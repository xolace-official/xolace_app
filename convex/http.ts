import { httpRouter } from "convex/server";
import { revenuecat } from "./revenuecat";

const http = httpRouter();

// Mounts POST /webhooks/revenuecat — the component verifies the
// Authorization header against REVENUECAT_WEBHOOK_AUTH, ingests all
// 18 RC event types, and fires the lifecycle hooks in convex/premium.ts.
revenuecat.registerRoutes(http);

export default http;
