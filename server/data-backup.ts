import {
  readFile,
  readdir,
  writeFile,
  mkdir,
  copyFile,
  rm,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CONFIG_FILE } from "./app-config.js";

const DATA_DIR = join(process.cwd(), "data");

const BACKUP_FILES = [
  "garmin-store.json",
  "user-profile.json",
  "activity-details-cache.json",
  "app-config.json",
] as const;

export interface BackupBundle {
  version: 1;
  exportedAt: string;
  files: Record<string, unknown>;
}

export async function createBackupBundle(): Promise<BackupBundle> {
  const files: Record<string, unknown> = {};

  for (const name of BACKUP_FILES) {
    const path = join(DATA_DIR, name);
    if (!existsSync(path)) continue;
    try {
      const raw = await readFile(path, "utf-8");
      files[name] = JSON.parse(raw);
    } catch {
      files[name] = null;
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    files,
  };
}

export async function restoreBackupBundle(
  bundle: BackupBundle,
): Promise<string[]> {
  if (
    bundle.version !== 1 ||
    !bundle.files ||
    typeof bundle.files !== "object"
  ) {
    throw new Error("Invalid backup format");
  }

  await mkdir(DATA_DIR, { recursive: true });
  const restored: string[] = [];

  for (const [name, content] of Object.entries(bundle.files)) {
    if (!BACKUP_FILES.includes(name as (typeof BACKUP_FILES)[number])) continue;
    if (content === null || content === undefined) continue;
    const path = join(DATA_DIR, name);
    await writeFile(path, JSON.stringify(content, null, 2), "utf-8");
    restored.push(name);
  }

  return restored;
}

export async function listDataFiles(): Promise<string[]> {
  if (!existsSync(DATA_DIR)) return [];
  const entries = await readdir(DATA_DIR);
  return entries.filter((entry) => entry.endsWith(".json"));
}
