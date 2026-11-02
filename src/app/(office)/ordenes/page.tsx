import Link from "next/link";
import { PageHeader, QueryAlert } from "../../../components/page-header";
import { StatusPill } from "../../../components/status-pill";
import { canWriteMasters } from "../../../domain/access";
import { activeCompanyId, requireActor } from "../../../auth/current";
import { getRepository } from "../../../data/get-repository";
import { formatWhen } from "../../../domain/format";
import { orderStatusLabel, workTypeLabel } from "../../../domain/labels";

export const metadata = { title: "Órdenes" };

export default async function OrdenesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  const query = await searchParams;
  const orders = await (await getRepository()).listWorkOrders(actor, companyId);
  const writer = canWriteMasters(actor);

  return (
    <>
      <PageHeader
        title="Órdenes"
        lede="Reparaciones de avería y visitas de mantenimiento de la empresa activa."
        actionHref={writer ? "/ordenes/nueva" : undefined}
        actionLabel={writer ? "Nueva orden" : undefined}
      />
      <QueryAlert message={query.error} />
      <p className="count">
        {orders.length} {orders.length === 1 ? "orden" : "órdenes"}
      </p>
      {orders.length === 0 ? (
        <p className="empty">Todavía no hay órdenes en esta empresa.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Resumen</th>
              <th>Tipo</th>
              <th>Dónde</th>
              <th>Operario</th>
              <th>Cuándo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="mono">{order.code ?? "—"}</td>
                <td>
                  <Link href={`/ordenes/${order.id}`}>{order.summary}</Link>
                </td>
                <td>{workTypeLabel(order.workType)}</td>
                <td>
                  {order.assetName ?? order.fincaName}
                  <div className="hint">{order.clientName}</div>
                </td>
                <td>{order.assigneeName ?? "Sin asignar"}</td>
                <td>{formatWhen(order.scheduledAt)}</td>
                <td>
                  <StatusPill status={order.status} label={orderStatusLabel(order.status)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
