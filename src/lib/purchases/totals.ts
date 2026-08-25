export type PurchaseTotalItem = {
  quantity: number;
  unitCost: number;
};

export type PurchaseTaxMode = "NET" | "GROSS";

export const defaultPurchaseTaxRate = 19;

function getTaxFactor(taxRate: number) {
  return 1 + Math.max(0, taxRate) / 100;
}

export function calculateNetUnitCost({
  unitCost,
  taxMode,
  taxRate,
}: {
  unitCost: number;
  taxMode: PurchaseTaxMode;
  taxRate: number;
}) {
  if (taxMode === "GROSS" && taxRate > 0) {
    return Math.round(unitCost / getTaxFactor(taxRate));
  }

  return unitCost;
}

export function calculatePurchaseTotals({
  items,
  discount,
  additionalCosts,
  isFreeOfCharge = false,
  taxMode,
  taxRate,
}: {
  items: PurchaseTotalItem[];
  discount: number;
  additionalCosts: number;
  isFreeOfCharge?: boolean;
  taxMode: PurchaseTaxMode;
  taxRate: number;
}) {
  if (isFreeOfCharge) {
    return { subtotal: 0, taxAmount: 0, total: 0 };
  }

  const enteredSubtotal = items.reduce(
    (total, item) => total + item.quantity * item.unitCost,
    0,
  );
  const adjustedAmount = enteredSubtotal - discount + additionalCosts;

  if (adjustedAmount < 0) {
    throw new Error("El total de la compra no puede ser negativo.");
  }

  if (taxMode === "GROSS") {
    const total = adjustedAmount;
    const subtotal =
      taxRate > 0 ? Math.round(total / getTaxFactor(taxRate)) : total;
    const taxAmount = total - subtotal;

    return { subtotal, taxAmount, total };
  }

  const subtotal = enteredSubtotal;
  const taxBase = adjustedAmount;
  const taxAmount = Math.round(taxBase * (Math.max(0, taxRate) / 100));
  const total = taxBase + taxAmount;

  return { subtotal, taxAmount, total };
}
