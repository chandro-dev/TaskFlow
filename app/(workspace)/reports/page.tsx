import { requireAuthenticatedUser } from "@/lib/auth/current-user";
import { TaskflowService } from "@/lib/application/taskflow-service";
import type { ProjectReportRow } from "@/lib/application/reports/report-query-service";
import type { ProjectState } from "@/lib/domain/models";
import { formatDateTime, percentage, projectStateLabel } from "@/lib/utils/format";

const service = new TaskflowService();

export default async function ReportsPage() {
  const currentUser = await requireAuthenticatedUser();
  const report = await service.getWorkspaceReport(currentUser);
  const hourUsage = progressRatio(
    report.totals.spentHours,
    report.totals.estimateHours,
  );
  const overdueRatio = progressRatio(
    report.totals.overdueTasks,
    report.totals.totalTasks,
  );
  const completedRatio = progressRatio(
    report.totals.completedTasks,
    report.totals.totalTasks,
  );
  const topByWorkload = [...report.rows]
    .sort((left, right) => right.totalTasks - left.totalTasks)
    .slice(0, 5);
  const topByHours = [...report.rows]
    .sort((left, right) => right.spentHours - left.spentHours)
    .slice(0, 6);
  const riskRows = report.rows
    .filter((row) => row.overdueTasks > 0 || row.progress < 50)
    .sort((left, right) => right.overdueTasks - left.overdueTasks)
    .slice(0, 4);
  const stateSummary = report.rows.reduce<Record<string, number>>((summary, row) => {
    summary[row.state] = (summary[row.state] ?? 0) + 1;
    return summary;
  }, {});
  const pendingTasks = Math.max(
    report.totals.totalTasks - report.totals.completedTasks - report.totals.overdueTasks,
    0,
  );
  const taskSegments = [
    {
      label: "Completadas",
      value: report.totals.completedTasks,
      color: "var(--color-accent)",
    },
    {
      label: "Vencidas",
      value: report.totals.overdueTasks,
      color: "var(--color-danger)",
    },
    {
      label: "Pendientes",
      value: pendingTasks,
      color: "var(--color-text-secondary)",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
            Dashboard ejecutivo - Bridge
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-semibold text-[color:var(--color-text-primary)]">
            Reportes y dashboards
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
            Vista ejecutiva de proyectos, avance, vencimientos y horas. El dashboard
            y las exportaciones comparten el mismo modelo mediante Bridge.
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          label="Proyectos visibles"
          value={report.totals.projects}
          detail={`${report.totals.boards} tableros activos`}
        />
        <DashboardMetric
          label="Tareas totales"
          value={report.totals.totalTasks}
          detail={`${report.totals.completedTasks} completadas`}
        />
        <DashboardMetric
          label="Avance general"
          value={percentage(report.totals.progress)}
          detail={`${completedRatio}% de cierre operativo`}
        />
        <DashboardMetric
          label="Tareas vencidas"
          value={report.totals.overdueTasks}
          detail={`${overdueRatio}% del total visible`}
          tone={report.totals.overdueTasks > 0 ? "risk" : "default"}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="taskflow-panel p-6">
          <div className="flex flex-col gap-2 border-b border-[color:var(--color-border)] pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
                Salud del portafolio
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Avance, deuda y horas</h2>
            </div>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Generado: {formatDateTime(report.generatedAt)}
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <ProgressBlock
              label="Avance general"
              value={report.totals.progress}
              detail={`${report.totals.completedTasks}/${report.totals.totalTasks} tareas cerradas`}
            />
            <ProgressBlock
              label="Vencimiento"
              value={overdueRatio}
              detail={`${report.totals.overdueTasks} tareas vencidas`}
              tone="risk"
            />
            <ProgressBlock
              label="Uso de horas"
              value={hourUsage}
              detail={`${report.totals.spentHours}/${report.totals.estimateHours}h ejecutadas`}
              tone={hourUsage > 100 ? "risk" : "default"}
            />
          </div>
        </div>

        <div className="taskflow-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
            Estados
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Distribucion de proyectos</h2>
          <div className="mt-5 space-y-4">
            {Object.entries(stateSummary).length ? (
              Object.entries(stateSummary).map(([state, count]) => (
                <div key={state}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {projectStateLabel(state as ProjectState)}
                    </span>
                    <span className="text-[color:var(--color-text-secondary)]">
                      {count}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[color:var(--color-surface-muted)]">
                    <div
                      className="h-2 rounded-full bg-[color:var(--color-accent)]"
                      style={{
                        width: `${progressRatio(count, report.totals.projects)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[color:var(--color-text-secondary)]">
                No hay proyectos visibles para construir la distribucion.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="taskflow-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
            Grafica de tareas
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Distribucion operativa</h2>
          <TaskDonutChart
            centerLabel={percentage(report.totals.progress)}
            segments={taskSegments}
            total={report.totals.totalTasks}
          />
        </div>

        <div className="taskflow-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
            Grafica de horas
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Ejecucion por proyecto</h2>
          <ProjectHoursChart rows={topByHours} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="taskflow-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
                Carga de trabajo
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Proyectos con mas tareas</h2>
            </div>
            <span className="taskflow-chip">Top 5</span>
          </div>
          <div className="mt-6 space-y-5">
            {topByWorkload.length ? (
              topByWorkload.map((row) => (
                <ProjectBar
                  key={row.projectId}
                  label={row.projectName}
                  value={row.totalTasks}
                  max={Math.max(...topByWorkload.map((item) => item.totalTasks), 1)}
                  detail={`${row.completedTasks} completadas - ${row.overdueTasks} vencidas`}
                />
              ))
            ) : (
              <p className="text-sm leading-6 text-[color:var(--color-text-secondary)]">
                No hay tareas suficientes para construir el ranking.
              </p>
            )}
          </div>
        </div>

        <div className="taskflow-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
                Riesgo
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Proyectos para revisar</h2>
            </div>
            <span className="taskflow-chip">{riskRows.length} hallazgos</span>
          </div>
          <div className="mt-6 space-y-4">
            {riskRows.length ? (
              riskRows.map((row) => (
                <div
                  key={row.projectId}
                  className="rounded-2xl border border-[color:var(--color-border)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{row.projectName}</h3>
                      <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                        {row.overdueTasks} vencidas - {percentage(row.progress)} de avance
                      </p>
                    </div>
                    <span className="rounded-full bg-[color:rgba(217,83,111,0.14)] px-3 py-1 text-sm font-semibold text-[color:var(--color-danger)]">
                      Revisar
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[color:var(--color-text-secondary)]">
                No hay proyectos con tareas vencidas o avance inferior al 50%.
              </p>
            )}
          </div>
        </div>
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
                  <td className="px-5 py-4">
                    <div className="min-w-32">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span>{percentage(row.progress)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[color:var(--color-surface-muted)]">
                        <div
                          className="h-2 rounded-full bg-[color:var(--color-text-primary)]"
                          style={{ width: `${clamp(row.progress)}%` }}
                        />
                      </div>
                    </div>
                  </td>
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

function DashboardMetric({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "risk";
}) {
  return (
    <div className="taskflow-panel p-5">
      <p className="text-sm text-[color:var(--color-text-secondary)]">{label}</p>
      <p
        className={
          tone === "risk"
            ? "mt-2 text-3xl font-semibold text-[color:var(--color-danger)]"
            : "mt-2 text-3xl font-semibold"
        }
      >
        {value}
      </p>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{detail}</p>
    </div>
  );
}

function TaskDonutChart({
  centerLabel,
  segments,
  total,
}: {
  centerLabel: string;
  segments: Array<{ label: string; value: number; color: string }>;
  total: number;
}) {
  const normalizedSegments = segments.map((segment, index) => {
    const percent = progressRatio(segment.value, total);
    const offset = segments
      .slice(0, index)
      .reduce((sum, item) => sum + progressRatio(item.value, total), 0);

    return { ...segment, percent, offset };
  });

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[14rem_1fr] md:items-center">
      <div className="relative mx-auto h-56 w-56">
        <svg className="h-full w-full" viewBox="0 0 120 120" role="img">
          <title>Distribucion de tareas del dashboard</title>
          <circle
            cx="60"
            cy="60"
            fill="none"
            r="46"
            stroke="var(--color-surface-muted)"
            strokeWidth="16"
          />
          {normalizedSegments.map((segment) =>
            segment.value > 0 ? (
              <circle
                key={segment.label}
                cx="60"
                cy="60"
                fill="none"
                pathLength="100"
                r="46"
                stroke={segment.color}
                strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="round"
                strokeWidth="16"
                transform="rotate(-90 60 60)"
              />
            ) : null,
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-4xl font-semibold">{centerLabel}</p>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            avance
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {normalizedSegments.map((segment) => (
          <div key={segment.label}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: segment.color }}
                />
                <span className="font-medium">{segment.label}</span>
              </div>
              <span className="text-[color:var(--color-text-secondary)]">
                {segment.value} - {segment.percent}%
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[color:var(--color-surface-muted)]">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${clamp(segment.percent)}%`,
                  background: segment.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectHoursChart({ rows }: { rows: ProjectReportRow[] }) {
  const maxHours = Math.max(
    ...rows.map((row) => Math.max(row.estimateHours, row.spentHours)),
    1,
  );

  if (!rows.length) {
    return (
      <p className="mt-6 text-sm leading-6 text-[color:var(--color-text-secondary)]">
        No hay horas registradas para construir la grafica.
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="flex min-h-72 min-w-[38rem] items-end gap-5 border-b border-[color:var(--color-border)] pb-5">
        {rows.map((row) => (
          <div key={row.projectId} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-52 items-end gap-2">
              <div
                className="w-5 rounded-t-lg bg-[color:var(--color-surface-muted)]"
                title={`${row.estimateHours} horas estimadas`}
                style={{
                  height: `${Math.max(progressRatio(row.estimateHours, maxHours), 6)}%`,
                }}
              />
              <div
                className="w-5 rounded-t-lg bg-[color:var(--color-accent)]"
                title={`${row.spentHours} horas ejecutadas`}
                style={{
                  height: `${Math.max(progressRatio(row.spentHours, maxHours), 6)}%`,
                }}
              />
            </div>
            <div className="w-full text-center">
              <p className="truncate text-sm font-medium" title={row.projectName}>
                {row.projectName}
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                {row.spentHours}/{row.estimateHours}h
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-[color:var(--color-text-secondary)]">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[color:var(--color-surface-muted)]" />
          Estimadas
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[color:var(--color-accent)]" />
          Ejecutadas
        </span>
      </div>
    </div>
  );
}

function ProgressBlock({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "default" | "risk";
}) {
  const barColor =
    tone === "risk"
      ? "bg-[color:var(--color-danger)]"
      : "bg-[color:var(--color-accent)]";

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{label}</p>
        <p className="text-sm font-semibold">{percentage(value)}</p>
      </div>
      <div className="mt-3 h-3 rounded-full bg-[color:var(--color-surface-muted)]">
        <div
          className={`h-3 rounded-full ${barColor}`}
          style={{ width: `${clamp(value)}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">{detail}</p>
    </div>
  );
}

function ProjectBar({
  label,
  value,
  max,
  detail,
}: {
  label: string;
  value: number;
  max: number;
  detail: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{label}</p>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            {detail}
          </p>
        </div>
        <p className="text-lg font-semibold">{value}</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-[color:var(--color-surface-muted)]">
        <div
          className="h-2 rounded-full bg-[color:var(--color-text-primary)]"
          style={{ width: `${progressRatio(value, max)}%` }}
        />
      </div>
    </div>
  );
}

function progressRatio(value: number, max: number) {
  return Math.round((value / Math.max(max, 1)) * 100);
}

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 100);
}
