export function calculateInventoryDifference({
  theoreticalStock,
  countedStock,
}: {
  theoreticalStock: number;
  countedStock: number;
}) {
  return countedStock - theoreticalStock;
}

export function getInventoryCountMovementType(difference: number) {
  if (difference > 0) {
    return "PHYSICAL_COUNT_POSITIVE_ADJUSTMENT";
  }

  if (difference < 0) {
    return "PHYSICAL_COUNT_NEGATIVE_ADJUSTMENT";
  }

  return null;
}
