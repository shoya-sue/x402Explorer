import { describe, it, expect } from "vitest";
import { checkWebhookAuth } from "../lib/webhook-auth.js";

describe("checkWebhookAuth", () => {
  const SECRET = "correct-secret-value-32chars-xxxx";

  it("returns false when Authorization header is null (missing)", () => {
    expect(checkWebhookAuth(null, SECRET)).toBe(false);
  });

  it("returns false when Authorization header is empty string", () => {
    expect(checkWebhookAuth("", SECRET)).toBe(false);
  });

  it("returns false for wrong secret value", () => {
    expect(checkWebhookAuth("Bearer wrong-value", SECRET)).toBe(false);
  });

  it("returns false when Bearer prefix is missing", () => {
    expect(checkWebhookAuth(SECRET, SECRET)).toBe(false);
  });

  it("returns true for correct Bearer token", () => {
    expect(checkWebhookAuth(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("returns false for token shorter than secret (no timing leak)", () => {
    expect(checkWebhookAuth("Bearer short", SECRET)).toBe(false);
  });

  it("returns false for token longer than secret (no timing leak)", () => {
    expect(checkWebhookAuth(`Bearer ${SECRET}-extra-chars`, SECRET)).toBe(false);
  });

  it("returns false for empty secret token after Bearer prefix", () => {
    expect(checkWebhookAuth("Bearer ", SECRET)).toBe(false);
  });
});
