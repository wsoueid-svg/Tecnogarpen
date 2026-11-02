import assert from "node:assert/strict";
import { test } from "node:test";
import { assertCanWriteMasters, assertCompanyVisible, canWriteMasters, landingPath } from "../../src/domain/access";
import { COMPANY_TG_ID, COMPANY_TGI_ID } from "../../src/domain/ids";
import type { Actor, Role } from "../../src/domain/types";

function actor(role: Role, companyIds: string[]): Actor {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    role,
    companyIds,
    displayName: "Prueba",
    email: "prueba@tecnogarpen.local",
  };
}

test("operario lands on the field desk and office roles land on clients", () => {
  assert.equal(landingPath("operario"), "/operario");
  for (const role of ["jefe", "encargado", "administrativo"] as const) {
    assert.equal(landingPath(role), "/clientes");
    assert.equal(canWriteMasters(actor(role, [COMPANY_TG_ID])), true);
    assert.doesNotThrow(() => assertCanWriteMasters(actor(role, [COMPANY_TG_ID]), COMPANY_TG_ID));
  }
});

test("operario can read their company and cannot write masters", () => {
  const pol = actor("operario", [COMPANY_TG_ID]);
  assert.equal(canWriteMasters(pol), false);
  assert.doesNotThrow(() => assertCompanyVisible(pol, COMPANY_TG_ID));
  assert.throws(() => assertCompanyVisible(pol, COMPANY_TGI_ID), /no está en tu acceso/);
  assert.throws(() => assertCanWriteMasters(pol, COMPANY_TG_ID), /solo lectura/);
});

test("a writer cannot cross into another company", () => {
  assert.throws(() => assertCanWriteMasters(actor("jefe", [COMPANY_TG_ID]), COMPANY_TGI_ID), /no está en tu acceso/);
});
