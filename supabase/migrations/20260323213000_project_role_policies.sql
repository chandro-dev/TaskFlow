create or replace function public.project_member_role(
  target_project_id uuid,
  target_user_id uuid default auth.uid()
)
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select pm.member_role
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = target_user_id
  limit 1;
$$;

revoke all on function public.project_member_role(uuid, uuid) from public;
grant execute on function public.project_member_role(uuid, uuid) to authenticated;

create or replace function public.can_coordinate_project(
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
    from public.projects p
    where p.id = target_project_id
      and (
        p.owner_id = target_user_id
        or public.is_admin_user(target_user_id)
      )
  )
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = target_user_id
      and pm.member_role = 'PROJECT_MANAGER'
  );
$$;

revoke all on function public.can_coordinate_project(uuid, uuid) from public;
grant execute on function public.can_coordinate_project(uuid, uuid) to authenticated;

drop policy if exists "profiles_select_active_for_invites" on public.profiles;
create policy "profiles_select_active_for_invites"
on public.profiles for select
to authenticated
using (is_active = true);

drop policy if exists "project_members_project_access" on public.project_members;
create policy "project_members_project_access"
on public.project_members for select
to authenticated
using (public.can_access_project(project_members.project_id, auth.uid()));

drop policy if exists "project_members_owner_or_admin_manage" on public.project_members;
create policy "project_members_owner_or_admin_manage"
on public.project_members for all
to authenticated
using (public.can_coordinate_project(project_members.project_id, auth.uid()))
with check (public.can_coordinate_project(project_members.project_id, auth.uid()));

drop policy if exists "boards_owner_or_admin_manage" on public.boards;
create policy "boards_owner_or_admin_manage"
on public.boards for all
to authenticated
using (public.can_coordinate_project(boards.project_id, auth.uid()))
with check (public.can_coordinate_project(boards.project_id, auth.uid()));

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
      and public.can_coordinate_project(b.project_id, auth.uid())
  )
);

drop policy if exists "member_invitations_project_access" on public.member_invitations;

create policy "member_invitations_select_access"
on public.member_invitations for select
to authenticated
using (
  invited_user_id = auth.uid()
  or public.can_coordinate_project(member_invitations.project_id, auth.uid())
);

create policy "member_invitations_insert_manage"
on public.member_invitations for insert
to authenticated
with check (public.can_coordinate_project(member_invitations.project_id, auth.uid()));

create policy "member_invitations_update_access"
on public.member_invitations for update
to authenticated
using (
  invited_user_id = auth.uid()
  or public.can_coordinate_project(member_invitations.project_id, auth.uid())
)
with check (
  invited_user_id = auth.uid()
  or public.can_coordinate_project(member_invitations.project_id, auth.uid())
);
