import { notFound } from "next/navigation";
import { ProjectBoardSwitcher } from "@/components/taskflow/project-board-switcher";
import { TaskCreator } from "@/components/taskflow/task-creator";
import { TaskKanbanBoard } from "@/components/taskflow/task-kanban-board";
import { TaskflowService } from "@/lib/application/taskflow-service";
import type { TaskFilters, TaskPriority, TaskType } from "@/lib/domain/models";

const service = new TaskflowService();

function readParam(value: string | string[] | undefined, fallback = "") {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function parsePriority(value: string): TaskPriority | undefined {
  if (["BAJA", "MEDIA", "ALTA", "URGENTE"].includes(value)) {
    return value as TaskPriority;
  }

  return undefined;
}

function parseTaskType(value: string): TaskType | undefined {
  if (["BUG", "FEATURE", "TASK", "IMPROVEMENT"].includes(value)) {
    return value as TaskType;
  }

  return undefined;
}

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; boardId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const route = await params;
  const query = await searchParams;

  const filters: TaskFilters = {
    query: readParam(query.query) || undefined,
    assigneeId: readParam(query.assigneeId) || undefined,
    labelId: readParam(query.labelId) || undefined,
    priority: parsePriority(readParam(query.priority)),
    type: parseTaskType(readParam(query.type)),
    from: readParam(query.from) || undefined,
    to: readParam(query.to) || undefined,
  };

  const data = await service.getBoardPageData(
    route.projectId,
    route.boardId,
    filters,
  );

  if (!data) {
    notFound();
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
            {data.project.name}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-semibold text-[color:var(--color-text-primary)]">
            Tablero Kanban
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
            Gestión de columnas, WIP, tipos de tarea, responsables, etiquetas y
            filtros avanzados sobre el proyecto activo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="taskflow-chip">{activeFilterCount} filtros activos</div>
          <TaskCreator
            projectId={data.project.id}
            boardId={data.board.id}
            columns={data.board.columns}
            users={data.users}
          />
        </div>
      </div>

      <form className="taskflow-panel grid gap-4 p-5 xl:grid-cols-7">
        <input
          name="query"
          defaultValue={data.filters.query}
          placeholder="Buscar tareas..."
          className="taskflow-input xl:col-span-2"
        />

        <select
          name="assigneeId"
          defaultValue={data.filters.assigneeId ?? ""}
          className="taskflow-input"
        >
          <option value="">Responsable</option>
          {data.users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <select
          name="labelId"
          defaultValue={data.filters.labelId ?? ""}
          className="taskflow-input"
        >
          <option value="">Etiqueta</option>
          {data.availableLabels.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))}
        </select>

        <select
          name="priority"
          defaultValue={data.filters.priority ?? ""}
          className="taskflow-input"
        >
          <option value="">Prioridad</option>
          <option value="BAJA">Baja</option>
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </select>

        <select
          name="type"
          defaultValue={data.filters.type ?? ""}
          className="taskflow-input"
        >
          <option value="">Tipo</option>
          <option value="BUG">Bug</option>
          <option value="FEATURE">Feature</option>
          <option value="TASK">Task</option>
          <option value="IMPROVEMENT">Improvement</option>
        </select>

        <button type="submit" className="taskflow-button-primary justify-center">
          Aplicar
        </button>

        <input
          type="date"
          name="from"
          defaultValue={data.filters.from}
          className="taskflow-input"
        />
        <input
          type="date"
          name="to"
          defaultValue={data.filters.to}
          className="taskflow-input"
        />
      </form>

      <ProjectBoardSwitcher
        projectId={data.project.id}
        activeBoardId={data.board.id}
        boards={data.projectBoards}
        filters={data.filters}
      />

      <TaskKanbanBoard
        projectId={data.project.id}
        boardId={data.board.id}
        initialColumns={data.columns}
        users={data.users}
      />
    </div>
  );
}
