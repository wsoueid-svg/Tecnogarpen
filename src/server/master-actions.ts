"use server";

import { redirect } from "next/navigation";
import { AccessError } from "../domain/access";
import { activeCompanyId, requireActor } from "../auth/current";
import { getRepository } from "../data/get-repository";
import { ValidationError, parseAssetInput, parseClientInput, parseFincaInput } from "../domain/validation";

function reject(path: string, error: unknown): never {
  if (error instanceof ValidationError || error instanceof AccessError) {
    redirect(`${path}?error=${encodeURIComponent(error.message)}`);
  }
  throw error;
}

export async function createClientAction(formData: FormData) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  try {
    const input = parseClientInput({
      companyId,
      clientType: String(formData.get("clientType") ?? ""),
      name: String(formData.get("name") ?? ""),
      taxId: String(formData.get("taxId") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
    });
    const repo = await getRepository();
    await repo.createClient(actor, input);
  } catch (error) {
    reject("/clientes/nuevo", error);
  }
  redirect("/clientes");
}

export async function createFincaAction(formData: FormData) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  try {
    const input = parseFincaInput({
      companyId,
      clientId: String(formData.get("clientId") ?? ""),
      name: String(formData.get("name") ?? ""),
      address: String(formData.get("address") ?? ""),
      municipality: String(formData.get("municipality") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
    });
    const repo = await getRepository();
    await repo.createFinca(actor, input);
  } catch (error) {
    reject("/fincas/nueva", error);
  }
  redirect("/fincas");
}

export async function createAssetAction(formData: FormData) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  try {
    const input = parseAssetInput({
      companyId,
      fincaId: String(formData.get("fincaId") ?? ""),
      name: String(formData.get("name") ?? ""),
      serialNumber: String(formData.get("serialNumber") ?? ""),
      installedOn: String(formData.get("installedOn") ?? ""),
    });
    const repo = await getRepository();
    await repo.createAsset(actor, input);
  } catch (error) {
    reject("/activos/nuevo", error);
  }
  redirect("/activos");
}
