# Tecno Garpen

Control center for the Adri demo (Tuesday 3 Nov 2026, Europe/Madrid). Increment A is the office masters and company boundary. Increment B adds incidents, work orders, the operario day, and a small dashboard. The seed is fictional Infraspeak-shaped data in `fixtures/demo/` (not a live dump and not real customers).

## Demo Adri

From a clean checkout:

```bash
npm install
cp .env.example .env.local
rm -f .data/store.json
npm run dev
```

Open http://localhost:3000. There is no password. The first read writes `.data/store.json` from the fixtures. If that file already exists from an older run, delete it so the demo seed loads again.

1. **Marta Puig** (jefe, TG and TGI) lands on **Panel**.
   - Tecno Garpen: open incidents, orders by status, closed hours against **350 € / 8 h**.
   - Switch the header to **TGI · Tecno Garpen Instalaciones** and the Gavà nave replaces the Garraf work. Switch back to TG.
   - **Incidencias**: six failures in the seed (F-3001 … F-3006). Open one, change the status, or use **Nueva incidencia**.
   - **Órdenes**: open **F-3001** (puerta del garaje, sin operario). **Asignar** Pol Riera and set the status to **En curso**.
2. **Salir**, then **Pol Riera** (operario, only TG). He lands on **/operario**, **Mi día**.
   - Por hacer includes the basculante in course (F-3002) and the maintenance visits **SW-6002** (Wednesday 4 Nov) and **SW-6003** (Thursday 5 Nov).
   - Open F-3002 (or the one Marta just assigned). **Empezar** if it is still pending. **Cerrar orden** with a note, the photo stub (checkbox or a file name), and the signature (his name is already filled in).
3. **Salir**, enter as Marta again. The panel hours move because the closed order now counts toward the 350 € day.

Seed shape: 3 clients, 7 locations, 6 doors, 6 failures (each with a repair order; F-3004 is unassigned), 2 maintenance contracts, 3 maintenance visits. Pol does not see TGI.

```bash
npm test
npm run build
```

## Stack

- Next.js App Router and TypeScript
- Office desktop, plus `/operario` with a standalone manifest
- Auth stub: mock directory by default. `AUTH_MODE=entra` turns the directory off
- Roles: `jefe`, `encargado`, `administrativo`, `operario`
- Data: `.data/store.json` by default. `DATA_BACKEND=supabase` uses a Frankfurt project (`eu-central-1`)

Masters (clients, fincas, assets) stay write-once. Incidents and work orders can change status. Closing an order stores a note, a photo name, and a signature name on the local file.

## Environment

See `.env.example`. Do not commit real secrets.

- `AUTH_MODE=mock` (default) or `entra`
- `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET` — presence only; Entra login is not wired
- `SESSION_SECRET` — signs the demo cookie
- `DATA_BACKEND=local` or `supabase`
- `DATA_FILE` — optional path for the JSON store
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` — required for the Supabase backend

## Supabase (Frankfurt)

Apply the migrations in order:

1. `supabase/migrations/20261102120000_init_masters.sql`
2. `supabase/migrations/20261102120100_phase1_stubs.sql`
3. `supabase/migrations/20261102120200_rls.sql`
4. `supabase/migrations/20261102120300_seed.sql`
5. `supabase/migrations/20261103100000_increment_b.sql`

`20261103100000_increment_b.sql` is generated from `fixtures/demo` with `npx tsx scripts/emit-increment-b-sql.ts`. The server signs a one-hour JWT whose `sub` is `app_user.id`, so `auth.uid()` matches Marta and Pol.

## Out of scope

Email-to-incident, real Entra SSO, Sage, MONEI, planning drag-and-drop, and a live Infraspeak import. `fixtures/demo/SEED-MAP.md` is the load map for the fictional sample.
