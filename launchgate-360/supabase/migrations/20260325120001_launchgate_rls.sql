-- Row Level Security — authorization from launch_memberships only

alter table public.launches enable row level security;
alter table public.profiles enable row level security;
alter table public.launch_memberships enable row level security;
alter table public.audit_events enable row level security;
alter table public.stakeholders enable row level security;
alter table public.invitations enable row level security;
alter table public.travel_passengers enable row level security;
alter table public.flight_segments enable row level security;
alter table public.hotel_room_nights enable row level security;
alter table public.transport_assignments enable row level security;
alter table public.venue_records enable row level security;
alter table public.budget_lines enable row level security;
alter table public.purchase_requisitions enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.launch_vehicle_units enable row level security;
alter table public.plan_phases enable row level security;
alter table public.plan_dependencies enable row level security;
alter table public.executive_report_snapshots enable row level security;

create or replace function public.current_membership(p_launch_id uuid)
returns public.launch_memberships
language sql
stable
security definer
set search_path = public
as $$
  select m.*
  from public.launch_memberships m
  where m.launch_id = p_launch_id
    and m.profile_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_read_launch(p_launch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.launch_memberships m
    where m.launch_id = p_launch_id and m.profile_id = auth.uid()
  );
$$;

create or replace function public.can_edit_domain(p_launch_id uuid, p_domain public.domain_area)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.launch_memberships m
    where m.launch_id = p_launch_id
      and m.profile_id = auth.uid()
      and (
        m.role = 'pmo_admin'
        or (m.role = 'department_editor' and p_domain = any (m.assigned_domains))
      )
  );
$$;

create or replace function public.can_approve_reports(p_launch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.launch_memberships m
    where m.launch_id = p_launch_id
      and m.profile_id = auth.uid()
      and (m.role = 'pmo_admin' or (m.role = 'executive' and m.can_approve_reports))
  );
$$;

-- Launches: members read; PMO admin write
create policy launches_select on public.launches
  for select using (public.can_read_launch(id));

create policy launches_update on public.launches
  for update using (
    exists (
      select 1 from public.launch_memberships m
      where m.launch_id = id and m.profile_id = auth.uid() and m.role = 'pmo_admin'
    )
  );

create policy profiles_select on public.profiles
  for select using (id = auth.uid() or exists (
    select 1 from public.launch_memberships m1
    join public.launch_memberships m2 on m1.launch_id = m2.launch_id
    where m1.profile_id = auth.uid() and m2.profile_id = profiles.id
  ));

create policy memberships_select on public.launch_memberships
  for select using (public.can_read_launch(launch_id));

create policy memberships_manage on public.launch_memberships
  for all using (
    exists (
      select 1 from public.launch_memberships m
      where m.launch_id = launch_memberships.launch_id
        and m.profile_id = auth.uid()
        and m.role = 'pmo_admin'
    )
  );

-- Generic read for launch members
create policy stakeholders_read on public.stakeholders
  for select using (public.can_read_launch(launch_id));

create policy stakeholders_write on public.stakeholders
  for all using (public.can_edit_domain(launch_id, 'stakeholders'));

create policy invitations_read on public.invitations
  for select using (public.can_read_launch(launch_id));

create policy invitations_write on public.invitations
  for all using (public.can_edit_domain(launch_id, 'stakeholders'));

create policy travel_read on public.travel_passengers
  for select using (public.can_read_launch(launch_id));
create policy travel_write on public.travel_passengers
  for all using (public.can_edit_domain(launch_id, 'travel'));
create policy segments_read on public.flight_segments
  for select using (public.can_read_launch(launch_id));
create policy segments_write on public.flight_segments
  for all using (public.can_edit_domain(launch_id, 'travel'));

create policy hotels_read on public.hotel_room_nights
  for select using (public.can_read_launch(launch_id));
create policy hotels_write on public.hotel_room_nights
  for all using (public.can_edit_domain(launch_id, 'hotels'));

create policy transport_read on public.transport_assignments
  for select using (public.can_read_launch(launch_id));
create policy transport_write on public.transport_assignments
  for all using (public.can_edit_domain(launch_id, 'transport'));

create policy venue_read on public.venue_records
  for select using (public.can_read_launch(launch_id));
create policy venue_write on public.venue_records
  for all using (public.can_edit_domain(launch_id, 'venue'));

create policy budget_read on public.budget_lines
  for select using (public.can_read_launch(launch_id));
create policy budget_write on public.budget_lines
  for all using (public.can_edit_domain(launch_id, 'budget_procurement'));

create policy pr_read on public.purchase_requisitions
  for select using (public.can_read_launch(launch_id));
create policy pr_write on public.purchase_requisitions
  for all using (public.can_edit_domain(launch_id, 'budget_procurement'));

create policy po_read on public.purchase_orders
  for select using (public.can_read_launch(launch_id));
create policy po_write on public.purchase_orders
  for all using (public.can_edit_domain(launch_id, 'budget_procurement'));

create policy vehicles_read on public.launch_vehicle_units
  for select using (public.can_read_launch(launch_id));
create policy vehicles_write on public.launch_vehicle_units
  for all using (public.can_edit_domain(launch_id, 'launch_vehicles'));

create policy plan_read on public.plan_phases
  for select using (public.can_read_launch(launch_id));
create policy plan_write on public.plan_phases
  for all using (public.can_edit_domain(launch_id, 'planning_governance'));

create policy snapshots_read on public.executive_report_snapshots
  for select using (public.can_read_launch(launch_id));
create policy snapshots_insert on public.executive_report_snapshots
  for insert with check (public.can_approve_reports(launch_id) or public.can_edit_domain(launch_id, 'planning_governance'));

create policy audit_read on public.audit_events
  for select using (public.can_read_launch(launch_id));
