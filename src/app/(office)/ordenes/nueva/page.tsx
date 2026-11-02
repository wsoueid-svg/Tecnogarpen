import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, QueryAlert } from "../../../../components/page-header";
import { canWriteMasters } from "../../../../domain/access";
import { activeCompanyId, requireActor } from "../../../../auth/current";
import { getRepository } from "../../../../data/get-repository";
import { workTypeLabel } from "../../../../domain/labels";
import { WORK_ORDER_TYPES } from "../../../../domain/types";
import { createWorkOrderAction } from "../../../../server/operation-actions";

export const metadata = { title: "Nueva orden" };

export default async function NuevaOrdenPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; incidencia?: string }>;
}) {
  const actor = await requireActor();
  if (!canWriteMasters(actor)) {
    redirect("/ordenes?error=" + encodeURIComponent("El operario consulta la oficina en solo lectura."));
  }
  const companyId = await activeCompanyId(actor);
  const query = await searchParams;
  const repo = await getRepository();
  const [incidents, assets, fincas, operarios] = await Promise.all([
    repo.listIncidents(actor, companyId),
    repo.listAssets(actor, companyId),
    repo.listFincas(actor, companyId),
    repo.listOperarios(actor, companyId),
  ]);
  const preset = incidents.find((incident) => incident.id === query.incidencia);

  return (
    <>
      <PageHeader
        title="Nueva orden"
        lede="Si eliges una incidencia, la orden hereda cliente, finca y puerta. Si no, elige la puerta."
      />
      <QueryAlert message={query.error} />
      <form action={createWorkOrderAction} className="sheet">
        <label>
          Incidencia
          <select name="incidentId" defaultValue={preset?.id ?? ""}>
            <option value="">Sin incidencia</option>
            {incidents.map((incident) => (
              <option key={incident.id} value={incident.id}>
                {incident.code ?? "Incidencia"} · {incident.summary}
              </option>
            ))}
          </select>
        </label>
        <label>
          Puerta, si no hay incidencia
          <select name="assetId" defaultValue="">
            <option value="">Sin puerta</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} · {asset.fincaName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Finca, si no hay puerta
          <select name="fincaId" defaultValue={fincas[0]?.id}>
            {fincas.map((finca) => (
              <option key={finca.id} value={finca.id}>
                {finca.name} · {finca.clientName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select name="workType" defaultValue="reparacion">
            {WORK_ORDER_TYPES.map((type) => (
              <option key={type} value={type}>
                {workTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Resumen
          <input name="summary" required maxLength={400} defaultValue={preset?.summary ?? ""} />
        </label>
        <label>
          Operario
          <select name="assigneeId" defaultValue="">
            <option value="">Sin asignar</option>
            {operarios.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cuándo
          <input name="scheduledAt" type="datetime-local" />
        </label>
        <div className="form-actions">
          <button type="submit">Guardar orden</button>
          <Link href="/ordenes">Cancelar</Link>
        </div>
      </form>
    </>
  );
}
