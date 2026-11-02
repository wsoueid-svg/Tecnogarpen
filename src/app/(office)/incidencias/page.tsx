import Link from "next/link";
import { PageHeader, QueryAlert } from "../../../components/page-header";
import { StatusPill } from "../../../components/status-pill";
import { canWriteMasters } from "../../../domain/access";
import { activeCompanyId, requireActor } from "../../../auth/current";
import { getRepository } from "../../../data/get-repository";
import { formatStamp } from "../../../domain/format";
import { incidentStatusLabel, priorityLabel } from "../../../domain/labels";

export const metadata = { title: "Incidencias" };

export default async function IncidenciasPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  const query = await searchParams;
  const incidents = await (await getRepository()).listIncidents(actor, companyId);
  const writer = canWriteMasters(actor);

  return (
    <>
      <PageHeader
        title="Incidencias"
        lede="Altas de la empresa activa. Cada avería de la semilla trae su orden de reparación."
        actionHref={writer ? "/incidencias/nueva" : undefined}
        actionLabel={writer ? "Nueva incidencia" : undefined}
      />
      <QueryAlert message={query.error} />
      <p className="count">
        {incidents.length} {incidents.length === 1 ? "incidencia" : "incidencias"}
      </p>
      {incidents.length === 0 ? (
        <p className="empty">Todavía no hay incidencias en esta empresa.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Resumen</th>
              <th>Dónde</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Alta</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id}>
                <td className="mono">{incident.code ?? "—"}</td>
                <td>
                  <Link href={`/incidencias/${incident.id}`}>{incident.summary}</Link>
                </td>
                <td>
                  {incident.fincaName}
                  <div className="hint">{incident.clientName}</div>
                </td>
                <td>{priorityLabel(incident.priority)}</td>
                <td>
                  <StatusPill status={incident.status} label={incidentStatusLabel(incident.status)} />
                </td>
                <td>{formatStamp(incident.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
