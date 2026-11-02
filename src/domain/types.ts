export const ROLES = ["jefe", "encargado", "administrativo", "operario"] as const;
export type Role = (typeof ROLES)[number];

export const CLIENT_TYPES = [
  "particular",
  "comunidad",
  "admin",
  "empresa",
  "constructora",
  "intermediario",
] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const WORK_ORDER_TYPES = [
  "reparacion",
  "mantenimiento",
  "montaje",
  "urgencia",
  "presupuesto",
  "garantia",
] as const;
export type WorkOrderType = (typeof WORK_ORDER_TYPES)[number];

export const OFFICE_WRITER_ROLES = ["jefe", "encargado", "administrativo"] as const;

export type Actor = {
  id: string;
  role: Role;
  companyIds: readonly string[];
  displayName: string;
  email: string;
};

export type Company = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
};

export type Client = {
  id: string;
  companyId: string;
  clientType: ClientType;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  createdBy: string;
};

export type Finca = {
  id: string;
  companyId: string;
  clientId: string;
  name: string;
  address: string | null;
  municipality: string | null;
  postalCode: string | null;
  createdAt: string;
  createdBy: string;
};

export type Asset = {
  id: string;
  companyId: string;
  fincaId: string;
  name: string;
  serialNumber: string | null;
  installedOn: string | null;
  createdAt: string;
  createdBy: string;
};

export type ClientInput = {
  companyId: string;
  clientType: ClientType;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type FincaInput = {
  companyId: string;
  clientId: string;
  name: string;
  address: string | null;
  municipality: string | null;
  postalCode: string | null;
};

export type AssetInput = {
  companyId: string;
  fincaId: string;
  name: string;
  serialNumber: string | null;
  installedOn: string | null;
};

export type FincaRecord = Finca & { clientName: string };
export type AssetRecord = Asset & { fincaName: string; clientName: string };

export type Membership = {
  userId: string;
  companyId: string;
};

export type StoredUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string;
};

export type StoreFile = {
  companies: Company[];
  users: StoredUser[];
  memberships: Membership[];
  clients: Client[];
  fincas: Finca[];
  assets: Asset[];
};
