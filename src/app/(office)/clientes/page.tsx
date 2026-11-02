import Link from "next/link";
import { PageHeader, QueryAlert } from "../../../components/page-header";
import { canWriteMasters } from "../../../domain/access";
import { activeCompanyId, requireActor } from "../../../auth/current";
import { getRepository } from "../../../data/get-repository";
import { dash, formatStamp } from "../../../domain/format";
import { clientTypeLabel } from "../../../domain/labels";

export const metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  const query = await searchParams;
  const clients = await (await getRepository()).listClients(actor, companyId);
  const writer = canWriteMasters(actor);

  return (
    <>
      <PageHeader
        title="Clientes"
        lede="Maestro de alta. El cliente queda en la empresa activa y no se modifica después."
        actionHref={writer ? "/clientes/nuevo" : undefined}
        actionLabel={writer ? "Nuevo cliente" : undefined}
      />
      <QueryAlert message={query.error} />
      <p className="count">
        {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
      </p>
      {clients.length === 0 ? (
        <p className="empty">Todavía no hay clientes en esta empresa.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>NIF</th>
              <th>Teléfono</th>
              <th>Alta</th>
              <th>Fincas</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  {client.name}
                  <div className="hint">{dash(client.email)}</div>
                </td>
                <td>{clientTypeLabel(client.clientType)}</td>
                <td className="mono">{dash(client.taxId)}</td>
                <td>{dash(client.phone)}</td>
                <td>{formatStamp(client.createdAt)}</td>
                <td>
                  <Link href={`/fincas?cliente=${client.id}`}>Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
