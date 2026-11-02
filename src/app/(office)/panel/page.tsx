import Link from "next/link";
import { PageHeader } from "../../../components/page-header";
import { StatusPill } from "../../../components/status-pill";
import { activeCompanyId, requireActor } from "../../../auth/current";
import { getRepository } from "../../../data/get-repository";
import { buildDashboard } from "../../../domain/dashboard";
import { formatEuros, formatHours } from "../../../domain/format";
import { orderStatusLabel } from "../../../domain/labels";
import { WORK_ORDER_STATUSES } from "../../../domain/types";

export const metadata = { title: "Panel" };

export default async function PanelPage() {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  const repo = await getRepository();
  const [incidents, orders, contracts] = await Promise.all([
    repo.listIncidents(actor, companyId),
    repo.listWorkOrders(actor, companyId),
    repo.listContracts(actor, companyId),
  ]);
  const board = buildDashboard(incidents, orders);

  return (
    <>
      <PageHeader
        title="Panel"
        lede="Incidencias abiertas, órdenes por estado y horas cerradas a 350 € la jornada de 8 h."
      />
      <dl className="meters office-meters">
        <div>
          <dt>Incidencias abiertas</dt>
          <dd>{board.openIncidents}</dd>
        </div>
        <div>
          <dt>Horas cerradas</dt>
          <dd>{formatHours(board.hours)}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>{formatEuros(board.euros)}</dd>
        </div>
      </dl>
      <p className="hint">Referencia: {formatEuros(board.dayRate)} por día. La barra es la parte de una jornada que cubren las horas ya cerradas.</p>
      <div className="bar" aria-hidden="true">
        <span style={{ width: `${Math.round(board.dayFraction * 100)}%` }} />
      </div>
      <h2 className="section-title">Órdenes por estado</h2>
      <ul className="status-line">
        {WORK_ORDER_STATUSES.map((status) => (
          <li key={status}>
            <StatusPill status={status} label={orderStatusLabel(status)} />
            <strong>{board.byStatus[status]}</strong>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/incidencias">Ver incidencias</Link>
        {" · "}
        <Link href="/ordenes">Ver órdenes</Link>
      </p>
      <h2 className="section-title">Contratos de mantenimiento</h2>
      {contracts.length === 0 ? (
        <p className="empty">Esta empresa no tiene contratos en la semilla.</p>
      ) : (
        <ul className="plain-list">
          {contracts.map((contract) => (
            <li key={contract.id}>
              <strong>{contract.name}</strong>
              <span>
                {contract.frequency} · {contract.clientName} · {contract.reference}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
