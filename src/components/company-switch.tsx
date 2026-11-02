"use client";

import { usePathname } from "next/navigation";
import { selectCompany } from "../auth/actions";
import type { Company } from "../domain/types";

export function CompanySwitch({ companies, activeId }: { companies: Company[]; activeId: string }) {
  const pathname = usePathname();
  if (companies.length <= 1) {
    const only = companies[0];
    return <p className="company-lock">{only ? `${only.prefix} · ${only.name}` : "Sin empresa"}</p>;
  }

  return (
    <form action={selectCompany} className="company-switch">
      <label htmlFor="companyId">Empresa</label>
      <select id="companyId" name="companyId" defaultValue={activeId}>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.prefix} · {company.name}
          </option>
        ))}
      </select>
      <input type="hidden" name="next" value={pathname} />
      <button type="submit">Ver</button>
    </form>
  );
}
