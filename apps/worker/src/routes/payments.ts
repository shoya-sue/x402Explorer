import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../types.js";
import type { PaymentRow } from "../lib/db.js";
import { rowToPayment } from "../lib/db.js";
import { checkWebhookAuth } from "../lib/webhook-auth.js";

// Helius Enhanced Transaction の最小サブセット（webhook 用）
const HeliusTransferSchema = z.object({
  fromUserAccount: z.string(),
  toUserAccount: z.string(),
  tokenAmount: z.number(),
  mint: z.string(),
});

const HeliusWebhookEntrySchema = z.object({
  signature: z.string(),
  slot: z.number().int(),
  timestamp: z.number().int(),
  tokenTransfers: z.array(HeliusTransferSchema).optional(),
});

const GetPaymentsQuerySchema = z.object({
  apiId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export const paymentsRoute = new Hono<{ Bindings: Env }>();

paymentsRoute.post("/webhook", async (c) => {
  const secret = c.env.HELIUS_WEBHOOK_SECRET;
  if (!secret) {
    return c.json({ success: false, error: "webhook secret not configured" }, 503);
  }
  if (!checkWebhookAuth(c.req.header("authorization") ?? null, secret)) {
    return c.json({ success: false, error: "unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "invalid JSON body" }, 400);
  }

  const txArray = z.array(HeliusWebhookEntrySchema).safeParse(body);
  if (!txArray.success) {
    return c.json({ success: false, error: "invalid webhook payload" }, 400);
  }

  // 承認済みAPIのウォレットアドレス → API情報 マップを構築
  const apiRows = await c.env.DB.prepare(
    "SELECT id, wallet, network FROM apis WHERE status = 'approved'",
  ).all<{ id: string; wallet: string; network: string }>();

  const walletToApi = new Map(apiRows.results.map((r) => [r.wallet, r]));

  let inserted = 0;
  const now = new Date().toISOString();

  for (const tx of txArray.data) {
    for (const transfer of tx.tokenTransfers ?? []) {
      const api = walletToApi.get(transfer.toUserAccount);
      if (!api) continue;

      const result = await c.env.DB.prepare(
        `INSERT OR IGNORE INTO payments
         (signature, api_id, amount, token, network, block_time, slot, from_address, to_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          tx.signature,
          api.id,
          String(transfer.tokenAmount),
          transfer.mint,
          api.network,
          tx.timestamp,
          tx.slot,
          transfer.fromUserAccount,
          transfer.toUserAccount,
          now,
        )
        .run();

      if (result.meta.changes > 0) inserted++;
    }
  }

  return c.json({ success: true, data: { inserted } });
});

paymentsRoute.get("/", async (c) => {
  const qp = GetPaymentsQuerySchema.safeParse({
    apiId: c.req.query("apiId"),
    limit: c.req.query("limit"),
    page: c.req.query("page"),
  });
  if (!qp.success) {
    return c.json({ success: false, error: qp.error.flatten() }, 400);
  }

  const { apiId, limit, page } = qp.data;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (apiId) {
    conditions.push("api_id = ?");
    bindings.push(apiId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows, countRow] = await Promise.all([
    c.env.DB.prepare(
      `SELECT * FROM payments ${where} ORDER BY block_time DESC LIMIT ? OFFSET ?`,
    )
      .bind(...bindings, limit, offset)
      .all<PaymentRow>(),
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM payments ${where}`)
      .bind(...bindings)
      .first<{ total: number }>(),
  ]);

  return c.json({
    success: true,
    data: rows.results.map(rowToPayment),
    meta: { total: countRow?.total ?? 0, page, limit },
  });
});
