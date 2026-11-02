# SEED-MAP — Infraspeak-shaped demo fixtures → Increment A/B tables

**FICTIONAL DATA for the Adri demo (Tue 3 Nov 2026). Not real Tecno Garpen clients, NIFs or addresses-as-customers. Not a live dump.**

Load order: company_map → clients → locations → elements → failures → works → scheduled_works. All ids are strings; keep `external_id = "infraspeak:<type>:<id>"` on our rows.

| File | Infraspeak resource | → Our table | Notes |
|---|---|---|---|
| company_map.ndjson | (sidecar, ours) | company_id on client & children | 9001,9002→TG; 9003→TGI. Children inherit via client. |
| clients.ndjson | `client` | client | name, code, nif, address, postal_code, city, country, observations→notes |
| locations.ndjson | `building` (has client_id) | finca | building = finca. address taken from client for demo. |
| locations.ndjson | `location-folder` / `location` (parent_id/root_parent_id) | finca sub-location (or flatten into finca.notes) | Builder choice; demo: flatten full_name into asset.location_label |
| elements.ndjson | `element` type EQUIPMENT | asset | local_id → location → root building → finca. brand/model/motor/CE/warranty parsed from `observation` ("—"-separated). code→asset.code, barcode→asset.barcode |
| failures.ndjson | `failure` | **1 incident + 1 work_order** (same external_id=failure_id, wo.type=reparacion) | client_id→client, local_id→finca, element_id_GUESS→asset. status map: WAITING_APPROVAL→incident nueva (no WO assigned); WAITING_RESOLUTION→WO pendiente; IN_RESOLUTION→en_curso; PAUSED→pausada; COMPLETED→cerrada (signed). priority 1=urgente…4=baja. started_by "Pol Riera"→operario Pol. |
| works.ndjson | `work` CYCLIC | maintenance_contract | periodicity/recurrence → contract frequency; element_ids_GUESS → contract assets |
| scheduled_works.ndjson | `scheduled-work` | work_order type=mantenimiento | work_id→contract; state SCHEDULED→pendiente (6002/6003 = Pol's «Mi día» Wed/Thu), COMPLETED→cerrada. **Not** plan_slot. |

Demo coverage: 6 incidents (2 closed, 4 open across statuses), 3 maintenance OTs → dashboard by status works. Hours-vs-350€: use manpower_duration on closed rows.

## GUESS fields (not in OpenAPI)
- `failure.element_id_GUESS` — real API links element via relationships/`include`; confirm on dry-run.
- `work.element_ids_GUESS` — real link likely via work elements sub-resource.
- brand/model/motor/CE/warranty inside `element.observation` — real tenant may use element-characteristic custom fields.
- client 9001 observation "Comisión admin 10%" → admin_commission_pct (custom, not in API).
- uuids are fake `00000000-demo-…` placeholders.
