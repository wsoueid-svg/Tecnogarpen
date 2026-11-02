import { readFileSync } from "node:fs";
import path from "node:path";
import { mapFixtures } from "../domain/map-fixtures";
import type { StoreFile } from "../domain/types";

export function fixtureDir(root = process.cwd()): string {
  return path.join(root, "fixtures/demo");
}

export function loadDemoStore(root = process.cwd()): StoreFile {
  const dir = fixtureDir(root);
  const read = (name: string) => readFileSync(path.join(dir, name), "utf8");
  return mapFixtures({
    companyMap: read("company_map.ndjson"),
    clients: read("clients.ndjson"),
    locations: read("locations.ndjson"),
    elements: read("elements.ndjson"),
    failures: read("failures.ndjson"),
    works: read("works.ndjson"),
    scheduledWorks: read("scheduled_works.ndjson"),
  });
}
