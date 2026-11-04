import { connection } from "next/server";
import { canEditDomain } from "@/lib/kpi/aggregate";
import {
  getActiveLaunch,
  getCurrentMembership,
  getTransactionBundle,
  isDemoMode,
} from "@/lib/data/launch-service";
import { MasterPlanWorkspace } from "./master-plan-workspace";

export const instant = false;

export default async function MasterPlanPage() {
  await connection();
  const launch = await getActiveLaunch();
  const bundle = await getTransactionBundle(launch.id);
  const membership = await getCurrentMembership(launch.id);
  const canEdit =
    isDemoMode() ||
    (membership !== null &&
      (membership.role === "pmo_admin" ||
        canEditDomain(membership.role, membership.assigned_domains, "planning_governance")));

  return (
    <MasterPlanWorkspace
      launch={bundle.launch}
      phases={bundle.planPhases}
      dependencies={bundle.planDependencies}
      isDemo={bundle.launch.is_demo}
      canEdit={canEdit}
    />
  );
}
