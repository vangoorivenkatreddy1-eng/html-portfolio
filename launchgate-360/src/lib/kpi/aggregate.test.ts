import { describe, expect, it } from "vitest";
import { getDemoTransactionBundle } from "@/lib/data/demo-store";
import {
  aggregateExecutiveKpis,
  canEditDomain,
  canDownloadExecutiveReport,
  compareKpiMovement,
  resolveReportingCadence,
} from "@/lib/kpi/aggregate";

describe("aggregateExecutiveKpis", () => {
  it("counts unique stakeholders separately from invitation records", () => {
    const bundle = getDemoTransactionBundle();
    const kpis = aggregateExecutiveKpis(bundle);
    expect(kpis.stakeholdersIdentified).toBe(3);
    expect(kpis.invitationsSent).toBe(3);
    expect(kpis.guestConfirmations).toBe(1);
    expect(kpis.flightSegmentsNeeded).toBe(2);
    expect(kpis.passengersNeedingFlights).toBe(2);
  });

  it("flags missing segments for passengers needing flights", () => {
    const bundle = getDemoTransactionBundle();
    bundle.travelPassengers.push({
      id: "tp-3",
      launch_id: bundle.launch.id,
      passenger_name: "Extra",
      needs_flight: true,
      has_exception: false,
    });
    const kpis = aggregateExecutiveKpis(bundle);
    expect(kpis.inconsistencies.some((m) => m.includes("Fewer flight segments"))).toBe(
      true,
    );
  });
});

describe("compareKpiMovement", () => {
  it("returns N/A without a baseline snapshot", () => {
    const bundle = getDemoTransactionBundle();
    const kpis = aggregateExecutiveKpis(bundle);
    const movement = compareKpiMovement(kpis, null);
    expect(movement.stakeholdersIdentified).toBe("N/A");
  });
});

describe("resolveReportingCadence", () => {
  it("uses weekly inside T-60", () => {
    const launch = getDemoTransactionBundle().launch;
    const cadence = resolveReportingCadence(launch, new Date("2026-08-01"));
    expect(cadence).toBe("weekly");
  });
});

describe("permissions", () => {
  it("blocks executives from domain edits", () => {
    expect(canEditDomain("executive", [], "stakeholders")).toBe(false);
  });

  it("allows department editors on assigned domains only", () => {
    expect(canEditDomain("department_editor", ["stakeholders"], "stakeholders")).toBe(
      true,
    );
    expect(canEditDomain("department_editor", ["travel"], "stakeholders")).toBe(false);
  });

  it("allows executives to download reports", () => {
    expect(
      canDownloadExecutiveReport({ role: "executive", can_approve_reports: false }),
    ).toBe(true);
  });
});
