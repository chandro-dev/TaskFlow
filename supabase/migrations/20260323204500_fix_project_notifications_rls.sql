drop policy if exists "project_notifications_member_create" on public.project_notifications;

create policy "project_notifications_member_create"
on public.project_notifications for insert
to authenticated
with check (public.can_access_project(project_notifications.project_id, auth.uid()));
