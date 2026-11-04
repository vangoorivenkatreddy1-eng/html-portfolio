"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteHotelRoomAction,
  exportHotelsCsvAction,
  transitionHotelRoomAction,
  upsertHotelRoomAction,
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
import { nextHotelStatuses } from "@/lib/operations/logistics-transitions";
import type { HotelRoomNight, HotelRoomStatus, Launch, TransactionBundle } from "@/lib/types/domain";

export function HotelsWorkspace({
  launch,
  rooms,
  isDemo,
  canEdit,
}: {
  launch: Launch;
  rooms: HotelRoomNight[];
  isDemo: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<HotelRoomNight | null>(null);

  const kpis = aggregateExecutiveKpis({
    launch,
    stakeholders: [],
    invitations: [],
    travelPassengers: [],
    flightSegments: [],
    hotelRooms: rooms,
    transport: [],
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
      title="Hotels"
      subtitle="Room nights and unique rooms — blocks, allocations, and vendor confirmation references."
    >
      {isDemo ? <DemoBanner /> : null}

      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() =>
            startTransition(async () => {
              const csv = await exportHotelsCsvAction();
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "hotels.csv";
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
          <CardTitle className="text-base">Hospitality counts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-slate-500">Room nights required</p>
            <p className="text-xl font-semibold">{kpis.roomNightsRequired}</p>
          </div>
          <div>
            <p className="text-slate-500">Unique rooms</p>
            <p className="text-xl font-semibold">{kpis.uniqueRoomsRequired}</p>
          </div>
          <div>
            <p className="text-slate-500">Booked / confirmed</p>
            <p className="text-xl font-semibold">{kpis.roomsBookedOrConfirmed}</p>
          </div>
          <div>
            <p className="text-slate-500">Blocks · pending allocation</p>
            <p className="text-xl font-semibold">
              {kpis.roomBlocks} · {kpis.roomPendingAllocation}
            </p>
          </div>
        </CardContent>
      </Card>

      {canEdit ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{editing ? "Edit room" : "Add room requirement"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-2"
              action={(fd) =>
                run(async () => {
                  if (editing) fd.set("id", editing.id);
                  return upsertHotelRoomAction(fd);
                }, "Room saved")
              }
            >
              <div className="space-y-1">
                <Label htmlFor="room_label">Room label</Label>
                <Input id="room_label" name="room_label" required defaultValue={editing?.room_label} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="room_block_name">Room block</Label>
                <Input
                  id="room_block_name"
                  name="room_block_name"
                  defaultValue={editing?.room_block_name ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nights_required">Nights required</Label>
                <Input
                  id="nights_required"
                  name="nights_required"
                  type="number"
                  min={1}
                  required
                  defaultValue={editing?.nights_required ?? 1}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hotel_status">Status</Label>
                <select
                  id="hotel_status"
                  name="status"
                  defaultValue={editing?.status ?? "required"}
                  className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
                >
                  {(
                    [
                      "required",
                      "blocked",
                      "booked",
                      "confirmed",
                      "pending_allocation",
                    ] as HotelRoomStatus[]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="vendor_confirmation_ref">Vendor confirmation ref</Label>
                <Input
                  id="vendor_confirmation_ref"
                  name="vendor_confirmation_ref"
                  defaultValue={editing?.vendor_confirmation_ref ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="allocated_to">Allocated to</Label>
                <Input id="allocated_to" name="allocated_to" defaultValue={editing?.allocated_to ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="check_in">Check-in</Label>
                <Input id="check_in" name="check_in" type="date" defaultValue={editing?.check_in ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="check_out">Check-out</Label>
                <Input id="check_out" name="check_out" type="date" defaultValue={editing?.check_out ?? ""} />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={pending}>
                  Save
                </Button>
                {editing ? (
                  <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
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
                <TableHead>Room</TableHead>
                <TableHead>Nights</TableHead>
                <TableHead>Stay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    No rooms recorded.
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.room_label}</div>
                      <div className="text-xs text-slate-500">{r.room_block_name}</div>
                    </TableCell>
                    <TableCell>{r.nights_required}</TableCell>
                    <TableCell className="text-xs">
                      {r.check_in ?? "—"} → {r.check_out ?? "—"}
                      <br />
                      {r.vendor_confirmation_ref ?? "No vendor ref"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <div className="flex flex-wrap gap-1">
                          {nextHotelStatuses(r.status).map((next) => (
                            <Button
                              key={next}
                              size="sm"
                              variant="outline"
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                run(() => transitionHotelRoomAction(r.id, next), "Status updated")
                              }
                            >
                              → {next.replace(/_/g, " ")}
                            </Button>
                          ))}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                            Edit
                          </Button>{" "}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => run(() => deleteHotelRoomAction(r.id), "Deleted")}
                          >
                            Delete
                          </Button>
                        </>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
