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

  return accepted_invitation;
end;
$$;

revoke all on function public.accept_internal_member_invitation(text) from public;
grant execute on function public.accept_internal_member_invitation(text) to authenticated;
