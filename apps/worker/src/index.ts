import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types.js";
import { healthRoute } from "./routes/health.js";
import { apisRoute } from "./routes/apis.js";
import { paymentsRoute } from "./routes/payments.js";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/", (c) => c.json({ name: "x402-explorer-worker", status: "ok" }));

app.route("/health", healthRoute);
app.route("/apis", apisRoute);
app.route("/payments", paymentsRoute);

export default app;
