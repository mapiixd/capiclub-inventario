export type SaleTotalItem = {
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  unitCost: number;
};

export type SalePaymentInput = {
  amount: number;
};

export function calculateSaleTotals(items: SaleTotalItem[]) {
  const grossTotal = items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
  const totalDiscount = items.reduce(
    (total, item) => total + item.lineDiscount,
    0,
  );
  const finalTotal = grossTotal - totalDiscount;
  const estimatedCostTotal = items.reduce(
    (total, item) => total + item.quantity * item.unitCost,
    0,
  );
  const estimatedMarginTotal = finalTotal - estimatedCostTotal;

  if (finalTotal < 0) {
    throw new Error("El total de la venta no puede ser negativo.");
  }

  return {
    grossTotal,
    totalDiscount,
    finalTotal,
    estimatedCostTotal,
    estimatedMarginTotal,
  };
}

export function assertPaymentsMatchTotal({
  payments,
  total,
}: {
  payments: SalePaymentInput[];
  total: number;
}) {
  const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);

  if (paidTotal !== total) {
    throw new Error("La suma de los pagos debe coincidir exactamente con el total.");
  }

  return paidTotal;
}

