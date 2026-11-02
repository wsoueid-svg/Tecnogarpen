import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, QueryAlert } from "../../../../components/page-header";
import { StatusPill } from "../../../../components/status-pill";
import { canWriteMasters } from "../../../../domain/access";
import { activeCompanyId, requireActor } from "../../../../auth/current";
import { getRepository } from "../../../../data/get-repository";
import { incidentStatusLabel, priorityLabel } from "../../../../domain/labels";
import { INCIDENT_STATUSES } from "../../../../domain/types";
import { setIncidentStatusAction } from "../../../../server/operation-actions";

export const metadata = { title: "Incidencia" };

export default async function IncidenciaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  const { id } = await params;
  const query = await searchParams;
  const repo = await getRepository();
  const [incidents, orders] = await Promise.all([repo.listIncidents(actor, companyId), repo.listWorkOrders(actor, companyId)]);
  const incident = incidents.find((row) => row.id === id);
  if (!incident) notFound();
  const linked = orders.filter((order) => order.incidentId === incident.id);
  const writer = canWriteMasters(actor);

  return (
    <>
      <PageHeader title={incident.code ?? "Incidencia"} lede={incident.summary} />
      <QueryAlert message={query.error} />
      <p>
        <StatusPill status={incident.status} label={incidentStatusLabel(incident.status)} />
        {" · "}
        {priorityLabel(incident.priority)}
        {" · "}
        {incident.clientName} · {incident.fincaName}
        {incident.assetName ? ` · ${incident.assetName}` : ""}
      </p>
      {writer ? (
        <form action={setIncidentStatusAction} className="inline-form">
          <input type="hidden" name="incidentId" value={incident.id} />
          <label>
            Estado
            <select name="status" defaultValue={incident.status}>
              {INCIDENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {incidentStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Guardar estado</button>
        </form>
      ) : null}
      <h2 className="section-title">Órdenes</h2>
      {linked.length === 0 ? <p className="empty">Todavía no hay una orden vinculada.</p> : null}
      <ul className="plain-list">
        {linked.map((order) => (
          <li key={order.id}>
            <Link href={`/ordenes/${order.id}`}>{order.summary}</Link>
            <span>{order.assigneeName ?? "Sin operario"}</span>
          </li>
        ))}
      </ul>
      {writer ? (
        <p>
          <Link className="button" href={`/ordenes/nueva?incidencia=${incident.id}`}>
            Nueva OT vinculada
          </Link>
        </p>
      ) : null}
      <p>
        <Link href="/incidencias">Volver al listado</Link>
      </p>
    </>
  );
}
