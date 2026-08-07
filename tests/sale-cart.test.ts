import { describe, expect, it } from "vitest";
import {
  addProductToCart,
  calculateCartTotals,
  getPaymentDifference,
  updateCartItemQuantity,
} from "@/lib/sales/cart";

const product = {
  id: "product-1",
  sku: "SKU-1",
  name: "Producto 1",
  salePrice: 1500,
  stock: 3,
};

describe("sale cart", () => {
  it("adds a product to an empty cart", () => {
    expect(addProductToCart([], product)).toEqual([
      {
        productId: "product-1",
        sku: "SKU-1",
        name: "Producto 1",
        stock: 3,
        quantity: 1,
        unitPrice: 1500,
        lineDiscount: 0,
      },
    ]);
  });

  it("increments quantity when adding the same product", () => {
    const cart = addProductToCart(addProductToCart([], product), product);

    expect(cart[0]?.quantity).toBe(2);
  });

  it("does not increment beyond stock", () => {
    const cart = [product, product, product, product].reduce(
      (items, nextProduct) => addProductToCart(items, nextProduct),
      [] as ReturnType<typeof addProductToCart>,
    );

    expect(cart[0]?.quantity).toBe(3);
  });

  it("clamps manual quantity to available stock", () => {
    const cart = updateCartItemQuantity(addProductToCart([], product), product.id, 10);

    expect(cart[0]?.quantity).toBe(3);
  });

  it("calculates totals and payment difference", () => {
    const totals = calculateCartTotals([
      {
        productId: "product-1",
        sku: "SKU-1",
        name: "Producto 1",
        stock: 3,
        quantity: 2,
        unitPrice: 1500,
        lineDiscount: 500,
      },
    ]);

    expect(totals).toEqual({
      grossTotal: 3000,
      totalDiscount: 500,
      finalTotal: 2500,
    });
    expect(
      getPaymentDifference({
        total: totals.finalTotal,
        payments: [{ paymentMethodId: "cash", amount: 2500, reference: "" }],
      }),
    ).toBe(0);
  });
});
