import type { SupabaseClient } from "@supabase/supabase-js";
import { assertCanWriteMasters } from "../domain/access";
import { applyClose, assertCanTouchOrder, assertIncidentStatus, assertOrderStatus } from "../domain/operations";
import type {
  Actor,
  ContractRecord,
  Incident,
  IncidentInput,
  IncidentRecord,
  IncidentStatus,
  OperarioOption,
  WorkOrder,
  WorkOrderClose,
  WorkOrderInput,
  WorkOrderRecord,
  WorkOrderStatus,
} from "../domain/types";
import { ValidationError } from "../domain/validation";

type Row = Record<string, unknown>;

function raise(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function text(value: unknown): string | null {
  return value == null ? null : String(value);
}

function embed(value: unknown): Row | null {
  if (Array.isArray(value)) return (value[0] as Row | undefined) ?? null;
  if (value && typeof value === "object") return value as Row;
  return null;
}

function displayOf(value: unknown): string {
  const row = embed(value);
  return row?.display_name ? String(row.display_name) : "Operario";
}

function nameOf(value: unknown, fallback: string): string {
  const row = embed(value);
  return row?.name ? String(row.name) : fallback;
}

const ORDER_COLUMNS =
  "id, company_id, incident_id, contract_id, client_id, finca_id, asset_id, code, summary, work_type, status, assignee_id, hours, close_note, photo_name, signature_name, scheduled_at, external_id, created_at, created_by, closed_at, client:client_id(name), finca:finca_id(name), asset:asset_id(name), assignee:assignee_id(display_name)";

function mapOrder(row: Row): WorkOrderRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    incidentId: text(row.incident_id),
    contractId: text(row.contract_id),
    clientId: String(row.client_id),
    fincaId: String(row.finca_id),
    assetId: text(row.asset_id),
    code: text(row.code),
    summary: String(row.summary ?? ""),
    workType: row.work_type as WorkOrderRecord["workType"],
    status: row.status as WorkOrderStatus,
    assigneeId: text(row.assignee_id),
    hours: row.hours == null ? null : Number(row.hours),
    closeNote: text(row.close_note),
    photoName: text(row.photo_name),
    signatureName: text(row.signature_name),
    scheduledAt: text(row.scheduled_at),
    externalId: text(row.external_id),
    createdAt: String(row.created_at),
    createdBy: String(row.created_by),
    closedAt: text(row.closed_at),
    clientName: nameOf(row.client, "Cliente"),
    fincaName: nameOf(row.finca, "Finca"),
    assetName: row.asset_id ? nameOf(row.asset, "Puerta") : null,
    assigneeName: row.assignee_id ? displayOf(row.assignee) : null,
  };
}

function mapIncident(row: Row): IncidentRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    clientId: String(row.client_id),
    fincaId: String(row.finca_id),
    assetId: text(row.asset_id),
    code: text(row.code),
    summary: String(row.summary ?? ""),
    status: row.status as IncidentStatus,
    priority: row.priority == null ? null : Number(row.priority),
    externalId: text(row.external_id),
    createdAt: String(row.created_at),
    createdBy: String(row.created_by),
    clientName: nameOf(row.client, "Cliente"),
    fincaName: nameOf(row.finca, "Finca"),
    assetName: row.asset_id ? nameOf(row.asset, "Puerta") : null,
  };
}

async function loadOrder(supabase: SupabaseClient, id: string): Promise<WorkOrderRecord> {
  const { data, error } = await supabase.from("work_order").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  raise(error);
  if (!data) throw new ValidationError("No está esa orden.");
  return mapOrder(data as Row);
}

