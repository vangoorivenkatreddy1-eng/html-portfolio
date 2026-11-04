"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deletePlanDependencyAction,
  deletePlanPhaseAction,
  exportMasterPlanCsvAction,
  upsertPlanDependencyAction,
  upsertPlanPhaseAction,
} from "@/app/actions/readiness";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBanner } from "@/components/demo-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLAN_PILLARS, pillarLabel } from "@/lib/master-plan/labels";
import { phasesAtRisk } from "@/lib/master-plan/risks";
import type { Launch, PlanDependency, PlanPhase, PlanPillar } from "@/lib/types/domain";

export function MasterPlanWorkspace({
  launch,
  phases,
  dependencies,
  isDemo,
  canEdit,
}: {
  launch: Launch;
  phases: PlanPhase[];
  dependencies: PlanDependency[];
  isDemo: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editPhase, setEditPhase] = useState<PlanPhase | null>(null);
  const asOf = new Date().toISOString().slice(0, 10);
  const atRisk = phasesAtRisk(phases, asOf);

  const sortedPhases = [...phases].sort((a, b) => a.phase_number - b.phase_number);

  function phaseName(id: string) {
    return sortedPhases.find((p) => p.id === id)?.name ?? id;
  }

  return (
    <AppShell
      title="Master plan & risks"
      subtitle="Three pillars, six phases, and dependencies — detail lives here, not on the executive landing."
    >
      {isDemo ? <DemoBanner /> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {PLAN_PILLARS.map((pillar) => (
          <Badge key={pillar} variant="secondary">
            {pillarLabel(pillar)}
          </Badge>
        ))}
        <Button
          variant="outline"
          className="ml-auto"
          onClick={() =>
            startTransition(async () => {
              const csv = await exportMasterPlanCsvAction();
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "master-plan.csv";
              a.click();
              URL.revokeObjectURL(url);
            })
          }
        >
          Export CSV
        </Button>
      </div>

      {atRisk.length ? (
        <Card className="mb-6 border-amber-200 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="text-base text-amber-900">Schedule risks</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-950">
            <ul className="list-disc pl-5">
              {atRisk.map((p) => (
                <li key={p.id}>
                  Phase {p.phase_number} ({p.name}) — target {p.target_date}, status {p.status}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {canEdit ? (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{editPhase ? "Edit phase" : "Update phase"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                action={(fd) =>
                  startTransition(async () => {
                    if (editPhase) fd.set("id", editPhase.id);
                    const res = await upsertPlanPhaseAction(fd);
                    if (res.error) {
                      toast.error("Could not save phase");
                      return;
                    }
                    toast.success("Phase saved");
                    setEditPhase(null);
                    router.refresh();
                  })
                }
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="phase_number">Phase #</Label>
                    <Input
                      id="phase_number"
                      name="phase_number"
                      type="number"
                      min={1}
                      max={6}
                      required
                      defaultValue={editPhase?.phase_number ?? 1}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="target_date">Target date</Label>
                    <Input
                      id="target_date"
                      name="target_date"
                      type="date"
                      defaultValue={editPhase?.target_date ?? ""}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required defaultValue={editPhase?.name} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pillar">Pillar</Label>
                  <select
                    id="pillar"
                    name="pillar"
                    defaultValue={editPhase?.pillar ?? "planning_governance"}
                    className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
                  >
                    {PLAN_PILLARS.map((p) => (
                      <option key={p} value={p}>
                        {pillarLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Input id="status" name="status" defaultValue={editPhase?.status ?? "not_started"} />
                </div>
                <Button type="submit" disabled={pending}>
                  Save phase
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add dependency</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                action={(fd) =>
                  startTransition(async () => {
                    const res = await upsertPlanDependencyAction(fd);
                    if (res.error) {
                      toast.error("Could not save dependency");
                      return;
                    }
                    toast.success("Dependency saved");
                    router.refresh();
                  })
                }
              >
                <div className="space-y-1">
                  <Label>Predecessor phase</Label>
                  <select
                    name="predecessor_phase_id"
                    required
                    className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
                  >
                    {sortedPhases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.phase_number}. {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Successor phase</Label>
                  <select
                    name="successor_phase_id"
                    required
                    className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
                  >
                    {sortedPhases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.phase_number}. {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>
                <Button type="submit" disabled={pending}>
                  Save dependency
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Six phases</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Pillar</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPhases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.phase_number}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-xs">{pillarLabel(p.pillar as PlanPillar)}</TableCell>
                  <TableCell>{p.target_date ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.status.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditPhase(p)}>
                          Edit
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            startTransition(async () => {
                              await deletePlanPhaseAction(p.id);
                              toast.success("Phase removed");
                              router.refresh();
                            })
                          }
                        >
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dependencies</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Predecessor</TableHead>
                <TableHead>Successor</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dependencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500">
                    No dependencies recorded.
                  </TableCell>
                </TableRow>
              ) : (
                dependencies.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{phaseName(d.predecessor_phase_id)}</TableCell>
                    <TableCell>{phaseName(d.successor_phase_id)}</TableCell>
                    <TableCell className="text-sm text-slate-600">{d.description ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            startTransition(async () => {
                              await deletePlanDependencyAction(d.id);
                              toast.success("Dependency removed");
                              router.refresh();
                            })
                          }
                        >
                          Delete
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-slate-500">
        Launch date reference: {launch.launch_date}
      </p>
    </AppShell>
  );
}
