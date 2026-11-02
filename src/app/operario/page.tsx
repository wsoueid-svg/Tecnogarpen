import Link from "next/link";
import { logout } from "../../auth/actions";
import { activeCompanyId, requireActor } from "../../auth/current";
import { CompanySwitch } from "../../components/company-switch";
import { getRepository } from "../../data/get-repository";
import { roleLabel } from "../../domain/labels";

export default async function OperarioPage() {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  const repo = await getRepository();
  const [companies, clients, fincas, assets] = await Promise.all([
    repo.listCompanies(actor),
    repo.listClients(actor, companyId),
    repo.listFincas(actor, companyId),
    repo.listAssets(actor, companyId),
  ]);
  const company = companies.find((row) => row.id === companyId);

  return (
    <main className="field-desk">
      <header className="field-top">
        <div>
          <p>
            {company ? `${company.prefix} · ${company.name}` : "Empresa"} · {roleLabel(actor.role)}
          </p>
          <h1>{actor.displayName}</h1>
        </div>
        <form action={logout}>
          <button type="submit">Salir</button>
        </form>
      </header>
      {companies.length > 1 ? <CompanySwitch companies={companies} activeId={companyId} /> : null}
      <dl className="meters">
        <div>
          <dt>Clientes</dt>
          <dd>{clients.length}</dd>
        </div>
        <div>
          <dt>Fincas</dt>
          <dd>{fincas.length}</dd>
        </div>
        <div>
          <dt>Activos</dt>
          <dd>{assets.length}</dd>
        </div>
      </dl>
      <p className="field-note">
        Puesto de operario. Las órdenes de trabajo, la planificación y los avisos llegan en un incremento
        posterior. Desde aquí solo se consulta el maestro de la empresa activa.
      </p>
      <nav className="field-nav" aria-label="Operario">
        <Link href="/operario" aria-current="page">
          Inicio
        </Link>
        <Link href="/clientes">Consultar oficina</Link>
      </nav>
    </main>
  );
}
