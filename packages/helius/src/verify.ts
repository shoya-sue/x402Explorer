/**
 * Helius API 接続確認スクリプト — Week 1-2 マイルストーン証明
 * 実行: pnpm verify:helius  (ルートから)
 *   または: pnpm --filter @x402/helius verify
 */
import { config } from "dotenv";
import { resolve } from "node:path";
// packages/helius/src/ から3段上がるとリポジトリルート
config({ path: resolve(import.meta.dirname, "../../../.env") });
import { HeliusClient } from "./client.js";
import type { Network } from "@x402/shared";

// devnet で実際に稼働しているウォレットアドレス
const DEVNET_TEST_ADDRESS = "GpXTtx53kf9FmAY6M4DqkSS39qNMtxcRJCSAncVJAcU4";

async function main(): Promise<void> {
  const apiKey = process.env["HELIUS_API_KEY"];
  const network = (process.env["HELIUS_NETWORK"] ?? "devnet") as Network;

  if (!apiKey) {
    console.error("ERROR: HELIUS_API_KEY が設定されていません。.env.example を参考に .env を作成してください。");
    process.exit(1);
  }

  console.log(`[verify] network=${network}`);
  const client = new HeliusClient({ apiKey, network });

  // 1. RPC 疎通確認
  const slot = await client.getSlot();
  console.log(`[verify] current slot: ${slot}`);

  // 2. Enhanced Transaction 取得（実オンチェーンデータ）
  const txs = await client.getTransactionsForAddress(DEVNET_TEST_ADDRESS, { limit: 5 });
  console.log(`[verify] fetched ${txs.length} transactions for ${DEVNET_TEST_ADDRESS}`);

  for (const tx of txs) {
    console.log(`  - ${tx.signature.slice(0, 12)}...  type=${tx.type}  slot=${tx.slot}  ts=${tx.timestamp}`);
  }

  if (txs.length === 0) {
    console.warn("[verify] WARNING: トランザクション 0 件。APIキーは有効 (getSlot 成功)。devnet アドレスにアクティビティがない可能性があります。");
  }

  console.log("[verify] OK — Helius API connection confirmed.");
}

main().catch((err: unknown) => {
  console.error("[verify] FAILED:", err);
  process.exit(1);
});
