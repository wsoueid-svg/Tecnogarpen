import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertCanWriteMasters, assertCompanyVisible } from "../domain/access";
import type { MastersRepository } from "../domain/repository";
import type {
  Actor,
  Asset,
  AssetInput,
  AssetRecord,
  Client,
  ClientInput,
  ClientType,
  Company,
  Finca,
  FincaInput,
  FincaRecord,
} from "../domain/types";
import { signSupabaseJwt } from "./jwt";

type DbError = { message: string } | null;

function raise(error: DbError): void {
  if (error) throw new Error(error.message);
}

function requiredRow<T>(data: T | null): T {
  if (!data) throw new Error("Supabase no devolvió la fila creada.");
  return data;
}

export class SupabaseMastersRepository implements MastersRepository {
  constructor(
    private readonly url: string,
    private readonly anonKey: string,
    private readonly jwtSecret: string,
  ) {}

  async listCompanies(actor: Actor): Promise<Company[]> {
    const supabase = this.clientFor(actor);
    const { data, error } = await supabase.from("company").select("id, name, prefix, created_at").order("prefix");
    raise(error);
    return (data ?? [])
      .map((row) => ({
        id: String(row.id),
        name: String(row.name),
        prefix: String(row.prefix),
        createdAt: String(row.created_at),
      }))
      .filter((company) => actor.companyIds.includes(company.id));
  }

  async listClients(actor: Actor, companyId: string): Promise<Client[]> {
    assertCompanyVisible(actor, companyId);
    const supabase = this.clientFor(actor);
    const { data, error } = await supabase
      .from("client")
      .select("id, company_id, client_type, name, tax_id, email, phone, address, created_at, created_by")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    raise(error);
    return (data ?? []).map((row) => ({
      id: String(row.id),
      companyId: String(row.company_id),
      clientType: row.client_type as ClientType,
      name: String(row.name),
      taxId: row.tax_id == null ? null : String(row.tax_id),
      email: row.email == null ? null : String(row.email),
      phone: row.phone == null ? null : String(row.phone),
      address: row.address == null ? null : String(row.address),
      createdAt: String(row.created_at),
      createdBy: String(row.created_by),
    }));
  }

