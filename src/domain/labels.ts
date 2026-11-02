import type { ClientType, IncidentStatus, Role, WorkOrderStatus, WorkOrderType } from "./types";

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

const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  nueva: "Nueva",
  abierta: "Abierta",
  en_curso: "En curso",
  pausada: "Pausada",
  cerrada: "Cerrada",
};

const ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  pausada: "Pausada",
  cerrada: "Cerrada",
};

const WORK_TYPE_LABELS: Record<WorkOrderType, string> = {
  reparacion: "Reparación",
  mantenimiento: "Mantenimiento",
  montaje: "Montaje",
  urgencia: "Urgencia",
  presupuesto: "Presupuesto",
  garantia: "Garantía",
};

export function clientTypeLabel(clientType: ClientType): string {
  return CLIENT_TYPE_LABELS[clientType];
}

export function incidentStatusLabel(status: IncidentStatus): string {
  return INCIDENT_STATUS_LABELS[status];
}

export function orderStatusLabel(status: WorkOrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

export function workTypeLabel(workType: WorkOrderType): string {
  return WORK_TYPE_LABELS[workType];
}

export function priorityLabel(priority: number | null): string {
  if (priority === 1) return "Urgente";
  if (priority === 2) return "Alta";
  if (priority === 3) return "Media";
  if (priority === 4) return "Baja";
  return "—";
}
