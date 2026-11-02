import { assertCanWriteMasters, assertCompanyVisible, canWriteMasters, AccessError } from "./access";
import type {
  Actor,
  Incident,
  IncidentInput,
  IncidentStatus,
  StoreFile,
  WorkOrder,
  WorkOrderClose,
  WorkOrderInput,
  WorkOrderRecord,
  WorkOrderStatus,
} from "./types";
import { INCIDENT_STATUSES, WORK_ORDER_STATUSES, WORK_ORDER_TYPES } from "./types";
import { ValidationError } from "./validation";

function clean(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function parseIncidentInput(raw: IncidentInput): IncidentInput {
  if (!raw.clientId.trim() || !raw.fincaId.trim()) {
    throw new ValidationError("La incidencia necesita cliente y finca.");
  }
  const summary = clean(raw.summary);
  if (!summary) throw new ValidationError("El resumen es obligatorio.");
  if (summary.length > 400) throw new ValidationError("El resumen admite como máximo 400 caracteres.");
  if (raw.priority != null && (raw.priority < 1 || raw.priority > 4)) {
    throw new ValidationError("La prioridad va de 1 (urgente) a 4 (baja).");
  }
  return { ...raw, summary, assetId: raw.assetId?.trim() || null };
}

export function parseWorkOrderInput(raw: WorkOrderInput): WorkOrderInput {
  if (!(WORK_ORDER_TYPES as readonly string[]).includes(raw.workType)) {
    throw new ValidationError("El tipo de orden no es válido.");
  }
  const summary = clean(raw.summary);
  if (!summary) throw new ValidationError("El resumen de la orden es obligatorio.");
  if (!raw.incidentId && !raw.fincaId.trim()) {
    throw new ValidationError("La orden necesita una incidencia o una finca.");
  }
  return {
    ...raw,
    summary,
    incidentId: raw.incidentId?.trim() || null,
    assetId: raw.assetId?.trim() || null,
    assigneeId: raw.assigneeId?.trim() || null,
    scheduledAt: raw.scheduledAt?.trim() || null,
  };
}

export function assertIncidentStatus(status: string): IncidentStatus {
  if (!(INCIDENT_STATUSES as readonly string[]).includes(status)) {
    throw new ValidationError("El estado de la incidencia no es válido.");
  }
  return status as IncidentStatus;
}

export function assertOrderStatus(status: string): WorkOrderStatus {
  if (!(WORK_ORDER_STATUSES as readonly string[]).includes(status)) {
    throw new ValidationError("El estado de la orden no es válido.");
  }
  return status as WorkOrderStatus;
}

export function assertCanOperate(actor: Actor, companyId: string): void {
  assertCanWriteMasters(actor, companyId);
}

export function assertCanTouchOrder(actor: Actor, order: WorkOrder): void {
  assertCompanyVisible(actor, order.companyId);
  if (canWriteMasters(actor)) return;
  if (order.assigneeId !== actor.id) {
    throw new AccessError("Esta orden no está en tu día.");
  }
}

export function applyClose(order: WorkOrder, input: WorkOrderClose, now = new Date().toISOString()): WorkOrder {
  if (order.status === "cerrada") throw new ValidationError("La orden ya está cerrada.");
  const note = clean(input.note);
  const signatureName = clean(input.signatureName);
  if (!note) throw new ValidationError("La nota de cierre es obligatoria.");
  if (!signatureName) throw new ValidationError("La firma es obligatoria.");
  if (!Number.isFinite(input.hours) || input.hours < 0 || input.hours > 24) {
    throw new ValidationError("Las horas tienen que estar entre 0 y 24.");
  }
  const photoName = clean(input.photoName);
  return {
    ...order,
    status: "cerrada",
    closeNote: note,
    signatureName,
    photoName: photoName || null,
    hours: Math.round(input.hours * 100) / 100,
    closedAt: now,
  };
}

export function decorateOrders(store: StoreFile, orders: WorkOrder[]): WorkOrderRecord[] {
  const clients = new Map(store.clients.map((client) => [client.id, client.name]));
  const fincas = new Map(store.fincas.map((finca) => [finca.id, finca.name]));
  const assets = new Map(store.assets.map((asset) => [asset.id, asset.name]));
  const users = new Map(store.users.map((user) => [user.id, user.displayName]));
  return orders.map((order) => ({
    ...order,
    clientName: clients.get(order.clientId) ?? "Cliente",
    fincaName: fincas.get(order.fincaId) ?? "Finca",
    assetName: order.assetId ? (assets.get(order.assetId) ?? null) : null,
    assigneeName: order.assigneeId ? (users.get(order.assigneeId) ?? null) : null,
  }));
}

export function myOpenOrders(actor: Actor, orders: WorkOrderRecord[]): WorkOrderRecord[] {
  return orders
    .filter((order) => order.assigneeId === actor.id && actor.companyIds.includes(order.companyId) && order.status !== "cerrada")
    .sort((a, b) => {
      if (a.status === "en_curso" && b.status !== "en_curso") return -1;
      if (b.status === "en_curso" && a.status !== "en_curso") return 1;
      return (a.scheduledAt ?? "9999").localeCompare(b.scheduledAt ?? "9999");
    });
}
