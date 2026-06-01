import Link from "next/link";
import type { Board, TaskFilters } from "@/lib/domain/models";

type ProjectBoardSwitcherProps = {
  projectId: string;
  activeBoardId: string;
  boards: Board[];
  filters: TaskFilters;
};

function buildBoardHref(projectId: string, boardId: string, filters: TaskFilters) {
  const search = new URLSearchParams();

  if (filters.query) {
    search.set("query", filters.query);
  }

  if (filters.assigneeId) {
    search.set("assigneeId", filters.assigneeId);
  }

  if (filters.labelId) {
    search.set("labelId", filters.labelId);
  }

  if (filters.priority) {
    search.set("priority", filters.priority);
  }

  if (filters.type) {
    search.set("type", filters.type);
  }

  if (filters.from) {
    search.set("from", filters.from);
  }

  if (filters.to) {
    search.set("to", filters.to);
  }

  const suffix = search.toString();
  return `/projects/${projectId}/boards/${boardId}${suffix ? `?${suffix}` : ""}`;
}

export function ProjectBoardSwitcher({
  projectId,
  activeBoardId,
  boards,
  filters,
}: ProjectBoardSwitcherProps) {
  return (
    <section className="taskflow-panel p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--color-text-primary)]">
            Tableros del proyecto
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Cambia entre los tableros disponibles sin salir del proyecto activo.
          </p>
        </div>
        <div className="taskflow-chip">{boards.length} tableros</div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {boards.map((board) => {
          const isActive = board.id === activeBoardId;

          return (
            <Link
              key={board.id}
              href={buildBoardHref(projectId, board.id, filters)}
              className={
                isActive
                  ? "rounded-2xl bg-[color:var(--color-text-primary)] px-4 py-3 text-sm font-medium text-white"
                  : "rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm font-medium text-[color:var(--color-text-primary)]"
              }
            >
              {board.name}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
