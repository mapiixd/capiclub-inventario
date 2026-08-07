export type ReturnableSaleItem = {
  id: string;
  quantity: number;
  finalUnitPrice: number;
  historicalUnitCost: number;
  returnItems: Array<{ quantity: number }>;
};

export function getReturnedQuantity(item: ReturnableSaleItem) {
  return item.returnItems.reduce((total, returnItem) => total + returnItem.quantity, 0);
}

export function getReturnableQuantity(item: ReturnableSaleItem) {
  return item.quantity - getReturnedQuantity(item);
}

export function assertReturnQuantity(item: ReturnableSaleItem, quantity: number) {
  const returnableQuantity = getReturnableQuantity(item);

  if (quantity <= 0) {
    throw new Error("La cantidad a devolver debe ser mayor a cero.");
  }

  if (quantity > returnableQuantity) {
    throw new Error("La cantidad a devolver supera lo disponible.");
  }
}

export function calculateReturnLineAmount({
  quantity,
  unitAmount,
}: {
  quantity: number;
  unitAmount: number;
}) {
  return quantity * unitAmount;
}

export function getSaleStatusAfterReturn(items: ReturnableSaleItem[]) {
  const totalSold = items.reduce((total, item) => total + item.quantity, 0);
  const totalReturned = items.reduce(
    (total, item) => total + getReturnedQuantity(item),
    0,
  );

  if (totalReturned === 0) {
    return "COMPLETED";
  }

  if (totalReturned >= totalSold) {
    return "RETURNED";
  }

  return "PARTIALLY_RETURNED";
}
