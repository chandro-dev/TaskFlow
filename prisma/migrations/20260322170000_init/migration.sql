create extension if not exists "pgcrypto";

create type public.user_role as enum ('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER');
create type public.project_state as enum ('PLANIFICADO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'ARCHIVADO');
create type public.task_priority as enum ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');
create type public.task_type as enum ('BUG', 'FEATURE', 'TASK', 'IMPROVEMENT');
create type public.theme_mode as enum ('light', 'dark');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role public.user_role not null default 'DEVELOPER',
  avatar_initials text,
  bio text default '',
  theme_preference public.theme_mode not null default 'light',
  last_access_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  platform_name text not null default 'Taskflow',
  max_attachment_mb integer not null default 10,
  password_policy text not null default 'Minimo 10 caracteres, mayuscula, numero y simbolo.',
  default_theme public.theme_mode not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  description text not null,
  start_date date not null,
  end_date date not null,
  state public.project_state not null default 'PLANIFICADO',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role public.user_role not null default 'DEVELOPER',
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.board_columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null,
  position integer not null,
  color text not null default '#b8c2d4',
  wip_limit integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(board_id, position)
);

create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  column_id uuid not null references public.board_columns(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority public.task_priority not null default 'MEDIA',
  type public.task_type not null default 'TASK',
  due_date date not null,
  estimate_hours integer not null default 0,
  spent_hours integer not null default 0,
  created_by uuid references public.profiles(id),
  assignee_ids uuid[] not null default '{}',
  cloned_from_task_id uuid references public.tasks(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_labels (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  unique(task_id, label_id)
);

create table if not exists public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  size_mb numeric(5,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  action text not null,
  from_column_id uuid references public.board_columns(id),
  to_column_id uuid references public.board_columns(id),
  occurred_at timestamptz not null default now()
);

create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  query text,
  assignee_id uuid references public.profiles(id),
  label_id uuid references public.labels(id),
  priority public.task_priority,
  task_type public.task_type,
  from_date date,
  to_date date,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_initials,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 2)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'DEVELOPER')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_system_settings_updated_at on public.system_settings;
create trigger trg_system_settings_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_boards_updated_at on public.boards;
create trigger trg_boards_updated_at
before update on public.boards
for each row execute function public.set_updated_at();

drop trigger if exists trg_board_columns_updated_at on public.board_columns;
create trigger trg_board_columns_updated_at
before update on public.board_columns
for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.system_settings (platform_name)
select 'Taskflow'
where not exists (select 1 from public.system_settings);

alter table public.profiles enable row level security;
alter table public.system_settings enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.boards enable row level security;
alter table public.board_columns enable row level security;
alter table public.labels enable row level security;
alter table public.tasks enable row level security;
alter table public.task_labels enable row level security;
alter table public.task_subtasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.task_history enable row level security;
alter table public.saved_filters enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles as p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles as p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1 from public.profiles as p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

drop policy if exists "system_settings_admin_only" on public.system_settings;
create policy "system_settings_admin_only"
on public.system_settings for all
to authenticated
using (
  exists (
    select 1 from public.profiles as p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
)
with check (
  exists (
    select 1 from public.profiles as p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

drop policy if exists "projects_member_access" on public.projects;
create policy "projects_member_access"
on public.projects for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = projects.id and pm.user_id = auth.uid()
  )
);

drop policy if exists "projects_owner_or_admin_manage" on public.projects;
create policy "projects_owner_or_admin_manage"
on public.projects for all
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
)
with check (
  owner_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

drop policy if exists "project_members_project_access" on public.project_members;
create policy "project_members_project_access"
on public.project_members for select
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_members.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "project_members_owner_or_admin_manage" on public.project_members;
create policy "project_members_owner_or_admin_manage"
on public.project_members for all
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_members.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_members.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
);

drop policy if exists "boards_member_access" on public.boards;
create policy "boards_member_access"
on public.boards for select
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = boards.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "boards_owner_or_admin_manage" on public.boards;
create policy "boards_owner_or_admin_manage"
on public.boards for all
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = boards.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = boards.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
);

drop policy if exists "board_columns_via_board_access" on public.board_columns;
create policy "board_columns_via_board_access"
on public.board_columns for all
to authenticated
using (
  exists (
    select 1
    from public.boards b
    join public.projects p on p.id = b.project_id
    where b.id = board_columns.board_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.boards b
    join public.projects p on p.id = b.project_id
    where b.id = board_columns.board_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
);

drop policy if exists "project_scoped_tables_access" on public.labels;
create policy "project_scoped_tables_access"
on public.labels for all
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = labels.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = labels.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
);

drop policy if exists "tasks_project_access" on public.tasks;
create policy "tasks_project_access"
on public.tasks for all
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
);

drop policy if exists "task_labels_via_task_access" on public.task_labels;
create policy "task_labels_via_task_access"
on public.task_labels for all
to authenticated
using (
  exists (select 1 from public.tasks t where t.id = task_labels.task_id)
)
with check (
  exists (select 1 from public.tasks t where t.id = task_labels.task_id)
);

drop policy if exists "task_subtasks_via_task_access" on public.task_subtasks;
create policy "task_subtasks_via_task_access"
on public.task_subtasks for all
to authenticated
using (
  exists (select 1 from public.tasks t where t.id = task_subtasks.task_id)
)
with check (
  exists (select 1 from public.tasks t where t.id = task_subtasks.task_id)
);

drop policy if exists "task_comments_via_task_access" on public.task_comments;
create policy "task_comments_via_task_access"
on public.task_comments for all
to authenticated
using (
  exists (select 1 from public.tasks t where t.id = task_comments.task_id)
)
with check (
  exists (select 1 from public.tasks t where t.id = task_comments.task_id)
);

drop policy if exists "task_attachments_via_task_access" on public.task_attachments;
create policy "task_attachments_via_task_access"
on public.task_attachments for all
to authenticated
using (
  exists (select 1 from public.tasks t where t.id = task_attachments.task_id)
)
with check (
  exists (select 1 from public.tasks t where t.id = task_attachments.task_id)
);

drop policy if exists "task_history_via_task_access" on public.task_history;
create policy "task_history_via_task_access"
on public.task_history for all
to authenticated
using (
  exists (select 1 from public.tasks t where t.id = task_history.task_id)
)
with check (
  exists (select 1 from public.tasks t where t.id = task_history.task_id)
);

drop policy if exists "saved_filters_owner_access" on public.saved_filters;
create policy "saved_filters_owner_access"
on public.saved_filters for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_project_members_project on public.project_members(project_id);
create index if not exists idx_boards_project on public.boards(project_id);
create index if not exists idx_columns_board on public.board_columns(board_id);
create index if not exists idx_labels_project on public.labels(project_id);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_board on public.tasks(board_id);
create index if not exists idx_tasks_column on public.tasks(column_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_priority on public.tasks(priority);
create index if not exists idx_task_history_task on public.task_history(task_id);
create index if not exists idx_saved_filters_owner on public.saved_filters(owner_id);
