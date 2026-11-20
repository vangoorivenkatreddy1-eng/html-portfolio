import type { LaunchMembership } from "@/lib/types/domain";
import { isDemoMode } from "@/lib/data/launch-service";

export function canEditLaunchMaster(membership: LaunchMembership | null): boolean {
  if (isDemoMode()) return true;
  return membership?.role === "pmo_admin";
}
