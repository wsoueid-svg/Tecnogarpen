-- Company membership plus office-writer role. auth.uid() is the app_user.id carried by the JWT.
-- No update or delete policies: masters and phase-1 stubs are write-once in Increment A.

create or replace function public.is_member(target_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_company
    where user_id = auth.uid()
      and company_id = target_company
  );
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.app_user where id = auth.uid();
$$;

create or replace function public.can_write_masters()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('jefe', 'encargado', 'administrativo');
$$;

create or replace function public.shares_company_with(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_company mine
    join public.user_company theirs on theirs.company_id = mine.company_id
    where mine.user_id = auth.uid()
      and theirs.user_id = other_user
  );
$$;

revoke all on function public.is_member(uuid) from public;
revoke all on function public.current_app_role() from public;
revoke all on function public.can_write_masters() from public;
revoke all on function public.shares_company_with(uuid) from public;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.can_write_masters() to authenticated;
grant execute on function public.shares_company_with(uuid) to authenticated;

alter table public.company enable row level security;
alter table public.app_user enable row level security;
alter table public.user_company enable row level security;
alter table public.client enable row level security;
alter table public.finca enable row level security;
alter table public.asset enable row level security;
alter table public.incident enable row level security;
alter table public.work_order enable row level security;
alter table public.plan_slot enable row level security;
alter table public.maintenance_contract enable row level security;

create policy company_select on public.company
  for select to authenticated
  using (public.is_member(id));

create policy app_user_select on public.app_user
  for select to authenticated
  using (id = auth.uid() or public.shares_company_with(id));

create policy user_company_select on public.user_company
  for select to authenticated
  using (user_id = auth.uid());

create policy client_select on public.client
  for select to authenticated
  using (public.is_member(company_id));

create policy client_insert on public.client
  for insert to authenticated
  with check (
    public.can_write_masters()
    and public.is_member(company_id)
    and created_by = auth.uid()
  );

create policy finca_select on public.finca
  for select to authenticated
  using (public.is_member(company_id));

create policy finca_insert on public.finca
  for insert to authenticated
  with check (
    public.can_write_masters()
    and public.is_member(company_id)
    and created_by = auth.uid()
  );

create policy asset_select on public.asset
  for select to authenticated
  using (public.is_member(company_id));

create policy asset_insert on public.asset
  for insert to authenticated
  with check (
    public.can_write_masters()
    and public.is_member(company_id)
    and created_by = auth.uid()
  );

create policy incident_select on public.incident
  for select to authenticated
  using (public.is_member(company_id));

create policy incident_insert on public.incident
  for insert to authenticated
  with check (
    public.can_write_masters()
    and public.is_member(company_id)
    and created_by = auth.uid()
  );

create policy work_order_select on public.work_order
  for select to authenticated
  using (public.is_member(company_id));

create policy work_order_insert on public.work_order
  for insert to authenticated
  with check (
    public.can_write_masters()
    and public.is_member(company_id)
    and created_by = auth.uid()
  );

create policy plan_slot_select on public.plan_slot
  for select to authenticated
  using (public.is_member(company_id));

create policy plan_slot_insert on public.plan_slot
  for insert to authenticated
  with check (
    public.can_write_masters()
    and public.is_member(company_id)
    and created_by = auth.uid()
  );

create policy maintenance_contract_select on public.maintenance_contract
  for select to authenticated
  using (public.is_member(company_id));

create policy maintenance_contract_insert on public.maintenance_contract
  for insert to authenticated
  with check (
    public.can_write_masters()
    and public.is_member(company_id)
    and created_by = auth.uid()
  );

grant usage on schema public to authenticated;

grant select on public.company, public.app_user, public.user_company to authenticated;
grant select, insert on public.client, public.finca, public.asset to authenticated;
grant select, insert on public.incident, public.work_order, public.plan_slot, public.maintenance_contract to authenticated;
