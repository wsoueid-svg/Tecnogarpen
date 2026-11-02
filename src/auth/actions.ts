"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { assertCompanyVisible, landingPath } from "../domain/access";
import { AccessError } from "../domain/access";
import { findDirectoryUser } from "../domain/directory";
import { authMode } from "./entra";
import { COMPANY_COOKIE, SESSION_COOKIE, requireActor, sessionSecret } from "./current";
import { signSession } from "./token";

const EIGHT_HOURS = 60 * 60 * 8;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: EIGHT_HOURS,
  };
}

export async function loginAs(formData: FormData) {
  if (authMode() !== "mock") {
    redirect("/login?error=entra");
  }
  const user = findDirectoryUser(String(formData.get("userId") ?? ""));
  if (!user) redirect("/login?error=usuario");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(user.id, sessionSecret()), cookieOptions());
  jar.set(COMPANY_COOKIE, user.companyIds[0] ?? "", cookieOptions());
  redirect(landingPath(user.role));
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(COMPANY_COOKIE);
  redirect("/login");
}

export async function selectCompany(formData: FormData) {
  const actor = await requireActor();
  const companyId = String(formData.get("companyId") ?? "");
  try {
    assertCompanyVisible(actor, companyId);
  } catch (error) {
    if (error instanceof AccessError) redirect("/clientes?error=" + encodeURIComponent(error.message));
    throw error;
  }
  const jar = await cookies();
  jar.set(COMPANY_COOKIE, companyId, cookieOptions());
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : landingPath(actor.role));
}
