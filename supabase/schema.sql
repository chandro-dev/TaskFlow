create extension if not exists "pgcrypto";

create type public.user_role as enum ('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER');
create type public.project_state as enum ('PLANIFICADO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'ARCHIVADO');
create type public.task_priority as enum ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');
create type public.task_type as enum ('BUG', 'FEATURE', 'TASK', 'IMPROVEMENT');
create type public.theme_mode as enum ('light', 'dark');
create type public.notification_kind as enum ('PROJECT_CREATED', 'PROJECT_UPDATED', 'BOARD_CREATED', 'TASK_CREATED', 'MEMBER_INVITED', 'MEMBER_JOINED');

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
  password_policy text not null default 'Mínimo 10 caracteres, mayúscula, número y símbolo.',
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
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

create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_boards_project on public.boards(project_id);
create index if not exists idx_columns_board on public.board_columns(board_id);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_board on public.tasks(board_id);
create index if not exists idx_tasks_column on public.tasks(column_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_priority on public.tasks(priority);
create index if not exists idx_task_history_task on public.task_history(task_id);
create index if not exists idx_saved_filters_owner on public.saved_filters(owner_id);
create index if not exists idx_project_notifications_recipient_state on public.project_notifications(recipient_id, is_read, created_at desc);
create index if not exists idx_project_notifications_project_created on public.project_notifications(project_id, created_at desc);
