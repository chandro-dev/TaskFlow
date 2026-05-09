import { requireAuthenticatedUser } from "@/lib/auth/current-user";
import { TaskflowService } from "@/lib/application/taskflow-service";
import { formatDateTime, percentage } from "@/lib/utils/format";

const service = new TaskflowService();

export default async function ReportsPage() {
  const currentUser = await requireAuthenticatedUser();
  const report = await service.getWorkspaceReport(currentUser);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
            Bridge
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-semibold text-[color:var(--color-text-primary)]">
            Reportes ejecutivos
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
            Consolidado de proyectos, tableros, avance, tareas vencidas y horas.
            El mismo reporte se renderiza en diferentes formatos mediante Bridge.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a className="taskflow-button-primary" href="/api/reports?format=html">
            HTML
          </a>
          <a className="taskflow-chip" href="/api/reports?format=csv">
            CSV
          </a>
          <a className="taskflow-chip" href="/api/reports?format=json">
            JSON
          </a>
        </div>
      </div>

      <section className="taskflow-panel p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Proyectos visibles
            </p>
            <p className="mt-2 text-3xl font-semibold">{report.totals.projects}</p>
          </div>
          <div>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Tareas totales
            </p>
            <p className="mt-2 text-3xl font-semibold">{report.totals.totalTasks}</p>
          </div>
          <div>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Avance general
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {percentage(report.totals.progress)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Tareas vencidas
            </p>
            <p className="mt-2 text-3xl font-semibold">{report.totals.overdueTasks}</p>
          </div>
        </div>
        <p className="mt-5 text-sm text-[color:var(--color-text-secondary)]">
          Generado: {formatDateTime(report.generatedAt)}
        </p>
      </section>

      <section className="taskflow-panel overflow-hidden p-0">
        <div className="border-b border-[color:var(--color-border)] px-6 py-5">
          <h2 className="text-2xl font-semibold">Detalle por proyecto</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-[color:var(--color-surface-muted)] text-sm text-[color:var(--color-text-secondary)]">
              <tr>
                <th className="px-5 py-4 font-medium">Proyecto</th>
                <th className="px-5 py-4 font-medium">Estado</th>
                <th className="px-5 py-4 font-medium">Tableros</th>
                <th className="px-5 py-4 font-medium">Tareas</th>
                <th className="px-5 py-4 font-medium">Completadas</th>
                <th className="px-5 py-4 font-medium">Vencidas</th>
                <th className="px-5 py-4 font-medium">Avance</th>
                <th className="px-5 py-4 font-medium">Horas</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr
                  key={row.projectId}
                  className="border-t border-[color:var(--color-border)]"
                >
                  <td className="px-5 py-4 font-medium">{row.projectName}</td>
                  <td className="px-5 py-4">{row.state}</td>
                  <td className="px-5 py-4">{row.boards}</td>
                  <td className="px-5 py-4">{row.totalTasks}</td>
                  <td className="px-5 py-4">{row.completedTasks}</td>
                  <td className="px-5 py-4">{row.overdueTasks}</td>
                  <td className="px-5 py-4">{percentage(row.progress)}</td>
                  <td className="px-5 py-4">
                    {row.spentHours}/{row.estimateHours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
