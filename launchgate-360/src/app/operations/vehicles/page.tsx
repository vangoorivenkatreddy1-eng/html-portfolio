import { connection } from "next/server";
import { canEditDomain } from "@/lib/kpi/aggregate";
import {
  getActiveLaunch,
  getCurrentMembership,
  getTransactionBundle,
  isDemoMode,
} from "@/lib/data/launch-service";
import { VehiclesWorkspace } from "./vehicles-workspace";

export const instant = false;

export default async function VehiclesPage() {
  await connection();
  const launch = await getActiveLaunch();
  const bundle = await getTransactionBundle(launch.id);
  const membership = await getCurrentMembership(launch.id);
  const canEdit =
    isDemoMode() ||
    (membership !== null &&
      (membership.role === "pmo_admin" ||
        canEditDomain(membership.role, membership.assigned_domains, "launch_vehicles")));

  return (
    <VehiclesWorkspace
      launch={bundle.launch}
      vehicles={bundle.vehicles}
      isDemo={bundle.launch.is_demo}
      canEdit={canEdit}
    />
  );
}
