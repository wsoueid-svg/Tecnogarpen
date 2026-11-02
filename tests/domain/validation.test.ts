import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CLIENT_TYPES, WORK_ORDER_TYPES } from "../../src/domain/types";
import { parseAssetInput, parseClientInput, parseFincaInput } from "../../src/domain/validation";
import { COMPANY_TG_ID, COMPANY_TGI_ID, USER_MARTA_ID, USER_POL_ID } from "../../src/domain/ids";

const companyId = COMPANY_TG_ID;

test("client input keeps the closed type list and trims blanks to null", () => {
  const parsed = parseClientInput({
    companyId,
    clientType: "comunidad",
    name: "  Escalera  Nord  ",
    taxId: "  ",
    email: "",
    phone: " 600 100 100 ",
    address: "",
  });
  assert.equal(parsed.name, "Escalera Nord");
  assert.equal(parsed.clientType, "comunidad");
  assert.equal(parsed.taxId, null);
  assert.equal(parsed.phone, "600 100 100");
  assert.throws(() => parseClientInput({ companyId, clientType: "foo", name: "A" }), /tipo de cliente/);
  assert.throws(() => parseClientInput({ companyId, clientType: "empresa", name: "  " }), /obligatorio/);
  assert.throws(
    () => parseClientInput({ companyId, clientType: "empresa", name: "A", email: "no-es-email" }),
    /email/,
  );
});

test("finca and asset inputs reject a bad parent reference shape and a bad date", () => {
  assert.throws(() => parseFincaInput({ companyId, clientId: " ", name: "Nave" }), /cliente/);
  assert.throws(
    () => parseFincaInput({ companyId, clientId: "c1", name: "Nave", postalCode: "080" }),
    /5 dígitos/,
  );
  const finca = parseFincaInput({ companyId, clientId: "c1", name: "Nave", postalCode: "08018" });
  assert.equal(finca.postalCode, "08018");
  assert.throws(
    () => parseAssetInput({ companyId, fincaId: "f1", name: "Motor", installedOn: "2026-13-40" }),
    /no existe|AAAA-MM-DD/,
  );
  const asset = parseAssetInput({ companyId, fincaId: "f1", name: "Motor", installedOn: "2026-04-02" });
  assert.equal(asset.installedOn, "2026-04-02");
});

test("migrations use the same ids, types, and write-once grants as the domain", () => {
  const init = readFileSync("supabase/migrations/20261102120000_init_masters.sql", "utf8");
  const phase = readFileSync("supabase/migrations/20261102120100_phase1_stubs.sql", "utf8");
  const rls = readFileSync("supabase/migrations/20261102120200_rls.sql", "utf8");
  const seed = readFileSync("supabase/migrations/20261102120300_seed.sql", "utf8");

  for (const id of [COMPANY_TG_ID, COMPANY_TGI_ID, USER_MARTA_ID, USER_POL_ID]) {
    assert.match(seed, new RegExp(id));
  }
  assert.match(seed, /Tecno Garpen Instalaciones/);
  assert.match(seed, /'TG'/);
  assert.match(seed, /'TGI'/);
  assert.match(seed, /Marta Puig/);
  assert.match(seed, /Pol Riera/);
  assert.match(init, /create table public\.user_company/);
  for (const type of CLIENT_TYPES) assert.match(init, new RegExp(`'${type}'`));
  for (const type of WORK_ORDER_TYPES) assert.match(phase, new RegExp(`'${type}'`));
  for (const table of ["incident", "work_order", "plan_slot", "maintenance_contract"]) {
    assert.match(phase, new RegExp(`create table public\\.${table}`));
  }
  assert.match(rls, /enable row level security/i);
  assert.match(rls, /can_write_masters/);
  assert.match(rls, /is_member/);
  assert.doesNotMatch(rls, /\bfor\s+update\b/i);
  assert.doesNotMatch(rls, /\bfor\s+delete\b/i);
  assert.doesNotMatch(rls, /grant\s+update/i);
  assert.doesNotMatch(rls, /grant\s+delete/i);
});
