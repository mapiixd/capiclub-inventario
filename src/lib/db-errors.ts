import { Prisma } from "@prisma/client";

export function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export function getUniqueConstraintFields(error: unknown) {
  if (!isUniqueConstraintError(error)) {
    return [];
  }

  const prismaError = error;
  const target = prismaError.meta?.target;

  return Array.isArray(target)
    ? target.filter((field): field is string => typeof field === "string")
    : [];
}

export function uniqueConstraintMessage(
  error: unknown,
  messagesByField: Record<string, string>,
  fallback = "Ya existe un registro con esos datos.",
) {
  const fields = getUniqueConstraintFields(error);

  for (const field of fields) {
    const message = messagesByField[field];

    if (message) {
      return message;
    }
  }

  return isUniqueConstraintError(error) ? fallback : undefined;
}
