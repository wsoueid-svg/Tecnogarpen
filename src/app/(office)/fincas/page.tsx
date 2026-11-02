import Link from "next/link";
import { PageHeader, QueryAlert } from "../../../components/page-header";
import { canWriteMasters } from "../../../domain/access";
import { activeCompanyId, requireActor } from "../../../auth/current";
import { getRepository } from "../../../data/get-repository";
import { dash, formatStamp } from "../../../domain/format";

export const metadata = { title: "Fincas" };

export default async function FincasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; cliente?: string }>;
}) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  const query = await searchParams;
  const repo = await getRepository();
  const [fincas, clients] = await Promise.all([
    repo.listFincas(actor, companyId),
    repo.listClients(actor, companyId),
  ]);
  const client = clients.find((row) => row.id === query.cliente);
  const visible = query.cliente ? fincas.filter((finca) => finca.clientId === query.cliente) : fincas;
  const writer = canWriteMasters(actor);
  const unknownClient = Boolean(query.cliente) && !client;

  return (
    <>
      <PageHeader
        title={client ? `Fincas de ${client.name}` : "Fincas"}
        lede="Cada finca cuelga de un cliente de la misma empresa."
        actionHref={writer ? `/fincas/nueva${client ? `?cliente=${client.id}` : ""}` : undefined}
        actionLabel={writer ? "Nueva finca" : undefined}
      />
      <QueryAlert message={unknownClient ? "Ese cliente no está en la empresa activa." : query.error} />
      {client ? (
        <p className="hint">
          <Link href="/fincas">Ver todas las fincas</Link>
        </p>
      ) : null}
      <p className="count">
        {visible.length} {visible.length === 1 ? "finca" : "fincas"}
      </p>
      {visible.length === 0 ? (
        <p className="empty">Todavía no hay fincas en esta vista.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cliente</th>
              <th>Municipio</th>
              <th>Dirección</th>
              <th>Alta</th>
              <th>Activos</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((finca) => (
              <tr key={finca.id}>
                <td>{finca.name}</td>
                <td>{finca.clientName}</td>
                <td>
                  {dash(finca.municipality)}
                  <div className="mono">{dash(finca.postalCode)}</div>
                </td>
                <td>{dash(finca.address)}</td>
                <td>{formatStamp(finca.createdAt)}</td>
                <td>
                  <Link href={`/activos?finca=${finca.id}`}>Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
