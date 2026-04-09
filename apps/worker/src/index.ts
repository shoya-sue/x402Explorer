import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types.js";
import { healthRoute } from "./routes/health.js";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/", (c) => c.json({ name: "x402-explorer-worker", status: "ok" }));

app.route("/health", healthRoute);

export default app;
