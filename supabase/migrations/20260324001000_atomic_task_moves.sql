create or replace function public.move_project_task(
  target_task_id uuid,
  target_project_id uuid,
  target_board_id uuid,
  target_to_column_id uuid
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_task public.tasks;
  destination_column public.board_columns;
  previous_column_id uuid;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesion para continuar.';
  end if;

  if not public.can_access_project(target_project_id, current_user_id) then
    raise exception 'No tienes permisos para mover tareas en este proyecto.';
  end if;

  select t.*
  into current_task
  from public.tasks t
  where t.id = target_task_id
    and t.project_id = target_project_id
    and t.board_id = target_board_id
  for update;

  if current_task.id is null then
    raise exception 'La tarea no existe dentro del tablero seleccionado.';
  end if;

  select bc.*
  into destination_column
  from public.board_columns bc
  where bc.id = target_to_column_id
    and bc.board_id = target_board_id;

  if destination_column.id is null then
    raise exception 'La columna de destino no pertenece al tablero.';
  end if;

  previous_column_id := current_task.column_id;

  update public.tasks t
  set
    column_id = target_to_column_id,
    updated_at = now()
  where t.id = current_task.id
  returning *
  into current_task;

  insert into public.task_history (
    task_id,
    actor_id,
    action,
    from_column_id,
    to_column_id
  )
  values (
    current_task.id,
    current_user_id,
    'Cambio de estado',
    previous_column_id,
    target_to_column_id
  );

  return current_task;
end;
$$;

revoke all on function public.move_project_task(uuid, uuid, uuid, uuid) from public;
grant execute on function public.move_project_task(uuid, uuid, uuid, uuid) to authenticated;
