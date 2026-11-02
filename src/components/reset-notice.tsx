"use client";

import { useSearchParams } from "next/navigation";

export function ResetNotice({ compact = false }: { compact?: boolean }) {
  const reset = useSearchParams().get("reset");
  if (reset === "ok") return <p role="status">Semilla restaurada.</p>;
  if (reset === "remoto") {
    return <p role="status">Reset demo solo funciona con el almacén local.</p>;
  }
  if (compact) return null;
  return <p>Vuelve a la semilla.</p>;
}
