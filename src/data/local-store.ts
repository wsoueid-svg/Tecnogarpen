import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertCanWriteMasters, assertCompanyVisible } from "../domain/access";
import type { MastersRepository } from "../domain/repository";
import type {
  Actor,
  Asset,
  AssetInput,
  AssetRecord,
  Client,
  ClientInput,
  Company,
  ContractRecord,
  Finca,
  FincaInput,
  FincaRecord,
  Incident,
  IncidentInput,
  IncidentRecord,
  IncidentStatus,
  OperarioOption,
  StoreFile,
  WorkOrder,
  WorkOrderClose,
  WorkOrderInput,
  WorkOrderRecord,
  WorkOrderStatus,
} from "../domain/types";
import { ValidationError } from "../domain/validation";
import { loadDemoStore } from "./load-fixtures";
import {
  addIncident,
  addWorkOrder,
  closeOrder,
  makeAsset,
  makeClient,
  makeFinca,
  patchAssignee,
  patchIncidentStatus,
  patchOrderStatus,
  readContracts,
  readIncidents,
  readMyOrders,
  readOperarios,
  readOrders,
} from "./store-ops";

function emptyStore(): StoreFile {
  return loadDemoStore();
}

function byNewest<T extends { createdAt: string; name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name, "es"));
}

const fileQueues = new Map<string, Promise<void>>();

/** Layout and page render concurrently, so the first seed must not interleave writes. */
async function withFileLock<T>(filePath: string, run: () => Promise<T>): Promise<T> {
  const previous = fileQueues.get(filePath) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const next = previous.catch(() => undefined).then(() => gate);
  fileQueues.set(filePath, next);
  await previous.catch(() => undefined);
  try {
    return await run();
  } finally {
    release();
  }
}

export function resolveDataFile(file = process.env.DATA_FILE ?? ".data/store.json"): string {
  return path.isAbsolute(file) ? file : path.join(process.cwd(), file);
}

export class LocalMastersRepository implements MastersRepository {
  constructor(private readonly filePath: string) {}

  async listCompanies(actor: Actor): Promise<Company[]> {
    const store = await withFileLock(this.filePath, () => this.read());
    return store.companies
      .filter((company) => actor.companyIds.includes(company.id))
      .sort((a, b) => a.prefix.localeCompare(b.prefix));
  }

  async listClients(actor: Actor, companyId: string): Promise<Client[]> {
    assertCompanyVisible(actor, companyId);
    const store = await withFileLock(this.filePath, () => this.read());
    return byNewest(store.clients.filter((client) => client.companyId === companyId));
  }

  async createClient(actor: Actor, input: ClientInput): Promise<Client> {
    assertCanWriteMasters(actor, input.companyId);
    return withFileLock(this.filePath, () =>
      this.mutate((store) => {
        const row = makeClient(actor, input);
        store.clients.push(row);
        return row;
      }),
    );
  }

  async listFincas(actor: Actor, companyId: string): Promise<FincaRecord[]> {
    assertCompanyVisible(actor, companyId);
    const store = await withFileLock(this.filePath, () => this.read());
    const names = new Map(store.clients.map((client) => [client.id, client.name]));
    return byNewest(
      store.fincas
        .filter((finca) => finca.companyId === companyId)
        .map((finca) => ({ ...finca, clientName: names.get(finca.clientId) ?? "Cliente eliminado" })),
    );
  }

  async createFinca(actor: Actor, input: FincaInput): Promise<Finca> {
    assertCanWriteMasters(actor, input.companyId);
    return withFileLock(this.filePath, () => this.mutate((store) => {
      const client = store.clients.find((row) => row.id === input.clientId);
      if (!client || client.companyId !== input.companyId) {
        throw new ValidationError("La finca tiene que pertenecer a un cliente de la misma empresa.");
      }
      const row = makeFinca(actor, input);
      store.fincas.push(row);
      return row;
    }));
  }

  async listAssets(actor: Actor, companyId: string): Promise<AssetRecord[]> {
    assertCompanyVisible(actor, companyId);
    const store = await withFileLock(this.filePath, () => this.read());
    const fincas = new Map(store.fincas.map((finca) => [finca.id, finca]));
    const clients = new Map(store.clients.map((client) => [client.id, client.name]));
    return byNewest(
      store.assets
        .filter((asset) => asset.companyId === companyId)
        .map((asset) => {
          const finca = fincas.get(asset.fincaId);
          return {
            ...asset,
            fincaName: finca?.name ?? "Finca eliminada",
            clientName: finca ? (clients.get(finca.clientId) ?? "Cliente eliminado") : "Cliente eliminado",
          };
        }),
    );
  }

