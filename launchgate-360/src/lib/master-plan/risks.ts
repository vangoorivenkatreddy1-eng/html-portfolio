import type { PlanPhase } from "@/lib/types/domain";

export function phasesAtRisk(phases: PlanPhase[], asOf: string): PlanPhase[] {
  return phases.filter(
    (p) =>
      p.target_date &&
      p.target_date < asOf &&
      !["complete", "completed", "done"].includes(p.status.toLowerCase()),
  );
}
