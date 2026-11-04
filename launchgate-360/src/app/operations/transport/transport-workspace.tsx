"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteTransportAction,
  exportTransportCsvAction,
  transitionTransportAction,
  upsertTransportAction,
} from "@/app/actions/logistics";
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
import { nextTransportStatuses } from "@/lib/operations/logistics-transitions";
import type {
  Launch,
  TransactionBundle,
  TransportAssignment,
  TransportAssignmentStatus,
} from "@/lib/types/domain";

export function TransportWorkspace({
  launch,
  assignments,
  isDemo,
  canEdit,
}: {
  launch: Launch;
  assignments: TransportAssignment[];
  isDemo: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<TransportAssignment | null>(null);

  const kpis = aggregateExecutiveKpis({
    launch,
    stakeholders: [],
    invitations: [],
    travelPassengers: [],
    flightSegments: [],
    hotelRooms: [],
    transport: assignments,
    venues: [],
    budgetLines: [],
    prs: [],
    pos: [],
    vehicles: [],
    planPhases: [],
    planDependencies: [],
  } satisfies TransactionBundle);

  function run(action: () => Promise<{ ok?: boolean; error?: unknown }>, msg: string) {
    startTransition(async () => {
      const res = await action();
      if (res.error) {
        toast.error(typeof res.error === "string" ? res.error : "Failed");
        return;
      }
      toast.success(msg);
      router.refresh();
    });
  }

  return (
    <AppShell
      title="Transport"
      subtitle="Each row is a route assignment (seats + pickup) — vehicle label when booked, not mixed with trip counts."
    >
      {isDemo ? <DemoBanner /> : null}

      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() =>
            startTransition(async () => {
              const csv = await exportTransportCsvAction();
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "transport.csv";
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
          <CardTitle className="text-base">Transport counts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-slate-500">Assignments (open pipeline)</p>
            <p className="text-xl font-semibold">{kpis.transportAssignmentsRequired}</p>
          </div>
          <div>
            <p className="text-slate-500">Confirmed assignments</p>
            <p className="text-xl font-semibold">{kpis.transportAssignmentsConfirmed}</p>
          </div>
          <div>
            <p className="text-slate-500">Passenger seats required</p>
            <p className="text-xl font-semibold">{kpis.transportSeatsRequired}</p>
          </div>
          <div>
            <p className="text-slate-500">Pending / required</p>
            <p className="text-xl font-semibold">{kpis.transportPending}</p>
          </div>
        </CardContent>
      </Card>

      {canEdit ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              {editing ? "Edit assignment" : "New route assignment"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-2"
              action={(fd) =>
                run(async () => {
                  if (editing) fd.set("id", editing.id);
                  return upsertTransportAction(fd);
                }, "Assignment saved")
              }
            >
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="route_name">Route</Label>
                <Input id="route_name" name="route_name" required defaultValue={editing?.route_name} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vehicle_label">Vehicle (when booked)</Label>
                <Input
                  id="vehicle_label"
                  name="vehicle_label"
                  placeholder="Optional until confirmed"
                  defaultValue={editing?.vehicle_label ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="passenger_seats_required">Passenger seats</Label>
                <Input
                  id="passenger_seats_required"
                  name="passenger_seats_required"
                  type="number"
                  min={1}
                  required
                  defaultValue={editing?.passenger_seats_required ?? 1}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pickup_at">Pickup (local)</Label>
                <Input
                  id="pickup_at"
                  name="pickup_at"
                  type="datetime-local"
                  defaultValue={
                    editing?.pickup_at ? editing.pickup_at.slice(0, 16) : undefined
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="transport_status">Status</Label>
                <select
                  id="transport_status"
                  name="status"
                  defaultValue={editing?.status ?? "required"}
                  className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
                >
                  {(
                    ["required", "pending", "allocated", "confirmed"] as TransportAssignmentStatus[]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={pending}>
                  Save assignment
                </Button>
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
                <TableHead>Route</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.route_name}</TableCell>
                  <TableCell>{t.vehicle_label ?? "—"}</TableCell>
                  <TableCell>{t.passenger_seats_required}</TableCell>
                  <TableCell className="text-xs">{t.pickup_at ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <div className="flex flex-wrap gap-1">
                        {nextTransportStatuses(t.status).map((next) => (
                          <Button
                            key={next}
                            size="sm"
                            variant="outline"
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              run(() => transitionTransportAction(t.id, next), "Updated")
                            }
                          >
                            → {next}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditing(t)}>
                          Edit
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => run(() => deleteTransportAction(t.id), "Deleted")}
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
