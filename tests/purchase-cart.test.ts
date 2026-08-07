import { describe, expect, it } from "vitest";
import {
  addProductToPurchaseCart,
  calculatePurchaseCartTotals,
  updatePurchaseCartItemQuantity,
  updatePurchaseCartItemUnitCost,
} from "@/lib/purchases/cart";

const product = {
  id: "product-1",
  sku: "SKU-1",
  name: "Producto 1",
};

describe("purchase cart", () => {
  it("adds a product to an empty cart", () => {
    expect(addProductToPurchaseCart([], product)).toEqual([
      {
        productId: "product-1",
        sku: "SKU-1",
        name: "Producto 1",
        quantity: 1,
        unitCost: 0,
      },
    ]);
  });

  it("increments quantity when adding the same product", () => {
    const cart = addProductToPurchaseCart(
      addProductToPurchaseCart([], product),
      product,
    );

    expect(cart[0]?.quantity).toBe(2);
  });

  it("clamps quantity and unit cost to valid values", () => {
    const withQuantity = updatePurchaseCartItemQuantity(
      addProductToPurchaseCart([], product),
      product.id,
      -5,
    );
    const withCost = updatePurchaseCartItemUnitCost(
      withQuantity,
      product.id,
      -100,
    );

    expect(withCost[0]?.quantity).toBe(1);
    expect(withCost[0]?.unitCost).toBe(0);
  });

  it("calculates subtotal and total", () => {
    expect(
      calculatePurchaseCartTotals({
        items: [
          {
            productId: "product-1",
            sku: "SKU-1",
            name: "Producto 1",
            quantity: 2,
            unitCost: 1500,
          },
        ],
        discount: 500,
        additionalCosts: 250,
      }),
    ).toEqual({
      subtotal: 3000,
      total: 2750,
    });
  });
});
