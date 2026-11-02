import { createLocalRepository } from "./local-store";
import type { MastersRepository } from "../domain/repository";

export async function getRepository(): Promise<MastersRepository> {
  const backend = process.env.DATA_BACKEND?.trim() || "local";
  if (backend === "local") return createLocalRepository();
  if (backend === "supabase") {
    const { createSupabaseRepository } = await import("./supabase-store");
    return createSupabaseRepository();
  }
  throw new Error(`DATA_BACKEND no reconocido: ${backend}. Usa local o supabase.`);
}
