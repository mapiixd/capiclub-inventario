import { describe, expect, it } from "vitest";
import { calculateWeightedAverageCost } from "@/lib/purchases/costing";
import {
  calculateNetUnitCost,
  calculatePurchaseTotals,
} from "@/lib/purchases/totals";
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
      isFreeOfCharge: false,
      taxMode: "NET",
      taxRate: 19,
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
        isFreeOfCharge: false,
        taxMode: "NET",
        taxRate: 0,
      }),
    ).toEqual({ subtotal: 2500, taxAmount: 0, total: 2300 });
  });

  it("adds IVA to net purchases", () => {
    expect(
      calculatePurchaseTotals({
        items: [{ quantity: 1, unitCost: 10000 }],
        discount: 0,
        additionalCosts: 0,
        isFreeOfCharge: false,
        taxMode: "NET",
        taxRate: 19,
      }),
    ).toEqual({ subtotal: 10000, taxAmount: 1900, total: 11900 });
  });

  it("splits IVA from gross purchases without increasing the document total", () => {
    expect(
      calculatePurchaseTotals({
        items: [{ quantity: 1, unitCost: 11900 }],
        discount: 0,
        additionalCosts: 0,
        isFreeOfCharge: false,
        taxMode: "GROSS",
        taxRate: 19,
      }),
    ).toEqual({ subtotal: 10000, taxAmount: 1900, total: 11900 });
  });

  it("supports exempt purchases", () => {
    expect(
      calculatePurchaseTotals({
        items: [{ quantity: 1, unitCost: 10000 }],
        discount: 0,
        additionalCosts: 0,
        isFreeOfCharge: false,
        taxMode: "NET",
        taxRate: 0,
      }),
    ).toEqual({ subtotal: 10000, taxAmount: 0, total: 10000 });
  });

  it("calculates net inventory cost from gross unit cost", () => {
    expect(
      calculateNetUnitCost({
        unitCost: 11900,
        taxMode: "GROSS",
        taxRate: 19,
      }),
    ).toBe(10000);
  });

  it("forces free purchases to zero totals", () => {
    expect(
      calculatePurchaseTotals({
        items: [{ quantity: 5, unitCost: 1000 }],
        discount: 0,
        additionalCosts: 0,
        isFreeOfCharge: true,
        taxMode: "NET",
        taxRate: 19,
      }),
    ).toEqual({ subtotal: 0, taxAmount: 0, total: 0 });
  });

  it("rejects negative final totals", () => {
    expect(() =>
      calculatePurchaseTotals({
        items: [{ quantity: 1, unitCost: 1000 }],
        discount: 2000,
        additionalCosts: 0,
        isFreeOfCharge: false,
        taxMode: "NET",
        taxRate: 19,
      }),
    ).toThrow("El total de la compra no puede ser negativo.");
  });
});
