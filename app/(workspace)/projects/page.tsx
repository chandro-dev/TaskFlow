import Link from "next/link";
import { InvitationManager } from "@/components/taskflow/invitation-manager";
import { ProjectCard } from "@/components/taskflow/project-card";
import { ArrowRightIcon, PlusIcon, SearchIcon } from "@/components/taskflow/icons";
import { TaskflowService } from "@/lib/application/taskflow-service";
import { formatDate, percentage, projectStateLabel } from "@/lib/utils/format";

const service = new TaskflowService();

function readParam(
  value: string | string[] | undefined,
  fallback = "",
): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = readParam(params.query);
  const state = readParam(params.state, "ALL");
  const data = await service.getProjectsPageData({ query, state });
  const highlights = await service.getSearchHighlights(undefined, {
    query: query || undefined,
  });

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
      <section className="space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
              Proyecto web
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-semibold text-[color:var(--color-text-primary)]">
              Panel de proyectos
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
              Administra proyectos, miembros, estados y clones de estructura
              usando una base de datos preparada para Supabase.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="taskflow-chip">{data.currentUser.role}</div>
            <button type="button" className="taskflow-button-primary">
              <PlusIcon className="h-5 w-5" />
              Nuevo proyecto
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="taskflow-panel p-5">
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Proyectos visibles
            </p>
            <div className="mt-3 text-4xl font-semibold">{data.projects.length}</div>
          </div>
          <div className="taskflow-panel p-5">
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              En progreso
            </p>
            <div className="mt-3 text-4xl font-semibold">
              {
                data.projects.filter((project) => project.state === "EN_PROGRESO")
                  .length
              }
            </div>
          </div>
          <div className="taskflow-panel p-5">
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Avance promedio
            </p>
            <div className="mt-3 text-4xl font-semibold">
              {percentage(
                data.projects.reduce((sum, project) => sum + project.progress, 0) /
                  Math.max(data.projects.length, 1),
              )}
            </div>
          </div>
        </div>

        <form className="taskflow-panel grid gap-4 p-5 md:grid-cols-[1fr_16rem_auto]">
          <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3">
            <SearchIcon className="h-5 w-5 text-[color:var(--color-text-secondary)]" />
            <input
              name="query"
              defaultValue={data.activeQuery}
              placeholder="Buscar proyectos o tareas relacionadas..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--color-text-secondary)]"
            />
          </label>
          <select
            name="state"
            defaultValue={data.activeState}
            className="taskflow-input"
          >
            {data.projectStates.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "Todos los estados" : projectStateLabel(item)}
              </option>
            ))}
          </select>
          <button type="submit" className="taskflow-button-primary justify-center">
            Filtrar
          </button>
        </form>

        <div className="space-y-5">
          {data.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <aside className="space-y-6">
        <InvitationManager
          project={data.selectedProject}
          invitations={data.invitations}
        />

        <section className="taskflow-panel p-6">
          <h2 className="text-xl font-semibold">Búsqueda y filtros</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-text-secondary)]">
            RF-07 cubierto con búsqueda de texto libre y acceso rápido a tareas
            relevantes dentro del workspace.
          </p>
          <div className="mt-5 space-y-4">
            {highlights.map((task) => (
              <Link
                key={task.id}
                href={`/projects/${task.projectId}/boards/${task.boardId}?query=${encodeURIComponent(
                  task.title,
                )}`}
                className="block rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4 transition-transform hover:-translate-y-0.5"
              >
                <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                  {task.title}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
                  {task.projectName}
                </p>
                <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
                  Vence {formatDate(task.dueDate)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="taskflow-panel p-6">
          <h2 className="text-xl font-semibold">Accesos rápidos</h2>
          <div className="mt-5 space-y-3">
            <Link
              href="/settings"
              className="flex items-center justify-between rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-medium"
            >
              Gestión de usuarios
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/projects/project-web/boards/board-web-main"
              className="flex items-center justify-between rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-medium"
            >
              Tablero principal
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </aside>
    </div>
  );
}
