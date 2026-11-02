import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, QueryAlert } from "../../../../components/page-header";
import { canWriteMasters } from "../../../../domain/access";
import { activeCompanyId, requireActor } from "../../../../auth/current";
import { getRepository } from "../../../../data/get-repository";
import { createAssetAction } from "../../../../server/master-actions";

export const metadata = { title: "Nuevo activo" };

export default async function NuevoActivoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; finca?: string }>;
}) {
  const actor = await requireActor();
  if (!canWriteMasters(actor)) {
    redirect("/activos?error=" + encodeURIComponent("El operario consulta la oficina en solo lectura."));
  }
  const companyId = await activeCompanyId(actor);
  const query = await searchParams;
  const fincas = await (await getRepository()).listFincas(actor, companyId);

  return (
    <>
      <PageHeader title="Nuevo activo" lede="Se guarda en la empresa activa y queda ligado a una finca." />
      <QueryAlert message={query.error} />
      {fincas.length === 0 ? (
        <p className="empty">
          Primero hace falta una finca. <Link href="/fincas/nueva">Crear finca</Link>
        </p>
      ) : (
        <form action={createAssetAction} className="sheet">
          <label>
            Finca
            <select name="fincaId" required defaultValue={query.finca ?? fincas[0]?.id}>
              {fincas.map((finca) => (
                <option key={finca.id} value={finca.id}>
                  {finca.name} · {finca.clientName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nombre
            <input name="name" required maxLength={160} />
          </label>
          <label>
            Número de serie
            <input name="serialNumber" maxLength={80} />
          </label>
          <label>
            Fecha de instalación
            <input name="installedOn" type="date" />
          </label>
          <div className="form-actions">
            <button type="submit">Guardar activo</button>
            <Link href="/activos">Cancelar</Link>
          </div>
        </form>
      )}
    </>
  );
}
