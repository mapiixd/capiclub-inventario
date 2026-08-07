import { describe, expect, it } from "vitest";
import {
  createBackupFileName,
  getDatabasePath,
  isSafeBackupFileName,
  sqliteHeader,
} from "@/lib/backups/paths";

describe("backup paths", () => {
  it("resolves relative sqlite DATABASE_URL under prisma directory", () => {
    expect(getDatabasePath("file:./dev.db").replaceAll("\\", "/")).toMatch(
      /\/prisma\/dev\.db$/,
    );
  });

  it("creates safe backup file names", () => {
    const fileName = createBackupFileName(new Date("2026-08-07T12:30:00.000Z"));

    expect(fileName).toBe("capiclub-backup-2026-08-07T12-30-00-000Z.db");
    expect(isSafeBackupFileName(fileName)).toBe(true);
    expect(isSafeBackupFileName("../dev.db")).toBe(false);
  });

  it("keeps the expected sqlite header", () => {
    expect(sqliteHeader).toBe("SQLite format 3\u0000");
  });
});
