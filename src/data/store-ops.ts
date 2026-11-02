import { assertCompanyVisible } from "../domain/access";
import {
  applyClose,
  assertCanOperate,
  assertCanTouchOrder,
  assertIncidentStatus,
  assertOrderStatus,
  decorateOrders,
  parseIncidentInput,
  parseWorkOrderInput,
} from "../domain/operations";
import type {
  Actor,
  Asset,
  AssetInput,
  Client,
  ClientInput,
  ContractRecord,
  Finca,
  FincaInput,
  Incident,
  IncidentInput,
  IncidentRecord,
  IncidentStatus,
  OperarioOption,
  StoreFile,
  WorkOrder,
  WorkOrderClose,
  WorkOrderInput,
  WorkOrderRecord,
  WorkOrderStatus,
} from "../domain/types";
import { ValidationError } from "../domain/validation";

function newest<T extends { createdAt: string; name?: string; summary?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || (a.name ?? a.summary ?? "").localeCompare(b.name ?? b.summary ?? "", "es"));
}

function sameCompany(store: StoreFile, clientId: string, fincaId: string, assetId: string | null, companyId: string): void {
  const client = store.clients.find((row) => row.id === clientId);
  const finca = store.fincas.find((row) => row.id === fincaId);
  if (!client || client.companyId !== companyId) throw new ValidationError("El cliente no es de esta empresa.");
  if (!finca || finca.companyId !== companyId || finca.clientId !== clientId) {
    throw new ValidationError("La finca tiene que ser del cliente y de la misma empresa.");
  }
  if (!assetId) return;
  const asset = store.assets.find((row) => row.id === assetId);
  if (!asset || asset.companyId !== companyId || asset.fincaId !== fincaId) {
    throw new ValidationError("La puerta tiene que estar en esa finca.");
  }
}

export function makeClient(actor: Actor, input: ClientInput): Client {
  return {
    ...input,
    id: crypto.randomUUID(),
    city: null,
    postalCode: null,
    country: null,
    code: null,
    notes: null,
    externalId: null,
    createdAt: new Date().toISOString(),
    createdBy: actor.id,
  };
}

export function makeFinca(actor: Actor, input: FincaInput): Finca {
  return {
    ...input,
    id: crypto.randomUUID(),
    parentId: null,
    code: null,
    notes: null,
    externalId: null,
    createdAt: new Date().toISOString(),
    createdBy: actor.id,
  };
}

export function makeAsset(actor: Actor, input: AssetInput): Asset {
  return {
    ...input,
    id: crypto.randomUUID(),
    code: null,
    locationLabel: null,
    notes: null,
    externalId: null,
    createdAt: new Date().toISOString(),
    createdBy: actor.id,
  };
}

function decorateIncidents(store: StoreFile, rows: Incident[]): IncidentRecord[] {
  const clients = new Map(store.clients.map((client) => [client.id, client.name]));
  const fincas = new Map(store.fincas.map((finca) => [finca.id, finca.name]));
  const assets = new Map(store.assets.map((asset) => [asset.id, asset.name]));
  return rows.map((incident) => ({
    ...incident,
    clientName: clients.get(incident.clientId) ?? "Cliente",
    fincaName: fincas.get(incident.fincaId) ?? "Finca",
    assetName: incident.assetId ? (assets.get(incident.assetId) ?? null) : null,
  }));
}

export function readIncidents(actor: Actor, store: StoreFile, companyId: string): IncidentRecord[] {
  assertCompanyVisible(actor, companyId);
  return newest(decorateIncidents(store, store.incidents.filter((row) => row.companyId === companyId)));
}

export function addIncident(actor: Actor, store: StoreFile, input: IncidentInput): Incident {
  assertCanOperate(actor, input.companyId);
  const parsed = parseIncidentInput(input);
  sameCompany(store, parsed.clientId, parsed.fincaId, parsed.assetId, parsed.companyId);
  const row: Incident = {
    ...parsed,
    id: crypto.randomUUID(),
    code: null,
    status: "nueva",
    externalId: null,
    createdAt: new Date().toISOString(),
    createdBy: actor.id,
  };
  store.incidents.push(row);
  return row;
}

export function patchIncidentStatus(actor: Actor, store: StoreFile, incidentId: string, status: IncidentStatus): Incident {
  const incident = store.incidents.find((row) => row.id === incidentId);
  if (!incident) throw new ValidationError("No está esa incidencia.");
  assertCanOperate(actor, incident.companyId);
  incident.status = assertIncidentStatus(status);
  return incident;
}

export function readOrders(actor: Actor, store: StoreFile, companyId: string): WorkOrderRecord[] {
  assertCompanyVisible(actor, companyId);
  return newest(decorateOrders(store, store.workOrders.filter((row) => row.companyId === companyId)));
}

