import type { Project, Task, TaskflowSnapshot, UserProfile } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { ProjectAccessPolicy } from "@/lib/domain/policies/project-access-policy";
import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import {
  createReportRenderer,
  type ReportDocument,
  type ReportFormat,
} from "@/lib/patterns/structural/bridge/report-renderer";

export interface ProjectReportRow {
  projectId: string;
  projectName: string;
  state: string;
  boards: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  progress: number;
  estimateHours: number;
  spentHours: number;
}

export interface WorkspaceReportView {
  generatedAt: string;
  rows: ProjectReportRow[];
  totals: {
    projects: number;
    boards: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    estimateHours: number;
    spentHours: number;
    progress: number;
  };
}

export interface RenderedReport {
  content: string;
  contentType: string;
  filename: string;
}

const reportColumns = [
  "Proyecto",
  "Estado",
  "Tableros",
  "Tareas",
  "Completadas",
  "Vencidas",
  "Avance",
  "Horas estimadas",
  "Horas ejecutadas",
];

export class ReportQueryService {
  private readonly snapshotLoader: SnapshotLoader;
  private readonly accessPolicy = new ProjectAccessPolicy();

  constructor(private readonly repository: IRepositroyFlow) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async getWorkspaceReport(currentUser?: UserProfile): Promise<WorkspaceReportView> {
    const snapshot = await this.snapshotLoader.load();
    const activeUser = currentUser ?? snapshot.currentUser;
    const visibleProjects = snapshot.projects.filter((project) =>
      this.accessPolicy.canAccess(project, activeUser),
    );
    const rows = visibleProjects.map((project) =>
      this.buildProjectReportRow(project, snapshot),
    );

    return {
      generatedAt: new Date().toISOString(),
      rows,
      totals: this.buildTotals(rows),
    };
  }

  async renderWorkspaceReport(
    format: ReportFormat,
    currentUser?: UserProfile,
  ): Promise<RenderedReport> {
    const report = await this.getWorkspaceReport(currentUser);
    const renderer = createReportRenderer(format);

    return {
      content: renderer.render(this.toDocument(report)),
      contentType: renderer.contentType,
      filename: `taskflow-report.${renderer.extension}`,
    };
  }

  private buildProjectReportRow(
    project: Project,
    snapshot: TaskflowSnapshot,
  ): ProjectReportRow {
    const boards = snapshot.boards.filter((board) => board.projectId === project.id);
    const tasks = snapshot.tasks.filter((task) => task.projectId === project.id);
    const completedTasks = tasks.filter((task) =>
      this.isTaskCompleted(task, snapshot),
    ).length;
    const overdueTasks = tasks.filter((task) => this.isTaskOverdue(task, snapshot)).length;
    const estimateHours = tasks.reduce((sum, task) => sum + task.estimateHours, 0);
    const spentHours = tasks.reduce((sum, task) => sum + task.spentHours, 0);

    return {
      projectId: project.id,
      projectName: project.name,
      state: project.state,
      boards: boards.length,
      totalTasks: tasks.length,
      completedTasks,
      overdueTasks,
      progress: Math.round((completedTasks / Math.max(tasks.length, 1)) * 100),
      estimateHours,
      spentHours,
    };
  }

  private buildTotals(rows: ProjectReportRow[]): WorkspaceReportView["totals"] {
    const totalTasks = rows.reduce((sum, row) => sum + row.totalTasks, 0);
    const completedTasks = rows.reduce((sum, row) => sum + row.completedTasks, 0);

    return {
      projects: rows.length,
      boards: rows.reduce((sum, row) => sum + row.boards, 0),
      totalTasks,
      completedTasks,
      overdueTasks: rows.reduce((sum, row) => sum + row.overdueTasks, 0),
      estimateHours: rows.reduce((sum, row) => sum + row.estimateHours, 0),
      spentHours: rows.reduce((sum, row) => sum + row.spentHours, 0),
      progress: Math.round((completedTasks / Math.max(totalTasks, 1)) * 100),
    };
  }

  private toDocument(report: WorkspaceReportView): ReportDocument {
    return {
      title: "Reporte ejecutivo Taskflow",
      generatedAt: report.generatedAt,
      summary: {
        Proyectos: report.totals.projects,
        Tableros: report.totals.boards,
        Tareas: report.totals.totalTasks,
        Completadas: report.totals.completedTasks,
        Vencidas: report.totals.overdueTasks,
        Avance: `${report.totals.progress}%`,
        "Horas estimadas": report.totals.estimateHours,
        "Horas ejecutadas": report.totals.spentHours,
      },
      columns: reportColumns,
      rows: report.rows.map((row) => ({
        Proyecto: row.projectName,
        Estado: row.state,
        Tableros: row.boards,
        Tareas: row.totalTasks,
        Completadas: row.completedTasks,
        Vencidas: row.overdueTasks,
        Avance: `${row.progress}%`,
        "Horas estimadas": row.estimateHours,
        "Horas ejecutadas": row.spentHours,
      })),
    };
  }

  private isTaskCompleted(task: Task, snapshot: TaskflowSnapshot) {
    const board = snapshot.boards.find((item) => item.id === task.boardId);
    const column = board?.columns.find((item) => item.id === task.columnId);

    return column?.name === "Completadas";
  }

  private isTaskOverdue(task: Task, snapshot: TaskflowSnapshot) {
    if (this.isTaskCompleted(task, snapshot)) {
      return false;
    }

    return new Date(task.dueDate) < new Date();
  }
}
