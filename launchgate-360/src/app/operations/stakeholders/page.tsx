import {
  getDemoInvitations,
  getDemoStakeholders,
} from "@/lib/data/demo-store";
import { getActiveLaunch, getTransactionBundle, isDemoMode } from "@/lib/data/launch-service";
import { StakeholdersWorkspace } from "./stakeholders-workspace";

export const instant = false;

export default async function StakeholdersPage() {
  if (isDemoMode()) {
    return (
      <StakeholdersWorkspace
        stakeholders={getDemoStakeholders()}
        invitations={getDemoInvitations()}
        isDemo
      />
    );
  }

  const launch = await getActiveLaunch();
  const bundle = await getTransactionBundle(launch.id);
  return (
    <StakeholdersWorkspace
      stakeholders={bundle.stakeholders}
      invitations={bundle.invitations}
      isDemo={bundle.launch.is_demo}
    />
  );
}
