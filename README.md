# Tecno Garpen — Incremento A

Control center for Tecno Garpen. This increment covers the office masters (clients, fincas, assets), a field shell for operarios, and the company/role boundary. Incidents, work orders, planning, email, quotes, and payments are tables or nothing: there is no UI for them yet.

## Stack

- Next.js App Router and TypeScript
- Office desktop screens, plus `/operario` with a standalone web app manifest
- Auth stub: mock directory by default. `AUTH_MODE=entra` turns the directory off and records whether Entra settings are present
- Roles: `jefe`, `encargado`, `administrativo`, `operario`
- Data: `.data/store.json` by default. `DATA_BACKEND=supabase` uses a Supabase project in Frankfurt (`eu-central-1`)

Masters are write-once. The app exposes create and list. The SQL grants `select` and `insert` only.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The first read creates `.data/store.json` (gitignored) with the two companies and the demo people.

```bash
npm test
npm run build
```

## Demo directory

| Person | Role | Companies | Lands on |
| --- | --- | --- | --- |
| Marta Puig | jefe | Tecno Garpen (TG) and Tecno Garpen Instalaciones (TGI) | `/clientes` |
| Pol Riera | operario | Tecno Garpen (TG) | `/operario` |

There is no password. The header company control limits every list to one company, and a person only sees companies they belong to. Pol can open the office lists in read-only mode. Jefe, encargado, and administrativo can create masters for their companies.

## Environment

See `.env.example`. Do not commit real secrets.

- `AUTH_MODE=mock` (default) or `entra`
- `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET` — presence only; Entra login is not wired
- `SESSION_SECRET` — signs the demo cookie. The dev fallback must be replaced anywhere the app is shared
- `DATA_BACKEND=local` or `supabase`
- `DATA_FILE` — optional path for the JSON store
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` — required for the Supabase backend

## Supabase (Frankfurt)

Create the project in region Frankfurt (`eu-central-1`), then apply the migrations in order:

1. `supabase/migrations/20261102120000_init_masters.sql`
2. `supabase/migrations/20261102120100_phase1_stubs.sql`
3. `supabase/migrations/20261102120200_rls.sql`
4. `supabase/migrations/20261102120300_seed.sql`

With the Supabase CLI linked to that project: `supabase db push`.

Row level security uses `auth.uid()`. In this increment the server signs a one-hour JWT with `SUPABASE_JWT_SECRET` whose `sub` is `app_user.id` (the same ids as the mock directory). Postgres policies then see that person. Office writers are `jefe`, `encargado`, and `administrativo`. Operario can select rows of their companies and cannot insert.

`user_company` is the membership table: Marta belongs to both companies, Pol only to TG.

## Out of scope

Incident, work-order, planning, contract, email, AI, quote, Sage, and MONEI screens. The phase-1 tables exist so the next increment can fill them in without reshaping the masters.
