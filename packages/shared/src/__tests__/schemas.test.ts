import { describe, it, expect } from "vitest";
import { NetworkSchema } from "../network.js";
import {
  ApiStatusSchema,
  ApiListingSchema,
  CreateApiListingInputSchema,
} from "../api-listing.js";
import { PaymentSchema } from "../payment.js";

// ---------------------------------------------------------------------------
// NetworkSchema
// ---------------------------------------------------------------------------
describe("NetworkSchema", () => {
  it('parses "devnet"', () => {
    expect(NetworkSchema.parse("devnet")).toBe("devnet");
  });

  it('parses "mainnet-beta"', () => {
    expect(NetworkSchema.parse("mainnet-beta")).toBe("mainnet-beta");
  });

  it('rejects invalid value "testnet"', () => {
    expect(() => NetworkSchema.parse("testnet")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ApiStatusSchema
// ---------------------------------------------------------------------------
describe("ApiStatusSchema", () => {
  const validStatuses = [
    "pending",
    "verifying",
    "approved",
    "rejected",
    "disabled",
  ] as const;

  for (const status of validStatuses) {
    it(`parses valid status "${status}"`, () => {
      expect(ApiStatusSchema.parse(status)).toBe(status);
    });
  }

  it("rejects an invalid status", () => {
    expect(() => ApiStatusSchema.parse("active")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// CreateApiListingInputSchema
// ---------------------------------------------------------------------------
describe("CreateApiListingInputSchema", () => {
  it("parses when only url is provided", () => {
    const input = { url: "https://api.example.com/resource" };
    const result = CreateApiListingInputSchema.parse(input);
    expect(result.url).toBe("https://api.example.com/resource");
  });

  it("parses when url and name are provided", () => {
    const input = { url: "https://api.example.com/resource", name: "My API" };
    const result = CreateApiListingInputSchema.parse(input);
    expect(result.url).toBe("https://api.example.com/resource");
    expect(result.name).toBe("My API");
  });

  it("rejects an invalid url", () => {
    expect(() =>
      CreateApiListingInputSchema.parse({ url: "not-a-url" })
    ).toThrow();
  });

  it("rejects when url is missing", () => {
    expect(() => CreateApiListingInputSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ApiListingSchema
// ---------------------------------------------------------------------------
describe("ApiListingSchema", () => {
  const validListing = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    url: "https://api.example.com/resource",
    name: "Example API",
    description: "A sample API listing",
    category: "Finance",
    wallet: "So11111111111111111111111111111111111111112",
    priceAmount: "0.01",
    priceToken: "USDC",
    network: "devnet",
    status: "approved",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  } as const;

  it("parses a complete valid listing", () => {
    const result = ApiListingSchema.parse(validListing);
    expect(result.id).toBe(validListing.id);
    expect(result.network).toBe("devnet");
    expect(result.status).toBe("approved");
  });

  it("rejects when wallet is too short", () => {
    const invalidListing = { ...validListing, wallet: "short" };
    expect(() => ApiListingSchema.parse(invalidListing)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// PaymentSchema
// ---------------------------------------------------------------------------
describe("PaymentSchema", () => {
  const validPayment = {
    signature:
      "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBwmJKTQr9mFoGFAMr8JqE1234567890",
    apiId: "123e4567-e89b-12d3-a456-426614174000",
    amount: "0.01",
    token: "USDC",
    network: "mainnet-beta",
    blockTime: 1700000000,
    slot: 123456789,
    fromAddress: "So11111111111111111111111111111111111111112",
    toAddress: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe8bv",
    createdAt: "2024-01-01T00:00:00.000Z",
  } as const;

  it("parses a complete valid payment", () => {
    const result = PaymentSchema.parse(validPayment);
    expect(result.signature).toBe(validPayment.signature);
    expect(result.network).toBe("mainnet-beta");
    expect(result.blockTime).toBe(1700000000);
    expect(result.slot).toBe(123456789);
  });
});
