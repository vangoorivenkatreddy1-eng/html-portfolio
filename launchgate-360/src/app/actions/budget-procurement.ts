"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  demoDeleteBudgetLine,
  demoDeletePo,
  demoDeletePr,
  demoTransitionBudgetApproval,
  demoTransitionPo,
  demoTransitionPr,
  demoUpsertBudgetLine,
  demoUpsertPo,
  demoUpsertPr,
  getDemoBudgetLines,
  getDemoPos,
  getDemoPrs,
} from "@/lib/data/demo-store";
import {
  getActiveLaunch,
  getCurrentMembership,
  isDemoMode,
} from "@/lib/data/launch-service";
import {
  assertEditorAction,
  assertTransitionAllowed,
  isApprovalTransition,
} from "@/lib/procurement/transitions";
import type { PoStatus, PrStatus } from "@/lib/types/domain";

const amount = z.coerce.number().min(0);

const budgetSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(2),
  currency: z.string().length(3),
  amount_requested: amount,
  amount_approved: amount,
  amount_committed: amount,
  amount_actual: amount,
  approval_status: z.string().min(2),
  owner_name: z.string().optional(),
});

const prSchema = z.object({
  id: z.string().optional(),
  pr_number: z.string().min(3),
  status: z.enum(["not_raised", "raised", "under_approval", "approved", "rejected"]),
  amount: amount,
  currency: z.string().length(3),
  owner_name: z.string().optional(),
  vendor_name: z.string().optional(),
  raised_at: z.string().optional(),
});

const poSchema = z.object({
  id: z.string().optional(),
  po_number: z.string().min(3),
  status: z.enum(["not_issued", "preparation", "under_approval", "issued", "rejected"]),
  amount: amount,
  currency: z.string().length(3),
  owner_name: z.string().optional(),
  vendor_name: z.string().optional(),
  pr_id: z.string().optional(),
});

async function membershipContext() {
  const launch = await getActiveLaunch();
  const membership = await getCurrentMembership(launch.id);
  return { launch, membership };
}

