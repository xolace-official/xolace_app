import { v } from "convex/values";
import { httpAction, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  listStreamEventHooks,
  setStreamEventHooks,
  verifyStreamWebhookSignature,
  type StreamEventHook,
} from "./integrations/stream";

/**
 * Stream's event webhook — the only server-side signal that a message was sent.
 *
 * Stream's *dedicated push webhook* was rejected for this: its payload names
 * neither the sender nor the recipient, so deriving who to notify would cost a
 * Stream REST round trip per message. The general event webhook carries both.
 *
 * Everything past verification returns 200, including every event we drop. A
 * non-2xx here is a retry from Stream's side and, after enough of them, a hook
 * Stream disables — neither is an appropriate answer to "this event was not
 * interesting".
 */
export const streamEvents = httpAction(async (ctx, request) => {
  // The raw bytes, not the parsed object: the HMAC is over the exact bytes
  // Stream signed, and re-serializing JSON does not reproduce them.
  //
  // Stream gzips payloads above a size threshold (`enable_hook_payload_compression`,
  // on by default for apps created after 2026-05-07) and Convex hands the body
  // over untouched, so `request.text()` would decode gzip bytes as UTF-8 and
  // sign garbage. Sniffing the magic bytes rather than `content-encoding`
  // follows Stream's own reference handler and survives a proxy dropping the
  // header. Small payloads arrive uncompressed even with the flag on — which is
  // why this only ever bit production.
  const body = new Uint8Array(await request.arrayBuffer());
  const rawBody =
    body[0] === 0x1f && body[1] === 0x8b
      ? await ctx.runAction(internal.streamGunzip.gunzip, { body: body.buffer })
      : new TextDecoder().decode(body);
  const signed = await verifyStreamWebhookSignature(
    rawBody,
    request.headers.get("x-signature"),
  );
  // The one failure that is not a 200. An unsigned request is not Stream, and
  // there is nothing to retry.
  if (!signed) return new Response("invalid signature", { status: 401 });

  let event: { type?: unknown; channel_id?: unknown; user?: { id?: unknown } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(null, { status: 200 });
  }

  if (event.type !== "message.new") return new Response(null, { status: 200 });
  const senderId = event.user?.id;
  if (typeof event.channel_id !== "string" || typeof senderId !== "string") {
    return new Response(null, { status: 200 });
  }

  await ctx.runMutation(internal.xolacerChat.notifyNewMessage, {
    channelId: event.channel_id,
    senderId,
  });
  return new Response(null, { status: 200 });
});

const WEBHOOK_PATH = "/webhooks/stream";
const EVENT_TYPES = ["message.new"];

/**
 * Point this deployment's Stream app at this deployment's webhook.
 *
 * Run per environment — dev and prod are separate Stream apps with separate
 * secrets, and each one has to be pointed at its own deployment:
 *
 *   bun stream:webhook           # dev
 *   bun stream:webhook:prod      # production
 *
 * Read-append-write, deliberately: Stream has no add-one endpoint, and a PATCH
 * deletes every hook missing from the array you submit. Hooks we did not create
 * are passed back verbatim.
 *
 * Idempotent — a second run finds our URL already registered and updates that
 * entry in place rather than adding a duplicate.
 */
export const registerWebhook = internalAction({
  args: {},
  returns: v.object({ url: v.string(), hooks: v.number() }),
  handler: async () => {
    // Convex hands every deployment its own HTTP-actions origin, so the URL is
    // never configured and can never point at the wrong environment.
    const siteUrl = process.env.CONVEX_SITE_URL;
    if (!siteUrl) throw new Error("CONVEX_SITE_URL is not set");
    const url = `${siteUrl}${WEBHOOK_PATH}`;

    const existing = await listStreamEventHooks();
    const ours: StreamEventHook = {
      hook_type: "webhook",
      enabled: true,
      webhook_url: url,
      event_types: EVENT_TYPES,
    };

    const index = existing.findIndex((hook) => hook.webhook_url === url);
    const hooks =
      index === -1
        ? [...existing, ours]
        : existing.map((hook, i) =>
            i === index ? { ...hook, ...ours } : hook,
          );

    await setStreamEventHooks(hooks);
    return { url, hooks: hooks.length };
  },
});
