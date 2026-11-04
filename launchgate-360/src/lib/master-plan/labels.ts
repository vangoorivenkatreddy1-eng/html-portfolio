import type { PlanPillar } from "@/lib/types/domain";

const LABELS: Record<PlanPillar, string> = {
  planning_governance: "Planning & Governance",
  people_event_operations: "People & Event Operations",
  vehicle_commercial_readiness: "Vehicle & Commercial Readiness",
};

export function pillarLabel(pillar: PlanPillar): string {
  return LABELS[pillar];
}

export const PLAN_PILLARS: PlanPillar[] = [
  "planning_governance",
  "people_event_operations",
  "vehicle_commercial_readiness",
];
