import type {
  Actor,
  Asset,
  AssetInput,
  AssetRecord,
  Client,
  ClientInput,
  Company,
  ContractRecord,
  Finca,
  FincaInput,
  FincaRecord,
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
} from "./types";

/**
 * Write-once masters. Increment A exposes list and create only.
 * Updates and deletes are intentionally absent: the SQL grants match this.
 */
export interface MastersRepository {
  listCompanies(actor: Actor): Promise<Company[]>;
  listClients(actor: Actor, companyId: string): Promise<Client[]>;
  createClient(actor: Actor, input: ClientInput): Promise<Client>;
  listFincas(actor: Actor, companyId: string): Promise<FincaRecord[]>;
  createFinca(actor: Actor, input: FincaInput): Promise<Finca>;
  listAssets(actor: Actor, companyId: string): Promise<AssetRecord[]>;
  createAsset(actor: Actor, input: AssetInput): Promise<Asset>;
  listIncidents(actor: Actor, companyId: string): Promise<IncidentRecord[]>;
  createIncident(actor: Actor, input: IncidentInput): Promise<Incident>;
  setIncidentStatus(actor: Actor, incidentId: string, status: IncidentStatus): Promise<Incident>;
  listWorkOrders(actor: Actor, companyId: string): Promise<WorkOrderRecord[]>;
  listMyWorkOrders(actor: Actor): Promise<WorkOrderRecord[]>;
  createWorkOrder(actor: Actor, input: WorkOrderInput): Promise<WorkOrder>;
  assignWorkOrder(actor: Actor, workOrderId: string, assigneeId: string): Promise<WorkOrder>;
  setWorkOrderStatus(actor: Actor, workOrderId: string, status: WorkOrderStatus): Promise<WorkOrder>;
  closeWorkOrder(actor: Actor, workOrderId: string, close: WorkOrderClose): Promise<WorkOrder>;
  listContracts(actor: Actor, companyId: string): Promise<ContractRecord[]>;
  listOperarios(actor: Actor, companyId: string): Promise<OperarioOption[]>;
}
