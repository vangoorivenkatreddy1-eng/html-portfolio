"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteVenueAction,
  exportVenueCsvAction,
  upsertVenueAction,
} from "@/app/actions/readiness";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBanner } from "@/components/demo-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { aggregateExecutiveKpis } from "@/lib/kpi/aggregate";
import type { Launch, TransactionBundle, VenueRecord } from "@/lib/types/domain";

export function VenueWorkspace({
  launch,
  venues,
  isDemo,
  canEdit,
}: {
  launch: Launch;
  venues: VenueRecord[];
  isDemo: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<VenueRecord | null>(null);

  const kpis = aggregateExecutiveKpis({
    launch,
    stakeholders: [],
    invitations: [],
    travelPassengers: [],
    flightSegments: [],
    hotelRooms: [],
    transport: [],
    venues,
    budgetLines: [],
    prs: [],
    pos: [],
    vehicles: [],
    planPhases: [],
    planDependencies: [],
  } satisfies TransactionBundle);

  return (
    <AppShell
      title="Venue"
      subtitle="Capacity, attendance, contract, permits, and stage/AV milestones."
    >
      {isDemo ? <DemoBanner /> : null}

      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() =>
            startTransition(async () => {
              const csv = await exportVenueCsvAction();
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "venue.csv";
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
          <CardTitle className="text-base">Venue snapshot (executive uses first record)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-slate-500">Capacity</p>
            <p className="text-xl font-semibold">{kpis.venueCapacity}</p>
          </div>
          <div>
            <p className="text-slate-500">Expected attendance</p>
            <p className="text-xl font-semibold">{kpis.venueExpectedAttendance}</p>
          </div>
          <div>
            <p className="text-slate-500">Contract</p>
            <p className="text-xl font-semibold capitalize">{kpis.venueContractStatus}</p>
          </div>
          <div>
            <p className="text-slate-500">Reconciliation</p>
            <p className="text-sm">
              {kpis.inconsistencies.filter((i) => i.includes("venue") || i.includes("attendance")).length
                ? "Review alerts on dashboard"
                : "No venue alerts"}
            </p>
          </div>
        </CardContent>
      </Card>

      {canEdit ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{editing ? "Edit venue" : "Add venue"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-2"
              action={(fd) =>
                startTransition(async () => {
                  if (editing) fd.set("id", editing.id);
                  const res = await upsertVenueAction(fd);
                  if (res.error) {
                    toast.error("Could not save venue");
                    return;
                  }
                  toast.success("Venue saved");
                  setEditing(null);
                  router.refresh();
                })
              }
            >
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="venue_name">Venue name</Label>
                <Input id="venue_name" name="venue_name" required defaultValue={editing?.venue_name} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" name="capacity" type="number" min={1} required defaultValue={editing?.capacity} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expected_attendance">Expected attendance</Label>
                <Input
                  id="expected_attendance"
                  name="expected_attendance"
                  type="number"
                  min={0}
                  required
                  defaultValue={editing?.expected_attendance}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contract_status">Contract status</Label>
                <Input id="contract_status" name="contract_status" defaultValue={editing?.contract_status ?? "pending"} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="permits_status">Permits status</Label>
                <Input id="permits_status" name="permits_status" defaultValue={editing?.permits_status ?? "pending"} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="event_start">Event start</Label>
                <Input id="event_start" name="event_start" type="date" defaultValue={editing?.event_start ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="event_end">Event end</Label>
                <Input id="event_end" name="event_end" type="date" defaultValue={editing?.event_end ?? ""} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="milestones_json">Stage / AV milestones (JSON array)</Label>
                <Textarea
                  id="milestones_json"
                  name="milestones_json"
                  rows={4}
                  className="font-mono text-xs"
                  defaultValue={JSON.stringify(editing?.stage_av_milestones ?? [], null, 2)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={pending}>
                  Save venue
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
                <TableHead>Venue</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Permits</TableHead>
                <TableHead>Milestones</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="font-medium">{v.venue_name}</div>
                    <div className="text-xs text-slate-500">
                      {v.expected_attendance} / {v.capacity} · {v.contract_status}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.event_start ?? "—"} → {v.event_end ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{v.permits_status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.stage_av_milestones.map((m) => m.title).join(", ") || "—"}
                  </TableCell>
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
                              await deleteVenueAction(v.id);
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
