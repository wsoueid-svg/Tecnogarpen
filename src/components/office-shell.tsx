import Link from "next/link";
import { logout } from "../auth/actions";
import { canWriteMasters } from "../domain/access";
import { roleLabel } from "../domain/labels";
import type { Actor, Company } from "../domain/types";
import { CompanySwitch } from "./company-switch";
import { OfficeNav } from "./office-nav";

export function OfficeShell({
  actor,
  companies,
  activeId,
  children,
}: {
  actor: Actor;
  companies: Company[];
  activeId: string;
  children: React.ReactNode;
}) {
  const active = companies.find((company) => company.id === activeId);
  return (
    <div className="desk">
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <aside className="rail">
        <Link href="/clientes" className="brand">
          <span>{active?.prefix ?? "TG"}</span>
          <strong>Tecno Garpen</strong>
        </Link>
        <OfficeNav />
        <p className="rail-note">Incremento A · maestros de alta</p>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <CompanySwitch companies={companies} activeId={activeId} />
          <div className="who">
            <strong>{actor.displayName}</strong>
            <span>{roleLabel(actor.role)}</span>
            <form action={logout}>
              <button type="submit" className="quiet">
                Salir
              </button>
            </form>
          </div>
        </header>
        {canWriteMasters(actor) ? null : (
          <p className="banner" role="status">
            Consulta en solo lectura. El alta de maestros queda en jefe, encargado y administrativo.
          </p>
        )}
        <main id="contenido" className="sheet-wrap">
          {children}
        </main>
      </div>
    </div>
  );
}
