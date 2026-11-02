import Link from "next/link";
import { logout } from "../../auth/actions";
import { requireActor } from "../../auth/current";
import { getRepository } from "../../data/get-repository";
import { formatHours, formatWhen } from "../../domain/format";
import { orderStatusLabel } from "../../domain/labels";
import { myOpenOrders } from "../../domain/operations";
import { StatusPill } from "../../components/status-pill";

export default async function OperarioPage() {
  const actor = await requireActor();
  const orders = await (await getRepository()).listMyWorkOrders(actor);
  const open = myOpenOrders(actor, orders);
  const closed = orders.filter((order) => order.status === "cerrada");
  const today = new Intl.DateTimeFormat("es-ES", { dateStyle: "full", timeZone: "Europe/Madrid" }).format(new Date());

  return (
    <main className="field-desk">
      <header className="field-top">
        <div>
          <p>
            {actor.displayName} · {today}
          </p>
          <h1>Mi día</h1>
        </div>
        <form action={logout}>
          <button type="submit">Salir</button>
        </form>
      </header>
      <p className="field-note">Órdenes asignadas a ti, también las del miércoles y el jueves. Abre una para empezarla o cerrarla.</p>
      <h2 className="section-title">Por hacer</h2>
      {open.length === 0 ? <p className="empty">No tienes órdenes abiertas.</p> : null}
      <div className="day-list">
        {open.map((order) => (
          <Link key={order.id} className="day-row" href={`/operario/orden/${order.id}`}>
            <strong>{order.summary}</strong>
            <span>
              {order.assetName ?? order.fincaName} · {order.clientName}
            </span>
            <span>
              <StatusPill status={order.status} label={orderStatusLabel(order.status)} /> {formatWhen(order.scheduledAt)}
            </span>
          </Link>
        ))}
      </div>
      <h2 className="section-title">Hechas</h2>
      {closed.length === 0 ? <p className="empty">Todavía no hay cierres.</p> : null}
      <ul className="plain-list">
        {closed.map((order) => (
          <li key={order.id}>
            <Link href={`/operario/orden/${order.id}`}>{order.summary}</Link>
            <span>{order.hours != null ? formatHours(order.hours) : "Cerrada"}</span>
          </li>
        ))}
      </ul>
      <nav className="field-nav" aria-label="Operario">
        <Link href="/operario" aria-current="page">
          Mi día
        </Link>
        <Link href="/clientes">Consultar oficina</Link>
      </nav>
    </main>
  );
}
