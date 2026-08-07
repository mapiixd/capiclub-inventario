import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { uniqueConstraintMessage } from "@/lib/db-errors";

describe("uniqueConstraintMessage", () => {
  it("maps Prisma unique constraint fields to user messages", () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["sku"] },
      },
    );

    expect(
      uniqueConstraintMessage(error, {
        sku: "Ya existe un producto con ese SKU.",
      }),
    ).toBe("Ya existe un producto con ese SKU.");
  });
});

