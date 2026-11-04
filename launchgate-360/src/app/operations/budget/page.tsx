import { connection } from "next/server";
import {
  canApproveBudgetProcurement,
  canEditBudgetProcurement,
} from "@/lib/procurement/transitions";
import {
  getActiveLaunch,
  getCurrentMembership,
  getTransactionBundle,
  isDemoMode,
} from "@/lib/data/launch-service";
import { BudgetWorkspace } from "./budget-workspace";

export const instant = false;

export default async function BudgetPage() {
  await connection();
  const launch = await getActiveLaunch();
  const bundle = await getTransactionBundle(launch.id);
  const membership = await getCurrentMembership(launch.id);

  const canEdit = isDemoMode() || canEditBudgetProcurement(membership);
  const canApprove = isDemoMode() || canApproveBudgetProcurement(membership);

  return (
    <BudgetWorkspace
      launch={bundle.launch}
      budgetLines={bundle.budgetLines}
      prs={bundle.prs}
      pos={bundle.pos}
      isDemo={bundle.launch.is_demo}
      canEdit={canEdit}
      canApprove={canApprove}
    />
  );
}
