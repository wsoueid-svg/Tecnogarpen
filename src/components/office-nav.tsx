"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/clientes", label: "Clientes" },
  { href: "/fincas", label: "Fincas" },
  { href: "/activos", label: "Activos" },
];

export function OfficeNav() {
  const pathname = usePathname();
  return (
    <nav className="side-nav" aria-label="Maestros">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
