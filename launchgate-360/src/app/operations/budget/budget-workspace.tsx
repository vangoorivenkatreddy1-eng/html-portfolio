"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteBudgetLineAction,
  deletePoAction,
  deletePrAction,
  exportBudgetProcurementCsvAction,
  transitionBudgetLineAction,
  transitionPoAction,
  transitionPrAction,
  upsertBudgetLineAction,
  upsertPoAction,
  upsertPrAction,
} from "@/app/actions/budget-procurement";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBanner } from "@/components/demo-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  nextBudgetApprovalStatuses,
  nextPoStatuses,
  nextPrStatuses,
} from "@/lib/procurement/transitions";
import type {
  BudgetLine,
  Launch,
  PoStatus,
  PrStatus,
  PurchaseOrder,
  PurchaseRequisition,
} from "@/lib/types/domain";

function money(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className="font-normal capitalize">
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function TransitionRow({
  label,
  nextStatuses,
  onTransition,
  disabled,
  isApproval,
}: {
  label: string;
  nextStatuses: string[];
  onTransition: (to: string) => void;
  disabled?: boolean;
  isApproval?: boolean;
}) {
  if (!nextStatuses.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500">{label}</span>
      {nextStatuses.map((to) => (
        <Button
          key={to}
          size="sm"
          variant={isApproval ? "default" : "outline"}
          disabled={disabled}
          type="button"
          onClick={() => onTransition(to)}
        >
          → {to.replace(/_/g, " ")}
        </Button>
      ))}
    </div>
  );
}

export function BudgetWorkspace({
  launch,
  budgetLines,
  prs,
  pos,
  isDemo,
  canEdit,
  canApprove,
}: {
  launch: Launch;
  budgetLines: BudgetLine[];
  prs: PurchaseRequisition[];
  pos: PurchaseOrder[];
  isDemo: boolean;
  canEdit: boolean;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingBudget, setEditingBudget] = useState<BudgetLine | null>(null);
  const [editingPr, setEditingPr] = useState<PurchaseRequisition | null>(null);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);

  const totals = budgetLines.reduce(
    (acc, b) => ({
      requested: acc.requested + b.amount_requested,
      approved: acc.approved + b.amount_approved,
      committed: acc.committed + b.amount_committed,
      actual: acc.actual + b.amount_actual,
    }),
    { requested: 0, approved: 0, committed: 0, actual: 0 },
  );

  function run(action: () => Promise<{ ok?: boolean; error?: unknown }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Action failed");
        return;
      }
      toast.success(success);
      router.refresh();
    });
  }

  return (
    <AppShell
      title="Budget & procurement"
      subtitle="Requested / approved / committed / actual — each PR and PO is its own record with explicit approvals."
    >
      {isDemo ? <DemoBanner /> : null}

      {!canEdit && !canApprove ? (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="py-3 text-sm text-amber-900">
            You have read-only access. Budget edits require the budget_procurement domain; approvals
            require executive or PMO approval permissions.
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const csv = await exportBudgetProcurementCsvAction();
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "budget-procurement.csv";
              a.click();
              URL.revokeObjectURL(url);
            })
          }
        >
          Export CSV
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Launch budget rollup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Requested</p>
            <p className="text-lg font-semibold">{money(totals.requested, launch.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Approved</p>
            <p className="text-lg font-semibold">{money(totals.approved, launch.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Committed</p>
            <p className="text-lg font-semibold">{money(totals.committed, launch.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Actual</p>
            <p className="text-lg font-semibold">{money(totals.actual, launch.currency)}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="budget">
        <TabsList className="mb-4">
          <TabsTrigger value="budget">Budget lines</TabsTrigger>
          <TabsTrigger value="pr">Purchase requisitions ({prs.length})</TabsTrigger>
          <TabsTrigger value="po">Purchase orders ({pos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-6">
          {canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingBudget ? "Edit budget line" : "Add budget line"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  action={(fd) =>
                    run(async () => {
                      if (editingBudget) fd.set("id", editingBudget.id);
                      return upsertBudgetLineAction(fd);
                    }, "Budget line saved")
                  }
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      required
                      defaultValue={editingBudget?.category}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      name="currency"
                      maxLength={3}
                      required
                      defaultValue={editingBudget?.currency ?? launch.currency}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="owner_name">Owner</Label>
                    <Input
                      id="owner_name"
                      name="owner_name"
                      defaultValue={editingBudget?.owner_name ?? ""}
                    />
                  </div>
                  {(
                    [
                      ["amount_requested", "Requested"],
                      ["amount_approved", "Approved"],
                      ["amount_committed", "Committed"],
                      ["amount_actual", "Actual"],
                    ] as const
                  ).map(([name, label]) => (
                    <div key={name} className="space-y-1">
                      <Label htmlFor={name}>{label}</Label>
                      <Input
                        id={name}
                        name={name}
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        defaultValue={editingBudget?.[name] ?? 0}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label htmlFor="approval_status">Approval status</Label>
                    <Input
                      id="approval_status"
                      name="approval_status"
                      defaultValue={editingBudget?.approval_status ?? "draft"}
                    />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit" disabled={pending}>
                      Save
                    </Button>
                    {editingBudget ? (
                      <Button type="button" variant="ghost" onClick={() => setEditingBudget(null)}>
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget lines</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Amounts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500">
                        No budget lines yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    budgetLines.map((b) => {
                      const next = nextBudgetApprovalStatuses(b.approval_status);
                      const approvalSteps = canApprove
                        ? next.filter((s) => s === "approved" || s === "rejected")
                        : [];
                      const submitSteps = canEdit
                        ? next.filter((s) => s === "submitted")
                        : [];
                      return (
                        <TableRow key={b.id}>
                          <TableCell>
                            <div className="font-medium">{b.category}</div>
                            <div className="text-xs text-slate-500">{b.owner_name}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            Req {money(b.amount_requested, b.currency)}
                            <br />
                            App {money(b.amount_approved, b.currency)}
                            <br />
                            Com {money(b.amount_committed, b.currency)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={b.approval_status} />
                          </TableCell>
                          <TableCell className="min-w-[200px] space-y-2">
                            <TransitionRow
                              label="Submit"
                              nextStatuses={submitSteps}
                              disabled={pending}
                              onTransition={(to) =>
                                run(() => transitionBudgetLineAction(b.id, to), "Status updated")
                              }
                            />
                            <TransitionRow
                              label="Approve"
                              nextStatuses={approvalSteps}
                              disabled={pending}
                              isApproval
                              onTransition={(to) =>
                                run(() => transitionBudgetLineAction(b.id, to), "Approval recorded")
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {canEdit ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingBudget(b)}
                                >
                                  Edit
                                </Button>{" "}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    run(() => deleteBudgetLineAction(b.id), "Deleted")
                                  }
                                >
                                  Delete
                                </Button>
                              </>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pr" className="space-y-6">
          {canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingPr ? "Edit PR" : "New purchase requisition"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  action={(fd) =>
                    run(async () => {
                      if (editingPr) fd.set("id", editingPr.id);
                      return upsertPrAction(fd);
                    }, "PR saved")
                  }
                >
                  <div className="space-y-1">
                    <Label htmlFor="pr_number">PR number</Label>
                    <Input
                      id="pr_number"
                      name="pr_number"
                      required
                      defaultValue={editingPr?.pr_number}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pr_status">Status</Label>
                    <select
                      id="pr_status"
                      name="status"
                      defaultValue={editingPr?.status ?? "not_raised"}
                      className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
                    >
                      {(
                        [
                          "not_raised",
                          "raised",
                          "under_approval",
                          "approved",
                          "rejected",
                        ] as PrStatus[]
                      ).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pr_amount">Amount</Label>
                    <Input
                      id="pr_amount"
                      name="amount"
                      type="number"
                      min={0}
                      required
                      defaultValue={editingPr?.amount ?? 0}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pr_currency">Currency</Label>
                    <Input
                      id="pr_currency"
                      name="currency"
                      maxLength={3}
                      defaultValue={editingPr?.currency ?? launch.currency}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pr_owner">Owner</Label>
                    <Input id="pr_owner" name="owner_name" defaultValue={editingPr?.owner_name ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pr_vendor">Vendor</Label>
                    <Input
                      id="pr_vendor"
                      name="vendor_name"
                      defaultValue={editingPr?.vendor_name ?? ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="raised_at">Raised date</Label>
                    <Input
                      id="raised_at"
                      name="raised_at"
                      type="date"
                      defaultValue={editingPr?.raised_at ?? ""}
                    />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit" disabled={pending}>
                      Save PR
                    </Button>
                    {editingPr ? (
                      <Button type="button" variant="ghost" onClick={() => setEditingPr(null)}>
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PR #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prs.map((pr) => {
                    const next = nextPrStatuses(pr.status);
                    const editorNext = canEdit
                      ? next.filter((s) => !["approved", "rejected"].includes(s))
                      : [];
                    const approverNext = canApprove
                      ? next.filter((s) => s === "approved" || s === "rejected")
                      : [];
                    return (
                      <TableRow key={pr.id}>
                        <TableCell className="font-medium">{pr.pr_number}</TableCell>
                        <TableCell>{pr.vendor_name}</TableCell>
                        <TableCell>{money(pr.amount, pr.currency)}</TableCell>
                        <TableCell>
                          <StatusBadge status={pr.status} />
                        </TableCell>
                        <TableCell className="space-y-2">
                          <TransitionRow
                            label="Progress"
                            nextStatuses={editorNext}
                            disabled={pending}
                            onTransition={(to) =>
                              run(() => transitionPrAction(pr.id, to as PrStatus), "PR updated")
                            }
                          />
                          <TransitionRow
                            label="Executive"
                            nextStatuses={approverNext}
                            disabled={pending}
                            isApproval
                            onTransition={(to) =>
                              run(() => transitionPrAction(pr.id, to as PrStatus), "PR decision")
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setEditingPr(pr)}>
                                Edit
                              </Button>{" "}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => run(() => deletePrAction(pr.id), "PR deleted")}
                              >
                                Delete
                              </Button>
                            </>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="po" className="space-y-6">
          {canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingPo ? "Edit PO" : "New purchase order"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  action={(fd) =>
                    run(async () => {
                      if (editingPo) fd.set("id", editingPo.id);
                      return upsertPoAction(fd);
                    }, "PO saved")
                  }
                >
                  <div className="space-y-1">
                    <Label htmlFor="po_number">PO number</Label>
                    <Input
                      id="po_number"
                      name="po_number"
                      required
                      defaultValue={editingPo?.po_number}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="po_status">Status</Label>
                    <select
                      id="po_status"
                      name="status"
                      defaultValue={editingPo?.status ?? "not_issued"}
                      className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
                    >
                      {(
                        [
                          "not_issued",
                          "preparation",
                          "under_approval",
                          "issued",
                          "rejected",
                        ] as PoStatus[]
                      ).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="po_amount">Amount</Label>
                    <Input
                      id="po_amount"
                      name="amount"
                      type="number"
                      min={0}
                      required
                      defaultValue={editingPo?.amount ?? 0}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="po_currency">Currency</Label>
                    <Input
                      id="po_currency"
                      name="currency"
                      maxLength={3}
                      defaultValue={editingPo?.currency ?? launch.currency}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="po_owner">Owner</Label>
                    <Input id="po_owner" name="owner_name" defaultValue={editingPo?.owner_name ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="po_vendor">Vendor</Label>
                    <Input
                      id="po_vendor"
                      name="vendor_name"
                      defaultValue={editingPo?.vendor_name ?? ""}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="pr_id">Linked PR id (optional)</Label>
                    <Input id="pr_id" name="pr_id" defaultValue={editingPo?.pr_id ?? ""} />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit" disabled={pending}>
                      Save PO
                    </Button>
                    {editingPo ? (
                      <Button type="button" variant="ghost" onClick={() => setEditingPo(null)}>
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pos.map((po) => {
                    const next = nextPoStatuses(po.status);
                    const editorNext = canEdit
                      ? next.filter((s) => !["issued", "rejected"].includes(s))
                      : [];
                    const approverNext = canApprove
                      ? next.filter((s) => s === "issued" || s === "rejected")
                      : [];
                    return (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>{po.vendor_name}</TableCell>
                        <TableCell>{money(po.amount, po.currency)}</TableCell>
                        <TableCell>
                          <StatusBadge status={po.status} />
                        </TableCell>
                        <TableCell className="space-y-2">
                          <TransitionRow
                            label="Progress"
                            nextStatuses={editorNext}
                            disabled={pending}
                            onTransition={(to) =>
                              run(() => transitionPoAction(po.id, to as PoStatus), "PO updated")
                            }
                          />
                          <TransitionRow
                            label="Executive"
                            nextStatuses={approverNext}
                            disabled={pending}
                            isApproval
                            onTransition={(to) =>
                              run(() => transitionPoAction(po.id, to as PoStatus), "PO decision")
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setEditingPo(po)}>
                                Edit
                              </Button>{" "}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => run(() => deletePoAction(po.id), "PO deleted")}
                              >
                                Delete
                              </Button>
                            </>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
