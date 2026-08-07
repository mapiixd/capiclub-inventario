import { describe, expect, it } from "vitest";
import {
  calculateInventoryDifference,
  getInventoryCountMovementType,
} from "@/lib/inventory/counts";

describe("inventory counts", () => {
  it("calculates counted stock differences", () => {
    expect(
      calculateInventoryDifference({ theoreticalStock: 8, countedStock: 5 }),
    ).toBe(-3);
    expect(
      calculateInventoryDifference({ theoreticalStock: 2, countedStock: 7 }),
    ).toBe(5);
  });

  it("maps differences to adjustment movement types", () => {
    expect(getInventoryCountMovementType(4)).toBe(
      "PHYSICAL_COUNT_POSITIVE_ADJUSTMENT",
    );
    expect(getInventoryCountMovementType(-2)).toBe(
      "PHYSICAL_COUNT_NEGATIVE_ADJUSTMENT",
    );
    expect(getInventoryCountMovementType(0)).toBeNull();
  });
});
