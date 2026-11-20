create policy plan_dependencies_read on public.plan_dependencies
  for select using (public.can_read_launch(launch_id));

create policy plan_dependencies_write on public.plan_dependencies
  for all using (public.can_edit_domain(launch_id, 'planning_governance'));
