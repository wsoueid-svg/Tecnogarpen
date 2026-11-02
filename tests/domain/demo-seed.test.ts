import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { AccessError } from "../../src/domain/access";
import { buildDashboard, eurosFromHours } from "../../src/domain/dashboard";
import { DIRECTORY_USERS } from "../../src/domain/directory";
import { COMPANY_TG_ID, COMPANY_TGI_ID } from "../../src/domain/ids";
import { myOpenOrders } from "../../src/domain/operations";
import type { Actor } from "../../src/domain/types";
import { createLocalRepository } from "../../src/data/local-store";
import { loadDemoStore } from "../../src/data/load-fixtures";

const marta = DIRECTORY_USERS[0] as Actor;
const pol = DIRECTORY_USERS[1] as Actor;

test("fixtures load the Adri counts and the 350 euro day", () => {
  const store = loadDemoStore();
  assert.equal(store.clients.length, 3);
  assert.equal(store.fincas.length, 7);
  assert.equal(store.assets.length, 6);
  assert.equal(store.incidents.length, 6);
  assert.equal(store.workOrders.length, 9);
  assert.equal(store.contracts.length, 2);
  assert.equal(store.clients.some((client) => client.name.startsWith("Comunidad de Propietarios")), true);
  assert.equal(store.assets.some((asset) => asset.name === "Puerta seccional garaje"), true);
  assert.equal(store.workOrders.some((order) => order.externalId === "infraspeak:scheduled-work:6002" && order.assigneeId === pol.id), true);
  assert.equal(eurosFromHours(8), 350);
  assert.equal(eurosFromHours(6.75), 295.31);
});

test("Marta can assign an order and Pol can close his own with a signature stub", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "tg-demo-"));
  const repo = createLocalRepository(path.join(dir, "store.json"));
  try {
    const tgIncidents = await repo.listIncidents(marta, COMPANY_TG_ID);
    const tgOrders = await repo.listWorkOrders(marta, COMPANY_TG_ID);
    const before = buildDashboard(tgIncidents, tgOrders);
    assert.equal(before.openIncidents, 2);
    assert.equal(before.hours, 6.75);
    assert.equal(before.euros, 295.31);
    assert.equal(before.byStatus.pendiente, 3);

    const waiting = tgOrders.find((order) => order.code === "F-3001");
    assert.ok(waiting);
    assert.equal(waiting.assigneeId, null);
    await repo.assignWorkOrder(marta, waiting.id, pol.id);
    await repo.setWorkOrderStatus(marta, waiting.id, "en_curso");

    const open = myOpenOrders(pol, await repo.listMyWorkOrders(pol));
    assert.deepEqual(open.map((order) => order.code).sort(), ["F-3001", "F-3002", "SW-6002", "SW-6003"]);
    const repair = open.find((order) => order.code === "F-3002");
    assert.ok(repair);
    await repo.closeWorkOrder(pol, repair.id, {
      note: "Fotocélula cambiada",
      photoName: "foto-demo.jpg",
      signatureName: "Pol Riera",
      hours: 1.5,
    });
    const afterOrders = await repo.listWorkOrders(marta, COMPANY_TG_ID);
    const after = buildDashboard(await repo.listIncidents(marta, COMPANY_TG_ID), afterOrders);
    assert.equal(after.hours, 8.25);
    assert.equal(afterOrders.find((order) => order.code === "F-3002")?.signatureName, "Pol Riera");
    assert.equal(afterOrders.find((order) => order.code === "F-3002")?.photoName, "foto-demo.jpg");

    const paused = (await repo.listWorkOrders(marta, COMPANY_TGI_ID)).find((order) => order.code === "F-3005");
    assert.ok(paused);
    await assert.rejects(
      () => repo.closeWorkOrder(pol, paused.id, { note: "No", photoName: null, signatureName: "Pol", hours: 1 }),
      AccessError,
    );
    await assert.rejects(
      () =>
        repo.createIncident(pol, {
          companyId: COMPANY_TG_ID,
          clientId: tgIncidents[0]!.clientId,
          fincaId: tgIncidents[0]!.fincaId,
          assetId: null,
          summary: "No debería",
          priority: 2,
        }),
      AccessError,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
