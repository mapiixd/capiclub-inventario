export type PurchaseTotalItem = {
  quantity: number;
  unitCost: number;
};

export function calculatePurchaseTotals({
  items,
  discount,
  additionalCosts,
}: {
  items: PurchaseTotalItem[];
  discount: number;
  additionalCosts: number;
}) {
  const subtotal = items.reduce(
    (total, item) => total + item.quantity * item.unitCost,
    0,
  );
  const total = subtotal - discount + additionalCosts;

  if (total < 0) {
    throw new Error("El total de la compra no puede ser negativo.");
  }

  return { subtotal, total };
}

