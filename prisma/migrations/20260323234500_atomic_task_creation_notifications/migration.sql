create or replace function public.create_project_task_with_notifications(
  target_project_id uuid,
  target_board_id uuid,
  target_column_id uuid default null,
  target_title text default '',
  target_description text default '',
  target_priority public.task_priority default 'MEDIA',
  target_type public.task_type default 'TASK',
  target_due_date date default null,
  target_estimate_hours integer default 0,
  target_assignee_ids uuid[] default '{}',
  target_subtasks jsonb default '[]'::jsonb
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_column_id uuid;
  project_name text;
  board_name text;
  actor_name text;
  created_task public.tasks;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesion para continuar.';
  end if;

  if not public.can_access_project(target_project_id, current_user_id) then
    raise exception 'No tienes permisos para crear tareas en este proyecto.';
  end if;

  if not exists (
    select 1
    from public.boards b
    where b.id = target_board_id
      and b.project_id = target_project_id
  ) then
    raise exception 'El tablero no pertenece al proyecto indicado.';
  end if;

  if target_column_id is not null then
    select bc.id
    into resolved_column_id
    from public.board_columns bc
    where bc.id = target_column_id
      and bc.board_id = target_board_id;
  else
    select bc.id
    into resolved_column_id
    from public.board_columns bc
    where bc.board_id = target_board_id
    order by bc.position asc
    limit 1;
  end if;

  if resolved_column_id is null then
    raise exception 'El tablero no tiene columnas disponibles.';
  end if;

  if exists (
    select 1
    from unnest(coalesce(target_assignee_ids, '{}')) assignee_id
    where not exists (
      select 1
      from public.projects p
      where p.id = target_project_id
        and (
          p.owner_id = assignee_id
          or exists (
            select 1
            from public.project_members pm
            where pm.project_id = target_project_id
              and pm.user_id = assignee_id
          )
        )
    )
  ) then
    raise exception 'Todos los responsables deben pertenecer al proyecto.';
  end if;

  insert into public.tasks (
    project_id,
    board_id,
    column_id,
    title,
    description,
    priority,
    type,
    due_date,
    estimate_hours,
    spent_hours,
    created_by,
    assignee_ids
  )
  values (
    target_project_id,
    target_board_id,
    resolved_column_id,
    nullif(trim(coalesce(target_title, '')), ''),
    trim(coalesce(target_description, '')),
    coalesce(target_priority, 'MEDIA'),
    coalesce(target_type, 'TASK'),
    target_due_date,
    coalesce(target_estimate_hours, 0),
    0,
    current_user_id,
    coalesce(target_assignee_ids, '{}')
  )
  returning *
  into created_task;

  if coalesce(jsonb_array_length(target_subtasks), 0) > 0 then
    insert into public.task_subtasks (task_id, title, is_completed)
    select
      created_task.id,
      trim(created_subtask.title),
      created_subtask.is_completed
    from jsonb_to_recordset(target_subtasks) as created_subtask(
      id uuid,
      title text,
      is_completed boolean
    )
    where nullif(trim(coalesce(created_subtask.title, '')), '') is not null;
  end if;

  insert into public.task_history (
    task_id,
    actor_id,
    action,
    to_column_id
  )
  values (
    created_task.id,
    current_user_id,
    'Tarea creada',
    resolved_column_id
  );

  select p.name, b.name
  into project_name, board_name
  from public.projects p
  join public.boards b on b.id = target_board_id
  where p.id = target_project_id;

  select pr.full_name
  into actor_name
  from public.profiles pr
  where pr.id = current_user_id;

  insert into public.project_notifications (
    project_id,
    recipient_id,
    actor_id,
    board_id,
    task_id,
    kind,
    title,
    message,
    link_href
  )
  select
    created_task.project_id,
    recipient_id,
    current_user_id,
    created_task.board_id,
    created_task.id,
    'TASK_CREATED',
    'Nueva tarea: ' || created_task.title,
    'Se creo la tarea ' || created_task.title || ' dentro del tablero ' || coalesce(board_name, 'Tablero') || '.',
    '/projects/' || created_task.project_id || '/boards/' || created_task.board_id || '?query=' || replace(created_task.title, ' ', '%20')
  from (
    select p.owner_id as recipient_id
    from public.projects p
    where p.id = created_task.project_id

    union

    select pm.user_id as recipient_id
    from public.project_members pm
    where pm.project_id = created_task.project_id
  ) recipients
  where recipient_id <> current_user_id;

  return created_task;
end;
$$;

revoke all on function public.create_project_task_with_notifications(uuid, uuid, uuid, text, text, public.task_priority, public.task_type, date, integer, uuid[], jsonb) from public;
grant execute on function public.create_project_task_with_notifications(uuid, uuid, uuid, text, text, public.task_priority, public.task_type, date, integer, uuid[], jsonb) to authenticated;
