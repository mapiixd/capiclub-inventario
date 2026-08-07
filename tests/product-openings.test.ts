import { describe, expect, it } from "vitest";
import {
  calculateProductOpeningLineCost,
  calculateProductOpeningTotal,
} from "@/lib/inventory/openings";

describe("product openings", () => {
  it("calculates manual output costs", () => {
    expect(calculateProductOpeningLineCost({ quantity: 3, unitCost: 1200 })).toBe(
      3600,
    );
    expect(
      calculateProductOpeningTotal([
        { quantity: 2, unitCost: 1500 },
        { quantity: 1, unitCost: 700 },
      ]),
    ).toBe(3700);
  });
});
