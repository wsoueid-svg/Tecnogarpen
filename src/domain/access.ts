import { OFFICE_WRITER_ROLES, type Actor, type Role } from "./types";

export class AccessError extends Error {
  readonly status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "AccessError";
  }
}

export function landingPath(role: Role): "/operario" | "/clientes" {
  return role === "operario" ? "/operario" : "/clientes";
}

export function canWriteMasters(actor: Actor): boolean {
  return (OFFICE_WRITER_ROLES as readonly Role[]).includes(actor.role);
}

export function assertCompanyVisible(actor: Actor, companyId: string): void {
  if (!actor.companyIds.includes(companyId)) {
    throw new AccessError("Esa empresa no está en tu acceso.");
  }
}

export function assertCanWriteMasters(actor: Actor, companyId: string): void {
  assertCompanyVisible(actor, companyId);
  if (!canWriteMasters(actor)) {
    throw new AccessError("El operario consulta la oficina en solo lectura.");
  }
}
