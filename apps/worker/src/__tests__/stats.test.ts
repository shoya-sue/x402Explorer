import { describe, it, expect } from "vitest";
import { rowToApiStats, type ApiStatsRow } from "../lib/db.js";

describe("rowToApiStats", () => {
  const baseRow: ApiStatsRow = {
    apiId: "123e4567-e89b-12d3-a456-426614174000",
    totalVolume: "10.500000",
    paymentCount: 5,
    lastPaymentAt: "2024-01-01 00:00:00",
    token: "USDC",
  };

  it("maps all fields correctly", () => {
    const result = rowToApiStats(baseRow);
    expect(result.apiId).toBe(baseRow.apiId);
    expect(result.totalVolume).toBe("10.500000");
    expect(result.paymentCount).toBe(5);
    expect(result.lastPaymentAt).toBe("2024-01-01 00:00:00");
    expect(result.token).toBe("USDC");
  });

  it('maps null lastPaymentAt (0 payments case)', () => {
    const row: ApiStatsRow = { ...baseRow, lastPaymentAt: null };
    const result = rowToApiStats(row);
    expect(result.lastPaymentAt).toBeNull();
  });

  it("maps null token", () => {
    const row: ApiStatsRow = { ...baseRow, token: null };
    const result = rowToApiStats(row);
    expect(result.token).toBeNull();
  });

  it('maps "0" totalVolume for empty aggregation', () => {
    const row: ApiStatsRow = { ...baseRow, totalVolume: "0", paymentCount: 0 };
    const result = rowToApiStats(row);
    expect(result.totalVolume).toBe("0");
    expect(result.paymentCount).toBe(0);
  });

  it("preserves string representation of totalVolume without numeric coercion", () => {
    const row: ApiStatsRow = { ...baseRow, totalVolume: "0.000001" };
    const result = rowToApiStats(row);
    expect(result.totalVolume).toBe("0.000001");
  });
});
