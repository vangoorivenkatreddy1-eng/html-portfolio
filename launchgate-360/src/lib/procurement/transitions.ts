import type { LaunchMembership, PoStatus, PrStatus } from "@/lib/types/domain";
import { canApproveBudget, canEditDomain } from "@/lib/kpi/aggregate";

export const PR_TRANSITIONS: Record<PrStatus, PrStatus[]> = {
  not_raised: ["raised"],
  raised: ["under_approval"],
  under_approval: ["approved", "rejected"],
  approved: [],
  rejected: ["raised"],
};

export const PO_TRANSITIONS: Record<PoStatus, PoStatus[]> = {
  not_issued: ["preparation"],
  preparation: ["under_approval"],
  under_approval: ["issued", "rejected"],
  issued: [],
  rejected: ["preparation"],
};

export const BUDGET_APPROVAL_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  pending: ["submitted"],
  submitted: ["approved", "rejected"],
  approved: [],
  rejected: ["submitted"],
};

export function nextPrStatuses(current: PrStatus): PrStatus[] {
  return PR_TRANSITIONS[current] ?? [];
}

export function nextPoStatuses(current: PoStatus): PoStatus[] {
  return PO_TRANSITIONS[current] ?? [];
}

export function nextBudgetApprovalStatuses(current: string): string[] {
  const key = current.toLowerCase();
  return BUDGET_APPROVAL_TRANSITIONS[key] ?? [];
}

export function isApprovalTransition(
  kind: "pr" | "po" | "budget",
  from: string,
  to: string,
): boolean {
  if (kind === "pr") {
    return from === "under_approval" && (to === "approved" || to === "rejected");
  }
  if (kind === "po") {
    return from === "under_approval" && (to === "issued" || to === "rejected");
  }
  return from === "submitted" && (to === "approved" || to === "rejected");
}

export function assertTransitionAllowed(
  kind: "pr" | "po" | "budget",
  from: string,
  to: string,
): void {
  const allowed =
    kind === "pr"
      ? nextPrStatuses(from as PrStatus).includes(to as PrStatus)
      : kind === "po"
        ? nextPoStatuses(from as PoStatus).includes(to as PoStatus)
        : nextBudgetApprovalStatuses(from).includes(to);
  if (!allowed) {
    throw new Error(`Transition ${from} → ${to} is not allowed for ${kind}.`);
  }
}

export function canEditBudgetProcurement(membership: LaunchMembership | null): boolean {
  if (!membership) return false;
  return (
    membership.role === "pmo_admin" ||
    canEditDomain(membership.role, membership.assigned_domains, "budget_procurement")
  );
}

export function canApproveBudgetProcurement(membership: LaunchMembership | null): boolean {
  if (!membership) return false;
  return canApproveBudget(membership);
}

export function assertEditorAction(
  membership: LaunchMembership | null,
  isApproval: boolean,
): void {
  if (isApproval) {
    if (!canApproveBudgetProcurement(membership)) {
      throw new Error("You do not have budget approval permissions.");
    }
    return;
  }
  if (!canEditBudgetProcurement(membership)) {
    throw new Error("You are not assigned to edit budget & procurement.");
  }
}
