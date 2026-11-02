import {
  CLIENT_TYPES,
  type AssetInput,
  type ClientInput,
  type ClientType,
  type FincaInput,
} from "./types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function isRealDay(day: string): boolean {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return false;
  const utc = new Date(Date.UTC(year, month - 1, date));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === date;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL = /^\d{5}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function clean(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function optional(value: string | null | undefined, max: number, label: string): string | null {
  const text = clean(value);
  if (!text) return null;
  if (text.length > max) {
    throw new ValidationError(`${label} admite como máximo ${max} caracteres.`);
  }
  return text;
}

function required(value: string | null | undefined, max: number, label: string): string {
  const text = optional(value, max, label);
  if (!text) throw new ValidationError(`${label} es obligatorio.`);
  return text;
}

export function parseClientInput(raw: {
  companyId: string;
  clientType: string;
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}): ClientInput {
  if (!(CLIENT_TYPES as readonly string[]).includes(raw.clientType)) {
    throw new ValidationError("El tipo de cliente no es válido.");
  }
  const email = optional(raw.email, 160, "El email");
  if (email && !EMAIL.test(email)) {
    throw new ValidationError("El email no tiene un formato válido.");
  }
  return {
    companyId: raw.companyId,
    clientType: raw.clientType as ClientType,
    name: required(raw.name, 160, "El nombre"),
    taxId: optional(raw.taxId, 20, "El NIF"),
    email,
    phone: optional(raw.phone, 40, "El teléfono"),
    address: optional(raw.address, 300, "La dirección"),
  };
}

export function parseFincaInput(raw: {
  companyId: string;
  clientId: string;
  name: string;
  address?: string | null;
  municipality?: string | null;
  postalCode?: string | null;
}): FincaInput {
  const clientId = clean(raw.clientId);
  if (!clientId) throw new ValidationError("El cliente es obligatorio.");
  const postalCode = optional(raw.postalCode, 5, "El código postal");
  if (postalCode && !POSTAL.test(postalCode)) {
    throw new ValidationError("El código postal debe tener 5 dígitos.");
  }
  return {
    companyId: raw.companyId,
    clientId,
    name: required(raw.name, 160, "El nombre"),
    address: optional(raw.address, 300, "La dirección"),
    municipality: optional(raw.municipality, 120, "El municipio"),
    postalCode,
  };
}

export function parseAssetInput(raw: {
  companyId: string;
  fincaId: string;
  name: string;
  serialNumber?: string | null;
  installedOn?: string | null;
}): AssetInput {
  const fincaId = clean(raw.fincaId);
  if (!fincaId) throw new ValidationError("La finca es obligatoria.");
  const installedOn = optional(raw.installedOn, 10, "La fecha de instalación");
  if (installedOn && !DAY.test(installedOn)) {
    throw new ValidationError("La fecha de instalación debe ser AAAA-MM-DD.");
  }
  if (installedOn && !isRealDay(installedOn)) {
    throw new ValidationError("La fecha de instalación no existe.");
  }
  return {
    companyId: raw.companyId,
    fincaId,
    name: required(raw.name, 160, "El nombre"),
    serialNumber: optional(raw.serialNumber, 80, "El número de serie"),
    installedOn,
  };
}
