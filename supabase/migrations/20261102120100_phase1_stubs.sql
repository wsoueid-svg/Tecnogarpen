-- Phase 1 tables only. No office UI in Increment A.

create table public.incident (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company (id),
  client_id uuid references public.client (id),
  finca_id uuid references public.finca (id),
  asset_id uuid references public.asset (id),
  summary text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.app_user (id)
);

create table public.work_order (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company (id),
  incident_id uuid references public.incident (id),
  client_id uuid not null references public.client (id),
  finca_id uuid not null references public.finca (id),
  asset_id uuid references public.asset (id),
  work_type text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.app_user (id),
  constraint work_order_type_check check (
    work_type in ('reparacion', 'mantenimiento', 'montaje', 'urgencia', 'presupuesto', 'garantia')
  )
);

create table public.plan_slot (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company (id),
  work_order_id uuid not null references public.work_order (id),
  assignee_id uuid not null references public.app_user (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.app_user (id),
  constraint plan_slot_range_check check (ends_at > starts_at)
);

create table public.maintenance_contract (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company (id),
  client_id uuid not null references public.client (id),
  finca_id uuid references public.finca (id),
  reference text not null,
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.app_user (id),
  constraint maintenance_contract_range_check check (ends_on is null or ends_on >= starts_on)
);

create index incident_company_idx on public.incident (company_id);
create index work_order_company_idx on public.work_order (company_id);
create index plan_slot_company_idx on public.plan_slot (company_id, starts_at);
create index maintenance_contract_company_idx on public.maintenance_contract (company_id);

comment on table public.incident is 'Phase 1 stub. No UI in Increment A.';
comment on table public.work_order is 'Phase 1 stub. work_type is the closed list for later screens.';
comment on table public.plan_slot is 'Phase 1 stub. Planning UI is out of scope.';
comment on table public.maintenance_contract is 'Phase 1 stub. Contract UI is out of scope.';
