export type AppRole = "executive" | "pmo_admin" | "department_editor";

export type DomainArea =
  | "planning_governance"
  | "people_event_ops"
  | "vehicle_commercial"
  | "stakeholders"
  | "travel"
  | "hotels"
  | "transport"
  | "venue"
  | "budget_procurement"
  | "launch_vehicles";

export type InvitationDeliveryStatus =
  | "draft"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed";

export type InvitationRsvpStatus = "pending_reply" | "confirmed" | "declined";

export type FlightSegmentStatus = "pending" | "confirmed" | "cancelled";

export type HotelRoomStatus =
  | "required"
  | "blocked"
  | "booked"
  | "confirmed"
  | "pending_allocation";

export type TransportAssignmentStatus =
  | "required"
  | "allocated"
  | "confirmed"
  | "pending";

export type PrStatus =
  | "not_raised"
  | "raised"
  | "under_approval"
  | "approved"
  | "rejected";

export type PoStatus =
  | "not_issued"
  | "preparation"
  | "under_approval"
  | "issued"
  | "rejected";

export type ReportCadence = "monthly" | "weekly" | "live_day";

export interface Launch {
  id: string;
  name: string;
  launch_date: string;
  currency: string;
  is_demo: boolean;
  demo_label: string | null;
}

export interface Stakeholder {
  id: string;
  launch_id: string;
  full_name: string;
  email: string;
  organization: string | null;
  title: string | null;
  checked_in_at: string | null;
}

export interface Invitation {
  id: string;
  launch_id: string;
  stakeholder_id: string;
  is_guest_attendee: boolean;
  delivery_status: InvitationDeliveryStatus;
  rsvp_status: InvitationRsvpStatus;
  sent_at: string | null;
  delivered_at: string | null;
}

export interface TravelPassenger {
  id: string;
  launch_id: string;
  stakeholder_id?: string | null;
  passenger_name: string;
  needs_flight: boolean;
  has_exception: boolean;
  exception_notes?: string | null;
}

export interface FlightSegment {
  id: string;
  launch_id: string;
  passenger_id: string;
  origin: string;
  destination: string;
  status: FlightSegmentStatus;
  booking_reference?: string | null;
}

export interface HotelRoomNight {
  id: string;
  launch_id: string;
  room_label: string;
  room_block_name: string | null;
  nights_required: number;
  status: HotelRoomStatus;
  vendor_confirmation_ref: string | null;
  check_in: string | null;
  check_out: string | null;
  allocated_to: string | null;
}

export interface TransportAssignment {
  id: string;
  launch_id: string;
  route_name: string;
  vehicle_label: string | null;
  passenger_seats_required: number;
  pickup_at: string | null;
  status: TransportAssignmentStatus;
}

export interface VenueRecord {
  id: string;
  launch_id: string;
  venue_name: string;
  capacity: number;
  expected_attendance: number;
  contract_status: string;
  event_start: string | null;
  event_end: string | null;
  permits_status: string;
  stage_av_milestones: StageAvMilestone[];
}

export interface StageAvMilestone {
  title: string;
  status: string;
  due_date?: string | null;
}

export type PlanPillar =
  | "planning_governance"
  | "people_event_operations"
  | "vehicle_commercial_readiness";

export interface PlanPhase {
  id: string;
  launch_id: string;
  phase_number: number;
  name: string;
  pillar: PlanPillar;
  target_date: string | null;
  status: string;
}

export interface PlanDependency {
  id: string;
  launch_id: string;
  predecessor_phase_id: string;
  successor_phase_id: string;
  description: string | null;
}

export interface BudgetLine {
  id: string;
  launch_id: string;
  category: string;
  currency: string;
  amount_requested: number;
  amount_approved: number;
  amount_committed: number;
  amount_actual: number;
  approval_status: string;
  owner_name: string | null;
}

export interface PurchaseRequisition {
  id: string;
  launch_id: string;
  pr_number: string;
  status: PrStatus;
  amount: number;
  currency: string;
  owner_name: string | null;
  vendor_name: string | null;
  raised_at: string | null;
}

export interface PurchaseOrder {
  id: string;
  launch_id: string;
  po_number: string;
  status: PoStatus;
  amount: number;
  currency: string;
  owner_name: string | null;
  vendor_name: string | null;
  pr_id: string | null;
}

export interface LaunchVehicleUnit {
  id: string;
  launch_id: string;
  unit_name: string;
  required_for_launch: boolean;
  inspection_ready: boolean;
  critical_blocker: string | null;
}

export interface LaunchMembership {
  launch_id: string;
  profile_id: string;
  role: AppRole;
  assigned_domains: DomainArea[];
  can_approve_budget: boolean;
  can_approve_reports: boolean;
}

export interface ExecutiveKpis {
  stakeholdersIdentified: number;
  invitationsSent: number;
  invitationsDelivered: number;
  invitationsBouncedOrFailed: number;
  guestConfirmations: number;
  invitationsDeclined: number;
  invitationsPendingReply: number;
  stakeholdersCheckedIn: number;
  passengersNeedingFlights: number;
  flightSegmentsNeeded: number;
  flightBookingsConfirmed: number;
  flightBookingsPending: number;
  flightBookingsCancelled: number;
  travelExceptions: number;
  roomNightsRequired: number;
  uniqueRoomsRequired: number;
  roomsBookedOrConfirmed: number;
  roomBlocks: number;
  roomPendingAllocation: number;
  transportAssignmentsRequired: number;
  transportAssignmentsConfirmed: number;
  transportSeatsRequired: number;
  transportPending: number;
  venueCapacity: number;
  venueExpectedAttendance: number;
  venueContractStatus: string;
  budgetRequested: number;
  budgetApproved: number;
  budgetCommitted: number;
  budgetActual: number;
  budgetCurrency: string;
  prCounts: Record<PrStatus, number>;
  poCounts: Record<PoStatus, number>;
  vehiclesRequired: number;
  vehiclesInspectionReady: number;
  vehicleCriticalBlockers: number;
  inconsistencies: string[];
}

export interface ExecutiveReportSnapshot {
  id: string;
  launch_id: string;
  reporting_period_start: string;
  reporting_period_end: string;
  cadence: ReportCadence;
  kpi_values: ExecutiveKpis;
  exceptions: string[];
  decisions: string[];
  next_priorities: string[];
  baseline_snapshot_id: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface TransactionBundle {
  launch: Launch;
  stakeholders: Stakeholder[];
  invitations: Invitation[];
  travelPassengers: TravelPassenger[];
  flightSegments: FlightSegment[];
  hotelRooms: HotelRoomNight[];
  transport: TransportAssignment[];
  venues: VenueRecord[];
  budgetLines: BudgetLine[];
  prs: PurchaseRequisition[];
  pos: PurchaseOrder[];
  vehicles: LaunchVehicleUnit[];
  planPhases: PlanPhase[];
  planDependencies: PlanDependency[];
}
