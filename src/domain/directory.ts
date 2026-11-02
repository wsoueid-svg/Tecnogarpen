import { COMPANY_TG_ID, COMPANY_TGI_ID, USER_MARTA_ID, USER_POL_ID } from "./ids";
import type { Actor, Company, Role } from "./types";

const SEED_AT = "2026-11-02T08:00:00.000Z";

export const DIRECTORY_COMPANIES: readonly Company[] = [
  {
    id: COMPANY_TG_ID,
    name: "Tecno Garpen",
    prefix: "TG",
    createdAt: SEED_AT,
  },
  {
    id: COMPANY_TGI_ID,
    name: "Tecno Garpen Instalaciones",
    prefix: "TGI",
    createdAt: SEED_AT,
  },
];

export type DirectoryUser = Actor & { createdAt: string };

export const DIRECTORY_USERS: readonly DirectoryUser[] = [
  {
    id: USER_MARTA_ID,
    email: "marta.puig@tecnogarpen.local",
    displayName: "Marta Puig",
    role: "jefe",
    companyIds: [COMPANY_TG_ID, COMPANY_TGI_ID],
    createdAt: SEED_AT,
  },
  {
    id: USER_POL_ID,
    email: "pol.riera@tecnogarpen.local",
    displayName: "Pol Riera",
    role: "operario",
    companyIds: [COMPANY_TG_ID],
    createdAt: SEED_AT,
  },
];

export function findDirectoryUser(id: string): DirectoryUser | undefined {
  return DIRECTORY_USERS.find((user) => user.id === id);
}

export function companyName(companyId: string): string {
  return DIRECTORY_COMPANIES.find((company) => company.id === companyId)?.name ?? companyId;
}

export function isRole(value: string): value is Role {
  return value === "jefe" || value === "encargado" || value === "administrativo" || value === "operario";
}
