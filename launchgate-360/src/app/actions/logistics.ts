"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  demoDeleteFlightSegment,
  demoDeleteHotelRoom,
  demoDeleteTransport,
  demoDeleteTravelPassenger,
  demoUpsertFlightSegment,
  demoUpsertHotelRoom,
  demoUpsertTransport,
  demoUpsertTravelPassenger,
  getDemoFlightSegments,
  getDemoHotelRooms,
  getDemoTransport,
  getDemoTravelPassengers,
} from "@/lib/data/demo-store";
import { getActiveLaunch, getCurrentMembership, isDemoMode } from "@/lib/data/launch-service";
import { canEditDomain } from "@/lib/kpi/aggregate";
import type { DomainArea, FlightSegmentStatus } from "@/lib/types/domain";

function assertDomain(membership: Awaited<ReturnType<typeof getCurrentMembership>>, domain: DomainArea) {
  if (!membership) throw new Error("Unauthorized");
  if (membership.role === "pmo_admin") return;
  if (!canEditDomain(membership.role, membership.assigned_domains, domain)) {
    throw new Error(`Not assigned to ${domain}`);
  }
}

async function guard(domain: DomainArea) {
  if (isDemoMode()) return;
  const launch = await getActiveLaunch();
  const membership = await getCurrentMembership(launch.id);
  assertDomain(membership, domain);
}

const passengerSchema = z.object({
  id: z.string().optional(),
  passenger_name: z.string().min(2),
  needs_flight: z.coerce.boolean(),
  has_exception: z.coerce.boolean(),
  exception_notes: z.string().optional(),
});

const segmentSchema = z.object({
  id: z.string().optional(),
  passenger_id: z.string().min(1),
  origin: z.string().min(3),
  destination: z.string().min(3),
  status: z.enum(["pending", "confirmed", "cancelled"]),
  booking_reference: z.string().optional(),
});

