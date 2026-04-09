#!/usr/bin/env tsx
/**
 * devnet-cycle.ts
 * デモ用スクリプト: D1に承認済みAPIをシードし、疑似Heliusウェブフックをループ送信する。
 *
 * 実行前にworkerを起動しておくこと: pnpm dev:worker
 *
 * 実行: pnpm devnet-cycle
 * 環境変数:
 *   WORKER_URL         (default: http://localhost:8787)
 *   CYCLE_INTERVAL_MS  (default: 3000)
 */
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const WORKER_URL = process.env["WORKER_URL"] ?? "http://localhost:8787";
const INTERVAL_MS = parseInt(process.env["CYCLE_INTERVAL_MS"] ?? "3000");
const WORKER_DIR = resolve(import.meta.dirname, "../apps/worker");

// ─── デモAPI定義 ────────────────────────────────────────────────────────────

const DEMO_APIS = [
  {
    id: "11111111-0000-0000-0000-000000000001",
    name: "AI Text Generator",
    url: "https://text.demo.x402.dev/generate",
    wallet: "GpXTtx53kf9FmAY6M4DqkSS39qNMtxcRJCSAncVJAcU4",
    price: "0.001",
    token: "USDC",
  },
  {
    id: "11111111-0000-0000-0000-000000000002",
    name: "Image Captioning API",
    url: "https://img.demo.x402.dev/caption",
    wallet: "7nYabs9dUhvxYwdTnrWVBL9MYviKQjEyWQmdBBjScHbE",
    price: "0.002",
    token: "USDC",
  },
  {
    id: "11111111-0000-0000-0000-000000000003",
    name: "Code Review Service",
    url: "https://code.demo.x402.dev/review",
    wallet: "DqhH94PjkZsjAqEze2BEkWhFQJ6EyTntVgL7c1AEXX9",
    price: "0.005",
    token: "USDC",
  },
  {
    id: "11111111-0000-0000-0000-000000000004",
    name: "Data Analytics API",
    url: "https://data.demo.x402.dev/analyze",
    wallet: "BVNo2tgCkWkFV3gfhj4P7BmNdPfGr8bfB2zKwsMzLqo",
    price: "0.003",
    token: "USDC",
  },
  {
    id: "11111111-0000-0000-0000-000000000005",
    name: "Translation Service",
    url: "https://translate.demo.x402.dev/tr",
    wallet: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    price: "0.001",
    token: "USDC",
  },
];

// ペイヤーアドレス (devnet上の想定エージェント)
const PAYER_WALLETS = [
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
  "3yFwqXBfZY4jBVb3QYxpXBqGFRE7Q5oGkDKj8vqj3KkT",
  "6D4e9MDzZ9KcKLxcBKT3eYAHHBjPdQtSrRKBKxGmvBVp",
];

// ─── ユーティリティ ─────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function runSql(sql: string): void {
  execSync(`npx wrangler d1 execute x402_explorer --local --command="${sql.replace(/"/g, '\\"')}"`, {
    cwd: WORKER_DIR,
    stdio: "pipe",
  });
}

// ─── シード ─────────────────────────────────────────────────────────────────

async function seedApis(): Promise<void> {
  console.log("[seed] Seeding demo APIs into local D1...");
  const now = new Date().toISOString();

  for (const api of DEMO_APIS) {
    runSql(
      `INSERT OR IGNORE INTO apis (id, url, name, wallet, price_amount, price_token, network, status, created_at, updated_at) ` +
        `VALUES ('${api.id}', '${api.url}', '${api.name}', '${api.wallet}', '${api.price}', '${api.token}', 'devnet', 'approved', '${now}', '${now}')`,
    );
    console.log(`  ✓ ${api.name}`);
  }

  console.log("[seed] Done.\n");
}

// ─── ウェブフック送信 ────────────────────────────────────────────────────────

function buildFakeWebhookPayload(): object[] {
  const api = pick(DEMO_APIS);
  const payer = pick(PAYER_WALLETS);
  const amount = parseFloat(api.price) * (0.8 + Math.random() * 0.4);

  return [
    {
      signature: randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, ""),
      slot: Math.floor(450_000_000 + Math.random() * 10_000_000),
      timestamp: Math.floor(Date.now() / 1000),
      tokenTransfers: [
        {
          fromUserAccount: payer,
          toUserAccount: api.wallet,
          tokenAmount: parseFloat(amount.toFixed(6)),
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        },
      ],
    },
  ];
}

async function sendWebhook(): Promise<void> {
  const payload = buildFakeWebhookPayload();
  const res = await fetch(`${WORKER_URL}/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as { success: boolean; data?: { inserted: number } };
  const transfer = payload[0] as { tokenTransfers: { toUserAccount: string; tokenAmount: number; mint: string }[] };
  const t = transfer.tokenTransfers[0];
  if (json.success) {
    console.log(
      `[cycle] +payment  ${t?.tokenAmount.toFixed(6)} USDC → ${t?.toUserAccount.slice(0, 8)}…  (inserted: ${json.data?.inserted ?? 0})`,
    );
  } else {
    console.warn("[cycle] webhook failed:", json);
  }
}

// ─── メイン ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`[devnet-cycle] WORKER_URL=${WORKER_URL}  INTERVAL=${INTERVAL_MS}ms`);

  // ヘルスチェック
  try {
    const health = await fetch(`${WORKER_URL}/health`);
    if (!health.ok) throw new Error(`health check failed: ${health.status}`);
    console.log("[devnet-cycle] Worker is up.\n");
  } catch (err) {
    console.error("[devnet-cycle] Cannot reach worker. Start it with: pnpm dev:worker");
    console.error(err);
    process.exit(1);
  }

  await seedApis();

  console.log(`[devnet-cycle] Starting payment loop (Ctrl+C to stop)...\n`);

  const loop = setInterval(() => {
    sendWebhook().catch((err: unknown) => {
      console.error("[cycle] error:", err);
    });
  }, INTERVAL_MS);

  process.on("SIGINT", () => {
    clearInterval(loop);
    console.log("\n[devnet-cycle] Stopped.");
    process.exit(0);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
