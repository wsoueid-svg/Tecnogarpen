-- Increment B: statuses, demo seed from fixtures/demo, and update rights for office and the assigned operario.
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

insert into public.client (id, company_id, client_type, name, tax_id, address, city, postal_code, country, code, notes, external_id, created_at, created_by)
values
  ('10000000-0000-4000-8000-000000009001', '11111111-1111-4111-8111-111111111111', 'comunidad', 'Comunidad de Propietarios Rambla Exposició 42', 'H08123456', 'Rambla de l''Exposició, 42', 'Vilanova i la Geltrú', '08800', 'ES', 'CPRE42', 'Administrador: Finques Serra. Comisión admin 10% (GUESS)', 'infraspeak:client:9001', '2026-10-01T09:00:00+02:00', '33333333-3333-4333-8333-333333333333'),
  ('10000000-0000-4000-8000-000000009002', '11111111-1111-4111-8111-111111111111', 'empresa', 'Aparcaments Sitges Centre SL', 'B65432198', 'Carrer de Sant Francesc, 15', 'Sitges', '08870', 'ES', 'ASC', 'Parking rotación 120 plazas', 'infraspeak:client:9002', '2026-10-01T09:00:00+02:00', '33333333-3333-4333-8333-333333333333'),
  ('10000000-0000-4000-8000-000000009003', '22222222-2222-4222-8222-222222222222', 'empresa', 'Logística Gavà Mar SA', 'A08987654', 'Carrer de la Riera de Sant Llorenç, 7', 'Gavà', '08850', 'ES', 'LGM', 'Nave industrial; cliente Instalaciones', 'infraspeak:client:9003', '2026-10-01T09:00:00+02:00', '33333333-3333-4333-8333-333333333333')
on conflict (id) do nothing;

