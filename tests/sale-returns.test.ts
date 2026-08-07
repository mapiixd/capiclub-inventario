import { describe, expect, it } from "vitest";
import {
  assertReturnQuantity,
  calculateReturnLineAmount,
  getReturnableQuantity,
  getSaleStatusAfterReturn,
} from "@/lib/sales/returns";

describe("sale returns", () => {
  it("calculates returnable quantity", () => {
    expect(
      getReturnableQuantity({
        id: "item-1",
        quantity: 3,
        finalUnitPrice: 1000,
        historicalUnitCost: 500,
        returnItems: [{ quantity: 1 }],
      }),
    ).toBe(2);
  });

  it("rejects returning more than available", () => {
    expect(() =>
      assertReturnQuantity(
        {
          id: "item-1",
          quantity: 2,
          finalUnitPrice: 1000,
          historicalUnitCost: 500,
          returnItems: [{ quantity: 1 }],
        },
        2,
      ),
    ).toThrow("La cantidad a devolver supera lo disponible.");
  });

  it("calculates line amount", () => {
    expect(calculateReturnLineAmount({ quantity: 2, unitAmount: 1500 })).toBe(3000);
  });

  it("detects partially returned and fully returned statuses", () => {
    expect(
      getSaleStatusAfterReturn([
        {
          id: "item-1",
          quantity: 2,
          finalUnitPrice: 1000,
          historicalUnitCost: 500,
          returnItems: [{ quantity: 1 }],
        },
      ]),
    ).toBe("PARTIALLY_RETURNED");

    expect(
      getSaleStatusAfterReturn([
        {
          id: "item-1",
          quantity: 2,
          finalUnitPrice: 1000,
          historicalUnitCost: 500,
          returnItems: [{ quantity: 2 }],
        },
      ]),
    ).toBe("RETURNED");
  });
});
