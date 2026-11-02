import { OfficeShell } from "../../components/office-shell";
import { activeCompanyId, requireActor } from "../../auth/current";
import { getRepository } from "../../data/get-repository";

export const dynamic = "force-dynamic";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const companyId = await activeCompanyId(actor);
  try {
    const companies = await (await getRepository()).listCompanies(actor);
    return (
      <OfficeShell actor={actor} companies={companies} activeId={companyId}>
        {children}
      </OfficeShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se ha podido abrir el almacén.";
    return (
      <main className="field-desk">
        <h1>Almacén no disponible</h1>
        <p>{message}</p>
      </main>
    );
  }
}
