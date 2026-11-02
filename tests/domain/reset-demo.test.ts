import assert from "node:assert/strict";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createLocalRepository } from "../../src/data/local-store";
import { isFileDataBackend, wipeLocalDemoStore } from "../../src/data/reset-demo";
import { DIRECTORY_USERS } from "../../src/domain/directory";
import type { Actor } from "../../src/domain/types";

const marta = DIRECTORY_USERS[0] as Actor;

test("reset demo accepts the local file backends and refuses supabase", () => {
  assert.equal(isFileDataBackend(undefined), true);
  assert.equal(isFileDataBackend(""), true);
  assert.equal(isFileDataBackend("local"), true);
  assert.equal(isFileDataBackend(" file "), true);
  assert.equal(isFileDataBackend("json"), true);
  assert.equal(isFileDataBackend("supabase"), false);
  assert.equal(isFileDataBackend("oracle"), false);
});

test("wiping the json store lets the next read restore the demo seed", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "tg-reset-"));
  const file = path.join(dir, "store.json");
  try {
    const repo = createLocalRepository(file);
    await repo.createClient(marta, {
      companyId: marta.companyIds[0] ?? "",
      clientType: "particular",
      name: "Cliente de la demo en curso",
      taxId: null,
      email: null,
      phone: null,
      address: null,
    });
    assert.equal(
      (await repo.listClients(marta, marta.companyIds[0] ?? "")).some((client) => client.name === "Cliente de la demo en curso"),
      true,
    );

    await wipeLocalDemoStore(file);
    await assert.rejects(() => access(file));

    const seeded = createLocalRepository(file);
    const clients = await seeded.listClients(marta, marta.companyIds[0] ?? "");
    assert.equal(clients.some((client) => client.name === "Cliente de la demo en curso"), false);
    assert.equal(clients.length > 0, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
