/**
 * Stream Chat server-side integration — plain fetch + Web Crypto, so it runs
 * in Convex's default runtime (no "use node", no Stream server SDK).
 *
 * Endpoint and JWT shapes are mirrored from the installed `stream-chat`
 * package source (signing.ts / client.ts):
 *  - user token:   HS256 JWT, payload { user_id }, no iat
 *  - server token: HS256 JWT, payload { server: true }
 *  - auth:         ?api_key=<key> + Authorization: <jwt> + stream-auth-type: jwt
 *  - upsert users: POST /users            { users: { [id]: user } }
 *  - channel:      POST /channels/messaging/{id}/query { data, state }
 *  - freeze:       PATCH /channels/messaging/{id} { set: { frozen: true } }
 *  - delete user:  DELETE /users/{id}?mark_messages_deleted&hard_delete
 *  - app settings: GET /app, PATCH /app { event_hooks: [...] }
 *  - webhook sig:  hex HMAC-SHA256 of the raw body, keyed by the API secret
 */

const BASE_URL = "https://chat.stream-io-api.com";

function getStreamEnv() {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("STREAM_API_KEY / STREAM_API_SECRET not configured");
  }
  return { apiKey, apiSecret };
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The one HMAC-SHA256 key import — shared by JWT signing and webhook verification. */
async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const header = base64url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(`${header}.${body}`),
  );
  return `${header}.${body}.${base64url(new Uint8Array(signature))}`;
}

/**
 * Byte-by-byte with no early return on the first mismatch. The length check is
 * not a leak: a valid signature is always 64 hex chars, so the length carries
 * nothing secret.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Is this webhook really from Stream?
 *
 * Stream signs the **raw** request body with the app secret — hex HMAC-SHA256,
 * in the `X-Signature` header — which is the same secret and the same primitive
 * the JWTs above use, so no new environment variable exists for the webhook.
 * Mirrors `verifySignature` in the `stream-chat` package's signing.ts.
 */
export async function verifyStreamWebhookSignature(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature) return false;
  const { apiSecret } = getStreamEnv();
  const digest = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(apiSecret),
    new TextEncoder().encode(rawBody),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(hex, signature);
}

/**
 * The publishable Stream key, handed to the client alongside its token. The
 * client deliberately does not keep its own copy: a token signed with this
 * app's secret is only valid against this app's key, so any drift between two
 * env vars fails as an unreadable WS signature error at connect time.
 */
export function getStreamApiKey(): string {
  return getStreamEnv().apiKey;
}

/** Client-facing Stream user token. userId is always a pseudonymous profile id. */
export async function mintUserToken(userId: string): Promise<string> {
  const { apiSecret } = getStreamEnv();
  return signJwt({ user_id: userId }, apiSecret);
}

async function streamRequest(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: { query?: Record<string, string>; body?: unknown } = {},
): Promise<Record<string, unknown>> {
  const { apiKey, apiSecret } = getStreamEnv();
  const serverToken = await signJwt({ server: true }, apiSecret);
  const url = new URL(BASE_URL + path);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(options.query ?? {})) {
    url.searchParams.set(k, v);
  }
  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: serverToken,
      "stream-auth-type": "jwt",
      "Content-Type": "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Stream ${method} ${path} failed (${response.status}): ${text}`);
  }
  return (await response.json()) as Record<string, unknown>;
}

export type StreamUser = { id: string; name?: string; image?: string };

/**
 * Batch upsert Stream users (id = emotionalProfileId, display data only).
 *
 * **The record is deliberately pseudonymous, always.** There is one global,
 * mutable Stream user per profile id, and the same person is a named xolacer in
 * one conversation and an anonymous seeker in another — so no single record can
 * be right, and a real name written here would render wherever their anonymous
 * side is shown. Every caller passes the pseudonym and the catalog avatar,
 * whether or not the person is a published xolacer. Real identity is resolved
 * per-conversation and per-role by `getConversation`, and the client overrides
 * every Stream surface that renders a name or image with it — see
 * COMPONENT_OVERRIDES in `thread-messages.tsx`.
 */
export async function upsertStreamUsers(users: StreamUser[]): Promise<void> {
  const userMap: Record<string, StreamUser> = {};
  for (const user of users) userMap[user.id] = user;
  await streamRequest("POST", "/users", { body: { users: userMap } });
}

/**
 * Create (or return) the 1:1 messaging channel for a conversation.
 * Channel id is deterministic per conversation row, so accept is idempotent.
 */
export async function createXolacerChannel(
  channelId: string,
  memberIds: string[],
  createdById: string,
): Promise<void> {
  await streamRequest("POST", `/channels/messaging/${encodeURIComponent(channelId)}/query`, {
    body: {
      data: { members: memberIds, created_by_id: createdById },
      state: false,
    },
  });
}

/**
 * Freeze a channel — Stream itself then refuses sends from both members, so a
 * block is enforced at the server rather than in either client's view. Partial
 * update: everything else about the channel is left alone, and re-freezing an
 * already-frozen channel is a no-op on Stream's side.
 */
export async function freezeStreamChannel(channelId: string): Promise<void> {
  await streamRequest("PATCH", `/channels/messaging/${encodeURIComponent(channelId)}`, {
    body: { set: { frozen: true } },
  });
}

/**
 * A Stream V2 event hook, as it appears in app settings. Only the fields we
 * read or write — Stream returns more, and every one of them has to survive a
 * round trip untouched, so hooks we did not create are passed back verbatim.
 */
export type StreamEventHook = {
  hook_type?: string;
  enabled?: boolean;
  webhook_url?: string;
  event_types?: string[];
  [key: string]: unknown;
};

/** Every event hook currently registered on this Stream app. */
export async function listStreamEventHooks(): Promise<StreamEventHook[]> {
  const response = await streamRequest("GET", "/app");
  const app = response.app as { event_hooks?: StreamEventHook[] } | undefined;
  return app?.event_hooks ?? [];
}

/**
 * Replace the app's event-hook array.
 *
 * **Stream deletes any hook absent from what you submit**, so the caller must
 * pass the full list — read, append, write. There is no add-one endpoint.
 */
export async function setStreamEventHooks(
  hooks: StreamEventHook[],
): Promise<void> {
  await streamRequest("PATCH", "/app", { body: { event_hooks: hooks } });
}

/** Hard-delete a Stream user and their messages (account-deletion path). */
export async function deleteStreamUser(userId: string): Promise<void> {
  await streamRequest("DELETE", `/users/${encodeURIComponent(userId)}`, {
    query: { mark_messages_deleted: "true", hard_delete: "true" },
  });
}
