import { connection } from "next/server";
import { canEditDomain } from "@/lib/kpi/aggregate";
import {
  getActiveLaunch,
  getCurrentMembership,
  getTransactionBundle,
  isDemoMode,
} from "@/lib/data/launch-service";
import { VenueWorkspace } from "./venue-workspace";

export const instant = false;

export default async function VenuePage() {
  await connection();
  const launch = await getActiveLaunch();
  const bundle = await getTransactionBundle(launch.id);
  const membership = await getCurrentMembership(launch.id);
  const canEdit =
    isDemoMode() ||
    (membership !== null &&
      (membership.role === "pmo_admin" ||
        canEditDomain(membership.role, membership.assigned_domains, "venue")));

  return (
    <VenueWorkspace
      launch={bundle.launch}
      venues={bundle.venues}
      isDemo={bundle.launch.is_demo}
      canEdit={canEdit}
    />
  );
}
