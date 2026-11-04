import type { TransactionBundle } from "@/lib/types/domain";

export const DEMO_LAUNCH_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

/** In-memory DEMO dataset — mirrors supabase/seed.sql; not live confirmations. */
export function getDemoTransactionBundle(): TransactionBundle {
  const launch = {
    id: DEMO_LAUNCH_ID,
    name: "OEM Nova SUV Launch 2026",
    launch_date: "2026-09-15",
    currency: "INR",
    is_demo: true,
    demo_label: "DEMO",
  };

  const stakeholders = [
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      launch_id: DEMO_LAUNCH_ID,
      full_name: "Anita Desai",
      email: "anita.desai@demo.oem",
      organization: "National Media",
      title: "Editor",
      checked_in_at: null,
    },
    {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      launch_id: DEMO_LAUNCH_ID,
      full_name: "Rahul Mehta",
      email: "rahul.mehta@demo.dealer",
      organization: "North Dealer Group",
      title: "MD",
      checked_in_at: null,
    },
    {
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      launch_id: DEMO_LAUNCH_ID,
      full_name: "Guest Companion",
      email: "guest@demo.oem",
      organization: "National Media",
      title: "Plus-one",
      checked_in_at: null,
    },
  ];

  const invitations = [
    {
      id: "inv-1",
      launch_id: DEMO_LAUNCH_ID,
      stakeholder_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      is_guest_attendee: false,
      delivery_status: "delivered" as const,
      rsvp_status: "confirmed" as const,
      sent_at: "2026-02-01T10:00:00Z",
      delivered_at: "2026-02-02T10:00:00Z",
    },
    {
      id: "inv-2",
      launch_id: DEMO_LAUNCH_ID,
      stakeholder_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      is_guest_attendee: false,
      delivery_status: "delivered" as const,
      rsvp_status: "pending_reply" as const,
      sent_at: "2026-02-03T10:00:00Z",
      delivered_at: "2026-02-04T10:00:00Z",
    },
    {
      id: "inv-3",
      launch_id: DEMO_LAUNCH_ID,
      stakeholder_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      is_guest_attendee: true,
      delivery_status: "sent" as const,
      rsvp_status: "pending_reply" as const,
      sent_at: "2026-02-09T10:00:00Z",
      delivered_at: null,
    },
  ];

  return {
    launch,
    stakeholders,
    invitations,
    travelPassengers: [
      {
        id: "tp-1",
        launch_id: DEMO_LAUNCH_ID,
        passenger_name: "Anita Desai",
        needs_flight: true,
        has_exception: false,
        exception_notes: null,
      },
      {
        id: "tp-2",
        launch_id: DEMO_LAUNCH_ID,
        passenger_name: "Rahul Mehta",
        needs_flight: true,
        has_exception: false,
        exception_notes: null,
      },
    ],
    flightSegments: [
      {
        id: "fs-1",
        launch_id: DEMO_LAUNCH_ID,
        passenger_id: "tp-1",
        origin: "DEL",
        destination: "BOM",
        status: "confirmed",
        booking_reference: "DEMO-PNR-001",
      },
      {
        id: "fs-2",
        launch_id: DEMO_LAUNCH_ID,
        passenger_id: "tp-2",
        origin: "BLR",
        destination: "BOM",
        status: "pending",
        booking_reference: null,
      },
    ],
    hotelRooms: [
      {
        id: "hr-1",
        launch_id: DEMO_LAUNCH_ID,
        room_label: "King-101",
        room_block_name: "Tower Block A",
        nights_required: 3,
        status: "confirmed",
        vendor_confirmation_ref: "DEMO-VENDOR-REF-001",
        check_in: "2026-09-13",
        check_out: "2026-09-16",
        allocated_to: "Anita Desai",
      },
      {
        id: "hr-2",
        launch_id: DEMO_LAUNCH_ID,
        room_label: "Twin-204",
        room_block_name: "Tower Block A",
        nights_required: 2,
        status: "pending_allocation",
        vendor_confirmation_ref: null,
        check_in: null,
        check_out: null,
        allocated_to: null,
      },
    ],
    transport: [
      {
        id: "tr-1",
        launch_id: DEMO_LAUNCH_ID,
        route_name: "Airport to Hotel",
        vehicle_label: "SUV-01",
        passenger_seats_required: 3,
        pickup_at: "2026-09-13T14:00:00Z",
        status: "confirmed",
      },
      {
        id: "tr-2",
        launch_id: DEMO_LAUNCH_ID,
        route_name: "Hotel to Venue",
        vehicle_label: null,
        passenger_seats_required: 4,
        pickup_at: null,
        status: "required",
      },
    ],
    venues: [
      {
        id: "vn-1",
        launch_id: DEMO_LAUNCH_ID,
        venue_name: "Grand Convention Hall",
        capacity: 1200,
        expected_attendance: 850,
        contract_status: "signed",
        event_start: "2026-09-14",
        event_end: "2026-09-15",
        permits_status: "in_review",
        stage_av_milestones: [
          { title: "Stage load-in", status: "scheduled", due_date: "2026-09-10" },
          { title: "AV rehearsal", status: "pending", due_date: "2026-09-13" },
        ],
      },
    ],
    budgetLines: [
      {
        id: "bl-1",
        launch_id: DEMO_LAUNCH_ID,
        category: "Event Production",
        currency: "INR",
        amount_requested: 4500000,
        amount_approved: 4200000,
        amount_committed: 3100000,
        amount_actual: 900000,
        approval_status: "approved",
        owner_name: "PMO Lead",
      },
    ],
    prs: [
      {
        id: "pr-1",
        launch_id: DEMO_LAUNCH_ID,
        pr_number: "PR-DEMO-1001",
        status: "under_approval",
        amount: 850000,
        currency: "INR",
        owner_name: "Procurement",
        vendor_name: "AV Vendor Co",
        raised_at: "2026-02-10",
      },
      {
        id: "pr-2",
        launch_id: DEMO_LAUNCH_ID,
        pr_number: "PR-DEMO-1002",
        status: "raised",
        amount: 120000,
        currency: "INR",
        owner_name: "Procurement",
        vendor_name: "Catering Ltd",
        raised_at: "2026-02-20",
      },
    ],
    pos: [
      {
        id: "po-1",
        launch_id: DEMO_LAUNCH_ID,
        po_number: "PO-DEMO-2001",
        status: "preparation",
        amount: 310000,
        currency: "INR",
        owner_name: "Procurement",
        vendor_name: "Stage Build Inc",
        pr_id: "pr-1",
      },
    ],
    vehicles: [
      {
        id: "lv-1",
        launch_id: DEMO_LAUNCH_ID,
        unit_name: "Nova Signature - Ice White",
        required_for_launch: true,
        inspection_ready: true,
        critical_blocker: null,
      },
      {
        id: "lv-2",
        launch_id: DEMO_LAUNCH_ID,
        unit_name: "Nova Performance - Graphite",
        required_for_launch: true,
        inspection_ready: false,
        critical_blocker: "PDI pending",
      },
    ],
    planPhases: [
      {
        id: "phase-1",
        launch_id: DEMO_LAUNCH_ID,
        phase_number: 1,
        name: "Charter & Governance",
        pillar: "planning_governance",
        target_date: "2026-03-01",
        status: "in_progress",
      },
      {
        id: "phase-2",
        launch_id: DEMO_LAUNCH_ID,
        phase_number: 2,
        name: "Stakeholder Mapping",
        pillar: "people_event_operations",
        target_date: "2026-04-01",
        status: "in_progress",
      },
      {
        id: "phase-3",
        launch_id: DEMO_LAUNCH_ID,
        phase_number: 3,
        name: "Travel & Hospitality",
        pillar: "people_event_operations",
        target_date: "2026-06-01",
        status: "not_started",
      },
      {
        id: "phase-4",
        launch_id: DEMO_LAUNCH_ID,
        phase_number: 4,
        name: "Venue & Experience",
        pillar: "people_event_operations",
        target_date: "2026-07-01",
        status: "not_started",
      },
      {
        id: "phase-5",
        launch_id: DEMO_LAUNCH_ID,
        phase_number: 5,
        name: "Vehicle Readiness",
        pillar: "vehicle_commercial_readiness",
        target_date: "2026-08-01",
        status: "not_started",
      },
      {
        id: "phase-6",
        launch_id: DEMO_LAUNCH_ID,
        phase_number: 6,
        name: "Launch Week Execution",
        pillar: "vehicle_commercial_readiness",
        target_date: "2026-09-15",
        status: "not_started",
      },
    ],
    planDependencies: [
      {
        id: "dep-1",
        launch_id: DEMO_LAUNCH_ID,
        predecessor_phase_id: "phase-1",
        successor_phase_id: "phase-2",
        description: "Governance charter before stakeholder mapping",
      },
      {
        id: "dep-2",
        launch_id: DEMO_LAUNCH_ID,
        predecessor_phase_id: "phase-5",
        successor_phase_id: "phase-6",
        description: "Vehicle readiness before launch week",
      },
    ],
  };
}

