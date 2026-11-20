"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  demoDeletePlanDependency,
  demoDeletePlanPhase,
  demoDeleteVehicle,
  demoDeleteVenue,
  demoUpsertPlanDependency,
  demoUpsertPlanPhase,
  demoUpsertVehicle,
  demoUpsertVenue,
  getDemoPlanDependencies,
  getDemoPlanPhases,
  getDemoVehicles,
  getDemoVenues,
} from "@/lib/data/demo-store";
import { getActiveLaunch, getCurrentMembership, isDemoMode } from "@/lib/data/launch-service";
import { canEditDomain } from "@/lib/kpi/aggregate";
import type { DomainArea, PlanPillar, StageAvMilestone } from "@/lib/types/domain";

function assertDomain(domain: DomainArea) {
  return async () => {
    if (isDemoMode()) return;
    const launch = await getActiveLaunch();
    const membership = await getCurrentMembership(launch.id);
    if (!membership) throw new Error("Unauthorized");
    if (membership.role === "pmo_admin") return;
    if (!canEditDomain(membership.role, membership.assigned_domains, domain)) {
      throw new Error(`Not assigned to ${domain}`);
    }
  };
}

function revalidateAll() {
  revalidatePath("/operations/venue");
  revalidatePath("/operations/vehicles");
  revalidatePath("/operations/master-plan");
  revalidatePath("/dashboard");
}

function parseMilestones(raw: string | null): StageAvMilestone[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as StageAvMilestone[];
    if (!Array.isArray(parsed)) throw new Error("Expected JSON array");
    return parsed;
  } catch {
    throw new Error("Invalid milestones JSON");
  }
}

const venueSchema = z.object({
  id: z.string().optional(),
  venue_name: z.string().min(2),
  capacity: z.coerce.number().int().min(1),
  expected_attendance: z.coerce.number().int().min(0),
  contract_status: z.string().min(2),
  event_start: z.string().optional(),
  event_end: z.string().optional(),
  permits_status: z.string().min(2),
  milestones_json: z.string().optional(),
});

const vehicleSchema = z.object({
  id: z.string().optional(),
  unit_name: z.string().min(2),
  critical_blocker: z.string().optional(),
});

const phaseSchema = z.object({
  id: z.string().optional(),
  phase_number: z.coerce.number().int().min(1).max(6),
  name: z.string().min(2),
  pillar: z.enum([
    "planning_governance",
    "people_event_operations",
    "vehicle_commercial_readiness",
  ]),
  target_date: z.string().optional(),
  status: z.string().min(2),
});

const dependencySchema = z.object({
  id: z.string().optional(),
  predecessor_phase_id: z.string().min(1),
  successor_phase_id: z.string().min(1),
  description: z.string().optional(),
});

export async function upsertVenueAction(formData: FormData) {
  const parsed = venueSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await assertDomain("venue")();
    const milestones = parseMilestones(parsed.data.milestones_json ?? "[]");
    if (isDemoMode()) {
      demoUpsertVenue({
        id: parsed.data.id,
        venue_name: parsed.data.venue_name,
        capacity: parsed.data.capacity,
        expected_attendance: parsed.data.expected_attendance,
        contract_status: parsed.data.contract_status,
        event_start: parsed.data.event_start || null,
        event_end: parsed.data.event_end || null,
        permits_status: parsed.data.permits_status,
        stage_av_milestones: milestones,
      });
      revalidateAll();
      return { ok: true };
    }
    const launch = await getActiveLaunch();
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: { _form: ["Unauthorized"] } };
    const payload = {
      launch_id: launch.id,
      venue_name: parsed.data.venue_name,
      capacity: parsed.data.capacity,
      expected_attendance: parsed.data.expected_attendance,
      contract_status: parsed.data.contract_status,
      event_start: parsed.data.event_start || null,
      event_end: parsed.data.event_end || null,
      permits_status: parsed.data.permits_status,
      stage_av_milestones: milestones,
      updated_by: user.id,
      created_by: user.id,
    };
    const { error } = parsed.data.id
      ? await supabase.from("venue_records").update(payload).eq("id", parsed.data.id)
      : await supabase.from("venue_records").insert(payload);
    if (error) return { error: { _form: [error.message] } };
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }
}

