import { describe, expect, it } from "vitest";
import { calculateWeightedAverageCost } from "@/lib/purchases/costing";
import { calculatePurchaseTotals } from "@/lib/purchases/totals";
import { createPurchaseSchema } from "@/lib/validation/purchase";

describe("calculateWeightedAverageCost", () => {
  it("calculates weighted average cost for received purchases", () => {
    expect(
      calculateWeightedAverageCost({
        currentStock: 10,
        currentAverageCost: 1000,
        incomingQuantity: 10,
        incomingUnitCost: 2000,
      }),
    ).toBe(1500);
  });

  it("uses incoming cost when current stock is zero", () => {
    expect(
      calculateWeightedAverageCost({
        currentStock: 0,
        currentAverageCost: 0,
        incomingQuantity: 5,
        incomingUnitCost: 1200,
      }),
    ).toBe(1200);
  });
});

describe("createPurchaseSchema", () => {
  it("requires at least one purchase item", () => {
    const result = createPurchaseSchema.safeParse({
      supplierId: "supplier_1",
      discount: 0,
      additionalCosts: 0,
      items: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("calculatePurchaseTotals", () => {
  it("calculates subtotal and final total", () => {
    expect(
      calculatePurchaseTotals({
        items: [
          { quantity: 2, unitCost: 1000 },
          { quantity: 1, unitCost: 500 },
        ],
        discount: 300,
        additionalCosts: 100,
      }),
    ).toEqual({ subtotal: 2500, total: 2300 });
  });

  it("rejects negative final totals", () => {
    expect(() =>
      calculatePurchaseTotals({
        items: [{ quantity: 1, unitCost: 1000 }],
        discount: 2000,
        additionalCosts: 0,
      }),
    ).toThrow("El total de la compra no puede ser negativo.");
  });
});
