-- DEMO seed — explicitly labeled; not live booking confirmations
-- Apply after migrations in a Supabase project (local or hosted).

insert into public.launches (id, name, launch_date, currency, is_demo, demo_label)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'OEM Nova SUV Launch 2026',
  '2026-09-15',
  'INR',
  true,
  'DEMO'
);

insert into public.plan_phases (launch_id, phase_number, name, pillar, target_date, status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Charter & Governance', 'planning_governance', '2026-03-01', 'in_progress'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Stakeholder Mapping', 'people_event_operations', '2026-04-01', 'in_progress'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'Travel & Hospitality', 'people_event_operations', '2026-06-01', 'not_started'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'Venue & Experience', 'people_event_operations', '2026-07-01', 'not_started'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'Vehicle Readiness', 'vehicle_commercial_readiness', '2026-08-01', 'not_started'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 6, 'Launch Week Execution', 'vehicle_commercial_readiness', '2026-09-15', 'not_started');

-- Stakeholders & invitations (distinct counts)
insert into public.stakeholders (id, launch_id, full_name, email, organization, title) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Anita Desai', 'anita.desai@demo.oem', 'National Media', 'Editor'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rahul Mehta', 'rahul.mehta@demo.dealer', 'North Dealer Group', 'MD'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Guest Companion', 'guest@demo.oem', 'National Media', 'Plus-one');

insert into public.invitations (launch_id, stakeholder_id, delivery_status, rsvp_status, sent_at, delivered_at, is_guest_attendee) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'delivered', 'confirmed', now() - interval '10 days', now() - interval '9 days', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'delivered', 'pending_reply', now() - interval '8 days', now() - interval '7 days', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'sent', 'pending_reply', now() - interval '2 days', null, true);

insert into public.travel_passengers (launch_id, stakeholder_id, passenger_name, needs_flight) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Anita Desai', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Rahul Mehta', true);

insert into public.flight_segments (launch_id, passenger_id, origin, destination, status)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', id, 'DEL', 'BOM', 'confirmed'::public.flight_segment_status
from public.travel_passengers where passenger_name = 'Anita Desai';

insert into public.flight_segments (launch_id, passenger_id, origin, destination, status)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', id, 'BLR', 'BOM', 'pending'::public.flight_segment_status
from public.travel_passengers where passenger_name = 'Rahul Mehta';

insert into public.hotel_room_nights (launch_id, room_label, room_block_name, nights_required, status, vendor_confirmation_ref) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'King-101', 'Tower Block A', 3, 'confirmed', 'DEMO-VENDOR-REF-001'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Twin-204', 'Tower Block A', 2, 'pending_allocation', null);

insert into public.transport_assignments (launch_id, route_name, vehicle_label, passenger_seats_required, status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Airport to Hotel', 'SUV-01', 3, 'confirmed'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hotel to Venue', null, 4, 'required');

insert into public.venue_records (launch_id, venue_name, capacity, expected_attendance, contract_status, event_start, permits_status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Grand Convention Hall', 1200, 850, 'signed', '2026-09-14', 'in_review');

insert into public.budget_lines (launch_id, category, currency, amount_requested, amount_approved, amount_committed, amount_actual, approval_status, owner_name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Event Production', 'INR', 4500000, 4200000, 3100000, 900000, 'approved', 'PMO Lead');

insert into public.purchase_requisitions (launch_id, pr_number, status, amount, currency, owner_name, vendor_name, raised_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PR-DEMO-1001', 'under_approval', 850000, 'INR', 'Procurement', 'AV Vendor Co', '2026-02-10'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PR-DEMO-1002', 'raised', 120000, 'INR', 'Procurement', 'Catering Ltd', '2026-02-20');

insert into public.purchase_orders (launch_id, po_number, status, amount, currency, owner_name, vendor_name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PO-DEMO-2001', 'preparation', 310000, 'INR', 'Procurement', 'Stage Build Inc');

insert into public.launch_vehicle_units (launch_id, unit_name, required_for_launch, inspection_ready, critical_blocker) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nova Signature - Ice White', true, true, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nova Performance - Graphite', true, false, 'PDI pending');
