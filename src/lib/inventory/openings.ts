export type ProductOpeningLine = {
  quantity: number;
  unitCost: number;
};

export function calculateProductOpeningLineCost({
  quantity,
  unitCost,
}: ProductOpeningLine) {
  return quantity * unitCost;
}

export function calculateProductOpeningTotal(lines: ProductOpeningLine[]) {
  return lines.reduce(
    (total, line) => total + calculateProductOpeningLineCost(line),
    0,
  );
}
