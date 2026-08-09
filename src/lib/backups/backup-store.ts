import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import {
  createBackupFileName,
  getBackupDirectory,
  getDatabasePath,
  isSafeBackupFileName,
  sqliteHeader,
} from "@/lib/backups/paths";

export type BackupFileInfo = {
  fileName: string;
  fullPath: string;
  size: number;
  createdAt: Date;
};

async function ensureDirectory(directory: string) {
  await fs.mkdir(directory, { recursive: true });
}

export async function isValidSqliteDatabase(filePath: string) {
  const handle = await fs.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(sqliteHeader.length);
    await handle.read(buffer, 0, sqliteHeader.length, 0);
    return buffer.toString("binary") === sqliteHeader;
  } finally {
    await handle.close();
  }
}

export async function listBackupFiles(): Promise<BackupFileInfo[]> {
  const backupDirectory = getBackupDirectory();
  await ensureDirectory(backupDirectory);
  const entries = await fs.readdir(backupDirectory, { withFileTypes: true });
  const backups = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && isSafeBackupFileName(entry.name))
      .map(async (entry) => {
        const fullPath = path.join(backupDirectory, entry.name);
        const stat = await fs.stat(fullPath);

        return {
          fileName: entry.name,
          fullPath,
          size: stat.size,
          createdAt: stat.birthtime,
        };
      }),
  );

  return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createDatabaseBackup({
  labelDate = new Date(),
}: {
  labelDate?: Date;
} = {}) {
  const databasePath = getDatabasePath();

  if (!(await isValidSqliteDatabase(databasePath))) {
    throw new Error("La base activa no parece ser una base SQLite valida.");
  }

  const backupDirectory = getBackupDirectory();
  await ensureDirectory(backupDirectory);
  const fileName = createBackupFileName(labelDate);
  const fullPath = path.join(backupDirectory, fileName);
  await fs.copyFile(databasePath, fullPath);
  const stat = await fs.stat(fullPath);

  return {
    fileName,
    fullPath,
    size: stat.size,
    createdAt: stat.birthtime,
  };
}

export async function ensureDailyBackup() {
  const backups = await listBackupFiles();
  const today = new Date().toISOString().slice(0, 10);
  const hasTodayBackup = backups.some((backup) =>
    backup.fileName.includes(today),
  );

  if (hasTodayBackup) {
    return { created: false, backup: backups[0] };
  }

  return { created: true, backup: await createDatabaseBackup() };
}

export async function resolveBackupPath(fileName: string) {
  if (!isSafeBackupFileName(fileName)) {
    throw new Error("Nombre de respaldo invalido.");
  }

  const backupDirectory = getBackupDirectory();
  const fullPath = path.resolve(backupDirectory, fileName);
  const relative = path.relative(backupDirectory, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Ruta de respaldo invalida.");
  }

  return fullPath;
}

export async function restoreDatabaseBackup(fileName: string) {
  const backupPath = await resolveBackupPath(fileName);

  if (!(await isValidSqliteDatabase(backupPath))) {
    throw new Error("El respaldo seleccionado no parece ser una base SQLite valida.");
  }

  const databasePath = getDatabasePath();
  const preRestoreBackup = await createDatabaseBackup();
  await fs.copyFile(backupPath, databasePath);

  return {
    restoredFrom: fileName,
    safetyBackup: preRestoreBackup,
  };
}
