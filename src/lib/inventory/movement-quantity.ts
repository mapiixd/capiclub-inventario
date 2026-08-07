export function inventoryQuantityForMovement(type: string, quantity: number) {
  const negativeTypes = new Set([
    "DAMAGED_PRODUCT",
    "SHRINKAGE",
    "INTERNAL_USE",
    "TOURNAMENT_PRIZE",
    "PHYSICAL_COUNT_NEGATIVE_ADJUSTMENT",
  ]);

  return negativeTypes.has(type) ? -quantity : quantity;
}

