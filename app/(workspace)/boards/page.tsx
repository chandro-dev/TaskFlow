import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/current-user";
import { BoardCreator } from "@/components/taskflow/board-creator";
import { ArrowRightIcon } from "@/components/taskflow/icons";
import { TaskflowService } from "@/lib/application/taskflow-service";
import { percentage, projectStateLabel } from "@/lib/utils/format";

const service = new TaskflowService();

export default async function BoardsPage() {
  const currentUser = await requireAuthenticatedUser();
  const data = await service.getBoardsPageData(currentUser);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
            Workspace
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-semibold text-[color:var(--color-text-primary)]">
            Tableros por proyecto
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
            Revisa cada proyecto con sus tableros asociados en bloques separados
            para navegar sin perder el contexto del workspace.
          </p>
        </div>

        <div className="taskflow-chip">
          {data.groups.reduce((sum, group) => sum + group.boards.length, 0)} tableros
        </div>
      </div>

      <div className="space-y-6">
        {data.groups.map((group) => (
          <section key={group.project.id} className="taskflow-panel p-6">
            <div className="flex flex-col gap-5 border-b border-[color:var(--color-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
                  {projectStateLabel(group.project.state)}
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-[color:var(--color-text-primary)]">
                  {group.project.name}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-text-secondary)]">
                  {group.project.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm text-[color:var(--color-text-secondary)]">
                  {group.boards.length} tableros
                </div>
                <div className="rounded-2xl bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm text-[color:var(--color-text-secondary)]">
                  Avance {percentage(group.project.progress)}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {group.boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/projects/${group.project.id}/boards/${board.id}`}
                  className="rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[color:var(--color-text-primary)]">
                        {board.name}
                      </h3>
                      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                        {board.columnsCount} columnas configuradas
                      </p>
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-[color:var(--color-text-secondary)]" />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-[color:var(--color-text-secondary)]">
                    <div className="rounded-2xl bg-[color:var(--color-surface)] px-3 py-2">
                      {board.totalTasks} tareas
                    </div>
                    <div className="rounded-2xl bg-[color:var(--color-surface)] px-3 py-2">
                      {board.completedTasks} completadas
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {group.project.canManage ? (
              <div className="mt-5">
                <BoardCreator projectId={group.project.id} />
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
