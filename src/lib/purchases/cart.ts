export type PurchaseCartProduct = {
  id: string;
  sku: string;
  name: string;
};

export type PurchaseCartItem = {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
};

export function addProductToPurchaseCart(
  items: PurchaseCartItem[],
  product: PurchaseCartProduct,
) {
  const existingItem = items.find((item) => item.productId === product.id);

  if (existingItem) {
    return items.map((item) =>
      item.productId === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item,
    );
  }

  return [
    ...items,
    {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: 1,
      unitCost: 0,
    },
  ];
}

export function updatePurchaseCartItemQuantity(
  items: PurchaseCartItem[],
  productId: string,
  quantity: number,
) {
  return items.map((item) =>
    item.productId === productId
      ? { ...item, quantity: Math.max(1, quantity) }
      : item,
  );
}

export function updatePurchaseCartItemUnitCost(
  items: PurchaseCartItem[],
  productId: string,
  unitCost: number,
) {
  return items.map((item) =>
    item.productId === productId
      ? { ...item, unitCost: Math.max(0, unitCost) }
      : item,
  );
}

export function calculatePurchaseCartTotals({
  items,
  discount,
  additionalCosts,
}: {
  items: PurchaseCartItem[];
  discount: number;
  additionalCosts: number;
}) {
  const subtotal = items.reduce(
    (total, item) => total + item.quantity * item.unitCost,
    0,
  );
  const total = Math.max(0, subtotal - discount + additionalCosts);

  return { subtotal, total };
}
