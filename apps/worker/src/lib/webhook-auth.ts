const BEARER_PREFIX = "Bearer ";

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);

  const maxLen = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length !== bBytes.length ? 1 : 0;

  for (let i = 0; i < maxLen; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }

  return diff === 0;
}

export function checkWebhookAuth(authHeader: string | null, secret: string): boolean {
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return false;
  }
  const token = authHeader.slice(BEARER_PREFIX.length);
  return timingSafeEqual(token, secret);
}