const hotelSchema = z.object({
  id: z.string().optional(),
  room_label: z.string().min(1),
  room_block_name: z.string().optional(),
  nights_required: z.coerce.number().int().min(1),
  status: z.enum(["required", "blocked", "booked", "confirmed", "pending_allocation"]),
  vendor_confirmation_ref: z.string().optional(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  allocated_to: z.string().optional(),
});

const transportSchema = z.object({
  id: z.string().optional(),
  route_name: z.string().min(2),
  vehicle_label: z.string().optional(),
  passenger_seats_required: z.coerce.number().int().min(1),
  pickup_at: z.string().optional(),
  status: z.enum(["required", "allocated", "confirmed", "pending"]),
});

function revalidateLogistics() {
  revalidatePath("/operations/travel");
  revalidatePath("/operations/hotels");
  revalidatePath("/operations/transport");
  revalidatePath("/dashboard");
}

export async function upsertTravelPassengerAction(formData: FormData) {
  const needs = formData.get("needs_flight") === "on";
  const exception = formData.get("has_exception") === "on";
  const parsed = passengerSchema.safeParse({
    id: formData.get("id") || undefined,
    passenger_name: formData.get("passenger_name"),
    needs_flight: needs,
    has_exception: exception,
    exception_notes: formData.get("exception_notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await guard("travel");
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }

  if (isDemoMode()) {
    demoUpsertTravelPassenger({
      ...parsed.data,
      needs_flight: needs,
      has_exception: exception,
      exception_notes: parsed.data.exception_notes ?? null,
    });
    revalidateLogistics();
    return { ok: true };
  }

  const launch = await getActiveLaunch();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _form: ["Unauthorized"] } };

  const payload = {
    launch_id: launch.id,
    passenger_name: parsed.data.passenger_name,
    needs_flight: needs,
    has_exception: exception,
    exception_notes: parsed.data.exception_notes ?? null,
    updated_by: user.id,
    created_by: user.id,
  };

  const { error } = parsed.data.id
    ? await supabase.from("travel_passengers").update(payload).eq("id", parsed.data.id)
    : await supabase.from("travel_passengers").insert(payload);

  if (error) return { error: { _form: [error.message] } };
  revalidateLogistics();
  return { ok: true };
}

export async function deleteTravelPassengerAction(id: string) {
  try {
    await guard("travel");
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (isDemoMode()) {
    demoDeleteTravelPassenger(id);
    revalidateLogistics();
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("travel_passengers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateLogistics();
  return { ok: true };
}

export async function upsertFlightSegmentAction(formData: FormData) {
  const parsed = segmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await guard("travel");
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }

  if (isDemoMode()) {
    demoUpsertFlightSegment({
      ...parsed.data,
      status: parsed.data.status as FlightSegmentStatus,
      booking_reference: parsed.data.booking_reference ?? null,
    });
    revalidateLogistics();
    return { ok: true };
  }

  const launch = await getActiveLaunch();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _form: ["Unauthorized"] } };

  const payload = {
    launch_id: launch.id,
    passenger_id: parsed.data.passenger_id,
    origin: parsed.data.origin,
    destination: parsed.data.destination,
    status: parsed.data.status,
    booking_reference: parsed.data.booking_reference ?? null,
    updated_by: user.id,
    created_by: user.id,
  };

  const { error } = parsed.data.id
    ? await supabase.from("flight_segments").update(payload).eq("id", parsed.data.id)
    : await supabase.from("flight_segments").insert(payload);

  if (error) return { error: { _form: [error.message] } };
  revalidateLogistics();
  return { ok: true };
}

export async function deleteFlightSegmentAction(id: string) {
  try {
    await guard("travel");
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (isDemoMode()) {
    demoDeleteFlightSegment(id);
    revalidateLogistics();
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("flight_segments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateLogistics();
  return { ok: true };
}

export async function exportTravelCsvAction(): Promise<string> {
  const passengers = isDemoMode() ? getDemoTravelPassengers() : [];
  const segments = isDemoMode() ? getDemoFlightSegments() : [];
  const rows = [
    ["type", "name", "needs_flight", "origin", "destination", "segment_status", "booking_ref"],
    ...passengers.map((p) => ["passenger", p.passenger_name, String(p.needs_flight), "", "", "", ""]),
    ...segments.map((s) => {
      const p = passengers.find((x) => x.id === s.passenger_id);
      return [
        "segment",
        p?.passenger_name ?? s.passenger_id,
        "",
        s.origin,
        s.destination,
        s.status,
        s.booking_reference ?? "",
      ];
    }),
  ];
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function upsertHotelRoomAction(formData: FormData) {
  const parsed = hotelSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await guard("hotels");
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }

  if (isDemoMode()) {
    demoUpsertHotelRoom({
      ...parsed.data,
      room_block_name: parsed.data.room_block_name ?? null,
      vendor_confirmation_ref: parsed.data.vendor_confirmation_ref ?? null,
      check_in: parsed.data.check_in || null,
      check_out: parsed.data.check_out || null,
      allocated_to: parsed.data.allocated_to ?? null,
    });
    revalidateLogistics();
    return { ok: true };
  }

  const launch = await getActiveLaunch();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _form: ["Unauthorized"] } };

  const payload = {
    launch_id: launch.id,
    room_label: parsed.data.room_label,
    room_block_name: parsed.data.room_block_name ?? null,
    nights_required: parsed.data.nights_required,
    status: parsed.data.status,
    vendor_confirmation_ref: parsed.data.vendor_confirmation_ref ?? null,
    check_in: parsed.data.check_in || null,
    check_out: parsed.data.check_out || null,
    allocated_to: parsed.data.allocated_to ?? null,
    updated_by: user.id,
    created_by: user.id,
  };

  const { error } = parsed.data.id
    ? await supabase.from("hotel_room_nights").update(payload).eq("id", parsed.data.id)
    : await supabase.from("hotel_room_nights").insert(payload);

  if (error) return { error: { _form: [error.message] } };
  revalidateLogistics();
  return { ok: true };
}

export async function deleteHotelRoomAction(id: string) {
  try {
    await guard("hotels");
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (isDemoMode()) {
    demoDeleteHotelRoom(id);
    revalidateLogistics();
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("hotel_room_nights").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateLogistics();
  return { ok: true };
}

export async function exportHotelsCsvAction(): Promise<string> {
  const rooms = isDemoMode() ? getDemoHotelRooms() : [];
  const rows = [
    ["room", "block", "nights", "status", "vendor_ref", "check_in", "check_out", "allocated_to"],
    ...rooms.map((r) => [
      r.room_label,
      r.room_block_name ?? "",
      String(r.nights_required),
      r.status,
      r.vendor_confirmation_ref ?? "",
      r.check_in ?? "",
      r.check_out ?? "",
      r.allocated_to ?? "",
    ]),
  ];
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function upsertTransportAction(formData: FormData) {
  const parsed = transportSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await guard("transport");
  } catch (e) {
    return { error: { _form: [(e as Error).message] } };
  }

  if (isDemoMode()) {
    demoUpsertTransport({
      ...parsed.data,
      vehicle_label: parsed.data.vehicle_label || null,
      pickup_at: parsed.data.pickup_at || null,
    });
    revalidateLogistics();
    return { ok: true };
  }

  const launch = await getActiveLaunch();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _form: ["Unauthorized"] } };

  const payload = {
    launch_id: launch.id,
    route_name: parsed.data.route_name,
    vehicle_label: parsed.data.vehicle_label || null,
    passenger_seats_required: parsed.data.passenger_seats_required,
    pickup_at: parsed.data.pickup_at ? new Date(parsed.data.pickup_at).toISOString() : null,
    status: parsed.data.status,
    updated_by: user.id,
    created_by: user.id,
  };

  const { error } = parsed.data.id
    ? await supabase.from("transport_assignments").update(payload).eq("id", parsed.data.id)
    : await supabase.from("transport_assignments").insert(payload);

  if (error) return { error: { _form: [error.message] } };
  revalidateLogistics();
  return { ok: true };
}

export async function transitionTransportAction(id: string, status: string) {
  try {
    await guard("transport");
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (isDemoMode()) {
    const row = getDemoTransport().find((t) => t.id === id);
    if (!row) return { error: "Not found" };
    demoUpsertTransport({ ...row, status: status as import("@/lib/types/domain").TransportAssignmentStatus });
    revalidateLogistics();
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase
    .from("transport_assignments")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateLogistics();
  return { ok: true };
}

export async function deleteTransportAction(id: string) {
  try {
    await guard("transport");
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (isDemoMode()) {
    demoDeleteTransport(id);
    revalidateLogistics();
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("transport_assignments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateLogistics();
  return { ok: true };
}

export async function exportTransportCsvAction(): Promise<string> {
  const rows = isDemoMode()
    ? getDemoTransport().map((t) => [
        t.route_name,
        t.vehicle_label ?? "",
        String(t.passenger_seats_required),
        t.status,
        t.pickup_at ?? "",
      ])
    : [];
  return [
    ["route", "vehicle", "seats", "status", "pickup_at"],
    ...rows,
  ]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export async function transitionHotelRoomAction(id: string, status: string) {
  try {
    await guard("hotels");
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (isDemoMode()) {
    const row = getDemoHotelRooms().find((r) => r.id === id);
    if (!row) return { error: "Not found" };
    demoUpsertHotelRoom({ ...row, status: status as import("@/lib/types/domain").HotelRoomStatus });
    revalidateLogistics();
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("hotel_room_nights").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidateLogistics();
  return { ok: true };
}
