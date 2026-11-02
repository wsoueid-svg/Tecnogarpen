import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, QueryAlert } from "../../../../components/page-header";
import { canWriteMasters } from "../../../../domain/access";
import { activeCompanyId, requireActor } from "../../../../auth/current";
import { getRepository } from "../../../../data/get-repository";
import { createIncidentAction } from "../../../../server/operation-actions";

export const metadata = { title: "Nueva incidencia" };

export default async function NuevaIncidenciaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  if (!canWriteMasters(actor)) {
    redirect("/incidencias?error=" + encodeURIComponent("El operario consulta la oficina en solo lectura."));
  }
  const companyId = await activeCompanyId(actor);
  const query = await searchParams;
  const repo = await getRepository();
  const [assets, fincas] = await Promise.all([repo.listAssets(actor, companyId), repo.listFincas(actor, companyId)]);

  return (
    <>
      <PageHeader title="Nueva incidencia" lede="Se guarda en la empresa activa. Si eliges puerta, la finca y el cliente salen de ella." />
      <QueryAlert message={query.error} />
      <form action={createIncidentAction} className="sheet">
        <label>
          Puerta
          <select name="assetId" defaultValue={assets[0]?.id ?? ""}>
            <option value="">Sin puerta</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} · {asset.fincaName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Finca, si no hay puerta
          <select name="fincaId" defaultValue={fincas[0]?.id}>
            {fincas.map((finca) => (
              <option key={finca.id} value={finca.id}>
                {finca.name} · {finca.clientName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Resumen
          <input name="summary" required maxLength={400} />
        </label>
        <label>
          Prioridad
          <select name="priority" defaultValue="2">
            <option value="1">1 · Urgente</option>
            <option value="2">2 · Alta</option>
            <option value="3">3 · Media</option>
            <option value="4">4 · Baja</option>
          </select>
        </label>
        <div className="form-actions">
          <button type="submit">Guardar incidencia</button>
          <Link href="/incidencias">Cancelar</Link>
        </div>
      </form>
    </>
  );
}
