import { writeFileSync } from "node:fs";
import { loadDemoStore } from "../src/data/load-fixtures";
import type { StoreFile } from "../src/domain/types";

function q(value: string | number | null | undefined): string {
  if (value == null || value === "") return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function rows(table: string, columns: string[], values: string[], conflict = "id"): string {
  return `insert into public.${table} (${columns.join(", ")})\nvalues\n  ${values.join(",\n  ")}\non conflict (${conflict}) do nothing;\n`;
}

function emit(store: StoreFile): string {
  const clients = store.clients.map(
    (row) =>
      `(${q(row.id)}, ${q(row.companyId)}, ${q(row.clientType)}, ${q(row.name)}, ${q(row.taxId)}, ${q(row.address)}, ${q(row.city)}, ${q(row.postalCode)}, ${q(row.country)}, ${q(row.code)}, ${q(row.notes)}, ${q(row.externalId)}, ${q(row.createdAt)}, ${q(row.createdBy)})`,
  );
  const fincas = store.fincas.map(
    (row) =>
      `(${q(row.id)}, ${q(row.companyId)}, ${q(row.clientId)}, ${q(row.parentId)}, ${q(row.name)}, ${q(row.address)}, ${q(row.municipality)}, ${q(row.postalCode)}, ${q(row.code)}, ${q(row.notes)}, ${q(row.externalId)}, ${q(row.createdAt)}, ${q(row.createdBy)})`,
  );
  const assets = store.assets.map(
    (row) =>
      `(${q(row.id)}, ${q(row.companyId)}, ${q(row.fincaId)}, ${q(row.name)}, ${q(row.code)}, ${q(row.serialNumber)}, ${q(row.locationLabel)}, ${q(row.notes)}, ${q(row.externalId)}, ${q(row.createdAt)}, ${q(row.createdBy)})`,
  );
  const incidents = store.incidents.map(
    (row) =>
      `(${q(row.id)}, ${q(row.companyId)}, ${q(row.clientId)}, ${q(row.fincaId)}, ${q(row.assetId)}, ${q(row.code)}, ${q(row.summary)}, ${q(row.status)}, ${row.priority ?? "null"}, ${q(row.externalId)}, ${q(row.createdAt)}, ${q(row.createdBy)})`,
  );
  const contracts = store.contracts.map(
    (row) =>
      `(${q(row.id)}, ${q(row.companyId)}, ${q(row.clientId)}, ${q(row.reference)}, ${q(row.name)}, ${q(row.frequency)}, ${q(row.notes)}, ${q(row.externalId)}, ${q(row.startsOn)}, ${q(row.createdAt)}, ${q(row.createdBy)})`,
  );
  const links = store.contracts.flatMap((contract) =>
    contract.assetIds.map((assetId) => `(${q(contract.id)}, ${q(assetId)})`),
  );
  const orders = store.workOrders.map(
    (row) =>
      `(${q(row.id)}, ${q(row.companyId)}, ${q(row.incidentId)}, ${q(row.contractId)}, ${q(row.clientId)}, ${q(row.fincaId)}, ${q(row.assetId)}, ${q(row.code)}, ${q(row.summary)}, ${q(row.workType)}, ${q(row.status)}, ${q(row.assigneeId)}, ${row.hours ?? "null"}, ${q(row.closeNote)}, ${q(row.photoName)}, ${q(row.signatureName)}, ${q(row.scheduledAt)}, ${q(row.externalId)}, ${q(row.createdAt)}, ${q(row.createdBy)}, ${q(row.closedAt)})`,
  );

  return `-- Increment B: statuses, demo seed from fixtures/demo, and update rights for office and the assigned operario.
-- Generated from the same mapper as the local JSON seed. Fictional Infraspeak-shaped data, not a live dump.

alter table public.client add column if not exists code text;
alter table public.client add column if not exists city text;
alter table public.client add column if not exists postal_code text;
alter table public.client add column if not exists country text;
alter table public.client add column if not exists notes text;
alter table public.client add column if not exists external_id text;
create unique index if not exists client_external_id_idx on public.client (external_id) where external_id is not null;

alter table public.finca add column if not exists parent_id uuid references public.finca (id);
alter table public.finca add column if not exists code text;
alter table public.finca add column if not exists notes text;
alter table public.finca add column if not exists external_id text;
create unique index if not exists finca_external_id_idx on public.finca (external_id) where external_id is not null;

alter table public.asset add column if not exists code text;
alter table public.asset add column if not exists location_label text;
alter table public.asset add column if not exists notes text;
alter table public.asset add column if not exists external_id text;
create unique index if not exists asset_external_id_idx on public.asset (external_id) where external_id is not null;

alter table public.incident add column if not exists code text;
alter table public.incident add column if not exists status text not null default 'nueva';
alter table public.incident add column if not exists priority integer;
alter table public.incident add column if not exists external_id text;
alter table public.incident drop constraint if exists incident_status_check;
alter table public.incident add constraint incident_status_check check (status in ('nueva', 'abierta', 'en_curso', 'pausada', 'cerrada'));

alter table public.work_order add column if not exists contract_id uuid;
alter table public.work_order add column if not exists code text;
alter table public.work_order add column if not exists summary text not null default '';
alter table public.work_order add column if not exists status text not null default 'pendiente';
alter table public.work_order add column if not exists assignee_id uuid references public.app_user (id);
alter table public.work_order add column if not exists hours numeric(6,2);
alter table public.work_order add column if not exists close_note text;
alter table public.work_order add column if not exists photo_name text;
alter table public.work_order add column if not exists signature_name text;
alter table public.work_order add column if not exists scheduled_at timestamptz;
alter table public.work_order add column if not exists external_id text;
alter table public.work_order add column if not exists closed_at timestamptz;
alter table public.work_order drop constraint if exists work_order_status_check;
alter table public.work_order add constraint work_order_status_check check (status in ('pendiente', 'en_curso', 'pausada', 'cerrada'));

alter table public.maintenance_contract add column if not exists name text;
alter table public.maintenance_contract add column if not exists frequency text;
alter table public.maintenance_contract add column if not exists notes text;
alter table public.maintenance_contract add column if not exists external_id text;

alter table public.work_order drop constraint if exists work_order_contract_fk;
alter table public.work_order add constraint work_order_contract_fk foreign key (contract_id) references public.maintenance_contract (id);

create table if not exists public.maintenance_contract_asset (
  contract_id uuid not null references public.maintenance_contract (id),
  asset_id uuid not null references public.asset (id),
  primary key (contract_id, asset_id)
);
alter table public.maintenance_contract_asset enable row level security;
grant select on public.maintenance_contract_asset to authenticated;
drop policy if exists contract_asset_select on public.maintenance_contract_asset;
create policy contract_asset_select on public.maintenance_contract_asset
  for select to authenticated
  using (
    exists (
      select 1 from public.maintenance_contract
      where maintenance_contract.id = maintenance_contract_asset.contract_id
        and public.is_member(maintenance_contract.company_id)
    )
  );

${rows("client", ["id", "company_id", "client_type", "name", "tax_id", "address", "city", "postal_code", "country", "code", "notes", "external_id", "created_at", "created_by"], clients)}
${rows("finca", ["id", "company_id", "client_id", "parent_id", "name", "address", "municipality", "postal_code", "code", "notes", "external_id", "created_at", "created_by"], fincas)}
${rows("asset", ["id", "company_id", "finca_id", "name", "code", "serial_number", "location_label", "notes", "external_id", "created_at", "created_by"], assets)}
${rows("incident", ["id", "company_id", "client_id", "finca_id", "asset_id", "code", "summary", "status", "priority", "external_id", "created_at", "created_by"], incidents)}
${rows("maintenance_contract", ["id", "company_id", "client_id", "reference", "name", "frequency", "notes", "external_id", "starts_on", "created_at", "created_by"], contracts)}
${rows("maintenance_contract_asset", ["contract_id", "asset_id"], links, "contract_id, asset_id")}
${rows("work_order", ["id", "company_id", "incident_id", "contract_id", "client_id", "finca_id", "asset_id", "code", "summary", "work_type", "status", "assignee_id", "hours", "close_note", "photo_name", "signature_name", "scheduled_at", "external_id", "created_at", "created_by", "closed_at"], orders)}

grant update on public.incident, public.work_order to authenticated;

drop policy if exists incident_update on public.incident;
create policy incident_update on public.incident
  for update to authenticated
  using (
    public.is_member(company_id)
    and (
      public.can_write_masters()
      or exists (
        select 1 from public.work_order
        where work_order.incident_id = incident.id
          and work_order.assignee_id = auth.uid()
      )
    )
  )
  with check (public.is_member(company_id));

drop policy if exists work_order_update on public.work_order;
create policy work_order_update on public.work_order
  for update to authenticated
  using (
    public.is_member(company_id)
    and (public.can_write_masters() or assignee_id = auth.uid())
  )
  with check (
    public.is_member(company_id)
    and (public.can_write_masters() or assignee_id = auth.uid())
  );
`;
}

const sql = emit(loadDemoStore());
const target = "supabase/migrations/20261103100000_increment_b.sql";
writeFileSync(target, sql);
console.log(`wrote ${target} (${sql.length} bytes)`);
