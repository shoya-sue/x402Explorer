import { X402ChallengeSchema } from "@x402/shared";

export interface VerifyResult {
  ok: boolean;
  wallet?: string;
  priceAmount?: string;
  priceToken?: string;
  network?: "devnet" | "mainnet-beta";
  error?: string;
}

export async function verify402(url: string): Promise<VerifyResult> {
  let response: Response;
  try {
    response = await fetch(url, { method: "GET" });
  } catch (err) {
    return { ok: false, error: `fetch failed: ${String(err)}` };
  }

  if (response.status !== 402) {
    return { ok: false, error: `expected HTTP 402, got ${response.status}` };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: "response body is not valid JSON" };
  }

  const parsed = X402ChallengeSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "response body does not match X402ChallengeSchema" };
  }

  const solanaEntry = parsed.data.accepts.find(
    (a) => a.network === "devnet" || a.network === "mainnet-beta",
  );

  if (!solanaEntry) {
    return { ok: false, error: "no Solana network entry found in accepts[]" };
  }

  return {
    ok: true,
    wallet: solanaEntry.payTo,
    priceAmount: solanaEntry.maxAmountRequired,
    priceToken: solanaEntry.asset,
    network: solanaEntry.network as "devnet" | "mainnet-beta",
  };
}

export async function runVerification(id: string, url: string, db: D1Database): Promise<void> {
  await db
    .prepare("UPDATE apis SET status = 'verifying', updated_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run();

  const result = await verify402(url);

  if (result.ok && result.wallet && result.priceAmount && result.priceToken && result.network) {
    await db
      .prepare(
        `UPDATE apis
         SET status = 'approved', wallet = ?, price_amount = ?, price_token = ?, network = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(result.wallet, result.priceAmount, result.priceToken, result.network, id)
      .run();
  } else {
    await db
      .prepare("UPDATE apis SET status = 'rejected', updated_at = datetime('now') WHERE id = ?")
      .bind(id)
      .run();
  }
}
