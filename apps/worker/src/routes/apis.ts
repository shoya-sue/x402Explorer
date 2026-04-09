import { Hono } from "hono";
import { z } from "zod";
import { CreateApiListingInputSchema, ApiStatusSchema, NetworkSchema } from "@x402/shared";
import type { Env } from "../types.js";
import type { ApiRow, ApiStatsRow } from "../lib/db.js";
import { rowToApiListing, rowToApiStats } from "../lib/db.js";
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

  const { url, name, network } = parsed.data;

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
     VALUES (?, ?, ?, '', '0', 'USDC', ?, 'pending', ?, ?)`,
  )
    .bind(id, url, displayName, network, now, now)
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

// NOTE: /stats and /:id/stats MUST be registered before /:id
// to avoid Hono matching "stats" as a dynamic :id parameter.

apisRoute.get("/stats", async (c) => {
  const network = c.req.query("network");

  const networkValidation = network ? NetworkSchema.safeParse(network) : null;
  if (networkValidation && !networkValidation.success) {
    return c.json({ success: false, error: "invalid network value" }, 400);
  }

  let query: string;
  let bindings: unknown[];

  if (network) {
    query = `
      SELECT
        api_id as apiId,
        COALESCE(printf('%.6f', SUM(CAST(amount AS REAL))), '0') as totalVolume,
        COUNT(*) as paymentCount,
        MAX(datetime(block_time, 'unixepoch')) as lastPaymentAt,
        (SELECT token FROM payments p2
         WHERE p2.api_id = payments.api_id
         GROUP BY token ORDER BY COUNT(*) DESC LIMIT 1) as token
      FROM payments
      WHERE network = ?
      GROUP BY api_id
    `;
    bindings = [network];
  } else {
    query = `
      SELECT
        api_id as apiId,
        COALESCE(printf('%.6f', SUM(CAST(amount AS REAL))), '0') as totalVolume,
        COUNT(*) as paymentCount,
        MAX(datetime(block_time, 'unixepoch')) as lastPaymentAt,
        (SELECT token FROM payments p2
         WHERE p2.api_id = payments.api_id
         GROUP BY token ORDER BY COUNT(*) DESC LIMIT 1) as token
      FROM payments
      GROUP BY api_id
    `;
    bindings = [];
  }

  const rows = await c.env.DB.prepare(query).bind(...bindings).all<ApiStatsRow>();
  return c.json({ success: true, data: rows.results.map(rowToApiStats) });
});

apisRoute.get("/:id/stats", async (c) => {
  const id = c.req.param("id");

  const row = await c.env.DB.prepare(`
    SELECT
      ? as apiId,
      COALESCE(printf('%.6f', SUM(CAST(amount AS REAL))), '0') as totalVolume,
      COUNT(*) as paymentCount,
      MAX(datetime(block_time, 'unixepoch')) as lastPaymentAt,
      (SELECT token FROM payments WHERE api_id = ? GROUP BY token ORDER BY COUNT(*) DESC LIMIT 1) as token
    FROM payments WHERE api_id = ?
  `)
    .bind(id, id, id)
    .first<ApiStatsRow>();

  if (!row) {
    return c.json({
      success: true,
      data: { apiId: id, totalVolume: "0", paymentCount: 0, lastPaymentAt: null, token: null },
    });
  }

  return c.json({ success: true, data: rowToApiStats(row) });
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
