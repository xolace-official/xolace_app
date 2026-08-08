import { httpRouter } from "convex/server";
import { revenuecat } from "./revenuecat";
import { streamEvents } from "./streamWebhook";

const http = httpRouter();

// Stream Chat event webhook — currently `message.new` only. Registered against
// the environment's Stream app by `bun stream:webhook`; the handler verifies
// the HMAC itself, so the route needs no protection of its own.
http.route({
  path: "/webhooks/stream",
  method: "POST",
  handler: streamEvents,
});

// Mounts POST /webhooks/revenuecat — the component verifies the
// Authorization header against REVENUECAT_WEBHOOK_AUTH, ingests all
// 18 RC event types, and fires the lifecycle hooks in convex/premium.ts.
revenuecat.registerRoutes(http);

export default http;
