-- Tecno Garpen (TG) and Tecno Garpen Instalaciones (TGI), plus the two demo people.
-- Ids match src/domain/ids.ts. Service role bypasses RLS, so this seed loads on a fresh project.

insert into public.company (id, name, prefix)
values
  ('11111111-1111-4111-8111-111111111111', 'Tecno Garpen', 'TG'),
  ('22222222-2222-4222-8222-222222222222', 'Tecno Garpen Instalaciones', 'TGI')
on conflict (id) do nothing;

insert into public.app_user (id, email, display_name, role)
values
  ('33333333-3333-4333-8333-333333333333', 'marta.puig@tecnogarpen.local', 'Marta Puig', 'jefe'),
  ('44444444-4444-4444-8444-444444444444', 'pol.riera@tecnogarpen.local', 'Pol Riera', 'operario')
on conflict (id) do nothing;

insert into public.user_company (user_id, company_id)
values
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111'),
  ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222'),
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111')
on conflict (user_id, company_id) do nothing;
