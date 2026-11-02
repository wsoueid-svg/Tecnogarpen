import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, QueryAlert } from "../../../../components/page-header";
import { StatusPill } from "../../../../components/status-pill";
import { canWriteMasters } from "../../../../domain/access";
import { activeCompanyId, requireActor } from "../../../../auth/current";
import { getRepository } from "../../../../data/get-repository";
import { formatHours, formatWhen } from "../../../../domain/format";
import { orderStatusLabel, workTypeLabel } from "../../../../domain/labels";
import { WORK_ORDER_STATUSES } from "../../../../domain/types";
import { assignWorkOrderAction, setWorkOrderStatusAction } from "../../../../server/operation-actions";

export const metadata = { title: "Orden" };

export default async function OrdenPage({
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
  const [orders, operarios] = await Promise.all([repo.listWorkOrders(actor, companyId), repo.listOperarios(actor, companyId)]);
  const order = orders.find((row) => row.id === id);
  if (!order) notFound();
  const writer = canWriteMasters(actor);
  const openStatuses = WORK_ORDER_STATUSES.filter((status) => status !== "cerrada");

  return (
    <>
      <PageHeader title={order.code ?? "Orden"} lede={order.summary} />
      <QueryAlert message={query.error} />
      <p>
        <StatusPill status={order.status} label={orderStatusLabel(order.status)} />
        {" · "}
        {workTypeLabel(order.workType)}
        {" · "}
        {order.clientName} · {order.fincaName}
        {order.assetName ? ` · ${order.assetName}` : ""}
      </p>
      <p className="hint">
        {formatWhen(order.scheduledAt)}
        {" · "}
        {order.assigneeName ?? "Sin operario"}
        {order.hours != null ? ` · ${formatHours(order.hours)}` : ""}
        {order.signatureName ? ` · Firma: ${order.signatureName}` : ""}
        {order.photoName ? ` · Foto: ${order.photoName}` : ""}
      </p>
      {order.closeNote ? <p>{order.closeNote}</p> : null}
      {writer && order.status !== "cerrada" && operarios.length > 0 ? (
        <form action={assignWorkOrderAction} className="inline-form">
          <input type="hidden" name="workOrderId" value={order.id} />
          <label>
            Operario
            <select name="assigneeId" defaultValue={order.assigneeId ?? operarios[0]?.id ?? ""} required>
              {operarios.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Asignar</button>
        </form>
      ) : null}
      {writer && order.status !== "cerrada" ? (
        <form action={setWorkOrderStatusAction} className="inline-form">
          <input type="hidden" name="workOrderId" value={order.id} />
          <label>
            Estado
            <select name="status" defaultValue={order.status}>
              {openStatuses.map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Guardar estado</button>
        </form>
      ) : null}
      {writer && order.status !== "cerrada" ? (
        <p className="hint">Cerrar con nota, foto y firma es el paso del operario en Mi día.</p>
      ) : null}
      <p>
        <Link href="/ordenes">Volver al listado</Link>
      </p>
    </>
  );
}
