import type {
  Actor,
  Asset,
  AssetInput,
  AssetRecord,
  Client,
  ClientInput,
  Company,
  Finca,
  FincaInput,
  FincaRecord,
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
}
