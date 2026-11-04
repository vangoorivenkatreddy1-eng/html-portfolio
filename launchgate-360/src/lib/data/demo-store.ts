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
      },
      {
        id: "tp-2",
        launch_id: DEMO_LAUNCH_ID,
        passenger_name: "Rahul Mehta",
        needs_flight: true,
        has_exception: false,
      },
    ],
    flightSegments: [
      {
        id: "fs-1",
        launch_id: DEMO_LAUNCH_ID,
        passenger_id: "tp-1",
        status: "confirmed",
      },
      {
        id: "fs-2",
        launch_id: DEMO_LAUNCH_ID,
        passenger_id: "tp-2",
        status: "pending",
      },
    ],
    hotelRooms: [
      {
        id: "hr-1",
        launch_id: DEMO_LAUNCH_ID,
        room_label: "King-101",
        nights_required: 3,
        status: "confirmed",
      },
      {
        id: "hr-2",
        launch_id: DEMO_LAUNCH_ID,
        room_label: "Twin-204",
        nights_required: 2,
        status: "pending_allocation",
      },
    ],
    transport: [
      {
        id: "tr-1",
        launch_id: DEMO_LAUNCH_ID,
        route_name: "Airport to Hotel",
        vehicle_label: "SUV-01",
        passenger_seats_required: 3,
        status: "confirmed",
      },
      {
        id: "tr-2",
        launch_id: DEMO_LAUNCH_ID,
        route_name: "Hotel to Venue",
        vehicle_label: null,
        passenger_seats_required: 4,
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
      },
    ],
    budgetLines: [
      {
        id: "bl-1",
        launch_id: DEMO_LAUNCH_ID,
        currency: "INR",
        amount_requested: 4500000,
        amount_approved: 4200000,
        amount_committed: 3100000,
        amount_actual: 900000,
        approval_status: "approved",
      },
    ],
    prs: [
      {
        id: "pr-1",
        launch_id: DEMO_LAUNCH_ID,
        pr_number: "PR-DEMO-1001",
        status: "under_approval",
        amount: 850000,
      },
      {
        id: "pr-2",
        launch_id: DEMO_LAUNCH_ID,
        pr_number: "PR-DEMO-1002",
        status: "raised",
        amount: 120000,
      },
    ],
    pos: [
      {
        id: "po-1",
        launch_id: DEMO_LAUNCH_ID,
        po_number: "PO-DEMO-2001",
        status: "preparation",
        amount: 310000,
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
  };
}

let demoStakeholders = getDemoTransactionBundle().stakeholders;
let demoInvitations = getDemoTransactionBundle().invitations;

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
}
