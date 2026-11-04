import { DEMO_LAUNCH_ID, getDemoTransactionBundle } from "@/lib/data/demo-store";
import type {
  ExecutiveReportSnapshot,
  Launch,
  LaunchMembership,
  Stakeholder,
  Invitation,
  TransactionBundle,
} from "@/lib/types/domain";
import {
  aggregateExecutiveKpis,
  resolveReportingCadence,
} from "@/lib/kpi/aggregate";

export function isDemoMode(): boolean {
  return (
    process.env.LAUNCHGATE_DEMO_MODE === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

export async function getActiveLaunch(): Promise<Launch> {
  if (isDemoMode()) {
    return getDemoTransactionBundle().launch;
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("launches")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    throw new Error(error?.message ?? "Launch not configured");
  }
  return data as Launch;
}

export async function getTransactionBundle(
  launchId: string,
): Promise<TransactionBundle> {
  if (isDemoMode() && launchId === DEMO_LAUNCH_ID) {
    return getDemoTransactionBundle();
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const launchRes = await supabase
    .from("launches")
    .select("*")
    .eq("id", launchId)
    .single();
  if (launchRes.error || !launchRes.data) {
    throw new Error(launchRes.error?.message ?? "Launch not found");
  }

  const [
    stakeholders,
    invitations,
    travelPassengers,
    flightSegments,
    hotelRooms,
    transport,
    venues,
    budgetLines,
    prs,
    pos,
    vehicles,
  ] = await Promise.all([
    supabase.from("stakeholders").select("*").eq("launch_id", launchId),
    supabase.from("invitations").select("*").eq("launch_id", launchId),
    supabase.from("travel_passengers").select("*").eq("launch_id", launchId),
    supabase.from("flight_segments").select("*").eq("launch_id", launchId),
    supabase.from("hotel_room_nights").select("*").eq("launch_id", launchId),
    supabase.from("transport_assignments").select("*").eq("launch_id", launchId),
    supabase.from("venue_records").select("*").eq("launch_id", launchId),
    supabase.from("budget_lines").select("*").eq("launch_id", launchId),
    supabase.from("purchase_requisitions").select("*").eq("launch_id", launchId),
    supabase.from("purchase_orders").select("*").eq("launch_id", launchId),
    supabase.from("launch_vehicle_units").select("*").eq("launch_id", launchId),
  ]);

  const firstError =
    stakeholders.error ||
    invitations.error ||
    travelPassengers.error ||
    flightSegments.error ||
    hotelRooms.error ||
    transport.error ||
    venues.error ||
    budgetLines.error ||
    prs.error ||
    pos.error ||
    vehicles.error;
  if (firstError) throw new Error(firstError.message);

  return {
    launch: launchRes.data as Launch,
    stakeholders: (stakeholders.data ?? []) as Stakeholder[],
    invitations: (invitations.data ?? []) as Invitation[],
    travelPassengers: travelPassengers.data ?? [],
    flightSegments: flightSegments.data ?? [],
    hotelRooms: hotelRooms.data ?? [],
    transport: transport.data ?? [],
    venues: venues.data ?? [],
    budgetLines: budgetLines.data ?? [],
    prs: prs.data ?? [],
    pos: pos.data ?? [],
    vehicles: vehicles.data ?? [],
  };
}

export async function getExecutiveDashboardData(launchId: string) {
  const bundle = await getTransactionBundle(launchId);
  const kpis = aggregateExecutiveKpis(bundle);
  const cadence = resolveReportingCadence(bundle.launch, new Date());
  return { launch: bundle.launch, kpis, cadence };
}

export async function getDemoMembership(): Promise<LaunchMembership> {
  return {
    launch_id: DEMO_LAUNCH_ID,
    profile_id: "demo-executive",
    role: "executive",
    assigned_domains: [],
    can_approve_budget: true,
    can_approve_reports: true,
  };
}

export async function getCurrentMembership(
  launchId: string,
): Promise<LaunchMembership | null> {
  if (isDemoMode()) return getDemoMembership();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("launch_memberships")
    .select("*")
    .eq("launch_id", launchId)
    .eq("profile_id", user.id)
    .maybeSingle();
  return (data as LaunchMembership) ?? null;
}

export async function listReportSnapshots(
  launchId: string,
): Promise<ExecutiveReportSnapshot[]> {
  if (isDemoMode()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("executive_report_snapshots")
    .select("*")
    .eq("launch_id", launchId)
    .order("reporting_period_end", { ascending: false });
  return (data ?? []) as ExecutiveReportSnapshot[];
}

export function validateLaunchDateForReporting(launch: Launch): void {
  if (!launch.launch_date) {
    throw new Error("Launch date must be configured before reporting.");
  }
  const parsed = new Date(launch.launch_date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Launch date is invalid.");
  }
}
