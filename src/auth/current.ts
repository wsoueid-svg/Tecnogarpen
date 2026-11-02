import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findDirectoryUser } from "../domain/directory";
import type { Actor } from "../domain/types";
import { authMode } from "./entra";
import { readSession } from "./token";

export const SESSION_COOKIE = "tg_session";
export const COMPANY_COOKIE = "tg_company";

export function sessionSecret(): string {
  return process.env.SESSION_SECRET?.trim() || "dev-only-session-secret";
}

export async function getActor(): Promise<Actor | null> {
  if (authMode() === "entra") return null;
  const jar = await cookies();
  const userId = readSession(jar.get(SESSION_COOKIE)?.value, sessionSecret());
  if (!userId) return null;
  const user = findDirectoryUser(userId);
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    companyIds: user.companyIds,
    displayName: user.displayName,
    email: user.email,
  };
}

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/login");
  return actor;
}

export async function activeCompanyId(actor: Actor): Promise<string> {
  const jar = await cookies();
  const selected = jar.get(COMPANY_COOKIE)?.value;
  if (selected && actor.companyIds.includes(selected)) return selected;
  const fallback = actor.companyIds[0];
  if (!fallback) redirect("/login");
  return fallback;
}
