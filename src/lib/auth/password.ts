import bcrypt from "bcryptjs";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(hash: string, password: string) {
  return bcrypt.compare(password, hash);
}
