import path from "node:path";

export const sqliteHeader = "SQLite format 3\u0000";

export function getWorkspaceRoot() {
  return process.cwd();
}

export function getBackupDirectory() {
  const backupDir = process.env.BACKUP_DIR ?? "./backups";

  return path.resolve(/* turbopackIgnore: true */ process.cwd(), backupDir);
}

export function getDatabasePath(databaseUrl = process.env.DATABASE_URL ?? "") {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Solo se admiten bases SQLite con DATABASE_URL file:.");
  }

  const rawPath = databaseUrl.slice("file:".length);
  const normalizedPath = rawPath.replaceAll("\\", path.sep);

  if (path.isAbsolute(normalizedPath)) {
    return normalizedPath;
  }

  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    "prisma",
    normalizedPath,
  );
}

export function createBackupFileName(date = new Date()) {
  const stamp = date.toISOString().replaceAll(":", "-").replaceAll(".", "-");

  return `capiclub-backup-${stamp}.db`;
}

export function isSafeBackupFileName(fileName: string) {
  return /^capiclub-backup-[A-Za-z0-9_.:-]+\.db$/.test(fileName);
}
