import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import actionCache from "@convex-dev/action-cache/convex.config.js";

const app = defineApp();
app.use(rateLimiter);
app.use(actionCache);

export default app;
