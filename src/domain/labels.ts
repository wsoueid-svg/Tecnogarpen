import type { ClientType, Role } from "./types";

const ROLE_LABELS: Record<Role, string> = {
  jefe: "Jefe",
  encargado: "Encargado",
  administrativo: "Administrativo",
  operario: "Operario",
};

const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  particular: "Particular",
  comunidad: "Comunidad",
  admin: "Administrador",
  empresa: "Empresa",
  constructora: "Constructora",
  intermediario: "Intermediario",
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role];
}

export function clientTypeLabel(clientType: ClientType): string {
  return CLIENT_TYPE_LABELS[clientType];
}
