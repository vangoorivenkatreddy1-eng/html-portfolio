import type {
  AppRole,
  DomainArea,
  ExecutiveKpis,
  FlightSegment,
  HotelRoomNight,
  Invitation,
  Launch,
  PurchaseOrder,
  PurchaseRequisition,
  Stakeholder,
  TransportAssignment,
  TravelPassenger,
  TransactionBundle,
} from "@/lib/types/domain";

const emptyPrCounts = (): ExecutiveKpis["prCounts"] => ({
  not_raised: 0,
  raised: 0,
  under_approval: 0,
  approved: 0,
  rejected: 0,
});

const emptyPoCounts = (): ExecutiveKpis["poCounts"] => ({
  not_issued: 0,
  preparation: 0,
  under_approval: 0,
  issued: 0,
  rejected: 0,
});

export function aggregateExecutiveKpis(data: TransactionBundle): ExecutiveKpis {
  const inconsistencies: string[] = [];

  const stakeholdersIdentified = data.stakeholders.length;
  const invitationsSent = data.invitations.filter((i) =>
    ["sent", "delivered", "bounced", "failed"].includes(i.delivery_status),
  ).length;
  const invitationsDelivered = data.invitations.filter(
    (i) => i.delivery_status === "delivered",
  ).length;
  const invitationsBouncedOrFailed = data.invitations.filter((i) =>
    ["bounced", "failed"].includes(i.delivery_status),
  ).length;
  const guestConfirmations = data.invitations.filter(
    (i) => i.rsvp_status === "confirmed" && !i.is_guest_attendee,
  ).length;
  const invitationsDeclined = data.invitations.filter(
    (i) => i.rsvp_status === "declined",
  ).length;
  const invitationsPendingReply = data.invitations.filter(
    (i) => i.rsvp_status === "pending_reply",
  ).length;
  const stakeholdersCheckedIn = data.stakeholders.filter(
    (s) => s.checked_in_at,
  ).length;

  const passengersNeedingFlights = data.travelPassengers.filter(
    (p) => p.needs_flight,
  ).length;
  const flightSegmentsNeeded = data.flightSegments.length;
  const flightBookingsConfirmed = data.flightSegments.filter(
    (s) => s.status === "confirmed",
  ).length;
  const flightBookingsPending = data.flightSegments.filter(
    (s) => s.status === "pending",
  ).length;
  const flightBookingsCancelled = data.flightSegments.filter(
    (s) => s.status === "cancelled",
  ).length;
  const travelExceptions = data.travelPassengers.filter(
    (p) => p.has_exception,
  ).length;

  if (
    passengersNeedingFlights > 0 &&
    flightSegmentsNeeded < passengersNeedingFlights
  ) {
    inconsistencies.push(
      "Fewer flight segments recorded than passengers flagged as needing flights.",
    );
  }

  const roomNightsRequired = data.hotelRooms.reduce(
    (sum, r) => sum + r.nights_required,
    0,
  );
  const uniqueRoomsRequired = new Set(
    data.hotelRooms.map((r) => r.room_label),
  ).size;
  const roomsBookedOrConfirmed = data.hotelRooms.filter((r) =>
    ["booked", "confirmed"].includes(r.status),
  ).length;
  const roomBlocks = new Set(
    data.hotelRooms
      .map((r) => r.room_label.split("-")[0])
      .filter(Boolean),
  ).size;
  const roomPendingAllocation = data.hotelRooms.filter(
    (r) => r.status === "pending_allocation",
  ).length;

  const transportAssignmentsRequired = data.transport.filter((t) =>
    ["required", "pending", "allocated"].includes(t.status),
  ).length;
  const transportAssignmentsConfirmed = data.transport.filter(
    (t) => t.status === "confirmed",
  ).length;
  const transportSeatsRequired = data.transport.reduce(
    (sum, t) => sum + t.passenger_seats_required,
    0,
  );
  const transportPending = data.transport.filter(
    (t) => t.status === "pending" || t.status === "required",
  ).length;

  const venue = data.venues[0];
  const venueCapacity = venue?.capacity ?? 0;
  const venueExpectedAttendance = venue?.expected_attendance ?? 0;
  const venueContractStatus = venue?.contract_status ?? "unknown";

  if (venue && venueExpectedAttendance > venueCapacity) {
    inconsistencies.push(
      "Expected attendance exceeds venue capacity on record.",
    );
  }

  const budgetRequested = data.budgetLines.reduce(
    (s, b) => s + Number(b.amount_requested),
    0,
  );
  const budgetApproved = data.budgetLines.reduce(
    (s, b) => s + Number(b.amount_approved),
    0,
  );
  const budgetCommitted = data.budgetLines.reduce(
    (s, b) => s + Number(b.amount_committed),
    0,
  );
  const budgetActual = data.budgetLines.reduce(
    (s, b) => s + Number(b.amount_actual),
    0,
  );
  const budgetCurrency = data.launch.currency;

  if (budgetCommitted > budgetApproved && budgetApproved > 0) {
    inconsistencies.push("Budget committed exceeds approved totals on one or more lines.");
  }

  const prCounts = emptyPrCounts();
  for (const pr of data.prs) {
    prCounts[pr.status] += 1;
  }
  const poCounts = emptyPoCounts();
  for (const po of data.pos) {
    poCounts[po.status] += 1;
  }

  const vehiclesRequired = data.vehicles.filter(
    (v) => v.required_for_launch,
  ).length;
  const vehiclesInspectionReady = data.vehicles.filter(
    (v) => v.required_for_launch && v.inspection_ready,
  ).length;
  const vehicleCriticalBlockers = data.vehicles.filter(
    (v) => v.critical_blocker,
  ).length;

  const stakeholderIdsWithInvite = new Set(
    data.invitations.map((i) => i.stakeholder_id),
  );
  const orphanInvites = data.invitations.filter(
    (i) => !data.stakeholders.some((s) => s.id === i.stakeholder_id),
  );
  if (orphanInvites.length) {
    inconsistencies.push("Invitation records reference missing stakeholders.");
  }
  const stakeholdersWithoutPrimaryInvite = data.stakeholders.filter(
    (s) =>
      !data.invitations.some(
        (i) => i.stakeholder_id === s.id && !i.is_guest_attendee,
      ),
  );
  if (stakeholdersWithoutPrimaryInvite.length) {
    inconsistencies.push(
      `${stakeholdersWithoutPrimaryInvite.length} stakeholder(s) have no primary invitation record.`,
    );
  }
  if (stakeholderIdsWithInvite.size > stakeholdersIdentified) {
    inconsistencies.push("Invitation stakeholder references exceed unique people.");
  }

  return {
    stakeholdersIdentified,
    invitationsSent,
    invitationsDelivered,
    invitationsBouncedOrFailed,
    guestConfirmations,
    invitationsDeclined,
    invitationsPendingReply,
    stakeholdersCheckedIn,
    passengersNeedingFlights,
    flightSegmentsNeeded,
    flightBookingsConfirmed,
    flightBookingsPending,
    flightBookingsCancelled,
    travelExceptions,
    roomNightsRequired,
    uniqueRoomsRequired,
    roomsBookedOrConfirmed,
    roomBlocks,
    roomPendingAllocation,
    transportAssignmentsRequired,
    transportAssignmentsConfirmed,
    transportSeatsRequired,
    transportPending,
    venueCapacity,
    venueExpectedAttendance,
    venueContractStatus,
    budgetRequested,
    budgetApproved,
    budgetCommitted,
    budgetActual,
    budgetCurrency,
    prCounts,
    poCounts,
    vehiclesRequired,
    vehiclesInspectionReady,
    vehicleCriticalBlockers,
    inconsistencies,
  };
}

