import { Hono } from "hono";
import { z } from "zod";
import { CreateApiListingInputSchema, ApiStatusSchema, NetworkSchema } from "@x402/shared";
import type { Env } from "../types.js";
import type { ApiRow } from "../lib/db.js";
import { rowToApiListing } from "../lib/db.js";
import { runVerification } from "../lib/verify402.js";

const GetApisQuerySchema = z.object({
  status: ApiStatusSchema.optional(),
  network: NetworkSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export const apisRoute = new Hono<{ Bindings: Env }>();

apisRoute.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "invalid JSON body" }, 400);
  }

  const parsed = CreateApiListingInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.flatten() }, 400);
  }

  const { url, name } = parsed.data;

  const existing = await c.env.DB.prepare("SELECT id FROM apis WHERE url = ?")
    .bind(url)
    .first<{ id: string }>();

  if (existing) {
    return c.json({ success: false, error: "URL already registered" }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const displayName = name ?? new URL(url).hostname;

  await c.env.DB.prepare(
    `INSERT INTO apis (id, url, name, wallet, price_amount, price_token, network, status, created_at, updated_at)
     VALUES (?, ?, ?, '', '0', 'USDC', 'devnet', 'pending', ?, ?)`,
  )
    .bind(id, url, displayName, now, now)
    .run();

  c.executionCtx.waitUntil(runVerification(id, url, c.env.DB));

  return c.json({ success: true, data: { id, status: "pending" } }, 202);
});

apisRoute.get("/", async (c) => {
  const qp = GetApisQuerySchema.safeParse({
    status: c.req.query("status"),
    network: c.req.query("network"),
    limit: c.req.query("limit"),
    page: c.req.query("page"),
  });
  if (!qp.success) {
    return c.json({ success: false, error: qp.error.flatten() }, 400);
  }

  const { status, network, limit, page } = qp.data;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (status) {
    conditions.push("status = ?");
    bindings.push(status);
  }
  if (network) {
    conditions.push("network = ?");
    bindings.push(network);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows, countRow] = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM apis ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...bindings, limit, offset)
      .all<ApiRow>(),
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM apis ${where}`)
      .bind(...bindings)
      .first<{ total: number }>(),
  ]);

  return c.json({
    success: true,
    data: rows.results.map(rowToApiListing),
    meta: { total: countRow?.total ?? 0, page, limit },
  });
});

apisRoute.get("/:id", async (c) => {
  const id = c.req.param("id");

  const row = await c.env.DB.prepare("SELECT * FROM apis WHERE id = ?")
    .bind(id)
    .first<ApiRow>();

  if (!row) {
    return c.json({ success: false, error: "not found" }, 404);
  }

  return c.json({ success: true, data: rowToApiListing(row) });
});
