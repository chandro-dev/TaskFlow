create or replace function public.clone_project_task(
  source_task_id uuid,
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
  target_subtasks jsonb default '[]'::jsonb,
  target_cloned_from_task_id uuid default null
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  source_task public.tasks;
  resolved_column_id uuid;
  created_task public.tasks;
  project_name text;
  board_name text;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesion para continuar.';
  end if;

  if not public.can_access_project(target_project_id, current_user_id) then
    raise exception 'No tienes permisos para clonar tareas en este proyecto.';
  end if;

  select t.*
  into source_task
  from public.tasks t
  where t.id = source_task_id
    and t.project_id = target_project_id;

  if source_task.id is null then
    raise exception 'La tarea origen no existe dentro del proyecto.';
  end if;

  if not exists (
    select 1
    from public.boards b
    where b.id = target_board_id
      and b.project_id = target_project_id
  ) then
    raise exception 'El tablero de destino no pertenece al proyecto.';
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
    raise exception 'La columna de destino no pertenece al tablero.';
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
    raise exception 'Todos los responsables de la copia deben pertenecer al proyecto.';
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
    assignee_ids,
    cloned_from_task_id
  )
  values (
    target_project_id,
    target_board_id,
    resolved_column_id,
    nullif(trim(coalesce(target_title, '')), ''),
    trim(coalesce(target_description, '')),
    coalesce(target_priority, source_task.priority),
    coalesce(target_type, source_task.type),
    coalesce(target_due_date, source_task.due_date),
    coalesce(target_estimate_hours, source_task.estimate_hours),
    0,
    current_user_id,
    coalesce(target_assignee_ids, source_task.assignee_ids),
    coalesce(target_cloned_from_task_id, source_task.id)
  )
  returning *
  into created_task;

  insert into public.task_labels (task_id, label_id)
  select created_task.id, tl.label_id
  from public.task_labels tl
  where tl.task_id = source_task.id;

  if coalesce(jsonb_array_length(target_subtasks), 0) > 0 then
    insert into public.task_subtasks (task_id, title, is_completed)
    select
      created_task.id,
      trim(cloned_subtask.title),
      cloned_subtask.is_completed
    from jsonb_to_recordset(target_subtasks) as cloned_subtask(
      source_subtask_id uuid,
      title text,
      is_completed boolean
    )
    where nullif(trim(coalesce(cloned_subtask.title, '')), '') is not null;
  else
    insert into public.task_subtasks (task_id, title, is_completed)
    select created_task.id, ts.title, ts.is_completed
    from public.task_subtasks ts
    where ts.task_id = source_task.id;
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
    'Tarea clonada',
    resolved_column_id
  );

  select p.name, b.name
  into project_name, board_name
  from public.projects p
  join public.boards b on b.id = target_board_id
  where p.id = target_project_id;

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
    'Nueva tarea clonada: ' || created_task.title,
    'Se clono la tarea ' || created_task.title || ' dentro del tablero ' || coalesce(board_name, 'Tablero') || '.',
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

revoke all on function public.clone_project_task(uuid, uuid, uuid, uuid, text, text, public.task_priority, public.task_type, date, integer, uuid[], jsonb, uuid) from public;
grant execute on function public.clone_project_task(uuid, uuid, uuid, uuid, text, text, public.task_priority, public.task_type, date, integer, uuid[], jsonb, uuid) to authenticated;