export function resolveReportingCadence(
  launch: Launch,
  asOf: Date,
): "monthly" | "weekly" | "live_day" {
  const launchDate = new Date(launch.launch_date);
  const msPerDay = 86400000;
  const daysToLaunch = Math.ceil(
    (launchDate.getTime() - asOf.getTime()) / msPerDay,
  );
  if (daysToLaunch <= 0) return "live_day";
  if (daysToLaunch <= 60) return "weekly";
  return "monthly";
}

export function compareKpiMovement(
  current: ExecutiveKpis,
  previous: ExecutiveKpis | null,
): Record<string, number | "N/A"> {
  const keys: (keyof ExecutiveKpis)[] = [
    "stakeholdersIdentified",
    "invitationsDelivered",
    "guestConfirmations",
    "flightBookingsConfirmed",
    "roomsBookedOrConfirmed",
    "transportAssignmentsConfirmed",
    "vehiclesInspectionReady",
    "budgetCommitted",
  ];
  const movement: Record<string, number | "N/A"> = {};
  for (const key of keys) {
    if (!previous) {
      movement[key] = "N/A";
      continue;
    }
    const cur = current[key];
    const prev = previous[key];
    if (typeof cur === "number" && typeof prev === "number") {
      movement[key] = cur - prev;
    } else {
      movement[key] = "N/A";
    }
  }
  return movement;
}

export function canEditDomain(
  role: AppRole,
  assignedDomains: DomainArea[],
  domain: DomainArea,
): boolean {
  if (role === "pmo_admin") return true;
  if (role === "executive") return false;
  return assignedDomains.includes(domain);
}

export function canApproveBudget(membership: {
  role: AppRole;
  can_approve_budget: boolean;
}): boolean {
  return (
    membership.role === "pmo_admin" ||
    (membership.role === "executive" && membership.can_approve_budget)
  );
}

export function canDownloadExecutiveReport(membership: {
  role: AppRole;
  can_approve_reports: boolean;
}): boolean {
  return (
    membership.role === "pmo_admin" ||
    membership.role === "executive" ||
    membership.can_approve_reports
  );
}

export type { Stakeholder, Invitation, TravelPassenger, FlightSegment, HotelRoomNight, TransportAssignment };
