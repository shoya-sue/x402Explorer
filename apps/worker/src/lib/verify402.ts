import { X402ChallengeSchema } from "@x402/shared";

export interface VerifyResult {
  ok: boolean;
  wallet?: string;
  priceAmount?: string;
  priceToken?: string;
  network?: "devnet" | "mainnet-beta";
  error?: string;
}

const MAX_BODY_SIZE = 65536; // 64 KB

function isPrivateHost(host: string): boolean {
  if (host === "localhost") return true;
  if (host.startsWith("127.")) return true;
  if (host.startsWith("10.")) return true;
  if (host.startsWith("192.168.")) return true;
  if (host.startsWith("169.254.")) return true;
  if (host === "::1" || host === "[::1]") return true;
  // 172.16.0.0/12 → 172.16.x.x ~ 172.31.x.x
  const m = host.match(/^172\.(\d+)\./);
  if (m) {
    const second = parseInt(m[1]!, 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

export function validateUrl(url: string): { ok: false; error: string } | { ok: true } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "invalid URL" };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "only HTTPS URLs are allowed" };
  }
  if (isPrivateHost(parsed.hostname.toLowerCase())) {
    return { ok: false, error: `blocked private/loopback host: ${parsed.hostname}` };
  }
  return { ok: true };
}

export async function verify402(url: string): Promise<VerifyResult> {
  const urlCheck = validateUrl(url);
  if (!urlCheck.ok) {
    return { ok: false, error: urlCheck.error };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    return { ok: false, error: `fetch failed: ${String(err)}` };
  }

  if (response.status !== 402) {
    return { ok: false, error: `expected HTTP 402, got ${response.status}` };
  }

  let body: unknown;
  try {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BODY_SIZE) {
      return { ok: false, error: "response body too large" };
    }
    const text = new TextDecoder().decode(buffer);
    body = JSON.parse(text);
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
