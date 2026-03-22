import Link from "next/link";
import type { ProjectCardView } from "@/lib/domain/models";
import { percentage, projectStateLabel } from "@/lib/utils/format";

export function ProjectCard({ project }: { project: ProjectCardView }) {
  return (
    <article className="taskflow-panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
            Proyecto
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[color:var(--color-text-primary)]">
            {project.name}
          </h3>
          <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-text-secondary)]">
            {project.description}
          </p>
        </div>
        <div className="rounded-full bg-[color:var(--color-surface-muted)] px-4 py-2 text-sm font-medium text-[color:var(--color-text-secondary)]">
          {projectStateLabel(project.state)}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-[color:var(--color-text-secondary)]">
          <span>Tareas completadas</span>
          <span>{percentage(project.progress)}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[color:var(--color-surface-muted)]">
          <div
            className="h-2 rounded-full bg-[color:var(--color-text-primary)]"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {project.members.map((member) => (
          <div
            key={member.id}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-sm font-semibold text-[color:var(--color-text-primary)]"
            title={member.name}
          >
            {member.avatar}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/projects/${project.id}/boards/${project.defaultBoardId}`}
          className="taskflow-button-primary"
        >
          Abrir tablero
        </Link>
        <div className="rounded-full bg-[color:var(--color-surface-muted)] px-4 py-2 text-sm text-[color:var(--color-text-secondary)]">
          {project.completedTasks}/{project.totalTasks} tareas cerradas
        </div>
        {project.archived ? (
          <div className="rounded-full bg-[color:rgba(217,83,111,0.14)] px-4 py-2 text-sm font-medium text-[color:var(--color-danger)]">
            Solo lectura
          </div>
        ) : null}
      </div>
    </article>
  );
}
