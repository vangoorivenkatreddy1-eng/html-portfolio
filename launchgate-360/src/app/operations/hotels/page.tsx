import { connection } from "next/server";
import { canEditDomain } from "@/lib/kpi/aggregate";
import {
  getActiveLaunch,
  getCurrentMembership,
  getTransactionBundle,
  isDemoMode,
} from "@/lib/data/launch-service";
import { HotelsWorkspace } from "./hotels-workspace";

export const instant = false;

export default async function HotelsPage() {
  await connection();
  const launch = await getActiveLaunch();
  const bundle = await getTransactionBundle(launch.id);
  const membership = await getCurrentMembership(launch.id);
  const canEdit =
    isDemoMode() ||
    (membership !== null &&
      (membership.role === "pmo_admin" ||
        canEditDomain(membership.role, membership.assigned_domains, "hotels")));

  return (
    <HotelsWorkspace
      launch={bundle.launch}
      rooms={bundle.hotelRooms}
      isDemo={bundle.launch.is_demo}
      canEdit={canEdit}
    />
  );
}
