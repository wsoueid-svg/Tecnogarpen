import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, QueryAlert } from "../../../../components/page-header";
import { canWriteMasters } from "../../../../domain/access";
import { activeCompanyId, requireActor } from "../../../../auth/current";
import { getRepository } from "../../../../data/get-repository";
import { createFincaAction } from "../../../../server/master-actions";

export const metadata = { title: "Nueva finca" };

export default async function NuevaFincaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; cliente?: string }>;
}) {
  const actor = await requireActor();
  if (!canWriteMasters(actor)) {
    redirect("/fincas?error=" + encodeURIComponent("El operario consulta la oficina en solo lectura."));
  }
  const companyId = await activeCompanyId(actor);
  const query = await searchParams;
  const clients = await (await getRepository()).listClients(actor, companyId);

  return (
    <>
      <PageHeader title="Nueva finca" lede="Se guarda en la empresa activa y queda ligada a un cliente." />
      <QueryAlert message={query.error} />
      {clients.length === 0 ? (
        <p className="empty">
          Primero hace falta un cliente. <Link href="/clientes/nuevo">Crear cliente</Link>
        </p>
      ) : (
        <form action={createFincaAction} className="sheet">
          <label>
            Cliente
            <select name="clientId" required defaultValue={query.cliente ?? clients[0]?.id}>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nombre
            <input name="name" required maxLength={160} />
          </label>
          <label>
            Dirección
            <input name="address" maxLength={300} />
          </label>
          <label>
            Municipio
            <input name="municipality" maxLength={120} />
          </label>
          <label>
            Código postal
            <input name="postalCode" inputMode="numeric" maxLength={5} pattern="[0-9]{5}" />
          </label>
          <div className="form-actions">
            <button type="submit">Guardar finca</button>
            <Link href="/fincas">Cancelar</Link>
          </div>
        </form>
      )}
    </>
  );
}
