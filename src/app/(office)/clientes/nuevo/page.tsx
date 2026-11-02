import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, QueryAlert } from "../../../../components/page-header";
import { canWriteMasters } from "../../../../domain/access";
import { requireActor } from "../../../../auth/current";
import { CLIENT_TYPES } from "../../../../domain/types";
import { clientTypeLabel } from "../../../../domain/labels";
import { createClientAction } from "../../../../server/master-actions";

export const metadata = { title: "Nuevo cliente" };

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await requireActor();
  if (!canWriteMasters(actor)) {
    redirect("/clientes?error=" + encodeURIComponent("El operario consulta la oficina en solo lectura."));
  }
  const query = await searchParams;

  return (
    <>
      <PageHeader title="Nuevo cliente" lede="Se guarda en la empresa activa del encabezado." />
      <QueryAlert message={query.error} />
      <form action={createClientAction} className="sheet">
        <label>
          Nombre
          <input name="name" required maxLength={160} autoComplete="organization" />
        </label>
        <label>
          Tipo
          <select name="clientType" required defaultValue="particular">
            {CLIENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {clientTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label>
          NIF
          <input name="taxId" maxLength={20} autoComplete="off" />
        </label>
        <label>
          Email
          <input name="email" type="email" maxLength={160} autoComplete="email" />
        </label>
        <label>
          Teléfono
          <input name="phone" maxLength={40} autoComplete="tel" />
        </label>
        <label>
          Dirección
          <input name="address" maxLength={300} autoComplete="street-address" />
        </label>
        <div className="form-actions">
          <button type="submit">Guardar cliente</button>
          <Link href="/clientes">Cancelar</Link>
        </div>
      </form>
    </>
  );
}
