export type CartProduct = {
  id: string;
  sku: string;
  name: string;
  salePrice: number;
  stock: number;
};

export type CartItem = {
  productId: string;
  sku: string;
  name: string;
  stock: number;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
};

export type PaymentDraft = {
  paymentMethodId: string;
  amount: number;
  reference: string;
};

export function addProductToCart(items: CartItem[], product: CartProduct) {
  const existingItem = items.find((item) => item.productId === product.id);

  if (existingItem) {
    return items.map((item) =>
      item.productId === product.id
        ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
        : item,
    );
  }

  return [
    ...items,
    {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      stock: product.stock,
      quantity: 1,
      unitPrice: product.salePrice,
      lineDiscount: 0,
    },
  ];
}

export function updateCartItemQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
) {
  return items.map((item) =>
    item.productId === productId
      ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
      : item,
  );
}

export function calculateCartTotals(items: CartItem[]) {
  const grossTotal = items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
  const totalDiscount = items.reduce(
    (total, item) => total + item.lineDiscount,
    0,
  );
  const finalTotal = Math.max(0, grossTotal - totalDiscount);

  return { grossTotal, totalDiscount, finalTotal };
}

export function calculatePaidTotal(payments: PaymentDraft[]) {
  return payments.reduce((total, payment) => total + payment.amount, 0);
}

export function getPaymentDifference({
  payments,
  total,
}: {
  payments: PaymentDraft[];
  total: number;
}) {
  return calculatePaidTotal(payments) - total;
}
