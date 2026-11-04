import { describe, expect, it } from "vitest";
import { phasesAtRisk } from "@/lib/master-plan/risks";
import type { PlanPhase } from "@/lib/types/domain";

describe("phasesAtRisk", () => {
  it("flags overdue phases not marked complete", () => {
    const phases: PlanPhase[] = [
      {
        id: "1",
        launch_id: "l",
        phase_number: 1,
        name: "Test",
        pillar: "planning_governance",
        target_date: "2020-01-01",
        status: "in_progress",
      },
    ];
    expect(phasesAtRisk(phases, "2026-01-01")).toHaveLength(1);
    expect(phasesAtRisk([{ ...phases[0], status: "completed" }], "2026-01-01")).toHaveLength(0);
  });
});
