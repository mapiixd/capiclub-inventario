import { describe, expect, it } from "vitest";
import {
  calculateCashDifference,
  calculateExpectedCash,
  getCashMovementSign,
} from "@/lib/cash/expected-cash";

describe("cash expected totals", () => {
  it("calculates expected cash from opening float, payments and movements", () => {
    expect(
      calculateExpectedCash({
        openingFloat: 10000,
        cashPayments: [15000, 5000],
        movements: [
          { type: "INCOME", amount: 2000 },
          { type: "WITHDRAWAL", amount: 3000 },
          { type: "EXPENSE", amount: 4000 },
        ],
      }),
    ).toBe(25000);
  });

  it("calculates close difference", () => {
    expect(calculateCashDifference({ expectedCash: 25000, countedCash: 24500 })).toBe(-500);
  });

  it("rejects unknown movement types", () => {
    expect(() => getCashMovementSign("OTHER")).toThrow(
      "Tipo de movimiento de caja invalido.",
    );
  });
});