insert into public.finca (id, company_id, client_id, parent_id, name, address, municipality, postal_code, code, notes, external_id, created_at, created_by)
values
  ('20000000-0000-4000-8000-000000007001', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009001', null, 'Edificio Rambla Exposició 42', 'Rambla de l''Exposició, 42', 'Vilanova i la Geltrú', '08800', 'RE42', 'Edificio Rambla Exposició 42', 'infraspeak:building:7001', '2026-10-15T09:00:00+02:00', '33333333-3333-4333-8333-333333333333'),
  ('20000000-0000-4000-8000-000000007011', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009001', '20000000-0000-4000-8000-000000007001', 'Garaje sótano -1', 'Rambla de l''Exposició, 42', 'Vilanova i la Geltrú', '08800', 'G-1', 'Edificio Rambla Exposició 42 - Garaje sótano -1', 'infraspeak:location:7011', '2026-10-15T09:00:00+02:00', '33333333-3333-4333-8333-333333333333'),
  ('20000000-0000-4000-8000-000000007002', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009002', null, 'Parking Sant Francesc', 'Carrer de Sant Francesc, 15', 'Sitges', '08870', 'PSF', 'Parking Sant Francesc', 'infraspeak:building:7002', '2026-10-15T09:00:00+02:00', '33333333-3333-4333-8333-333333333333'),
  ('20000000-0000-4000-8000-000000007021', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009002', '20000000-0000-4000-8000-000000007002', 'Planta -1', 'Carrer de Sant Francesc, 15', 'Sitges', '08870', 'P-1', 'Parking Sant Francesc - Planta -1', 'infraspeak:location-folder:7021', '2026-10-15T09:00:00+02:00', '33333333-3333-4333-8333-333333333333'),
  ('20000000-0000-4000-8000-000000007022', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009002', '20000000-0000-4000-8000-000000007021', 'Rampa acceso', 'Carrer de Sant Francesc, 15', 'Sitges', '08870', 'RAMPA', 'Parking Sant Francesc - Planta -1 - Rampa acceso', 'infraspeak:location:7022', '2026-10-15T09:00:00+02:00', '33333333-3333-4333-8333-333333333333'),
  ('20000000-0000-4000-8000-000000007003', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000009003', null, 'Nave Gavà Mar', 'Carrer de la Riera de Sant Llorenç, 7', 'Gavà', '08850', 'NGM', 'Nave Gavà Mar', 'infraspeak:building:7003', '2026-10-15T09:00:00+02:00', '33333333-3333-4333-8333-333333333333'),
  ('20000000-0000-4000-8000-000000007031', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000009003', '20000000-0000-4000-8000-000000007003', 'Muelle de carga', 'Carrer de la Riera de Sant Llorenç, 7', 'Gavà', '08850', 'MUELLE', 'Nave Gavà Mar - Muelle de carga', 'infraspeak:location:7031', '2026-10-15T09:00:00+02:00', '33333333-3333-4333-8333-333333333333')
on conflict (id) do nothing;

insert into public.asset (id, company_id, finca_id, name, code, serial_number, location_label, notes, external_id, created_at, created_by)
values
  ('30000000-0000-4000-8000-000000005001', '11111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000007011', 'Puerta seccional garaje', 'PG-RE42-01', 'TG5001', 'Edificio Rambla Exposició 42 - Garaje sótano -1', 'Hörmann SPU F42 · motor Hörmann SupraMatic E · CE 2014 · garantía hasta 2026-12-31', 'infraspeak:element:5001', '2024-03-01T10:00:00+01:00', '33333333-3333-4333-8333-333333333333'),
  ('30000000-0000-4000-8000-000000005002', '11111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000007011', 'Puerta peatonal garaje', 'PP-RE42-02', 'TG5002', 'Edificio Rambla Exposició 42 - Garaje sótano -1', 'Doorgate · cierrapuertas hidráulico · CE 2019', 'infraspeak:element:5002', '2024-03-01T10:00:00+01:00', '33333333-3333-4333-8333-333333333333'),
  ('30000000-0000-4000-8000-000000005003', '11111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000007022', 'Puerta basculante rampa', 'PB-PSF-01', 'TG5003', 'Parking Sant Francesc - Planta -1 - Rampa acceso', 'Doorgate DG-B · motor Nice Hyppo HY7005 · CE 2017', 'infraspeak:element:5003', '2024-03-01T10:00:00+01:00', '33333333-3333-4333-8333-333333333333'),
  ('30000000-0000-4000-8000-000000005004', '11111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000007022', 'Barrera vehicular', 'BA-PSF-02', 'TG5004', 'Parking Sant Francesc - Planta -1 - Rampa acceso', 'Nice M-BAR M3BAR · CE 2021 · garantía hasta 2026-06-30', 'infraspeak:element:5004', '2024-03-01T10:00:00+01:00', '33333333-3333-4333-8333-333333333333'),
  ('30000000-0000-4000-8000-000000005005', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000007031', 'Puerta rápida enrollable muelle', 'PR-NGM-01', 'TG5005', 'Nave Gavà Mar - Muelle de carga', 'Hörmann V 5015 SEL · motor FU · CE 2022', 'infraspeak:element:5005', '2024-03-01T10:00:00+01:00', '33333333-3333-4333-8333-333333333333'),
  ('30000000-0000-4000-8000-000000005006', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000007031', 'Puerta seccional industrial', 'PS-NGM-02', 'TG5006', 'Nave Gavà Mar - Muelle de carga', 'Hörmann SPU 67 Thermo · motor WA 400 · CE 2020', 'infraspeak:element:5006', '2024-03-01T10:00:00+01:00', '33333333-3333-4333-8333-333333333333')
on conflict (id) do nothing;

insert into public.incident (id, company_id, client_id, finca_id, asset_id, code, summary, status, priority, external_id, created_at, created_by)
values
  ('40000000-0000-4000-8000-000000003001', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009001', '20000000-0000-4000-8000-000000007011', '30000000-0000-4000-8000-000000005001', 'F-3001', 'La puerta del garaje no sube, se queda a medio recorrido', 'abierta', 1, 'infraspeak:failure:3001', '2026-10-30T08:12:00+01:00', '33333333-3333-4333-8333-333333333333'),
  ('40000000-0000-4000-8000-000000003002', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009002', '20000000-0000-4000-8000-000000007022', '30000000-0000-4000-8000-000000005003', 'F-3002', 'Basculante rampa hace ruido y fotocélula falla', 'en_curso', 2, 'infraspeak:failure:3002', '2026-10-29T17:40:00+01:00', '33333333-3333-4333-8333-333333333333'),
  ('40000000-0000-4000-8000-000000003003', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009002', '20000000-0000-4000-8000-000000007022', '30000000-0000-4000-8000-000000005003', 'F-3003', 'Mando no abre la basculante — reprogramado receptor Nice', 'cerrada', 3, 'infraspeak:failure:3003', '2026-09-12T09:00:00+02:00', '33333333-3333-4333-8333-333333333333'),
  ('40000000-0000-4000-8000-000000003004', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000009003', '20000000-0000-4000-8000-000000007031', '30000000-0000-4000-8000-000000005005', 'F-3004', 'Puerta rápida muelle golpeada por carretilla, lona rota', 'nueva', 1, 'infraspeak:failure:3004', '2026-11-01T07:55:00+01:00', '33333333-3333-4333-8333-333333333333'),
  ('40000000-0000-4000-8000-000000003005', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000009003', '20000000-0000-4000-8000-000000007031', '30000000-0000-4000-8000-000000005006', 'F-3005', 'Seccional industrial: muelle de torsión roto, pendiente pieza', 'pausada', 2, 'infraspeak:failure:3005', '2026-10-27T11:20:00+01:00', '33333333-3333-4333-8333-333333333333'),
  ('40000000-0000-4000-8000-000000003006', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009001', '20000000-0000-4000-8000-000000007011', '30000000-0000-4000-8000-000000005002', 'F-3006', 'Puerta peatonal no cierra sola — ajuste cierrapuertas', 'cerrada', 4, 'infraspeak:failure:3006', '2026-10-05T10:00:00+02:00', '33333333-3333-4333-8333-333333333333')
on conflict (id) do nothing;

insert into public.maintenance_contract (id, company_id, client_id, reference, name, frequency, notes, external_id, starts_on, created_at, created_by)
values
  ('70000000-0000-4000-8000-000000008001', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009001', 'MT-8001', 'Mantenimiento trimestral puertas garaje RE42', 'Trimestral', 'Revisión según EN 12453/EN 12604: engrase, fotocélulas, finales de carrera, seguridad', 'infraspeak:work:8001', '2026-01-15', '2026-01-01T09:00:00+01:00', '33333333-3333-4333-8333-333333333333'),
  ('70000000-0000-4000-8000-000000008002', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000009002', 'MT-8002', 'Mantenimiento semestral accesos Parking Sant Francesc', 'Semestral', 'Revisión según EN 12453/EN 12604: engrase, fotocélulas, finales de carrera, seguridad', 'infraspeak:work:8002', '2026-01-01', '2026-01-01T09:00:00+01:00', '33333333-3333-4333-8333-333333333333')
on conflict (id) do nothing;

insert into public.maintenance_contract_asset (contract_id, asset_id)
values
  ('70000000-0000-4000-8000-000000008001', '30000000-0000-4000-8000-000000005001'),
  ('70000000-0000-4000-8000-000000008001', '30000000-0000-4000-8000-000000005002'),
  ('70000000-0000-4000-8000-000000008002', '30000000-0000-4000-8000-000000005003'),
  ('70000000-0000-4000-8000-000000008002', '30000000-0000-4000-8000-000000005004')
on conflict (contract_id, asset_id) do nothing;

insert into public.work_order (id, company_id, incident_id, contract_id, client_id, finca_id, asset_id, code, summary, work_type, status, assignee_id, hours, close_note, photo_name, signature_name, scheduled_at, external_id, created_at, created_by, closed_at)
values
  ('50000000-0000-4000-8000-000000003001', '11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000003001', null, '10000000-0000-4000-8000-000000009001', '20000000-0000-4000-8000-000000007011', '30000000-0000-4000-8000-000000005001', 'F-3001', 'La puerta del garaje no sube, se queda a medio recorrido', 'reparacion', 'pendiente', null, null, null, null, null, '2026-10-30T08:12:00+01:00', 'infraspeak:failure:3001', '2026-10-30T08:12:00+01:00', '33333333-3333-4333-8333-333333333333', null),
  ('50000000-0000-4000-8000-000000003002', '11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000003002', null, '10000000-0000-4000-8000-000000009002', '20000000-0000-4000-8000-000000007022', '30000000-0000-4000-8000-000000005003', 'F-3002', 'Basculante rampa hace ruido y fotocélula falla', 'reparacion', 'en_curso', '44444444-4444-4444-8444-444444444444', null, null, null, null, '2026-10-29T17:40:00+01:00', 'infraspeak:failure:3002', '2026-10-29T17:40:00+01:00', '33333333-3333-4333-8333-333333333333', null),
  ('50000000-0000-4000-8000-000000003003', '11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000003003', null, '10000000-0000-4000-8000-000000009002', '20000000-0000-4000-8000-000000007022', '30000000-0000-4000-8000-000000005003', 'F-3003', 'Mando no abre la basculante — reprogramado receptor Nice', 'reparacion', 'cerrada', '44444444-4444-4444-8444-444444444444', 2.5, 'Cerrada y firmada', null, 'Pol Riera', '2026-09-12T09:00:00+02:00', 'infraspeak:failure:3003', '2026-09-12T09:00:00+02:00', '33333333-3333-4333-8333-333333333333', '2026-09-12T12:30:00+02:00'),
  ('50000000-0000-4000-8000-000000003004', '22222222-2222-4222-8222-222222222222', '40000000-0000-4000-8000-000000003004', null, '10000000-0000-4000-8000-000000009003', '20000000-0000-4000-8000-000000007031', '30000000-0000-4000-8000-000000005005', 'F-3004', 'Puerta rápida muelle golpeada por carretilla, lona rota', 'reparacion', 'pendiente', null, null, null, null, null, '2026-11-01T07:55:00+01:00', 'infraspeak:failure:3004', '2026-11-01T07:55:00+01:00', '33333333-3333-4333-8333-333333333333', null),
  ('50000000-0000-4000-8000-000000003005', '22222222-2222-4222-8222-222222222222', '40000000-0000-4000-8000-000000003005', null, '10000000-0000-4000-8000-000000009003', '20000000-0000-4000-8000-000000007031', '30000000-0000-4000-8000-000000005006', 'F-3005', 'Seccional industrial: muelle de torsión roto, pendiente pieza', 'reparacion', 'pausada', '44444444-4444-4444-8444-444444444444', null, null, null, null, '2026-10-27T11:20:00+01:00', 'infraspeak:failure:3005', '2026-10-27T11:20:00+01:00', '33333333-3333-4333-8333-333333333333', null),
  ('50000000-0000-4000-8000-000000003006', '11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000003006', null, '10000000-0000-4000-8000-000000009001', '20000000-0000-4000-8000-000000007011', '30000000-0000-4000-8000-000000005002', 'F-3006', 'Puerta peatonal no cierra sola — ajuste cierrapuertas', 'reparacion', 'cerrada', '44444444-4444-4444-8444-444444444444', 2.5, 'Cerrada y firmada', null, 'Pol Riera', '2026-10-05T10:00:00+02:00', 'infraspeak:failure:3006', '2026-10-05T10:00:00+02:00', '33333333-3333-4333-8333-333333333333', '2026-10-05T11:00:00+02:00'),
  ('60000000-0000-4000-8000-000000006001', '11111111-1111-4111-8111-111111111111', null, '70000000-0000-4000-8000-000000008001', '10000000-0000-4000-8000-000000009001', '20000000-0000-4000-8000-000000007011', '30000000-0000-4000-8000-000000005001', 'SW-6001', 'Mantenimiento trimestral puertas garaje RE42. Todo OK, engrase realizado', 'mantenimiento', 'cerrada', '44444444-4444-4444-8444-444444444444', 1.75, 'Todo OK, engrase realizado', null, 'Pol Riera', '2026-07-15T09:00:00+02:00', 'infraspeak:scheduled-work:6001', '2026-07-15T09:00:00+02:00', '33333333-3333-4333-8333-333333333333', '2026-07-15T10:45:00+02:00'),
  ('60000000-0000-4000-8000-000000006002', '11111111-1111-4111-8111-111111111111', null, '70000000-0000-4000-8000-000000008001', '10000000-0000-4000-8000-000000009001', '20000000-0000-4000-8000-000000007011', '30000000-0000-4000-8000-000000005001', 'SW-6002', 'Mantenimiento trimestral puertas garaje RE42', 'mantenimiento', 'pendiente', '44444444-4444-4444-8444-444444444444', null, null, null, null, '2026-11-04T09:00:00+01:00', 'infraspeak:scheduled-work:6002', '2026-11-04T09:00:00+01:00', '33333333-3333-4333-8333-333333333333', null),
  ('60000000-0000-4000-8000-000000006003', '11111111-1111-4111-8111-111111111111', null, '70000000-0000-4000-8000-000000008002', '10000000-0000-4000-8000-000000009002', '20000000-0000-4000-8000-000000007022', '30000000-0000-4000-8000-000000005003', 'SW-6003', 'Mantenimiento semestral accesos Parking Sant Francesc', 'mantenimiento', 'pendiente', '44444444-4444-4444-8444-444444444444', null, null, null, null, '2026-11-05T08:30:00+01:00', 'infraspeak:scheduled-work:6003', '2026-11-05T08:30:00+01:00', '33333333-3333-4333-8333-333333333333', null)
on conflict (id) do nothing;


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
