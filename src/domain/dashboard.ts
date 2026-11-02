import { DAY_RATE_EUR, HOURS_PER_DAY, WORK_ORDER_STATUSES, type Incident, type WorkOrder, type WorkOrderStatus } from "./types";

export type StatusCounts = Record<WorkOrderStatus, number>;

export type DashboardSnapshot = {
  openIncidents: number;
  byStatus: StatusCounts;
  hours: number;
  euros: number;
  dayRate: number;
  dayFraction: number;
};

export function eurosFromHours(hours: number): number {
  return Math.round((hours / HOURS_PER_DAY) * DAY_RATE_EUR * 100) / 100;
}

/** Open incidents, orders by status, and closed-row hours priced at 350 € per 8 h day. */
export function buildDashboard(incidents: Incident[], orders: WorkOrder[]): DashboardSnapshot {
  const byStatus = Object.fromEntries(WORK_ORDER_STATUSES.map((status) => [status, 0])) as StatusCounts;
  let hours = 0;
  for (const order of orders) {
    byStatus[order.status] += 1;
    if (order.status === "cerrada" && order.hours) hours += order.hours;
  }
  hours = Math.round(hours * 100) / 100;
  return {
    openIncidents: incidents.filter((incident) => incident.status !== "cerrada").length,
    byStatus,
    hours,
    euros: eurosFromHours(hours),
    dayRate: DAY_RATE_EUR,
    dayFraction: Math.min(1, hours / HOURS_PER_DAY),
  };
}
