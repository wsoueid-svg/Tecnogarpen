import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "../../../../auth/current";
import { StatusPill } from "../../../../components/status-pill";
import { getRepository } from "../../../../data/get-repository";
import { formatWhen } from "../../../../domain/format";
import { orderStatusLabel, workTypeLabel } from "../../../../domain/labels";
import { QueryAlert } from "../../../../components/page-header";
import { closeWorkOrderAction, setWorkOrderStatusAction } from "../../../../server/operation-actions";

export const metadata = { title: "Orden" };

export default async function OperarioOrdenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await requireActor();
  const { id } = await params;
  const query = await searchParams;
  const orders = await (await getRepository()).listMyWorkOrders(actor);
  const order = orders.find((row) => row.id === id);
  if (!order) notFound();
  const open = order.status !== "cerrada";

  return (
    <main className="field-desk">
      <p>
        <Link href="/operario">Mi día</Link>
      </p>
      <h1>{order.summary}</h1>
      <QueryAlert message={query.error} />
      <p>
        <StatusPill status={order.status} label={orderStatusLabel(order.status)} />
        {" · "}
        {workTypeLabel(order.workType)}
      </p>
      <p>
        {order.clientName}
        <br />
        {order.fincaName}
        {order.assetName ? ` · ${order.assetName}` : ""}
        <br />
        {formatWhen(order.scheduledAt)}
      </p>
      {order.closeNote ? <p>{order.closeNote}</p> : null}
      {order.photoName ? <p>Foto: {order.photoName}</p> : null}
      {order.signatureName ? <p>Firma: {order.signatureName}</p> : null}
      {open && order.status !== "en_curso" ? (
        <form action={setWorkOrderStatusAction} className="form-actions">
          <input type="hidden" name="workOrderId" value={order.id} />
          <input type="hidden" name="status" value="en_curso" />
          <input type="hidden" name="returnTo" value={`/operario/orden/${order.id}`} />
          <button type="submit">Empezar</button>
        </form>
      ) : null}
      {open ? (
        <form action={closeWorkOrderAction} className="sheet">
          <input type="hidden" name="workOrderId" value={order.id} />
          <label>
            Nota de cierre
            <input name="note" required maxLength={400} placeholder="Qué se ha hecho" />
          </label>
          <label>
            Horas
            <input name="hours" type="number" min="0" max="24" step="0.25" defaultValue="1" required />
          </label>
          <label>
            Foto
            <input name="photo" type="file" accept="image/*" />
          </label>
          <label className="check">
            <input name="photoStub" type="checkbox" />
            Usar foto de prueba si no adjunto archivo
          </label>
          <label>
            Firma
            <input name="signatureName" required maxLength={120} defaultValue={actor.displayName} />
          </label>
          <button type="submit" className="primary-cta">
            Cerrar orden
          </button>
        </form>
      ) : null}
    </main>
  );
}