  async createClient(actor: Actor, input: ClientInput): Promise<Client> {
    assertCanWriteMasters(actor, input.companyId);
    const supabase = this.clientFor(actor);
    const { data, error } = await supabase
      .from("client")
      .insert({
        company_id: input.companyId,
        client_type: input.clientType,
        name: input.name,
        tax_id: input.taxId,
        email: input.email,
        phone: input.phone,
        address: input.address,
        created_by: actor.id,
      })
      .select("id, company_id, client_type, name, tax_id, email, phone, address, created_at, created_by")
      .single();
    raise(error);
    const row = requiredRow(data);
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      clientType: row.client_type as ClientType,
      name: String(row.name),
      taxId: row.tax_id == null ? null : String(row.tax_id),
      email: row.email == null ? null : String(row.email),
      phone: row.phone == null ? null : String(row.phone),
      address: row.address == null ? null : String(row.address),
      createdAt: String(row.created_at),
      createdBy: String(row.created_by),
    };
  }

  async listFincas(actor: Actor, companyId: string): Promise<FincaRecord[]> {
    assertCompanyVisible(actor, companyId);
    const supabase = this.clientFor(actor);
    const { data, error } = await supabase
      .from("finca")
      .select("id, company_id, client_id, name, address, municipality, postal_code, created_at, created_by, client:client_id(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    raise(error);
    return (data ?? []).map((row) => ({
      id: String(row.id),
      companyId: String(row.company_id),
      clientId: String(row.client_id),
      name: String(row.name),
      address: row.address == null ? null : String(row.address),
      municipality: row.municipality == null ? null : String(row.municipality),
      postalCode: row.postal_code == null ? null : String(row.postal_code),
      createdAt: String(row.created_at),
      createdBy: String(row.created_by),
      clientName: embeddedName(row.client),
    }));
  }

  async createFinca(actor: Actor, input: FincaInput): Promise<Finca> {
    assertCanWriteMasters(actor, input.companyId);
    const supabase = this.clientFor(actor);
    const { data: parent, error: parentError } = await supabase
      .from("client")
      .select("id, company_id")
      .eq("id", input.clientId)
      .maybeSingle();
    raise(parentError);
    if (!parent || parent.company_id !== input.companyId) {
      throw new Error("La finca tiene que pertenecer a un cliente de la misma empresa.");
    }
    const { data, error } = await supabase
      .from("finca")
      .insert({
        company_id: input.companyId,
        client_id: input.clientId,
        name: input.name,
        address: input.address,
        municipality: input.municipality,
        postal_code: input.postalCode,
        created_by: actor.id,
      })
      .select("id, company_id, client_id, name, address, municipality, postal_code, created_at, created_by")
      .single();
    raise(error);
    const row = requiredRow(data);
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      clientId: String(row.client_id),
      name: String(row.name),
      address: row.address == null ? null : String(row.address),
      municipality: row.municipality == null ? null : String(row.municipality),
      postalCode: row.postal_code == null ? null : String(row.postal_code),
      createdAt: String(row.created_at),
      createdBy: String(row.created_by),
    };
  }

  async listAssets(actor: Actor, companyId: string): Promise<AssetRecord[]> {
    assertCompanyVisible(actor, companyId);
    const supabase = this.clientFor(actor);
    const { data, error } = await supabase
      .from("asset")
      .select(
        "id, company_id, finca_id, name, serial_number, installed_on, created_at, created_by, finca:finca_id(name, client:client_id(name))",
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    raise(error);
    return (data ?? []).map((row) => {
      const finca = firstEmbed(row.finca) as { name?: string; client?: unknown } | null;
      return {
        id: String(row.id),
        companyId: String(row.company_id),
        fincaId: String(row.finca_id),
        name: String(row.name),
        serialNumber: row.serial_number == null ? null : String(row.serial_number),
        installedOn: row.installed_on == null ? null : String(row.installed_on),
        createdAt: String(row.created_at),
        createdBy: String(row.created_by),
        fincaName: finca?.name ? String(finca.name) : "Finca",
        clientName: finca ? embeddedName(finca.client) : "Cliente",
      };
    });
  }

  async createAsset(actor: Actor, input: AssetInput): Promise<Asset> {
    assertCanWriteMasters(actor, input.companyId);
    const supabase = this.clientFor(actor);
    const { data: parent, error: parentError } = await supabase
      .from("finca")
      .select("id, company_id")
      .eq("id", input.fincaId)
      .maybeSingle();
    raise(parentError);
    if (!parent || parent.company_id !== input.companyId) {
      throw new Error("El activo tiene que pertenecer a una finca de la misma empresa.");
    }
    const { data, error } = await supabase
      .from("asset")
      .insert({
        company_id: input.companyId,
        finca_id: input.fincaId,
        name: input.name,
        serial_number: input.serialNumber,
        installed_on: input.installedOn,
        created_by: actor.id,
      })
      .select("id, company_id, finca_id, name, serial_number, installed_on, created_at, created_by")
      .single();
    raise(error);
    const row = requiredRow(data);
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      fincaId: String(row.finca_id),
      name: String(row.name),
      serialNumber: row.serial_number == null ? null : String(row.serial_number),
      installedOn: row.installed_on == null ? null : String(row.installed_on),
      createdAt: String(row.created_at),
      createdBy: String(row.created_by),
    };
  }

  private clientFor(actor: Actor): SupabaseClient {
    const token = signSupabaseJwt(actor.id, this.jwtSecret);
    return createClient(this.url, this.anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
}

function firstEmbed(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) ?? null;
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return null;
}

function embeddedName(value: unknown): string {
  const row = firstEmbed(value);
  return row?.name ? String(row.name) : "Cliente";
}

export function createSupabaseRepository(): SupabaseMastersRepository {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const jwtSecret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (!url || !anonKey || !jwtSecret) {
    throw new Error("Faltan SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_JWT_SECRET.");
  }
  return new SupabaseMastersRepository(url, anonKey, jwtSecret);
}