let demoStakeholders = getDemoTransactionBundle().stakeholders;
let demoInvitations = getDemoTransactionBundle().invitations;
let demoBudgetLines = getDemoTransactionBundle().budgetLines;
let demoPrs = getDemoTransactionBundle().prs;
let demoPos = getDemoTransactionBundle().pos;
let demoTravelPassengers = getDemoTransactionBundle().travelPassengers;
let demoFlightSegments = getDemoTransactionBundle().flightSegments;
let demoHotelRooms = getDemoTransactionBundle().hotelRooms;
let demoTransport = getDemoTransactionBundle().transport;
let demoVenues = getDemoTransactionBundle().venues;
let demoVehicles = getDemoTransactionBundle().vehicles;
let demoPlanPhases = getDemoTransactionBundle().planPhases;
let demoPlanDependencies = getDemoTransactionBundle().planDependencies;

export function getDemoTransactionBundleForLaunch(): import("@/lib/types/domain").TransactionBundle {
  const base = getDemoTransactionBundle();
  return {
    ...base,
    stakeholders: getDemoStakeholders(),
    invitations: getDemoInvitations(),
    budgetLines: getDemoBudgetLines(),
    prs: getDemoPrs(),
    pos: getDemoPos(),
    travelPassengers: getDemoTravelPassengers(),
    flightSegments: getDemoFlightSegments(),
    hotelRooms: getDemoHotelRooms(),
    transport: getDemoTransport(),
    venues: getDemoVenues(),
    vehicles: getDemoVehicles(),
    planPhases: getDemoPlanPhases(),
    planDependencies: getDemoPlanDependencies(),
  };
}

