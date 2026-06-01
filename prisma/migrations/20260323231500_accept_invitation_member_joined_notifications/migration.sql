create or replace function public.accept_internal_member_invitation(
  target_token text
)
returns public.member_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  accepted_invitation public.member_invitations;
  actor_name text;
  project_name text;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesion para continuar.';
  end if;

  select mi.*
  into accepted_invitation
  from public.member_invitations mi
  where mi.token = target_token
    and mi.status = 'PENDING'
  for update;

  if accepted_invitation.id is null then
    raise exception 'Invitacion no disponible para aceptar.';
  end if;

  if accepted_invitation.invited_user_id <> current_user_id then
    raise exception 'No puedes aceptar una invitacion asignada a otro usuario.';
  end if;

  if accepted_invitation.expires_at <= now() then
    raise exception 'La invitacion ya expiro.';
  end if;

  update public.member_invitations mi
  set
    status = 'ACCEPTED',
    accepted_at = now(),
    updated_at = now()
  where mi.id = accepted_invitation.id
  returning *
  into accepted_invitation;

  insert into public.project_members (
    project_id,
    user_id,
    member_role,
    invited_by
  )
  values (
    accepted_invitation.project_id,
    accepted_invitation.invited_user_id,
    accepted_invitation.role,
    accepted_invitation.invited_by
  )
  on conflict (project_id, user_id) do update
  set
    member_role = excluded.member_role,
    invited_by = excluded.invited_by;

  select p.full_name
  into actor_name
  from public.profiles p
  where p.id = current_user_id;

  select p.name
  into project_name
  from public.projects p
  where p.id = accepted_invitation.project_id;

  insert into public.project_notifications (
    project_id,
    recipient_id,
    actor_id,
    kind,
    title,
    message,
    link_href
  )
  select
    accepted_invitation.project_id,
    recipient_id,
    current_user_id,
    'MEMBER_JOINED',
    'Nuevo miembro en ' || coalesce(project_name, 'Proyecto'),
    coalesce(actor_name, 'Un miembro') || ' se incorporo al proyecto ' || coalesce(project_name, 'Proyecto') || '.',
    '/projects'
  from (
    select p.owner_id as recipient_id
    from public.projects p
    where p.id = accepted_invitation.project_id

    union

    select pm.user_id as recipient_id
    from public.project_members pm
    where pm.project_id = accepted_invitation.project_id
  ) recipients
  where recipient_id <> current_user_id;

  return accepted_invitation;
end;
$$;

revoke all on function public.accept_internal_member_invitation(text) from public;
grant execute on function public.accept_internal_member_invitation(text) to authenticated;
