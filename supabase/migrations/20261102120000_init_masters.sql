-- Increment A masters. Write-once: no updated_at, and later grants omit update/delete.
-- user_company is the membership row because a person (Marta) can belong to more than one company.

create extension if not exists pgcrypto;

create table public.company (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prefix text not null,
  created_at timestamptz not null default now(),
  constraint company_prefix_format check (prefix ~ '^[A-Z0-9]{2,6}$'),
  constraint company_prefix_unique unique (prefix)
);

create table public.app_user (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null,
  role text not null,
  created_at timestamptz not null default now(),
  constraint app_user_email_unique unique (email),
  constraint app_user_role_check check (role in ('jefe', 'encargado', 'administrativo', 'operario'))
);

create table public.user_company (
  user_id uuid not null references public.app_user (id),
  company_id uuid not null references public.company (id),
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

create table public.client (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company (id),
  client_type text not null,
  name text not null,
  tax_id text,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.app_user (id),
  constraint client_type_check check (
    client_type in ('particular', 'comunidad', 'admin', 'empresa', 'constructora', 'intermediario')
  )
);

create table public.finca (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company (id),
  client_id uuid not null references public.client (id),
  name text not null,
  address text,
  municipality text,
  postal_code text,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.app_user (id)
);

create table public.asset (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company (id),
  finca_id uuid not null references public.finca (id),
  name text not null,
  serial_number text,
  installed_on date,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.app_user (id)
);

create index client_company_idx on public.client (company_id);
create index finca_company_client_idx on public.finca (company_id, client_id);
create index asset_company_finca_idx on public.asset (company_id, finca_id);
create index user_company_company_idx on public.user_company (company_id);

create or replace function public.enforce_finca_company()
returns trigger
language plpgsql
as $$
declare
  parent_company uuid;
begin
  select company_id into parent_company from public.client where id = new.client_id;
  if parent_company is null then
    raise exception 'client not found';
  end if;
  if new.company_id is distinct from parent_company then
    raise exception 'finca company must match client company';
  end if;
  return new;
end;
$$;

create trigger finca_company_match
  before insert on public.finca
  for each row execute function public.enforce_finca_company();

create or replace function public.enforce_asset_company()
returns trigger
language plpgsql
as $$
declare
  parent_company uuid;
begin
  select company_id into parent_company from public.finca where id = new.finca_id;
  if parent_company is null then
    raise exception 'finca not found';
  end if;
  if new.company_id is distinct from parent_company then
    raise exception 'asset company must match finca company';
  end if;
  return new;
end;
$$;

create trigger asset_company_match
  before insert on public.asset
  for each row execute function public.enforce_asset_company();

comment on table public.client is 'Write-once client master for Increment A.';
comment on table public.finca is 'Write-once site master. company_id must match the parent client.';
comment on table public.asset is 'Write-once asset master. company_id must match the parent finca.';
