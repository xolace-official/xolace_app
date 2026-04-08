import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import actionCache from "@convex-dev/action-cache/convex.config.js";
import migrations from "@convex-dev/migrations/convex.config.js";
import pushNotifications from "@convex-dev/expo-push-notifications/convex.config.js";

const app = defineApp();
app.use(rateLimiter);
app.use(actionCache);
app.use(migrations);
app.use(pushNotifications);

export default app;
