create or replace function public.create_internal_member_invitation(
  target_project_id uuid,
  target_invited_user_id uuid,
  target_role public.user_role,
  target_message text default null
)
returns public.member_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  inviter_name text;
  project_name text;
  invited_user_email text;
  created_invitation public.member_invitations;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesion para continuar.';
  end if;

  if not public.can_coordinate_project(target_project_id, current_user_id) then
    raise exception 'No tienes permisos para invitar miembros a este proyecto.';
  end if;

  select p.name
  into project_name
  from public.projects p
  where p.id = target_project_id
    and p.archived = false;

  if project_name is null then
    raise exception 'Proyecto no disponible para invitaciones.';
  end if;

  select p.email, p.full_name
  into invited_user_email, inviter_name
  from public.profiles p
  where p.id = target_invited_user_id
    and p.is_active = true;

  if invited_user_email is null then
    raise exception 'La persona seleccionada no esta activa dentro de la aplicacion.';
  end if;

  select p.full_name
  into inviter_name
  from public.profiles p
  where p.id = current_user_id;

  if exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = target_invited_user_id
  ) then
    raise exception 'La persona seleccionada ya pertenece al proyecto.';
  end if;

  if exists (
    select 1
    from public.member_invitations mi
    where mi.project_id = target_project_id
      and mi.invited_user_id = target_invited_user_id
      and mi.status = 'PENDING'
  ) then
    raise exception 'Ya existe una invitacion pendiente para esta persona en este proyecto.';
  end if;

  insert into public.member_invitations (
    project_id,
    invited_user_id,
    email,
    role,
    status,
    channel,
    invited_by,
    token,
    message,
    expires_at
  )
  values (
    target_project_id,
    target_invited_user_id,
    invited_user_email,
    target_role,
    'PENDING',
    'IN_APP',
    current_user_id,
    replace(gen_random_uuid()::text, '-', ''),
    nullif(trim(coalesce(target_message, '')), ''),
    now() + interval '7 days'
  )
  returning *
  into created_invitation;

  insert into public.project_notifications (
    project_id,
    recipient_id,
    actor_id,
    kind,
    title,
    message,
    link_href
  )
  values (
    target_project_id,
    target_invited_user_id,
    current_user_id,
    'MEMBER_INVITED',
    'Te invitaron a ' || project_name,
    coalesce(inviter_name, 'Un miembro del proyecto') || ' te ha enviado una invitacion para unirte.',
    '/invitations/' || created_invitation.token
  );

  return created_invitation;
end;
$$;

revoke all on function public.create_internal_member_invitation(uuid, uuid, public.user_role, text) from public;
grant execute on function public.create_internal_member_invitation(uuid, uuid, public.user_role, text) to authenticated;

create or replace function public.resend_internal_member_invitation(
  target_invitation_id uuid
)
returns public.member_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  project_name text;
  inviter_name text;
  refreshed_invitation public.member_invitations;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesion para continuar.';
  end if;

  select mi.*
  into refreshed_invitation
  from public.member_invitations mi
  where mi.id = target_invitation_id;

  if refreshed_invitation.id is null then
    raise exception 'Invitacion no encontrada.';
  end if;

  select p.name
  into project_name
  from public.projects p
  where p.id = refreshed_invitation.project_id;

  if not public.can_coordinate_project(refreshed_invitation.project_id, current_user_id) then
    raise exception 'No tienes permisos para reenviar esta invitacion.';
  end if;

  update public.member_invitations mi
  set
    status = 'PENDING',
    accepted_at = null,
    token = replace(gen_random_uuid()::text, '-', ''),
    expires_at = now() + interval '7 days',
    updated_at = now()
  where mi.id = target_invitation_id
  returning *
  into refreshed_invitation;

  select p.full_name
  into inviter_name
  from public.profiles p
  where p.id = current_user_id;

  insert into public.project_notifications (
    project_id,
    recipient_id,
    actor_id,
    kind,
    title,
    message,
    link_href
  )
  values (
    refreshed_invitation.project_id,
    refreshed_invitation.invited_user_id,
    current_user_id,
    'MEMBER_INVITED',
    'Recordatorio de invitacion en ' || coalesce(project_name, 'Proyecto'),
    coalesce(inviter_name, 'Un miembro del proyecto') || ' te recordo tu invitacion pendiente.',
    '/invitations/' || refreshed_invitation.token
  );

  return refreshed_invitation;
end;
$$;

revoke all on function public.resend_internal_member_invitation(uuid) from public;
grant execute on function public.resend_internal_member_invitation(uuid) to authenticated;
