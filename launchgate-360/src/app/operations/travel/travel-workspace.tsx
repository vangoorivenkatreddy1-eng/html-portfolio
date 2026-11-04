"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteFlightSegmentAction,
  deleteTravelPassengerAction,
  exportTravelCsvAction,
  upsertFlightSegmentAction,
  upsertTravelPassengerAction,
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
import type {
  FlightSegment,
  Launch,
  TransactionBundle,
  TravelPassenger,
} from "@/lib/types/domain";

export function TravelWorkspace({
  launch,
  passengers,
  segments,
  isDemo,
  canEdit,
}: {
  launch: Launch;
  passengers: TravelPassenger[];
  segments: FlightSegment[];
  isDemo: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editPassenger, setEditPassenger] = useState<TravelPassenger | null>(null);
  const [editSegment, setEditSegment] = useState<FlightSegment | null>(null);

  const bundle: TransactionBundle = {
    launch,
    stakeholders: [],
    invitations: [],
    travelPassengers: passengers,
    flightSegments: segments,
    hotelRooms: [],
    transport: [],
    venues: [],
    budgetLines: [],
    prs: [],
    pos: [],
    vehicles: [],
  };
  const kpis = aggregateExecutiveKpis(bundle);

  function run(action: () => Promise<{ ok?: boolean; error?: unknown }>, msg: string) {
    startTransition(async () => {
      const res = await action();
      if (res.error) {
        toast.error(typeof res.error === "string" ? res.error : "Action failed");
        return;
      }
      toast.success(msg);
      router.refresh();
    });
  }

  return (
    <AppShell
      title="Travel"
      subtitle="Passengers needing flights are counted separately from flight segment bookings."
    >
      {isDemo ? <DemoBanner /> : null}
      {!canEdit ? (
        <p className="mb-4 text-sm text-slate-600">Read-only — requires travel domain assignment.</p>
      ) : null}

      <div className="mb-4">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const csv = await exportTravelCsvAction();
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "travel.csv";
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
          <CardTitle className="text-base">Travel counts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-slate-500">Passengers needing flights</p>
            <p className="text-xl font-semibold">{kpis.passengersNeedingFlights}</p>
          </div>
          <div>
            <p className="text-slate-500">Flight segments</p>
            <p className="text-xl font-semibold">{kpis.flightSegmentsNeeded}</p>
          </div>
          <div>
            <p className="text-slate-500">Confirmed / pending / cancelled</p>
            <p className="text-xl font-semibold">
              {kpis.flightBookingsConfirmed} / {kpis.flightBookingsPending} /{" "}
              {kpis.flightBookingsCancelled}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Travel exceptions</p>
            <p className="text-xl font-semibold">{kpis.travelExceptions}</p>
          </div>
        </CardContent>
      </Card>

      {canEdit ? (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {editPassenger ? "Edit passenger" : "Add passenger"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                action={(fd) =>
                  run(async () => {
                    if (editPassenger) fd.set("id", editPassenger.id);
                    return upsertTravelPassengerAction(fd);
                  }, "Passenger saved")
                }
              >
                <div className="space-y-1">
                  <Label htmlFor="passenger_name">Name</Label>
                  <Input
                    id="passenger_name"
                    name="passenger_name"
                    required
                    defaultValue={editPassenger?.passenger_name}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="needs_flight"
                      defaultChecked={editPassenger?.needs_flight ?? true}
                    />
                    Needs flight
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="has_exception"
                      defaultChecked={editPassenger?.has_exception}
                    />
                    Travel exception
                  </label>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="exception_notes">Exception notes</Label>
                  <Input
                    id="exception_notes"
                    name="exception_notes"
                    defaultValue={editPassenger?.exception_notes ?? ""}
                  />
                </div>
                <Button type="submit" disabled={pending}>
                  Save passenger
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {editSegment ? "Edit segment" : "Add flight segment"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                action={(fd) =>
                  run(async () => {
                    if (editSegment) fd.set("id", editSegment.id);
                    return upsertFlightSegmentAction(fd);
                  }, "Segment saved")
                }
              >
                <div className="space-y-1">
                  <Label htmlFor="passenger_id">Passenger</Label>
                  <select
                    id="passenger_id"
                    name="passenger_id"
                    required
                    defaultValue={editSegment?.passenger_id}
                    className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
                  >
                    <option value="">Select</option>
                    {passengers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.passenger_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="origin">Origin</Label>
                    <Input id="origin" name="origin" required defaultValue={editSegment?.origin} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      name="destination"
                      required
                      defaultValue={editSegment?.destination}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Booking status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editSegment?.status ?? "pending"}
                    className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="booking_reference">Booking reference</Label>
                  <Input
                    id="booking_reference"
                    name="booking_reference"
                    defaultValue={editSegment?.booking_reference ?? ""}
                  />
                </div>
                <Button type="submit" disabled={pending}>
                  Save segment
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Passengers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Needs flight</TableHead>
                <TableHead>Exception</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {passengers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.passenger_name}</TableCell>
                  <TableCell>{p.needs_flight ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {p.has_exception ? (
                      <Badge variant="outline">{p.exception_notes || "Exception"}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditPassenger(p)}>
                          Edit
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => run(() => deleteTravelPassengerAction(p.id), "Removed")}
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
          <CardTitle className="text-base">Flight segments</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Passenger</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((s) => {
                const p = passengers.find((x) => x.id === s.passenger_id);
                return (
                  <TableRow key={s.id}>
                    <TableCell>{p?.passenger_name ?? s.passenger_id}</TableCell>
                    <TableCell>
                      {s.origin} → {s.destination}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{s.booking_reference ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditSegment(s)}>
                            Edit
                          </Button>{" "}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => run(() => deleteFlightSegmentAction(s.id), "Removed")}
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
    </AppShell>
  );
}