export function getDemoVenues() {
  return [...demoVenues];
}

export function getDemoVehicles() {
  return [...demoVehicles];
}

export function getDemoPlanPhases() {
  return [...demoPlanPhases];
}

export function getDemoPlanDependencies() {
  return [...demoPlanDependencies];
}

export function getDemoTravelPassengers() {
  return [...demoTravelPassengers];
}

export function getDemoFlightSegments() {
  return [...demoFlightSegments];
}

export function getDemoHotelRooms() {
  return [...demoHotelRooms];
}

export function getDemoTransport() {
  return [...demoTransport];
}

export function getDemoBudgetLines() {
  return [...demoBudgetLines];
}

export function getDemoPrs() {
  return [...demoPrs];
}

export function getDemoPos() {
  return [...demoPos];
}

export function getDemoStakeholders() {
  return [...demoStakeholders];
}

export function getDemoInvitations() {
  return [...demoInvitations];
}

export function demoUpsertStakeholder(
  input: {
    id?: string;
    full_name: string;
    email: string;
    organization?: string | null;
    title?: string | null;
    checked_in_at?: string | null;
  },
) {
  if (input.id) {
    demoStakeholders = demoStakeholders.map((s) =>
      s.id === input.id ? { ...s, ...input, launch_id: DEMO_LAUNCH_ID } : s,
    );
    return demoStakeholders.find((s) => s.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    full_name: input.full_name,
    email: input.email,
    organization: input.organization ?? null,
    title: input.title ?? null,
    checked_in_at: input.checked_in_at ?? null,
  };
  demoStakeholders = [...demoStakeholders, created];
  return created;
}

export function demoDeleteStakeholder(id: string) {
  demoStakeholders = demoStakeholders.filter((s) => s.id !== id);
  demoInvitations = demoInvitations.filter((i) => i.stakeholder_id !== id);
}

export function demoUpsertInvitation(
  input: Omit<(typeof demoInvitations)[0], "id" | "launch_id"> & { id?: string },
) {
  if (input.id) {
    demoInvitations = demoInvitations.map((i) =>
      i.id === input.id ? { ...i, ...input, launch_id: DEMO_LAUNCH_ID } : i,
    );
    return demoInvitations.find((i) => i.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    ...input,
  };
  demoInvitations = [...demoInvitations, created];
  return created;
}

export function resetDemoStore() {
  const fresh = getDemoTransactionBundle();
  demoStakeholders = fresh.stakeholders;
  demoInvitations = fresh.invitations;
  demoBudgetLines = fresh.budgetLines;
  demoPrs = fresh.prs;
  demoPos = fresh.pos;
  demoTravelPassengers = fresh.travelPassengers;
  demoFlightSegments = fresh.flightSegments;
  demoHotelRooms = fresh.hotelRooms;
  demoTransport = fresh.transport;
  demoVenues = fresh.venues;
  demoVehicles = fresh.vehicles;
  demoPlanPhases = fresh.planPhases;
  demoPlanDependencies = fresh.planDependencies;
}

function parseAmount(value: FormDataEntryValue | null): number {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) throw new Error("Invalid amount");
  return n;
}

export function demoUpsertBudgetLine(input: {
  id?: string;
  category: string;
  currency: string;
  amount_requested: number;
  amount_approved: number;
  amount_committed: number;
  amount_actual: number;
  approval_status: string;
  owner_name?: string | null;
}) {
  if (input.id) {
    demoBudgetLines = demoBudgetLines.map((b) =>
      b.id === input.id ? { ...b, ...input, launch_id: DEMO_LAUNCH_ID } : b,
    );
    return demoBudgetLines.find((b) => b.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    owner_name: input.owner_name ?? null,
    ...input,
  };
  demoBudgetLines = [...demoBudgetLines, created];
  return created;
}

export function demoDeleteBudgetLine(id: string) {
  demoBudgetLines = demoBudgetLines.filter((b) => b.id !== id);
}

export function demoTransitionBudgetApproval(id: string, toStatus: string, approver?: boolean) {
  const line = demoBudgetLines.find((b) => b.id === id);
  if (!line) throw new Error("Budget line not found");
  const updated = { ...line, approval_status: toStatus };
  if (approver && toStatus === "approved" && updated.amount_approved === 0) {
    updated.amount_approved = updated.amount_requested;
  }
  demoBudgetLines = demoBudgetLines.map((b) => (b.id === id ? updated : b));
  return updated;
}

export function demoUpsertPr(input: {
  id?: string;
  pr_number: string;
  status: import("@/lib/types/domain").PrStatus;
  amount: number;
  currency: string;
  owner_name?: string | null;
  vendor_name?: string | null;
  raised_at?: string | null;
}) {
  if (input.id) {
    demoPrs = demoPrs.map((p) =>
      p.id === input.id ? { ...p, ...input, launch_id: DEMO_LAUNCH_ID } : p,
    );
    return demoPrs.find((p) => p.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    owner_name: input.owner_name ?? null,
    vendor_name: input.vendor_name ?? null,
    raised_at: input.raised_at ?? null,
    ...input,
  };
  demoPrs = [...demoPrs, created];
  return created;
}

export function demoTransitionPr(id: string, to: import("@/lib/types/domain").PrStatus) {
  demoPrs = demoPrs.map((p) => (p.id === id ? { ...p, status: to } : p));
  return demoPrs.find((p) => p.id === id)!;
}

export function demoDeletePr(id: string) {
  demoPrs = demoPrs.filter((p) => p.id !== id);
}

export function demoUpsertPo(input: {
  id?: string;
  po_number: string;
  status: import("@/lib/types/domain").PoStatus;
  amount: number;
  currency: string;
  owner_name?: string | null;
  vendor_name?: string | null;
  pr_id?: string | null;
}) {
  if (input.id) {
    demoPos = demoPos.map((p) =>
      p.id === input.id ? { ...p, ...input, launch_id: DEMO_LAUNCH_ID } : p,
    );
    return demoPos.find((p) => p.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    owner_name: input.owner_name ?? null,
    vendor_name: input.vendor_name ?? null,
    pr_id: input.pr_id ?? null,
    ...input,
  };
  demoPos = [...demoPos, created];
  return created;
}

export function demoTransitionPo(id: string, to: import("@/lib/types/domain").PoStatus) {
  demoPos = demoPos.map((p) => (p.id === id ? { ...p, status: to } : p));
  return demoPos.find((p) => p.id === id)!;
}

export function demoDeletePo(id: string) {
  demoPos = demoPos.filter((p) => p.id !== id);
}

export function demoUpsertTravelPassenger(input: {
  id?: string;
  passenger_name: string;
  needs_flight: boolean;
  has_exception: boolean;
  exception_notes?: string | null;
}) {
  if (input.id) {
    demoTravelPassengers = demoTravelPassengers.map((p) =>
      p.id === input.id ? { ...p, ...input, launch_id: DEMO_LAUNCH_ID } : p,
    );
    return demoTravelPassengers.find((p) => p.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    exception_notes: input.exception_notes ?? null,
    ...input,
  };
  demoTravelPassengers = [...demoTravelPassengers, created];
  return created;
}

export function demoDeleteTravelPassenger(id: string) {
  demoTravelPassengers = demoTravelPassengers.filter((p) => p.id !== id);
  demoFlightSegments = demoFlightSegments.filter((s) => s.passenger_id !== id);
}

export function demoUpsertFlightSegment(input: {
  id?: string;
  passenger_id: string;
  origin: string;
  destination: string;
  status: import("@/lib/types/domain").FlightSegmentStatus;
  booking_reference?: string | null;
}) {
  if (input.id) {
    demoFlightSegments = demoFlightSegments.map((s) =>
      s.id === input.id ? { ...s, ...input, launch_id: DEMO_LAUNCH_ID } : s,
    );
    return demoFlightSegments.find((s) => s.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    booking_reference: input.booking_reference ?? null,
    ...input,
  };
  demoFlightSegments = [...demoFlightSegments, created];
  return created;
}

export function demoDeleteFlightSegment(id: string) {
  demoFlightSegments = demoFlightSegments.filter((s) => s.id !== id);
}

export function demoUpsertHotelRoom(input: {
  id?: string;
  room_label: string;
  room_block_name?: string | null;
  nights_required: number;
  status: import("@/lib/types/domain").HotelRoomStatus;
  vendor_confirmation_ref?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  allocated_to?: string | null;
}) {
  if (input.id) {
    demoHotelRooms = demoHotelRooms.map((r) =>
      r.id === input.id ? { ...r, ...input, launch_id: DEMO_LAUNCH_ID } : r,
    );
    return demoHotelRooms.find((r) => r.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    room_block_name: input.room_block_name ?? null,
    vendor_confirmation_ref: input.vendor_confirmation_ref ?? null,
    check_in: input.check_in ?? null,
    check_out: input.check_out ?? null,
    allocated_to: input.allocated_to ?? null,
    ...input,
  };
  demoHotelRooms = [...demoHotelRooms, created];
  return created;
}

export function demoDeleteHotelRoom(id: string) {
  demoHotelRooms = demoHotelRooms.filter((r) => r.id !== id);
}

export function demoUpsertTransport(input: {
  id?: string;
  route_name: string;
  vehicle_label?: string | null;
  passenger_seats_required: number;
  pickup_at?: string | null;
  status: import("@/lib/types/domain").TransportAssignmentStatus;
}) {
  if (input.id) {
    demoTransport = demoTransport.map((t) =>
      t.id === input.id ? { ...t, ...input, launch_id: DEMO_LAUNCH_ID } : t,
    );
    return demoTransport.find((t) => t.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    vehicle_label: input.vehicle_label ?? null,
    pickup_at: input.pickup_at ?? null,
    ...input,
  };
  demoTransport = [...demoTransport, created];
  return created;
}

export function demoDeleteTransport(id: string) {
  demoTransport = demoTransport.filter((t) => t.id !== id);
}

export function demoUpsertVenue(input: {
  id?: string;
  venue_name: string;
  capacity: number;
  expected_attendance: number;
  contract_status: string;
  event_start?: string | null;
  event_end?: string | null;
  permits_status: string;
  stage_av_milestones: import("@/lib/types/domain").StageAvMilestone[];
}) {
  if (input.id) {
    demoVenues = demoVenues.map((v) =>
      v.id === input.id ? { ...v, ...input, launch_id: DEMO_LAUNCH_ID } : v,
    );
    return demoVenues.find((v) => v.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    event_start: input.event_start ?? null,
    event_end: input.event_end ?? null,
    ...input,
  };
  demoVenues = [...demoVenues, created];
  return created;
}

export function demoDeleteVenue(id: string) {
  demoVenues = demoVenues.filter((v) => v.id !== id);
}

export function demoUpsertVehicle(input: {
  id?: string;
  unit_name: string;
  required_for_launch: boolean;
  inspection_ready: boolean;
  critical_blocker?: string | null;
}) {
  if (input.id) {
    demoVehicles = demoVehicles.map((v) =>
      v.id === input.id ? { ...v, ...input, launch_id: DEMO_LAUNCH_ID } : v,
    );
    return demoVehicles.find((v) => v.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    critical_blocker: input.critical_blocker ?? null,
    ...input,
  };
  demoVehicles = [...demoVehicles, created];
  return created;
}

export function demoDeleteVehicle(id: string) {
  demoVehicles = demoVehicles.filter((v) => v.id !== id);
}

export function demoUpsertPlanPhase(input: {
  id?: string;
  phase_number: number;
  name: string;
  pillar: import("@/lib/types/domain").PlanPillar;
  target_date?: string | null;
  status: string;
}) {
  if (input.id) {
    demoPlanPhases = demoPlanPhases.map((p) =>
      p.id === input.id ? { ...p, ...input, launch_id: DEMO_LAUNCH_ID } : p,
    );
    return demoPlanPhases.find((p) => p.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    target_date: input.target_date ?? null,
    ...input,
  };
  demoPlanPhases = [...demoPlanPhases, created];
  return created;
}

export function demoDeletePlanPhase(id: string) {
  demoPlanPhases = demoPlanPhases.filter((p) => p.id !== id);
  demoPlanDependencies = demoPlanDependencies.filter(
    (d) => d.predecessor_phase_id !== id && d.successor_phase_id !== id,
  );
}

export function demoUpsertPlanDependency(input: {
  id?: string;
  predecessor_phase_id: string;
  successor_phase_id: string;
  description?: string | null;
}) {
  if (input.predecessor_phase_id === input.successor_phase_id) {
    throw new Error("A phase cannot depend on itself.");
  }
  if (input.id) {
    demoPlanDependencies = demoPlanDependencies.map((d) =>
      d.id === input.id ? { ...d, ...input, launch_id: DEMO_LAUNCH_ID } : d,
    );
    return demoPlanDependencies.find((d) => d.id === input.id)!;
  }
  const created = {
    id: crypto.randomUUID(),
    launch_id: DEMO_LAUNCH_ID,
    description: input.description ?? null,
    ...input,
  };
  demoPlanDependencies = [...demoPlanDependencies, created];
  return created;
}

export function demoDeletePlanDependency(id: string) {
  demoPlanDependencies = demoPlanDependencies.filter((d) => d.id !== id);
}

export { parseAmount };
