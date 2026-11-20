-- LaunchGate 360 — core schema (V1.2 + reporting V1.3)

create extension if not exists "pgcrypto";

-- Roles stored in profiles; enforced in RLS (never trust client UI)

create type public.app_role as enum (
  'executive',
  'pmo_admin',
  'department_editor'
);

create type public.domain_area as enum (
  'planning_governance',
  'people_event_ops',
  'vehicle_commercial',
  'stakeholders',
  'travel',
  'hotels',
  'transport',
  'venue',
  'budget_procurement',
  'launch_vehicles'
);

create type public.plan_pillar as enum (
  'planning_governance',
  'people_event_operations',
  'vehicle_commercial_readiness'
);

create type public.invitation_delivery_status as enum (
  'draft',
  'sent',
  'delivered',
  'bounced',
  'failed'
);

create type public.invitation_rsvp_status as enum (
  'pending_reply',
  'confirmed',
  'declined'
);

create type public.flight_segment_status as enum (
  'pending',
  'confirmed',
  'cancelled'
);

create type public.hotel_room_status as enum (
  'required',
  'blocked',
  'booked',
  'confirmed',
  'pending_allocation'
);

create type public.transport_assignment_status as enum (
  'required',
  'allocated',
  'confirmed',
  'pending'
);

create type public.pr_status as enum (
  'not_raised',
  'raised',
  'under_approval',
  'approved',
  'rejected'
);

create type public.po_status as enum (
  'not_issued',
  'preparation',
  'under_approval',
  'issued',
  'rejected'
);

create type public.report_cadence as enum (
  'monthly',
  'weekly',
  'live_day'
);

create type public.snapshot_status as enum (
  'draft',
  'pending_approval',
  'approved',
  'published'
);

create table public.launches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  launch_date date not null,
  currency char(3) not null default 'INR',
  is_demo boolean not null default false,
  demo_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.launch_memberships (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  assigned_domains public.domain_area[] not null default '{}',
  can_approve_budget boolean not null default false,
  can_approve_reports boolean not null default false,
  unique (launch_id, profile_id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  payload jsonb not null default '{}',
  actor_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.stakeholders (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  full_name text not null,
  email text not null,
  organization text,
  title text,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  unique (launch_id, email)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  stakeholder_id uuid not null references public.stakeholders (id) on delete cascade,
  is_guest_attendee boolean not null default false,
  channel text not null default 'email',
  delivery_status public.invitation_delivery_status not null default 'draft',
  rsvp_status public.invitation_rsvp_status not null default 'pending_reply',
  sent_at timestamptz,
  delivered_at timestamptz,
  delivery_evidence jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create table public.travel_passengers (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  stakeholder_id uuid references public.stakeholders (id) on delete set null,
  passenger_name text not null,
  needs_flight boolean not null default true,
  has_exception boolean not null default false,
  exception_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create table public.flight_segments (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  passenger_id uuid not null references public.travel_passengers (id) on delete cascade,
  origin text not null,
  destination text not null,
  status public.flight_segment_status not null default 'pending',
  booking_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create table public.hotel_room_nights (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  room_label text not null,
  room_block_name text,
  nights_required integer not null check (nights_required > 0),
  status public.hotel_room_status not null default 'required',
  vendor_confirmation_ref text,
  check_in date,
  check_out date,
  allocated_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create table public.transport_assignments (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  route_name text not null,
  vehicle_label text,
  passenger_seats_required integer not null check (passenger_seats_required > 0),
  pickup_at timestamptz,
  status public.transport_assignment_status not null default 'required',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create table public.venue_records (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  venue_name text not null,
  capacity integer not null check (capacity > 0),
  expected_attendance integer not null check (expected_attendance >= 0),
  contract_status text not null default 'pending',
  event_start date,
  event_end date,
  permits_status text not null default 'pending',
  stage_av_milestones jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create table public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  category text not null,
  currency char(3) not null,
  amount_requested numeric(14, 2) not null default 0,
  amount_approved numeric(14, 2) not null default 0,
  amount_committed numeric(14, 2) not null default 0,
  amount_actual numeric(14, 2) not null default 0,
  approval_status text not null default 'pending',
  owner_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create table public.purchase_requisitions (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  pr_number text not null,
  status public.pr_status not null default 'not_raised',
  amount numeric(14, 2) not null default 0,
  currency char(3) not null,
  owner_name text,
  vendor_name text,
  raised_at date,
  approval_evidence jsonb not null default '{}',
  approved_at timestamptz,
  approved_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  unique (launch_id, pr_number)
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  po_number text not null,
  pr_id uuid references public.purchase_requisitions (id) on delete set null,
  status public.po_status not null default 'not_issued',
  amount numeric(14, 2) not null default 0,
  currency char(3) not null,
  owner_name text,
  vendor_name text,
  issued_at date,
  approval_evidence jsonb not null default '{}',
  approved_at timestamptz,
  approved_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  unique (launch_id, po_number)
);

create table public.launch_vehicle_units (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  unit_name text not null,
  required_for_launch boolean not null default true,
  inspection_ready boolean not null default false,
  critical_blocker text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create table public.plan_phases (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  phase_number smallint not null check (phase_number between 1 and 6),
  name text not null,
  pillar public.plan_pillar not null,
  target_date date,
  status text not null default 'not_started',
  unique (launch_id, phase_number)
);

create table public.plan_dependencies (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  predecessor_phase_id uuid not null references public.plan_phases (id) on delete cascade,
  successor_phase_id uuid not null references public.plan_phases (id) on delete cascade,
  description text
);

create table public.executive_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches (id) on delete cascade,
  reporting_period_start date not null,
  reporting_period_end date not null,
  cadence public.report_cadence not null,
  author_id uuid references auth.users (id),
  status public.snapshot_status not null default 'draft',
  kpi_values jsonb not null,
  exceptions jsonb not null default '[]',
  decisions jsonb not null default '[]',
  next_priorities jsonb not null default '[]',
  baseline_snapshot_id uuid references public.executive_report_snapshots (id),
  approved_at timestamptz,
  approved_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index on public.stakeholders (launch_id);
create index on public.invitations (launch_id);
create index on public.flight_segments (launch_id);
create index on public.executive_report_snapshots (launch_id, reporting_period_end desc);
