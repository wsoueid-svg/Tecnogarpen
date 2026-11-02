import { unlink } from "node:fs/promises";
import { resolveDataFile } from "./local-store";

/** Local JSON store. `local` is the project default; `file` and `json` are accepted aliases. */
export function isFileDataBackend(backend: string | undefined = process.env.DATA_BACKEND): boolean {
  const value = (backend ?? "").trim().toLowerCase();
  return value === "" || value === "local" || value === "file" || value === "json";
}

/** Delete the JSON store so the next read rewrites the demo seed. */
export async function wipeLocalDemoStore(file = resolveDataFile()): Promise<void> {
  try {
    await unlink(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