export async function upsertBudgetLineAction(formData: FormData) {
  const parsed = budgetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  if (isDemoMode()) {
    demoUpsertBudgetLine(parsed.data);
    revalidatePath("/operations/budget");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const { launch, membership } = await membershipContext();
  try {
    assertEditorAction(membership, false);
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _form: ["Unauthorized"] } };

  const payload = {
    ...parsed.data,
    launch_id: launch.id,
    owner_name: parsed.data.owner_name ?? null,
    updated_by: user.id,
    created_by: user.id,
  };

  const { error } = parsed.data.id
    ? await supabase.from("budget_lines").update(payload).eq("id", parsed.data.id)
    : await supabase.from("budget_lines").insert(payload);

  if (error) return { error: { _form: [error.message] } };
  revalidatePath("/operations/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function transitionBudgetLineAction(id: string, toStatus: string) {
  if (isDemoMode()) {
    const line = getDemoBudgetLines().find((b) => b.id === id);
    if (!line) return { error: "Not found" };
    try {
      assertTransitionAllowed("budget", line.approval_status, toStatus);
    } catch (e) {
      return { error: (e as Error).message };
    }
    demoTransitionBudgetApproval(id, toStatus, toStatus === "approved");
    revalidatePath("/operations/budget");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const { launch, membership } = await membershipContext();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: line } = await supabase
    .from("budget_lines")
    .select("approval_status, amount_requested, amount_approved")
    .eq("id", id)
    .single();
  if (!line) return { error: "Not found" };

  const approval = isApprovalTransition("budget", line.approval_status, toStatus);
  try {
    assertTransitionAllowed("budget", line.approval_status, toStatus);
    assertEditorAction(membership, approval);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const update: Record<string, unknown> = {
    approval_status: toStatus,
    updated_at: new Date().toISOString(),
  };
  if (toStatus === "approved" && Number(line.amount_approved) === 0) {
    update.amount_approved = line.amount_requested;
  }

  const { error } = await supabase.from("budget_lines").update(update).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/operations/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteBudgetLineAction(id: string) {
  if (isDemoMode()) {
    demoDeleteBudgetLine(id);
    revalidatePath("/operations/budget");
    revalidatePath("/dashboard");
    return { ok: true };
  }
  const { membership } = await membershipContext();
  try {
    assertEditorAction(membership, false);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("budget_lines").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/operations/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function upsertPrAction(formData: FormData) {
  const parsed = prSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  if (isDemoMode()) {
    demoUpsertPr({
      ...parsed.data,
      owner_name: parsed.data.owner_name ?? null,
      vendor_name: parsed.data.vendor_name ?? null,
      raised_at: parsed.data.raised_at ?? null,
    });
    revalidatePath("/operations/budget");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const { launch, membership } = await membershipContext();
  try {
    assertEditorAction(membership, false);
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _form: ["Unauthorized"] } };

  const payload = {
    launch_id: launch.id,
    pr_number: parsed.data.pr_number,
    status: parsed.data.status as PrStatus,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    owner_name: parsed.data.owner_name ?? null,
    vendor_name: parsed.data.vendor_name ?? null,
    raised_at: parsed.data.raised_at ?? null,
    updated_by: user.id,
    created_by: user.id,
  };

  const { error } = parsed.data.id
    ? await supabase.from("purchase_requisitions").update(payload).eq("id", parsed.data.id)
    : await supabase.from("purchase_requisitions").insert(payload);

  if (error) return { error: { _form: [error.message] } };
  revalidatePath("/operations/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function transitionPrAction(id: string, toStatus: PrStatus) {
  if (isDemoMode()) {
    const row = getDemoPrs().find((p) => p.id === id);
    if (!row) return { error: "Not found" };
    try {
      assertTransitionAllowed("pr", row.status, toStatus);
    } catch (e) {
      return { error: (e as Error).message };
    }
    demoTransitionPr(id, toStatus);
    revalidatePath("/operations/budget");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const { membership } = await membershipContext();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("purchase_requisitions")
    .select("status")
    .eq("id", id)
    .single();
  if (!row) return { error: "Not found" };
  const approval = isApprovalTransition("pr", row.status, toStatus);
  try {
    assertTransitionAllowed("pr", row.status, toStatus);
    assertEditorAction(membership, approval);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const update: Record<string, unknown> = { status: toStatus };
  if (approval && toStatus === "approved") {
    update.approved_at = new Date().toISOString();
  }

  const { error } = await supabase.from("purchase_requisitions").update(update).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/operations/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletePrAction(id: string) {
  if (isDemoMode()) {
    demoDeletePr(id);
    revalidatePath("/operations/budget");
    revalidatePath("/dashboard");
    return { ok: true };
  }
  const { membership } = await membershipContext();
  try {
    assertEditorAction(membership, false);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_requisitions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/operations/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function upsertPoAction(formData: FormData) {
  const parsed = poSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  if (isDemoMode()) {
    demoUpsertPo({
      ...parsed.data,
      owner_name: parsed.data.owner_name ?? null,
      vendor_name: parsed.data.vendor_name ?? null,
      pr_id: parsed.data.pr_id || null,
    });
    revalidatePath("/operations/budget");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const { launch, membership } = await membershipContext();
  try {
    assertEditorAction(membership, false);
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _form: ["Unauthorized"] } };

  const payload = {
    launch_id: launch.id,
    po_number: parsed.data.po_number,
    status: parsed.data.status as PoStatus,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    owner_name: parsed.data.owner_name ?? null,
    vendor_name: parsed.data.vendor_name ?? null,
    pr_id: parsed.data.pr_id || null,
    updated_by: user.id,
    created_by: user.id,
  };

  const { error } = parsed.data.id
    ? await supabase.from("purchase_orders").update(payload).eq("id", parsed.data.id)
    : await supabase.from("purchase_orders").insert(payload);

  if (error) return { error: { _form: [error.message] } };
  revalidatePath("/operations/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function transitionPoAction(id: string, toStatus: PoStatus) {
  if (isDemoMode()) {
    const row = getDemoPos().find((p) => p.id === id);
    if (!row) return { error: "Not found" };
    try {
      assertTransitionAllowed("po", row.status, toStatus);
    } catch (e) {
      return { error: (e as Error).message };
    }
    demoTransitionPo(id, toStatus);
    revalidatePath("/operations/budget");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const { membership } = await membershipContext();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("purchase_orders")
    .select("status")
    .eq("id", id)
    .single();
  if (!row) return { error: "Not found" };
  const approval = isApprovalTransition("po", row.status, toStatus);
  try {
    assertTransitionAllowed("po", row.status, toStatus);
    assertEditorAction(membership, approval);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const update: Record<string, unknown> = { status: toStatus };
  if (approval && toStatus === "issued") {
    update.approved_at = new Date().toISOString();
  }

  const { error } = await supabase.from("purchase_orders").update(update).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/operations/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletePoAction(id: string) {
  if (isDemoMode()) {
    demoDeletePo(id);
    revalidatePath("/operations/budget");
    revalidatePath("/dashboard");
    return { ok: true };
  }
  const { membership } = await membershipContext();
  try {
    assertEditorAction(membership, false);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/operations/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function exportBudgetProcurementCsvAction(): Promise<string> {
  const lines = isDemoMode() ? getDemoBudgetLines() : [];
  const prs = isDemoMode() ? getDemoPrs() : [];
  const pos = isDemoMode() ? getDemoPos() : [];
  const rows: string[][] = [
    ["type", "reference", "status", "amount", "currency", "owner", "vendor"],
    ...lines.map((b) => [
      "budget",
      b.category,
      b.approval_status,
      String(b.amount_requested),
      b.currency,
      b.owner_name ?? "",
      "",
    ]),
    ...prs.map((p) => [
      "pr",
      p.pr_number,
      p.status,
      String(p.amount),
      p.currency,
      p.owner_name ?? "",
      p.vendor_name ?? "",
    ]),
    ...pos.map((p) => [
      "po",
      p.po_number,
      p.status,
      String(p.amount),
      p.currency,
      p.owner_name ?? "",
      p.vendor_name ?? "",
    ]),
  ];
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}
