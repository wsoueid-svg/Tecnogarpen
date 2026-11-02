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

export const INCIDENT_STATUSES = ["nueva", "abierta", "en_curso", "pausada", "cerrada"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const WORK_ORDER_STATUSES = ["pendiente", "en_curso", "pausada", "cerrada"] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

/** One field day, used by the demo dashboard. */
export const DAY_RATE_EUR = 350;
export const HOURS_PER_DAY = 8;

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
  city: string | null;
  postalCode: string | null;
  country: string | null;
  code: string | null;
  notes: string | null;
  externalId: string | null;
  createdAt: string;
  createdBy: string;
};

export type Finca = {
  id: string;
  companyId: string;
  clientId: string;
  parentId: string | null;
  name: string;
  address: string | null;
  municipality: string | null;
  postalCode: string | null;
  code: string | null;
  notes: string | null;
  externalId: string | null;
  createdAt: string;
  createdBy: string;
};

export type Asset = {
  id: string;
  companyId: string;
  fincaId: string;
  name: string;
  code: string | null;
  serialNumber: string | null;
  locationLabel: string | null;
  notes: string | null;
  externalId: string | null;
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

export type Incident = {
  id: string;
  companyId: string;
  clientId: string;
  fincaId: string;
  assetId: string | null;
  code: string | null;
  summary: string;
  status: IncidentStatus;
  priority: number | null;
  externalId: string | null;
  createdAt: string;
  createdBy: string;
};

export type IncidentInput = {
  companyId: string;
  clientId: string;
  fincaId: string;
  assetId: string | null;
  summary: string;
  priority: number | null;
};

export type IncidentRecord = Incident & {
  clientName: string;
  fincaName: string;
  assetName: string | null;
};

export type WorkOrder = {
  id: string;
  companyId: string;
  incidentId: string | null;
  contractId: string | null;
  clientId: string;
  fincaId: string;
  assetId: string | null;
  code: string | null;
  summary: string;
  workType: WorkOrderType;
  status: WorkOrderStatus;
  assigneeId: string | null;
  hours: number | null;
  closeNote: string | null;
  photoName: string | null;
  signatureName: string | null;
  scheduledAt: string | null;
  externalId: string | null;
  createdAt: string;
  createdBy: string;
  closedAt: string | null;
};

export type WorkOrderInput = {
  companyId: string;
  incidentId: string | null;
  clientId: string;
  fincaId: string;
  assetId: string | null;
  workType: WorkOrderType;
  summary: string;
  assigneeId: string | null;
  scheduledAt: string | null;
};

export type WorkOrderClose = {
  note: string;
  photoName: string | null;
  signatureName: string;
  hours: number;
};

export type WorkOrderRecord = WorkOrder & {
  clientName: string;
  fincaName: string;
  assetName: string | null;
  assigneeName: string | null;
};

export type MaintenanceContract = {
  id: string;
  companyId: string;
  clientId: string;
  reference: string;
  name: string;
  frequency: string;
  notes: string | null;
  assetIds: string[];
  externalId: string | null;
  startsOn: string;
  createdAt: string;
  createdBy: string;
};

export type ContractRecord = MaintenanceContract & { clientName: string };

export type OperarioOption = { id: string; displayName: string };

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
  version: 2;
  companies: Company[];
  users: StoredUser[];
  memberships: Membership[];
  clients: Client[];
  fincas: Finca[];
  assets: Asset[];
  incidents: Incident[];
  workOrders: WorkOrder[];
  contracts: MaintenanceContract[];
};