export async function deleteVenueAction(id: string) {
  try {
    await assertDomain("venue")();
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (isDemoMode()) {
    demoDeleteVenue(id);
    revalidateAll();
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("venue_records").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function exportVenueCsvAction(): Promise<string> {
  const venues = isDemoMode() ? getDemoVenues() : [];
  const rows = [
    ["venue", "capacity", "attendance", "contract", "permits", "event_start", "event_end"],
    ...venues.map((v) => [
      v.venue_name,
      String(v.capacity),
      String(v.expected_attendance),
      v.contract_status,
      v.permits_status,
      v.event_start ?? "",
      v.event_end ?? "",
    ]),
  ];
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function upsertVehicleAction(formData: FormData) {
  const required = formData.get("required_for_launch") === "on";
  const ready = formData.get("inspection_ready") === "on";
  const parsed = vehicleSchema.safeParse({
    id: formData.get("id") || undefined,
    unit_name: formData.get("unit_name"),
    required_for_launch: required,
    inspection_ready: ready,
    critical_blocker: formData.get("critical_blocker") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await assertDomain("launch_vehicles")();
    if (isDemoMode()) {
      demoUpsertVehicle({
        ...parsed.data,
        required_for_launch: required,
        inspection_ready: ready,
        critical_blocker: parsed.data.critical_blocker ?? null,
      });
      revalidateAll();
      return { ok: true };
    }
    const launch = await getActiveLaunch();
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: { _form: ["Unauthorized"] } };
    const payload = {
      launch_id: launch.id,
      unit_name: parsed.data.unit_name,
      required_for_launch: required,
      inspection_ready: ready,
      critical_blocker: parsed.data.critical_blocker ?? null,
      updated_by: user.id,
      created_by: user.id,
    };
    const { error } = parsed.data.id
      ? await supabase.from("launch_vehicle_units").update(payload).eq("id", parsed.data.id)
      : await supabase.from("launch_vehicle_units").insert(payload);
    if (error) return { error: { _form: [error.message] } };
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }
}

export async function deleteVehicleAction(id: string) {
  try {
    await assertDomain("launch_vehicles")();
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (isDemoMode()) {
    demoDeleteVehicle(id);
    revalidateAll();
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("launch_vehicle_units").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function exportVehiclesCsvAction(): Promise<string> {
  const vehicles = isDemoMode() ? getDemoVehicles() : [];
  const rows = [
    ["unit", "required", "inspection_ready", "blocker"],
    ...vehicles.map((v) => [
      v.unit_name,
      String(v.required_for_launch),
      String(v.inspection_ready),
      v.critical_blocker ?? "",
    ]),
  ];
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function upsertPlanPhaseAction(formData: FormData) {
  const parsed = phaseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await assertDomain("planning_governance")();
    if (isDemoMode()) {
      demoUpsertPlanPhase({
        id: parsed.data.id,
        phase_number: parsed.data.phase_number,
        name: parsed.data.name,
        pillar: parsed.data.pillar as PlanPillar,
        target_date: parsed.data.target_date || null,
        status: parsed.data.status,
      });
      revalidateAll();
      return { ok: true };
    }
    const launch = await getActiveLaunch();
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const payload = {
      launch_id: launch.id,
      phase_number: parsed.data.phase_number,
      name: parsed.data.name,
      pillar: parsed.data.pillar,
      target_date: parsed.data.target_date || null,
      status: parsed.data.status,
    };
    const { error } = parsed.data.id
      ? await supabase.from("plan_phases").update(payload).eq("id", parsed.data.id)
      : await supabase.from("plan_phases").insert(payload);
    if (error) return { error: { _form: [error.message] } };
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }
}

export async function deletePlanPhaseAction(id: string) {
  try {
    await assertDomain("planning_governance")();
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (isDemoMode()) {
    demoDeletePlanPhase(id);
    revalidateAll();
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.from("plan_dependencies").delete().or(`predecessor_phase_id.eq.${id},successor_phase_id.eq.${id}`);
  const { error } = await supabase.from("plan_phases").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function upsertPlanDependencyAction(formData: FormData) {
  const parsed = dependencySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await assertDomain("planning_governance")();
    if (isDemoMode()) {
      demoUpsertPlanDependency({
        id: parsed.data.id,
        predecessor_phase_id: parsed.data.predecessor_phase_id,
        successor_phase_id: parsed.data.successor_phase_id,
        description: parsed.data.description ?? null,
      });
      revalidateAll();
      return { ok: true };
    }
    const launch = await getActiveLaunch();
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const payload = {
      launch_id: launch.id,
      predecessor_phase_id: parsed.data.predecessor_phase_id,
      successor_phase_id: parsed.data.successor_phase_id,
      description: parsed.data.description ?? null,
    };
    const { error } = parsed.data.id
      ? await supabase.from("plan_dependencies").update(payload).eq("id", parsed.data.id)
      : await supabase.from("plan_dependencies").insert(payload);
    if (error) return { error: { _form: [error.message] } };
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }
}

export async function deletePlanDependencyAction(id: string) {
  try {
    await assertDomain("planning_governance")();
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (isDemoMode()) {
    demoDeletePlanDependency(id);
    revalidateAll();
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("plan_dependencies").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function exportMasterPlanCsvAction(): Promise<string> {
  const phases = isDemoMode() ? getDemoPlanPhases() : [];
  const deps = isDemoMode() ? getDemoPlanDependencies() : [];
  const phaseName = (id: string) => phases.find((p) => p.id === id)?.name ?? id;
  const rows = [
    ["type", "phase", "pillar", "status", "target_date"],
    ...phases.map((p) => [
      "phase",
      String(p.phase_number),
      p.name,
      p.pillar,
      p.status,
      p.target_date ?? "",
    ]),
    ...deps.map((d) => [
      "dependency",
      phaseName(d.predecessor_phase_id),
      "→",
      phaseName(d.successor_phase_id),
      d.description ?? "",
    ]),
  ];
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