export async function sbListIncidents(supabase: SupabaseClient, companyId: string): Promise<IncidentRecord[]> {
  const { data, error } = await supabase
    .from("incident")
    .select("id, company_id, client_id, finca_id, asset_id, code, summary, status, priority, external_id, created_at, created_by, client:client_id(name), finca:finca_id(name), asset:asset_id(name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  raise(error);
  return (data ?? []).map((row) => mapIncident(row as Row));
}

export async function sbCreateIncident(supabase: SupabaseClient, actor: Actor, input: IncidentInput): Promise<Incident> {
  assertCanWriteMasters(actor, input.companyId);
  const { data, error } = await supabase
    .from("incident")
    .insert({
      company_id: input.companyId,
      client_id: input.clientId,
      finca_id: input.fincaId,
      asset_id: input.assetId,
      summary: input.summary,
      priority: input.priority,
      status: "nueva",
      created_by: actor.id,
    })
    .select("id, company_id, client_id, finca_id, asset_id, code, summary, status, priority, external_id, created_at, created_by")
    .single();
  raise(error);
  if (!data) throw new Error("Supabase no devolvió la incidencia.");
  return mapIncident(data as Row);
}

export async function sbSetIncidentStatus(supabase: SupabaseClient, actor: Actor, incidentId: string, status: IncidentStatus): Promise<Incident> {
  const next = assertIncidentStatus(status);
  const { data: current, error: readError } = await supabase.from("incident").select("id, company_id").eq("id", incidentId).maybeSingle();
  raise(readError);
  if (!current) throw new ValidationError("No está esa incidencia.");
  assertCanWriteMasters(actor, String(current.company_id));
  const { data, error } = await supabase
    .from("incident")
    .update({ status: next })
    .eq("id", incidentId)
    .select("id, company_id, client_id, finca_id, asset_id, code, summary, status, priority, external_id, created_at, created_by")
    .single();
  raise(error);
  if (!data) throw new Error("Supabase no devolvió la incidencia.");
  return mapIncident({ ...(data as Row), client: null, finca: null, asset: null });
}

export async function sbListOrders(supabase: SupabaseClient, companyId: string): Promise<WorkOrderRecord[]> {
  const { data, error } = await supabase.from("work_order").select(ORDER_COLUMNS).eq("company_id", companyId).order("created_at", { ascending: false });
  raise(error);
  return (data ?? []).map((row) => mapOrder(row as Row));
}

export async function sbListMyOrders(supabase: SupabaseClient, actor: Actor): Promise<WorkOrderRecord[]> {
  const { data, error } = await supabase.from("work_order").select(ORDER_COLUMNS).eq("assignee_id", actor.id);
  raise(error);
  return (data ?? []).map((row) => mapOrder(row as Row)).filter((order) => actor.companyIds.includes(order.companyId));
}

export async function sbCreateOrder(supabase: SupabaseClient, actor: Actor, input: WorkOrderInput): Promise<WorkOrder> {
  assertCanWriteMasters(actor, input.companyId);
  let clientId = input.clientId;
  let fincaId = input.fincaId;
  let assetId = input.assetId;
  if (input.incidentId) {
    const { data: incident, error } = await supabase.from("incident").select("client_id, finca_id, asset_id, company_id").eq("id", input.incidentId).maybeSingle();
    raise(error);
    if (!incident || incident.company_id !== input.companyId) throw new ValidationError("La incidencia no es de esta empresa.");
    clientId = String(incident.client_id);
    fincaId = String(incident.finca_id);
    assetId = incident.asset_id == null ? null : String(incident.asset_id);
  }
  const { data, error } = await supabase
    .from("work_order")
    .insert({
      company_id: input.companyId,
      incident_id: input.incidentId,
      client_id: clientId,
      finca_id: fincaId,
      asset_id: assetId,
      summary: input.summary,
      work_type: input.workType,
      status: "pendiente",
      assignee_id: input.assigneeId,
      scheduled_at: input.scheduledAt,
      created_by: actor.id,
    })
    .select(ORDER_COLUMNS)
    .single();
  raise(error);
  if (!data) throw new Error("Supabase no devolvió la orden.");
  return mapOrder(data as Row);
}

export async function sbAssign(supabase: SupabaseClient, actor: Actor, workOrderId: string, assigneeId: string): Promise<WorkOrder> {
  const current = await loadOrder(supabase, workOrderId);
  assertCanWriteMasters(actor, current.companyId);
  if (current.status === "cerrada") throw new ValidationError("La orden ya está cerrada.");
  const { data, error } = await supabase.from("work_order").update({ assignee_id: assigneeId }).eq("id", workOrderId).select(ORDER_COLUMNS).single();
  raise(error);
  if (!data) throw new Error("Supabase no devolvió la orden.");
  return mapOrder(data as Row);
}

export async function sbSetOrderStatus(supabase: SupabaseClient, actor: Actor, workOrderId: string, status: WorkOrderStatus): Promise<WorkOrder> {
  const next = assertOrderStatus(status);
  if (next === "cerrada") throw new ValidationError("Para cerrar hace falta nota, foto y firma.");
  const current = await loadOrder(supabase, workOrderId);
  assertCanTouchOrder(actor, current);
  const { data, error } = await supabase.from("work_order").update({ status: next }).eq("id", workOrderId).select(ORDER_COLUMNS).single();
  raise(error);
  if (!data) throw new Error("Supabase no devolvió la orden.");
  return mapOrder(data as Row);
}

export async function sbClose(supabase: SupabaseClient, actor: Actor, workOrderId: string, close: WorkOrderClose): Promise<WorkOrder> {
  const current = await loadOrder(supabase, workOrderId);
  assertCanTouchOrder(actor, current);
  const closed = applyClose(current, close);
  const { data, error } = await supabase
    .from("work_order")
    .update({
      status: "cerrada",
      close_note: closed.closeNote,
      photo_name: closed.photoName,
      signature_name: closed.signatureName,
      hours: closed.hours,
      closed_at: closed.closedAt,
    })
    .eq("id", workOrderId)
    .select(ORDER_COLUMNS)
    .single();
  raise(error);
  if (current.incidentId) {
    const { error: incidentError } = await supabase.from("incident").update({ status: "cerrada" }).eq("id", current.incidentId);
    raise(incidentError);
  }
  if (!data) throw new Error("Supabase no devolvió la orden.");
  return mapOrder(data as Row);
}

export async function sbContracts(supabase: SupabaseClient, companyId: string): Promise<ContractRecord[]> {
  const { data, error } = await supabase
    .from("maintenance_contract")
    .select("id, company_id, client_id, reference, name, frequency, notes, external_id, starts_on, created_at, created_by, client:client_id(name), maintenance_contract_asset(asset_id)")
    .eq("company_id", companyId);
  raise(error);
  return (data ?? []).map((row) => {
    const record = row as Row;
    const links = Array.isArray(record.maintenance_contract_asset) ? record.maintenance_contract_asset : [];
    return {
      id: String(record.id),
      companyId: String(record.company_id),
      clientId: String(record.client_id),
      reference: String(record.reference),
      name: String(record.name ?? record.reference),
      frequency: String(record.frequency ?? ""),
      notes: text(record.notes),
      assetIds: links.map((link) => String((link as Row).asset_id)),
      externalId: text(record.external_id),
      startsOn: String(record.starts_on),
      createdAt: String(record.created_at),
      createdBy: String(record.created_by),
      clientName: nameOf(record.client, "Cliente"),
    };
  });
}

export async function sbOperarios(supabase: SupabaseClient, companyId: string): Promise<OperarioOption[]> {
  const { data, error } = await supabase.from("user_company").select("user_id, app_user:user_id(id, display_name, role)").eq("company_id", companyId);
  raise(error);
  return (data ?? [])
    .map((row) => embed((row as Row).app_user))
    .filter((user): user is Row => user != null && user.role === "operario")
    .map((user) => ({ id: String(user.id), displayName: String(user.display_name) }));
}
