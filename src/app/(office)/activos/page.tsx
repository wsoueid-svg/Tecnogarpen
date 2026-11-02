import Link from "next/link";
import { PageHeader, QueryAlert } from "../../../components/page-header";
import { canWriteMasters } from "../../../domain/access";
import { activeCompanyId, requireActor } from "../../../auth/current";
import { getRepository } from "../../../data/get-repository";
import { dash, formatDay, formatStamp } from "../../../domain/format";

export const metadata = { title: "Activos" };

export default async function ActivosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; finca?: string }>;
}) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  const query = await searchParams;
  const repo = await getRepository();
  const [assets, fincas] = await Promise.all([
    repo.listAssets(actor, companyId),
    repo.listFincas(actor, companyId),
  ]);
  const finca = fincas.find((row) => row.id === query.finca);
  const visible = query.finca ? assets.filter((asset) => asset.fincaId === query.finca) : assets;
  const writer = canWriteMasters(actor);
  const unknownFinca = Boolean(query.finca) && !finca;

  return (
    <>
      <PageHeader
        title={finca ? `Activos de ${finca.name}` : "Activos"}
        lede="Cada activo cuelga de una finca de la misma empresa."
        actionHref={writer ? `/activos/nuevo${finca ? `?finca=${finca.id}` : ""}` : undefined}
        actionLabel={writer ? "Nuevo activo" : undefined}
      />
      <QueryAlert message={unknownFinca ? "Esa finca no está en la empresa activa." : query.error} />
      {finca ? (
        <p className="hint">
          <Link href="/activos">Ver todos los activos</Link>
        </p>
      ) : null}
      <p className="count">
        {visible.length} {visible.length === 1 ? "activo" : "activos"}
      </p>
      {visible.length === 0 ? (
        <p className="empty">Todavía no hay activos en esta vista.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Finca</th>
              <th>Cliente</th>
              <th>N.º de serie</th>
              <th>Instalación</th>
              <th>Alta</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((asset) => (
              <tr key={asset.id}>
                <td>{asset.name}</td>
                <td>{asset.fincaName}</td>
                <td>{asset.clientName}</td>
                <td className="mono">{dash(asset.serialNumber)}</td>
                <td>{formatDay(asset.installedOn)}</td>
                <td>{formatStamp(asset.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
