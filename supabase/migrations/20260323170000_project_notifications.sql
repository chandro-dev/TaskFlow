do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'notification_kind'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.notification_kind as enum (
      'PROJECT_CREATED',
      'PROJECT_UPDATED',
      'BOARD_CREATED',
      'TASK_CREATED',
      'MEMBER_INVITED',
      'MEMBER_JOINED'
    );
  end if;
end
$$;

create table if not exists public.project_notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  board_id uuid references public.boards(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  message text not null,
  link_href text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_notifications_recipient_state
on public.project_notifications(recipient_id, is_read, created_at desc);

create index if not exists idx_project_notifications_project_created
on public.project_notifications(project_id, created_at desc);

alter table public.project_notifications enable row level security;

drop policy if exists "project_notifications_recipient_access" on public.project_notifications;
create policy "project_notifications_recipient_access"
on public.project_notifications for select
to authenticated
using (recipient_id = auth.uid());

drop policy if exists "project_notifications_member_create" on public.project_notifications;
create policy "project_notifications_member_create"
on public.project_notifications for insert
to authenticated
with check (public.can_access_project(project_notifications.project_id, auth.uid()));

drop policy if exists "project_notifications_recipient_update" on public.project_notifications;
create policy "project_notifications_recipient_update"
on public.project_notifications for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());
