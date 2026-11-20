"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteVehicleAction,
  exportVehiclesCsvAction,
  upsertVehicleAction,
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
import { aggregateExecutiveKpis } from "@/lib/kpi/aggregate";
import type { Launch, LaunchVehicleUnit, TransactionBundle } from "@/lib/types/domain";

export function VehiclesWorkspace({
  launch,
  vehicles,
  isDemo,
  canEdit,
}: {
  launch: Launch;
  vehicles: LaunchVehicleUnit[];
  isDemo: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<LaunchVehicleUnit | null>(null);

  const kpis = aggregateExecutiveKpis({
    launch,
    stakeholders: [],
    invitations: [],
    travelPassengers: [],
    flightSegments: [],
    hotelRooms: [],
    transport: [],
    venues: [],
    budgetLines: [],
    prs: [],
    pos: [],
    vehicles,
    planPhases: [],
    planDependencies: [],
  } satisfies TransactionBundle);

  return (
    <AppShell
      title="Launch vehicles"
      subtitle="Required units, inspection readiness, and critical blockers for show vehicles."
    >
      {isDemo ? <DemoBanner /> : null}

      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() =>
            startTransition(async () => {
              const csv = await exportVehiclesCsvAction();
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "launch-vehicles.csv";
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
          <CardTitle className="text-base">Readiness</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-slate-500">Required units</p>
            <p className="text-xl font-semibold">{kpis.vehiclesRequired}</p>
          </div>
          <div>
            <p className="text-slate-500">Inspection ready</p>
            <p className="text-xl font-semibold">{kpis.vehiclesInspectionReady}</p>
          </div>
          <div>
            <p className="text-slate-500">Critical blockers</p>
            <p className="text-xl font-semibold">{kpis.vehicleCriticalBlockers}</p>
          </div>
        </CardContent>
      </Card>

      {canEdit ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{editing ? "Edit unit" : "Add launch vehicle"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3 max-w-lg"
              action={(fd) =>
                startTransition(async () => {
                  if (editing) fd.set("id", editing.id);
                  const res = await upsertVehicleAction(fd);
                  if (res.error) {
                    toast.error("Could not save");
                    return;
                  }
                  toast.success("Vehicle saved");
                  setEditing(null);
                  router.refresh();
                })
              }
            >
              <div className="space-y-1">
                <Label htmlFor="unit_name">Unit name</Label>
                <Input id="unit_name" name="unit_name" required defaultValue={editing?.unit_name} />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="required_for_launch"
                    defaultChecked={editing?.required_for_launch ?? true}
                  />
                  Required for launch
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="inspection_ready"
                    defaultChecked={editing?.inspection_ready}
                  />
                  Inspection ready
                </label>
              </div>
              <div className="space-y-1">
                <Label htmlFor="critical_blocker">Critical blocker</Label>
                <Input
                  id="critical_blocker"
                  name="critical_blocker"
                  placeholder="Leave empty if none"
                  defaultValue={editing?.critical_blocker ?? ""}
                />
              </div>
              <Button type="submit" disabled={pending}>
                Save
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Ready</TableHead>
                <TableHead>Blocker</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.unit_name}</TableCell>
                  <TableCell>{v.required_for_launch ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {v.inspection_ready ? (
                      <Badge className="bg-teal-700 text-white">Ready</Badge>
                    ) : (
                      <Badge variant="outline">Not ready</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-amber-800">{v.critical_blocker ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {canEdit ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditing(v)}>
                          Edit
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            startTransition(async () => {
                              await deleteVehicleAction(v.id);
                              toast.success("Deleted");
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
    </AppShell>
  );
}
