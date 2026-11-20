import { connection } from "next/server";
import { canEditDomain } from "@/lib/kpi/aggregate";
import {
  getActiveLaunch,
  getCurrentMembership,
  getTransactionBundle,
  isDemoMode,
} from "@/lib/data/launch-service";
import { TravelWorkspace } from "./travel-workspace";

export const instant = false;

export default async function TravelPage() {
  await connection();
  const launch = await getActiveLaunch();
  const bundle = await getTransactionBundle(launch.id);
  const membership = await getCurrentMembership(launch.id);
  const canEdit =
    isDemoMode() ||
    (membership !== null &&
      (membership.role === "pmo_admin" ||
        canEditDomain(membership.role, membership.assigned_domains, "travel")));

  return (
    <TravelWorkspace
      launch={bundle.launch}
      passengers={bundle.travelPassengers}
      segments={bundle.flightSegments}
      isDemo={bundle.launch.is_demo}
      canEdit={canEdit}
    />
  );
}
