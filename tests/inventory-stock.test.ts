import { describe, expect, it } from "vitest";
import { inventoryQuantityForMovement } from "@/lib/inventory/movement-quantity";
import { createProductSchema, updateProductSchema } from "@/lib/validation/product";

describe("inventoryQuantityForMovement", () => {
  it("keeps positive adjustments as positive quantities", () => {
    expect(
      inventoryQuantityForMovement("PHYSICAL_COUNT_POSITIVE_ADJUSTMENT", 10),
    ).toBe(10);
  });

  it("converts stock exits to negative quantities", () => {
    expect(inventoryQuantityForMovement("DAMAGED_PRODUCT", 2)).toBe(-2);
    expect(inventoryQuantityForMovement("TOURNAMENT_PRIZE", 1)).toBe(-1);
  });
});

describe("updateProductSchema", () => {
  it("does not accept SKU changes in product updates", () => {
    const result = updateProductSchema.safeParse({
      productId: "product_1",
      sku: "NEW-SKU",
      name: "Carta de prueba",
      type: "SINGLE",
      averageCost: 100,
      lastPurchaseCost: 100,
      salePrice: 500,
      minimumStock: 1,
    });

    expect(result.success).toBe(false);
  });
});

describe("createProductSchema", () => {
  it("accepts null optional form fields", () => {
    const result = createProductSchema.safeParse({
      sku: "SKU-001",
      barcode: null,
      name: "Carta de prueba",
      gameId: null,
      categoryId: null,
      edition: null,
      manufacturer: null,
      language: null,
      condition: null,
      rarity: null,
      variant: null,
      type: "SINGLE",
      averageCost: 0,
      lastPurchaseCost: 0,
      salePrice: 1000,
      minimumStock: 0,
      notes: null,
    });

    expect(result.success).toBe(true);
  });
});
