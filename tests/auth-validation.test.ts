import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/validation/auth";

describe("loginSchema", () => {
  it("accepts a valid login input", () => {
    const result = loginSchema.safeParse({
      email: "admin@capiclub.local",
      password: "Cambiar.12345",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "admin",
      password: "Cambiar.12345",
    });

    expect(result.success).toBe(false);
  });
});