  async createAsset(actor: Actor, input: AssetInput): Promise<Asset> {
    assertCanWriteMasters(actor, input.companyId);
    return withFileLock(this.filePath, () => this.mutate((store) => {
      const finca = store.fincas.find((row) => row.id === input.fincaId);
      if (!finca || finca.companyId !== input.companyId) {
        throw new ValidationError("El activo tiene que pertenecer a una finca de la misma empresa.");
      }
      const row = makeAsset(actor, input);
      store.assets.push(row);
      return row;
    }));
  }

  async listIncidents(actor: Actor, companyId: string): Promise<IncidentRecord[]> {
    return withFileLock(this.filePath, async () => readIncidents(actor, await this.read(), companyId));
  }

  async createIncident(actor: Actor, input: IncidentInput): Promise<Incident> {
    return withFileLock(this.filePath, () => this.mutate((store) => addIncident(actor, store, input)));
  }

  async setIncidentStatus(actor: Actor, incidentId: string, status: IncidentStatus): Promise<Incident> {
    return withFileLock(this.filePath, () => this.mutate((store) => patchIncidentStatus(actor, store, incidentId, status)));
  }

  async listWorkOrders(actor: Actor, companyId: string): Promise<WorkOrderRecord[]> {
    return withFileLock(this.filePath, async () => readOrders(actor, await this.read(), companyId));
  }

  async listMyWorkOrders(actor: Actor): Promise<WorkOrderRecord[]> {
    return withFileLock(this.filePath, async () => readMyOrders(actor, await this.read()));
  }

  async createWorkOrder(actor: Actor, input: WorkOrderInput): Promise<WorkOrder> {
    return withFileLock(this.filePath, () => this.mutate((store) => addWorkOrder(actor, store, input)));
  }

  async assignWorkOrder(actor: Actor, workOrderId: string, assigneeId: string): Promise<WorkOrder> {
    return withFileLock(this.filePath, () => this.mutate((store) => patchAssignee(actor, store, workOrderId, assigneeId)));
  }

  async setWorkOrderStatus(actor: Actor, workOrderId: string, status: WorkOrderStatus): Promise<WorkOrder> {
    return withFileLock(this.filePath, () => this.mutate((store) => patchOrderStatus(actor, store, workOrderId, status)));
  }

  async closeWorkOrder(actor: Actor, workOrderId: string, close: WorkOrderClose): Promise<WorkOrder> {
    return withFileLock(this.filePath, () => this.mutate((store) => closeOrder(actor, store, workOrderId, close)));
  }

  async listContracts(actor: Actor, companyId: string): Promise<ContractRecord[]> {
    return withFileLock(this.filePath, async () => readContracts(actor, await this.read(), companyId));
  }

  async listOperarios(actor: Actor, companyId: string): Promise<OperarioOption[]> {
    return withFileLock(this.filePath, async () => readOperarios(actor, await this.read(), companyId));
  }

  private async read(): Promise<StoreFile> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as StoreFile;
      if (!parsed || !Array.isArray(parsed.companies) || !Array.isArray(parsed.clients)) {
        throw new ValidationError(`El almacén local ${this.filePath} no tiene el formato esperado.`);
      }
      if (parsed.version !== 2 || !Array.isArray(parsed.incidents) || !Array.isArray(parsed.workOrders)) {
        const seeded = emptyStore();
        await this.write(seeded);
        return seeded;
      }
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const seeded = emptyStore();
        await this.write(seeded);
        return seeded;
      }
      throw error;
    }
  }

  private async mutate<T>(change: (store: StoreFile) => T): Promise<T> {
    const store = await this.read();
    const result = change(store);
    await this.write(store);
    return result;
  }

  private async write(store: StoreFile): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    await writeFile(tmp, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
    await rename(tmp, this.filePath);
  }
}

export function createLocalRepository(file = resolveDataFile()): LocalMastersRepository {
  return new LocalMastersRepository(file);
}
