import { describe, expect, it } from "vitest";
import { assertPaymentsMatchTotal, calculateSaleTotals } from "@/lib/sales/totals";

describe("calculateSaleTotals", () => {
  it("calculates sale totals and estimated margin", () => {
    expect(
      calculateSaleTotals([
        { quantity: 2, unitPrice: 1000, lineDiscount: 100, unitCost: 400 },
      ]),
    ).toEqual({
      grossTotal: 2000,
      totalDiscount: 100,
      finalTotal: 1900,
      estimatedCostTotal: 800,
      estimatedMarginTotal: 1100,
    });
  });
});

describe("assertPaymentsMatchTotal", () => {
  it("accepts exact mixed payments", () => {
    expect(
      assertPaymentsMatchTotal({
        total: 25000,
        payments: [{ amount: 10000 }, { amount: 15000 }],
      }),
    ).toBe(25000);
  });

  it("rejects payments that do not match sale total", () => {
    expect(() =>
      assertPaymentsMatchTotal({
        total: 25000,
        payments: [{ amount: 10000 }],
      }),
    ).toThrow("La suma de los pagos debe coincidir exactamente con el total.");
  });
});

