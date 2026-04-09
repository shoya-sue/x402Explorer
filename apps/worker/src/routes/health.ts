import { Hono } from "hono";
import type { Env } from "../types.js";

export const healthRoute = new Hono<{ Bindings: Env }>();

healthRoute.get("/", async (c) => {
  // D1 バインディングが正しく設定されているか確認
  let d1Ok = false;
  let d1Error: string | undefined;
  try {
    const result = await c.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    d1Ok = result?.ok === 1;
  } catch (e) {
    d1Error = (e as Error).message;
  }

  return c.json({
    ok: true,
    service: "x402-explorer-worker",
    timestamp: new Date().toISOString(),
    d1: { ok: d1Ok, error: d1Error },
    heliusKeyConfigured: Boolean(c.env.HELIUS_API_KEY),
    network: c.env.HELIUS_NETWORK,
  });
});
