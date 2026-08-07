export function calculateWeightedAverageCost({
  currentStock,
  currentAverageCost,
  incomingQuantity,
  incomingUnitCost,
}: {
  currentStock: number;
  currentAverageCost: number;
  incomingQuantity: number;
  incomingUnitCost: number;
}) {
  if (incomingQuantity <= 0) {
    return currentAverageCost;
  }

  const stockValue = Math.max(currentStock, 0) * currentAverageCost;
  const incomingValue = incomingQuantity * incomingUnitCost;
  const resultingStock = Math.max(currentStock, 0) + incomingQuantity;

  if (resultingStock === 0) {
    return incomingUnitCost;
  }

  return Math.round((stockValue + incomingValue) / resultingStock);
}

