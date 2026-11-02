export function formatStamp(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(iso));
}

export function formatDay(day: string | null): string {
  if (!day) return "—";
  const [year, month, date] = day.split("-");
  if (!year || !month || !date) return day;
  return `${date}/${month}/${year}`;
}

export function dash(value: string | null | undefined): string {
  const text = value?.trim();
  return text ? text : "—";
}
