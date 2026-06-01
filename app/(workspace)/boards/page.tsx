import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/current-user";
import { BoardCreator } from "@/components/taskflow/board-creator";
import { ArrowRightIcon } from "@/components/taskflow/icons";
import { TaskflowService } from "@/lib/application/taskflow-service";
import { percentage, projectStateLabel } from "@/lib/utils/format";

const service = new TaskflowService();

function countProjectsWithBoards(
  groups: Awaited<ReturnType<typeof service.getBoardsPageData>>["groups"],
) {
  return groups.filter((group) => group.boards.length > 0).length;
}

export default async function BoardsPage() {
  const currentUser = await requireAuthenticatedUser();
  const data = await service.getBoardsPageData(currentUser);
  const totalBoards = data.groups.reduce((sum, group) => sum + group.boards.length, 0);
  const projectsWithBoards = countProjectsWithBoards(data.groups);

  return (
    <div className="space-y-8">
      <section className="taskflow-panel overflow-hidden p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
              Workspace
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-[color:var(--color-text-primary)] md:text-5xl">
              Tableros por proyecto
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
              Navega cada proyecto con una disposicion mas clara: resumen a la
              izquierda, tableros accionables a la derecha y creacion enfocada
              sin formularios inline.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                Tableros visibles
              </p>
              <div className="mt-3 text-4xl font-semibold text-[color:var(--color-text-primary)]">
                {totalBoards}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                Proyectos activos
              </p>
              <div className="mt-3 text-4xl font-semibold text-[color:var(--color-text-primary)]">
                {projectsWithBoards}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                Sin tableros
              </p>
              <div className="mt-3 text-4xl font-semibold text-[color:var(--color-text-primary)]">
                {data.groups.length - projectsWithBoards}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {data.groups.map((group) => (
          <section key={group.project.id} className="taskflow-panel p-6 md:p-7">
            <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
              <aside className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
                  {projectStateLabel(group.project.state)}
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[color:var(--color-text-primary)]">
                  {group.project.name}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[color:var(--color-text-secondary)]">
                  {group.project.description}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl bg-[color:var(--color-surface)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
                      Tableros
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{group.boards.length}</p>
                  </div>
                  <div className="rounded-2xl bg-[color:var(--color-surface)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
                      Avance
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {percentage(group.project.progress)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[color:var(--color-surface)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
                      Gestion
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[color:var(--color-text-primary)]">
                      {group.project.canManage ? "Disponible" : "Solo lectura"}
                    </p>
                  </div>
                </div>

                {group.project.canManage ? (
                  <div className="mt-6">
                    <BoardCreator projectId={group.project.id} />
                  </div>
                ) : null}
              </aside>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[color:var(--color-text-primary)]">
                      Tableros disponibles
                    </h3>
                    <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                      Entra al tablero correcto sin perder el contexto del proyecto.
                    </p>
                  </div>
                  <div className="taskflow-chip">{group.boards.length}</div>
                </div>

                {group.boards.length ? (
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {group.boards.map((board) => (
                      <Link
                        key={board.id}
                        href={`/projects/${group.project.id}/boards/${board.id}`}
                        className="group rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition-transform hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-xl font-semibold text-[color:var(--color-text-primary)]">
                              {board.name}
                            </h4>
                            <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                              {board.columnsCount} columnas configuradas
                            </p>
                          </div>
                          <div className="rounded-full bg-[color:var(--color-surface-muted)] p-2 text-[color:var(--color-text-secondary)] transition-colors group-hover:text-[color:var(--color-accent)]">
                            <ArrowRightIcon className="h-5 w-5" />
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-[color:var(--color-surface-muted)] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-secondary)]">
                              Tareas
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-[color:var(--color-text-primary)]">
                              {board.totalTasks}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[color:var(--color-surface-muted)] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-secondary)]">
                              Completadas
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-[color:var(--color-text-primary)]">
                              {board.completedTasks}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-6 py-10 text-sm leading-7 text-[color:var(--color-text-secondary)]">
                    Este proyecto aun no tiene tableros creados.
                    {group.project.canManage
                      ? " Usa el boton lateral para crear el primero."
                      : " Necesitas permisos de gestion para crear uno nuevo."}
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
