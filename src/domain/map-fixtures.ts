import { COMPANY_TG_ID, COMPANY_TGI_ID, USER_MARTA_ID, USER_POL_ID } from "./ids";
import { DIRECTORY_COMPANIES, DIRECTORY_USERS } from "./directory";
import type {
  Asset,
  Client,
  ClientType,
  Finca,
  Incident,
  IncidentStatus,
  MaintenanceContract,
  StoreFile,
  WorkOrder,
  WorkOrderStatus,
} from "./types";

const MARTA = USER_MARTA_ID;
const POL = USER_POL_ID;

type Bag = Record<string, unknown>;

function ndjson(text: string): Bag[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Bag);
}

function attrs(row: Bag): Bag {
  return (row.attributes as Bag | undefined) ?? row;
}

function str(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function numId(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

/** Stable UUID so the local seed and the SQL seed share ids. */
export function fixtureId(kind: "1" | "2" | "3" | "4" | "5" | "6" | "7", raw: string): string {
  const tail = numId(raw).padStart(12, "0").slice(-12);
  return `${kind}0000000-0000-4000-8000-${tail}`;
}

function madridIso(local: string | null): string | null {
  if (!local) return null;
  const match = local.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (!match) return null;
  const date = match[1] ?? "";
  const time = match[2] ?? "00:00:00";
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const dst = (month > 3 && month < 10) || (month === 3 && day >= 29) || (month === 10 && day < 25);
  return `${date}T${time}${dst ? "+02:00" : "+01:00"}`;
}

function manpowerHours(value: unknown): number | null {
  const text = str(value);
  if (!text) return null;
  const [hours, minutes, seconds] = text.split(":").map(Number);
  if (!Number.isFinite(hours)) return null;
  return Math.round(((hours ?? 0) + (minutes ?? 0) / 60 + (seconds ?? 0) / 3600) * 100) / 100;
}

function clientTypeOf(name: string): ClientType {
  if (/comunidad/i.test(name)) return "comunidad";
  if (/constructora/i.test(name)) return "constructora";
  return "empresa";
}

function doorParts(observation: string | null): { name: string; notes: string | null } {
  const text = observation?.trim() || "Puerta";
  const parts = text.split(" — ").map((part) => part.trim()).filter(Boolean);
  return { name: parts[0] || text, notes: parts.length > 1 ? parts.slice(1).join(" · ") : null };
}

function companyIdFor(code: string): string {
  if (code === "TG") return COMPANY_TG_ID;
  if (code === "TGI") return COMPANY_TGI_ID;
  throw new Error(`Empresa desconocida en company_map: ${code}`);
}

const INCIDENT_STATUS: Record<string, IncidentStatus> = {
  WAITING_APPROVAL: "nueva",
  WAITING_RESOLUTION: "abierta",
  IN_RESOLUTION: "en_curso",
  PAUSED: "pausada",
  COMPLETED: "cerrada",
};

const ORDER_STATUS: Record<string, WorkOrderStatus> = {
  WAITING_APPROVAL: "pendiente",
  WAITING_RESOLUTION: "pendiente",
  IN_RESOLUTION: "en_curso",
  PAUSED: "pausada",
  COMPLETED: "cerrada",
};

const FREQUENCY: Record<string, string> = {
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  MONTHLY: "Mensual",
  YEARLY: "Anual",
};

export function mapFixtures(files: {
  companyMap: string;
  clients: string;
  locations: string;
  elements: string;
  failures: string;
  works: string;
  scheduledWorks: string;
}): StoreFile {
  const companyByClient = new Map<string, string>();
  for (const row of ndjson(files.companyMap)) {
    companyByClient.set(numId(row.id), companyIdFor(String(row.company_code ?? "")));
  }

  const clients: Client[] = ndjson(files.clients).map((row) => {
    const data = attrs(row);
    const raw = numId(data.client_id ?? row.id);
    const companyId = companyByClient.get(raw);
    if (!companyId) throw new Error(`El cliente ${raw} no está en company_map.`);
    const name = String(data.name ?? "");
    return {
      id: fixtureId("1", raw),
      companyId,
      clientType: clientTypeOf(name),
      name,
      taxId: str(data.nif),
      email: null,
      phone: null,
      address: str(data.address),
      city: str(data.city),
      postalCode: str(data.postal_code),
      country: str(data.country),
      code: str(data.code),
      notes: str(data.observations),
      externalId: `infraspeak:client:${raw}`,
      createdAt: "2026-10-01T09:00:00+02:00",
      createdBy: MARTA,
    };
  });
  const clientByRaw = new Map(clients.map((client) => [client.externalId?.split(":").pop() ?? "", client]));

  const locationRows = ndjson(files.locations);
  const fincas: Finca[] = [];
  const fincaByLocal = new Map<string, Finca>();
  for (const row of locationRows) {
    const data = attrs(row);
    const raw = numId(data.local_id ?? row.id);
    const root = numId(data.root_parent_id ?? raw);
    const building = locationRows.find((item) => numId(attrs(item).local_id ?? item.id) === root);
    const clientRaw = numId(attrs(building ?? row).client_id);
    const client = clientByRaw.get(clientRaw);
    if (!client) throw new Error(`La ubicación ${raw} no cuelga de un cliente.`);
    const parentRaw = numId(data.parent_id);
    const parent = parentRaw ? fincaByLocal.get(parentRaw) : undefined;
    const finca: Finca = {
      id: fixtureId("2", raw),
      companyId: client.companyId,
      clientId: client.id,
      parentId: parent?.id ?? null,
      name: String(data.name ?? raw),
      address: client.address,
      municipality: client.city,
      postalCode: client.postalCode,
      code: str(data.code),
      notes: str(data.full_name),
      externalId: `infraspeak:${String(row.type ?? "location")}:${raw}`,
      createdAt: madridIso(str(data.date_updated)) ?? "2026-10-15T09:00:00+02:00",
      createdBy: MARTA,
    };
    fincas.push(finca);
    fincaByLocal.set(raw, finca);
  }

  const assets: Asset[] = ndjson(files.elements).map((row) => {
    const data = attrs(row);
    const raw = numId(data.element_id ?? row.id);
    const finca = fincaByLocal.get(numId(data.local_id));
    if (!finca) throw new Error(`El elemento ${raw} no tiene ubicación ${String(data.local_id)}.`);
    const door = doorParts(str(data.observation));
    return {
      id: fixtureId("3", raw),
      companyId: finca.companyId,
      fincaId: finca.id,
      name: door.name,
      code: str(data.code),
      serialNumber: str(data.barcode),
      locationLabel: finca.notes,
      notes: door.notes,
      externalId: `infraspeak:element:${raw}`,
      installedOn: null,
      createdAt: madridIso(str(data.created_at)) ?? "2024-03-01T10:00:00+01:00",
      createdBy: MARTA,
    };
  });
  const assetByRaw = new Map(assets.map((asset) => [asset.externalId?.split(":").pop() ?? "", asset]));

  const incidents: Incident[] = [];
  const workOrders: WorkOrder[] = [];

  for (const row of ndjson(files.failures)) {
    const data = attrs(row);
    const raw = numId(data.failure_id ?? row.id);
    const client = clientByRaw.get(numId(data.client_id));
    const finca = fincaByLocal.get(numId(data.local_id));
    const asset = assetByRaw.get(numId(data.element_id_GUESS));
    if (!client || !finca) throw new Error(`La avería ${raw} no enlaza cliente y finca.`);
    const sourceStatus = String(data.status ?? "");
    const incidentStatus = INCIDENT_STATUS[sourceStatus];
    const orderStatus = ORDER_STATUS[sourceStatus];
    if (!incidentStatus || !orderStatus) throw new Error(`Estado de avería no mapeado: ${sourceStatus}`);
    const signed = String(data.signature_status ?? "") === "SIGNED";
    const polStarted = [data.started_by, data.completed_by].some((name) => /pol riera/i.test(String(name ?? "")));
    const assigned = sourceStatus === "WAITING_APPROVAL" || sourceStatus === "WAITING_RESOLUTION" ? false : polStarted;
    const createdAt = madridIso(str(data.created_at)) ?? madridIso(str(data.start_date)) ?? "2026-10-01T09:00:00+02:00";
    incidents.push({
      id: fixtureId("4", raw),
      companyId: client.companyId,
      clientId: client.id,
      fincaId: finca.id,
      assetId: asset?.id ?? null,
      code: str(data.code),
      summary: String(data.description ?? "Avería"),
      status: incidentStatus,
      priority: typeof data.priority === "number" ? data.priority : Number(data.priority ?? 0) || null,
      externalId: `infraspeak:failure:${raw}`,
      createdAt,
      createdBy: MARTA,
    });
    workOrders.push({
      id: fixtureId("5", raw),
      companyId: client.companyId,
      incidentId: fixtureId("4", raw),
      contractId: null,
      clientId: client.id,
      fincaId: finca.id,
      assetId: asset?.id ?? null,
      code: str(data.code),
      summary: String(data.description ?? "Avería"),
      workType: "reparacion",
      status: orderStatus,
      assigneeId: assigned ? POL : null,
      hours: orderStatus === "cerrada" ? manpowerHours(data.manpower_duration) : null,
      closeNote: signed ? "Cerrada y firmada" : null,
      photoName: null,
      signatureName: signed ? str(data.completed_by) : null,
      scheduledAt: madridIso(str(data.start_date)),
      externalId: `infraspeak:failure:${raw}`,
      createdAt,
      createdBy: MARTA,
      closedAt: madridIso(str(data.completed_date)),
    });
  }

  const contracts: MaintenanceContract[] = ndjson(files.works).map((row) => {
    const data = attrs(row);
    const raw = numId(data.work_id ?? row.id);
    const client = clientByRaw.get(numId(data.client_id));
    if (!client) throw new Error(`El contrato ${raw} no tiene cliente.`);
    const elementIds = Array.isArray(data.element_ids_GUESS) ? data.element_ids_GUESS : [];
    const day = Number((data.recurrence as Bag | undefined)?.bymonthday ?? 1);
    return {
      id: fixtureId("7", raw),
      companyId: client.companyId,
      clientId: client.id,
      reference: `MT-${raw}`,
      name: String(data.name ?? `Contrato ${raw}`),
      frequency: FREQUENCY[String(data.periodicity ?? "")] ?? String(data.periodicity ?? "Periódico"),
      notes: str(data.description),
      assetIds: elementIds.map((elementId) => assetByRaw.get(numId(elementId))?.id).filter((id): id is string => Boolean(id)),
      externalId: `infraspeak:work:${raw}`,
      startsOn: `2026-01-${String(day).padStart(2, "0")}`,
      createdAt: "2026-01-01T09:00:00+01:00",
      createdBy: MARTA,
    };
  });
  const contractByRaw = new Map(contracts.map((contract) => [contract.externalId?.split(":").pop() ?? "", contract]));

  for (const row of ndjson(files.scheduledWorks)) {
    const data = attrs(row);
    const raw = numId(data.schedule_work_id ?? row.id);
    const contract = contractByRaw.get(numId(data.work_id));
    if (!contract) throw new Error(`La visita ${raw} no tiene contrato.`);
    const asset = assets.find((item) => item.id === contract.assetIds[0]);
    const finca = fincas.find((item) => item.id === asset?.fincaId);
    if (!asset || !finca) throw new Error(`La visita ${raw} no tiene puerta.`);
    const completed = String(data.state ?? "") === "COMPLETED";
    const signed = String(data.signature_status ?? "") === "SIGNED";
    const pol = raw === "6002" || raw === "6003" || /pol riera/i.test(String(data.last_status_change_operator ?? ""));
    workOrders.push({
      id: fixtureId("6", raw),
      companyId: contract.companyId,
      incidentId: null,
      contractId: contract.id,
      clientId: contract.clientId,
      fincaId: finca.id,
      assetId: asset.id,
      code: `SW-${raw}`,
      summary: str(data.observation) ? `${contract.name}. ${str(data.observation)}` : contract.name,
      workType: "mantenimiento",
      status: completed ? "cerrada" : "pendiente",
      assigneeId: pol ? POL : null,
      hours: completed ? manpowerHours(data.manpower_duration) : null,
      closeNote: signed ? str(data.observation) : null,
      photoName: null,
      signatureName: signed ? "Pol Riera" : null,
      scheduledAt: madridIso(str(data.start_date)),
      externalId: `infraspeak:scheduled-work:${raw}`,
      createdAt: madridIso(str(data.start_date)) ?? "2026-07-15T09:00:00+02:00",
      createdBy: MARTA,
      closedAt: madridIso(str(data.completed_date)),
    });
  }

  return {
    version: 2,
    companies: DIRECTORY_COMPANIES.map((company) => ({ ...company })),
    users: DIRECTORY_USERS.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    })),
    memberships: DIRECTORY_USERS.flatMap((user) => user.companyIds.map((companyId) => ({ userId: user.id, companyId }))),
    clients,
    fincas,
    assets,
    incidents,
    workOrders,
    contracts,
  };
}
