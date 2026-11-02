"use server";

import { redirect } from "next/navigation";
import { AccessError } from "../domain/access";
import { activeCompanyId, requireActor } from "../auth/current";
import { getRepository } from "../data/get-repository";
import { assertIncidentStatus, assertOrderStatus } from "../domain/operations";
import type { WorkOrderType } from "../domain/types";
import { WORK_ORDER_TYPES } from "../domain/types";
import { ValidationError } from "../domain/validation";

function fail(path: string, error: unknown): never {
  if (error instanceof ValidationError || error instanceof AccessError) {
    redirect(`${path}?error=${encodeURIComponent(error.message)}`);
  }
  throw error;
}

export async function createIncidentAction(formData: FormData) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  const assetId = String(formData.get("assetId") ?? "");
  let fincaId = String(formData.get("fincaId") ?? "");
  let clientId = "";
  try {
    const repo = await getRepository();
    const [assets, fincas] = await Promise.all([repo.listAssets(actor, companyId), repo.listFincas(actor, companyId)]);
    if (assetId) {
      const asset = assets.find((row) => row.id === assetId);
      const finca = fincas.find((row) => row.id === asset?.fincaId);
      if (!asset || !finca) throw new ValidationError("Esa puerta no está en la empresa activa.");
      fincaId = finca.id;
      clientId = finca.clientId;
    } else {
      const finca = fincas.find((row) => row.id === fincaId);
      if (!finca) throw new ValidationError("Elige una puerta o una finca.");
      clientId = finca.clientId;
    }
    const priorityRaw = String(formData.get("priority") ?? "");
    await repo.createIncident(actor, {
      companyId,
      clientId,
      fincaId,
      assetId: assetId || null,
      summary: String(formData.get("summary") ?? ""),
      priority: priorityRaw ? Number(priorityRaw) : null,
    });
  } catch (error) {
    fail("/incidencias/nueva", error);
  }
  redirect("/incidencias");
}

export async function setIncidentStatusAction(formData: FormData) {
  const actor = await requireActor();
  const incidentId = String(formData.get("incidentId") ?? "");
  const back = `/incidencias/${incidentId}`;
  try {
    const repo = await getRepository();
    await repo.setIncidentStatus(actor, incidentId, assertIncidentStatus(String(formData.get("status") ?? "")));
  } catch (error) {
    fail(back, error);
  }
  redirect(back);
}

export async function createWorkOrderAction(formData: FormData) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  const incidentId = String(formData.get("incidentId") ?? "");
  const assetId = String(formData.get("assetId") ?? "");
  let fincaId = String(formData.get("fincaId") ?? "");
  let clientId = String(formData.get("clientId") ?? "");
  const workType = String(formData.get("workType") ?? "");
  try {
    if (!(WORK_ORDER_TYPES as readonly string[]).includes(workType)) {
      throw new ValidationError("El tipo de orden no es válido.");
    }
    const repo = await getRepository();
    if (!incidentId) {
      const [assets, fincas] = await Promise.all([repo.listAssets(actor, companyId), repo.listFincas(actor, companyId)]);
      if (assetId) {
        const asset = assets.find((row) => row.id === assetId);
        const finca = fincas.find((row) => row.id === asset?.fincaId);
        if (!asset || !finca) throw new ValidationError("Esa puerta no está en la empresa activa.");
        fincaId = finca.id;
        clientId = finca.clientId;
      } else {
        const finca = fincas.find((row) => row.id === fincaId);
        if (!finca) throw new ValidationError("Elige una incidencia, una puerta o una finca.");
        clientId = finca.clientId;
      }
    }
    const scheduled = String(formData.get("scheduledAt") ?? "");
    await repo.createWorkOrder(actor, {
      companyId,
      incidentId: incidentId || null,
      clientId,
      fincaId,
      assetId: assetId || null,
      workType: workType as WorkOrderType,
      summary: String(formData.get("summary") ?? ""),
      assigneeId: String(formData.get("assigneeId") ?? "") || null,
      scheduledAt: scheduled ? new Date(scheduled).toISOString() : null,
    });
  } catch (error) {
    fail("/ordenes/nueva", error);
  }
  redirect("/ordenes");
}

export async function assignWorkOrderAction(formData: FormData) {
  const actor = await requireActor();
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const back = `/ordenes/${workOrderId}`;
  try {
    const repo = await getRepository();
    await repo.assignWorkOrder(actor, workOrderId, String(formData.get("assigneeId") ?? ""));
  } catch (error) {
    fail(back, error);
  }
  redirect(back);
}

export async function setWorkOrderStatusAction(formData: FormData) {
  const actor = await requireActor();
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const field = String(formData.get("returnTo") ?? "");
  const back = field.startsWith("/operario") ? field : `/ordenes/${workOrderId}`;
  try {
    const repo = await getRepository();
    await repo.setWorkOrderStatus(actor, workOrderId, assertOrderStatus(String(formData.get("status") ?? "")));
  } catch (error) {
    fail(back, error);
  }
  redirect(back);
}

export async function closeWorkOrderAction(formData: FormData) {
  const actor = await requireActor();
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const back = `/operario/orden/${workOrderId}`;
  try {
    const upload = formData.get("photo");
    const stub = formData.get("photoStub") === "on";
    const uploadedName = upload instanceof File && upload.size > 0 ? upload.name : "";
    const photoName = uploadedName || (stub ? "foto-demo.jpg" : "");
    const repo = await getRepository();
    await repo.closeWorkOrder(actor, workOrderId, {
      note: String(formData.get("note") ?? ""),
      photoName,
      signatureName: String(formData.get("signatureName") ?? actor.displayName),
      hours: Number(String(formData.get("hours") ?? "1").replace(",", ".")),
    });
  } catch (error) {
    fail(back, error);
  }
  redirect("/operario");
}
