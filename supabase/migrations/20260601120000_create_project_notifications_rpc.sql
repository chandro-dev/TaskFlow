create or replace function public.create_project_notifications(
  target_notifications jsonb
)
returns setof public.project_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesion para crear notificaciones.';
  end if;

  if target_notifications is null or jsonb_typeof(target_notifications) <> 'array' then
    raise exception 'Las notificaciones deben enviarse como un arreglo JSON.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(target_notifications) as notification(project_id uuid)
    where notification.project_id is null
      or not public.can_access_project(notification.project_id, current_user_id)
  ) then
    raise exception 'No tienes permiso para crear notificaciones en uno de los proyectos.';
  end if;

  return query
  insert into public.project_notifications (
    id,
    project_id,
    recipient_id,
    actor_id,
    board_id,
    task_id,
    kind,
    title,
    message,
    link_href,
    is_read,
    read_at,
    created_at
  )
  select
    coalesce(notification.id, gen_random_uuid()),
    notification.project_id,
    notification.recipient_id,
    notification.actor_id,
    notification.board_id,
    notification.task_id,
    notification.kind,
    notification.title,
    notification.message,
    notification.link_href,
    coalesce(notification.is_read, false),
    notification.read_at,
    coalesce(notification.created_at, now())
  from jsonb_to_recordset(target_notifications) as notification(
    id uuid,
    project_id uuid,
    recipient_id uuid,
    actor_id uuid,
    board_id uuid,
    task_id uuid,
    kind public.notification_kind,
    title text,
    message text,
    link_href text,
    is_read boolean,
    read_at timestamptz,
    created_at timestamptz
  )
  returning *;
end;
$$;

revoke all on function public.create_project_notifications(jsonb) from public;
grant execute on function public.create_project_notifications(jsonb) to authenticated;
