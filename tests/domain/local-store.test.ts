import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { AccessError } from "../../src/domain/access";
import { DIRECTORY_USERS } from "../../src/domain/directory";
import { COMPANY_TG_ID, COMPANY_TGI_ID } from "../../src/domain/ids";
import type { Actor } from "../../src/domain/types";
import { createLocalRepository } from "../../src/data/local-store";
import { getRepository } from "../../src/data/get-repository";
import { signSupabaseJwt } from "../../src/data/jwt";
import { entraStatus, authMode } from "../../src/auth/entra";
import { readSession, signSession } from "../../src/auth/token";

const marta = DIRECTORY_USERS[0] as Actor;
const pol = DIRECTORY_USERS[1] as Actor;

function encargado(): Actor {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    role: "encargado",
    companyIds: [COMPANY_TG_ID, COMPANY_TGI_ID],
    displayName: "Encargado",
    email: "encargado@tecnogarpen.local",
  };
}

test("local store isolates companies, blocks operario writes, and keeps the hierarchy", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "tg-"));
  const file = path.join(dir, "store.json");
  try {
    const repo = createLocalRepository(file);
    const companies = await repo.listCompanies(marta);
    assert.deepEqual(
      companies.map((company) => company.prefix),
      ["TG", "TGI"],
    );
    assert.deepEqual(
      (await repo.listCompanies(pol)).map((company) => company.id),
      [COMPANY_TG_ID],
    );

    await assert.rejects(() => repo.listClients(pol, COMPANY_TGI_ID), AccessError);
    const tgBefore = await repo.listClients(pol, COMPANY_TG_ID);
    const created = await repo.createClient(marta, {
      companyId: COMPANY_TGI_ID,
      clientType: "constructora",
      name: "Obra Llevant",
      taxId: null,
      email: null,
      phone: null,
      address: null,
    });
    assert.equal((await repo.listClients(pol, COMPANY_TG_ID)).some((client) => client.id === created.id), false);
    assert.equal(tgBefore.length > 0, true);
    assert.equal((await repo.listClients(marta, COMPANY_TGI_ID))[0]?.id, created.id);
    await assert.rejects(
      () =>
        repo.createClient(pol, {
          companyId: COMPANY_TG_ID,
          clientType: "particular",
          name: "No debería",
          taxId: null,
          email: null,
          phone: null,
          address: null,
        }),
      AccessError,
    );

    const again = createLocalRepository(file);
    assert.equal((await again.listClients(marta, COMPANY_TGI_ID))[0]?.name, "Obra Llevant");
    const onDisk = JSON.parse(await readFile(file, "utf8")) as { clients: Array<{ name: string; createdBy: string }> };
    assert.equal(onDisk.clients.find((client) => client.name === "Obra Llevant")?.createdBy, marta.id);
    assert.equal("updateClient" in repo, false);
    assert.equal("deleteClient" in repo, false);

    const finca = await repo.createFinca(marta, {
      companyId: COMPANY_TGI_ID,
      clientId: created.id,
      name: "Portal 4",
      address: null,
      municipality: "Barcelona",
      postalCode: "08018",
    });
    await assert.rejects(
      () =>
        repo.createFinca(marta, {
          companyId: COMPANY_TG_ID,
          clientId: created.id,
          name: "Cruzada",
          address: null,
          municipality: null,
          postalCode: null,
        }),
      /misma empresa/,
    );
    const asset = await repo.createAsset(encargado(), {
      companyId: COMPANY_TGI_ID,
      fincaId: finca.id,
      name: "Motor",
      serialNumber: "SN-1",
      installedOn: null,
    });
    assert.equal(asset.fincaId, finca.id);
    const listed = await repo.listAssets(marta, COMPANY_TGI_ID);
    assert.equal(listed[0]?.clientName, "Obra Llevant");
    assert.equal(listed[0]?.fincaName, "Portal 4");

    const parallel = await Promise.all(
      ["Uno", "Dos", "Tres"].map((name) =>
        repo.createClient(marta, {
          companyId: COMPANY_TG_ID,
          clientType: "particular",
          name,
          taxId: null,
          email: null,
          phone: null,
          address: null,
        }),
      ),
    );
    const tgClients = await repo.listClients(marta, COMPANY_TG_ID);
    assert.equal(tgClients.length, tgBefore.length + parallel.length);
    for (const name of ["Uno", "Dos", "Tres"]) assert.equal(tgClients.some((client) => client.name === name), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("session token and supabase jwt round-trip without leaking the entra secret", () => {
  const secret = "test-secret";
  const token = signSession(marta.id, secret);
  assert.equal(readSession(token, secret), marta.id);
  assert.equal(readSession(`${token}x`, secret), null);
  assert.equal(readSession(token, "other"), null);

  const jwt = signSupabaseJwt(pol.id, secret, 1_700_000_000);
  const payload = JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString()) as {
    sub: string;
    aud: string;
    role: string;
    exp: number;
  };
  assert.equal(payload.sub, pol.id);
  assert.equal(payload.aud, "authenticated");
  assert.equal(payload.role, "authenticated");
  assert.equal(payload.exp, 1_700_000_000 + 3600);

  const status = entraStatus({
    AUTH_MODE: "entra",
    ENTRA_TENANT_ID: "tenant",
    ENTRA_CLIENT_ID: "",
    ENTRA_CLIENT_SECRET: "super-secret",
  });
  assert.equal(status.mode, "entra");
  assert.equal(status.tenantConfigured, true);
  assert.equal(status.clientConfigured, false);
  assert.equal(status.secretConfigured, true);
  assert.equal(JSON.stringify(status).includes("super-secret"), false);
  assert.equal(authMode({}), "mock");
});

test("getRepository defaults to the local file and rejects an unknown backend", async () => {
  const previousBackend = process.env.DATA_BACKEND;
  const previousFile = process.env.DATA_FILE;
  const previousUrl = process.env.SUPABASE_URL;
  const previousAnon = process.env.SUPABASE_ANON_KEY;
  const previousJwt = process.env.SUPABASE_JWT_SECRET;
  const dir = await mkdtemp(path.join(tmpdir(), "tg-repo-"));
  try {
    delete process.env.DATA_BACKEND;
    process.env.DATA_FILE = path.join(dir, "store.json");
    const repo = await getRepository();
    assert.equal((await repo.listCompanies(marta)).length, 2);
    process.env.DATA_BACKEND = "oracle";
    await assert.rejects(() => getRepository(), /no reconocido/);
    process.env.DATA_BACKEND = "supabase";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_JWT_SECRET;
    await assert.rejects(() => getRepository(), /SUPABASE_URL/);
  } finally {
    if (previousBackend === undefined) delete process.env.DATA_BACKEND;
    else process.env.DATA_BACKEND = previousBackend;
    if (previousFile === undefined) delete process.env.DATA_FILE;
    else process.env.DATA_FILE = previousFile;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousAnon === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousAnon;
    if (previousJwt === undefined) delete process.env.SUPABASE_JWT_SECRET;
    else process.env.SUPABASE_JWT_SECRET = previousJwt;
    await rm(dir, { recursive: true, force: true });
  }
});