export function readMyOrders(actor: Actor, store: StoreFile): WorkOrderRecord[] {
  return decorateOrders(
    store,
    store.workOrders.filter((row) => row.assigneeId === actor.id && actor.companyIds.includes(row.companyId)),
  );
}

export function addWorkOrder(actor: Actor, store: StoreFile, input: WorkOrderInput): WorkOrder {
  assertCanOperate(actor, input.companyId);
  const parsed = parseWorkOrderInput(input);
  let clientId = parsed.clientId;
  let fincaId = parsed.fincaId;
  let assetId = parsed.assetId;
  if (parsed.incidentId) {
    const incident = store.incidents.find((row) => row.id === parsed.incidentId);
    if (!incident || incident.companyId !== parsed.companyId) {
      throw new ValidationError("La incidencia no es de esta empresa.");
    }
    clientId = incident.clientId;
    fincaId = incident.fincaId;
    assetId = incident.assetId;
  }
  sameCompany(store, clientId, fincaId, assetId, parsed.companyId);
  if (parsed.assigneeId) assertOperario(store, parsed.companyId, parsed.assigneeId);
  const row: WorkOrder = {
    id: crypto.randomUUID(),
    companyId: parsed.companyId,
    incidentId: parsed.incidentId,
    contractId: null,
    clientId,
    fincaId,
    assetId,
    code: null,
    summary: parsed.summary,
    workType: parsed.workType,
    status: "pendiente",
    assigneeId: parsed.assigneeId,
    hours: null,
    closeNote: null,
    photoName: null,
    signatureName: null,
    scheduledAt: parsed.scheduledAt,
    externalId: null,
    createdAt: new Date().toISOString(),
    createdBy: actor.id,
    closedAt: null,
  };
  store.workOrders.push(row);
  return row;
}

function assertOperario(store: StoreFile, companyId: string, userId: string): void {
  const user = store.users.find((row) => row.id === userId);
  const member = store.memberships.some((row) => row.userId === userId && row.companyId === companyId);
  if (!user || user.role !== "operario" || !member) {
    throw new ValidationError("Ese operario no está en la empresa.");
  }
}

export function patchAssignee(actor: Actor, store: StoreFile, workOrderId: string, assigneeId: string): WorkOrder {
  const order = store.workOrders.find((row) => row.id === workOrderId);
  if (!order) throw new ValidationError("No está esa orden.");
  assertCanOperate(actor, order.companyId);
  if (order.status === "cerrada") throw new ValidationError("La orden ya está cerrada.");
  assertOperario(store, order.companyId, assigneeId);
  order.assigneeId = assigneeId;
  return order;
}

export function patchOrderStatus(actor: Actor, store: StoreFile, workOrderId: string, status: WorkOrderStatus): WorkOrder {
  const order = store.workOrders.find((row) => row.id === workOrderId);
  if (!order) throw new ValidationError("No está esa orden.");
  const next = assertOrderStatus(status);
  if (next === "cerrada") throw new ValidationError("Para cerrar hace falta nota, foto y firma.");
  assertCanTouchOrder(actor, order);
  if (order.status === "cerrada") throw new ValidationError("La orden ya está cerrada.");
  order.status = next;
  return order;
}

export function closeOrder(actor: Actor, store: StoreFile, workOrderId: string, close: WorkOrderClose): WorkOrder {
  const order = store.workOrders.find((row) => row.id === workOrderId);
  if (!order) throw new ValidationError("No está esa orden.");
  assertCanTouchOrder(actor, order);
  const closed = applyClose(order, close);
  Object.assign(order, closed);
  if (order.incidentId) {
    const incident = store.incidents.find((row) => row.id === order.incidentId);
    if (incident) incident.status = "cerrada";
  }
  return order;
}

export function readContracts(actor: Actor, store: StoreFile, companyId: string): ContractRecord[] {
  assertCompanyVisible(actor, companyId);
  const clients = new Map(store.clients.map((client) => [client.id, client.name]));
  return store.contracts
    .filter((contract) => contract.companyId === companyId)
    .map((contract) => ({ ...contract, clientName: clients.get(contract.clientId) ?? "Cliente" }));
}

export function readOperarios(actor: Actor, store: StoreFile, companyId: string): OperarioOption[] {
  assertCompanyVisible(actor, companyId);
  const ids = new Set(store.memberships.filter((row) => row.companyId === companyId).map((row) => row.userId));
  return store.users
    .filter((user) => user.role === "operario" && ids.has(user.id))
    .map((user) => ({ id: user.id, displayName: user.displayName }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
}
