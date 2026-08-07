export type CashMovementKind = "INCOME" | "WITHDRAWAL" | "EXPENSE";

export type ExpectedCashInput = {
  openingFloat: number;
  cashPayments: number[];
  movements: Array<{
    type: string;
    amount: number;
  }>;
};

export function getCashMovementSign(type: string) {
  if (type === "INCOME") {
    return 1;
  }

  if (type === "WITHDRAWAL" || type === "EXPENSE") {
    return -1;
  }

  throw new Error("Tipo de movimiento de caja invalido.");
}

export function calculateExpectedCash({
  openingFloat,
  cashPayments,
  movements,
}: ExpectedCashInput) {
  const paymentTotal = cashPayments.reduce((total, amount) => total + amount, 0);
  const movementTotal = movements.reduce(
    (total, movement) => total + getCashMovementSign(movement.type) * movement.amount,
    0,
  );

  return openingFloat + paymentTotal + movementTotal;
}

export function calculateCashDifference({
  expectedCash,
  countedCash,
}: {
  expectedCash: number;
  countedCash: number;
}) {
  return countedCash - expectedCash;
}
