create or replace function public.is_admin_user(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and role = 'ADMIN'
  );
$$;

revoke all on function public.is_admin_user(uuid) from public;
grant execute on function public.is_admin_user(uuid) to authenticated;

create or replace function public.is_project_member(
  target_project_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = target_project_id
      and user_id = target_user_id
  );
$$;

revoke all on function public.is_project_member(uuid, uuid) from public;
grant execute on function public.is_project_member(uuid, uuid) to authenticated;

create or replace function public.can_manage_project(
  target_project_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects
    where id = target_project_id
      and (
        owner_id = target_user_id
        or public.is_admin_user(target_user_id)
      )
  );
$$;

revoke all on function public.can_manage_project(uuid, uuid) from public;
grant execute on function public.can_manage_project(uuid, uuid) to authenticated;

create or replace function public.is_project_owner(
  target_project_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects
    where id = target_project_id
      and owner_id = target_user_id
  );
$$;

revoke all on function public.is_project_owner(uuid, uuid) from public;
grant execute on function public.is_project_owner(uuid, uuid) to authenticated;

create or replace function public.can_access_project(
  target_project_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects
    where id = target_project_id
      and (
        owner_id = target_user_id
        or public.is_project_member(target_project_id, target_user_id)
        or public.is_admin_user(target_user_id)
      )
  );
$$;

revoke all on function public.can_access_project(uuid, uuid) from public;
grant execute on function public.can_access_project(uuid, uuid) to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (
  auth.uid() = id
  or public.is_admin_user(auth.uid())
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (
  auth.uid() = id
  or public.is_admin_user(auth.uid())
)
with check (
  auth.uid() = id
  or public.is_admin_user(auth.uid())
);

drop policy if exists "system_settings_admin_only" on public.system_settings;
create policy "system_settings_admin_only"
on public.system_settings for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "projects_owner_or_admin_manage" on public.projects;
create policy "projects_owner_or_admin_manage"
on public.projects for all
to authenticated
using (
  owner_id = auth.uid()
  or public.is_admin_user(auth.uid())
)
with check (
  owner_id = auth.uid()
  or public.is_admin_user(auth.uid())
);

drop policy if exists "projects_member_access" on public.projects;
create policy "projects_member_access"
on public.projects for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_project_member(projects.id, auth.uid())
  or public.is_admin_user(auth.uid())
);

drop policy if exists "project_members_owner_or_admin_manage" on public.project_members;
create policy "project_members_owner_or_admin_manage"
on public.project_members for all
to authenticated
using (
  public.can_manage_project(project_members.project_id, auth.uid())
)
with check (
  public.can_manage_project(project_members.project_id, auth.uid())
);

drop policy if exists "project_members_project_access" on public.project_members;
create policy "project_members_project_access"
on public.project_members for select
to authenticated
using (
  project_members.user_id = auth.uid()
  or public.is_project_owner(project_members.project_id, auth.uid())
  or public.is_admin_user(auth.uid())
);

drop policy if exists "boards_owner_or_admin_manage" on public.boards;
create policy "boards_owner_or_admin_manage"
on public.boards for all
to authenticated
using (
  public.can_manage_project(boards.project_id, auth.uid())
)
with check (
  public.can_manage_project(boards.project_id, auth.uid())
);

drop policy if exists "boards_member_access" on public.boards;
create policy "boards_member_access"
on public.boards for select
to authenticated
using (
  public.can_access_project(boards.project_id, auth.uid())
);

drop policy if exists "board_columns_via_board_access" on public.board_columns;
create policy "board_columns_via_board_access"
on public.board_columns for all
to authenticated
using (
  exists (
    select 1
    from public.boards b
    where b.id = board_columns.board_id
      and public.can_access_project(b.project_id, auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.boards b
    where b.id = board_columns.board_id
      and public.can_access_project(b.project_id, auth.uid())
  )
);

drop policy if exists "project_scoped_tables_access" on public.labels;
create policy "project_scoped_tables_access"
on public.labels for all
to authenticated
using (
  public.can_access_project(labels.project_id, auth.uid())
)
with check (
  public.can_access_project(labels.project_id, auth.uid())
);

drop policy if exists "tasks_project_access" on public.tasks;
create policy "tasks_project_access"
on public.tasks for all
to authenticated
using (
  public.can_access_project(tasks.project_id, auth.uid())
)
with check (
  public.can_access_project(tasks.project_id, auth.uid())
);
