import type {
  BoardPageView,
  BoardTaskView,
  CreateInvitationInput,
  Label,
  MemberInvitation,
  Project,
  ProjectCardView,
  ProjectInvitationView,
  RegisterUserInput,
  SystemSettings,
  SettingsView,
  Task,
  TaskFilters,
  TaskflowSnapshot,
  UserProfile,
} from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { MockTaskflowRepository } from "@/lib/infrastructure/mock/mock-repository";
import { createTaskflowRepository } from "@/lib/infrastructure/repository-factory";

const FALLBACK_USER: UserProfile = {
  id: "demo-user",
  name: "Demo Admin",
  email: "demo@taskflow.dev",
  role: "ADMIN",
  avatar: "DA",
  bio: "Usuario de respaldo para entornos sin datos iniciales.",
  lastAccess: new Date().toISOString(),
  themePreference: "light",
  isActive: true,
};

const FALLBACK_SETTINGS: SystemSettings = {
  platformName: "Taskflow",
  maxAttachmentMb: 10,
  passwordPolicy: "Minimo 10 caracteres, mayuscula, numero y simbolo.",
  defaultTheme: "light",
};

function isTaskMatching(task: Task, filters: TaskFilters) {
  const query = filters.query?.trim().toLowerCase();

  if (
    query &&
    !`${task.title} ${task.description}`.toLowerCase().includes(query)
  ) {
    return false;
  }

  if (filters.assigneeId && !task.assigneeIds.includes(filters.assigneeId)) {
    return false;
  }

  if (filters.labelId && !task.labels.some((label) => label.id === filters.labelId)) {
    return false;
  }

  if (filters.priority && task.priority !== filters.priority) {
    return false;
  }

  if (filters.type && task.type !== filters.type) {
    return false;
  }

  if (filters.from && task.dueDate < filters.from) {
    return false;
  }

  if (filters.to && task.dueDate > filters.to) {
    return false;
  }

  return true;
}

function subtaskProgress(task: Task) {
  if (task.subtasks.length === 0) {
    return 0;
  }

  const completed = task.subtasks.filter((item) => item.isCompleted).length;
  return Math.round((completed / task.subtasks.length) * 100);
}

function buildProjectCard(project: Project, snapshot: TaskflowSnapshot): ProjectCardView {
  const projectTasks = snapshot.tasks.filter((task) => task.projectId === project.id);
  const completedTasks = projectTasks.filter((task) => {
    const board = snapshot.boards.find((item) => item.id === task.boardId);
    const column = board?.columns.find((item) => item.id === task.columnId);
    return column?.name === "Completadas";
  }).length;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    state: project.state,
    archived: project.archived,
    progress: (completedTasks / Math.max(projectTasks.length, 1)) * 100,
    completedTasks,
    totalTasks: projectTasks.length,
    members: snapshot.users.filter((user) => project.memberIds.includes(user.id)),
    defaultBoardId: project.boardIds[0] ?? "",
  };
}

function hydrateBoardTask(task: Task, snapshot: TaskflowSnapshot): BoardTaskView {
  return {
    ...task,
    assignees: snapshot.users.filter((user) => task.assigneeIds.includes(user.id)),
    isOverdue:
      new Date(task.dueDate) < new Date() &&
      !["column-done", "column-archive-done", "column-mobile-done"].includes(
        task.columnId,
      ),
    subtaskProgress: subtaskProgress(task),
  };
}

function hydrateInvitation(
  invitation: MemberInvitation,
  snapshot: TaskflowSnapshot,
): ProjectInvitationView {
  return {
    ...invitation,
    inviter:
      snapshot.users.find((user) => user.id === invitation.invitedBy) ?? null,
    project:
      snapshot.projects.find((project) => project.id === invitation.projectId) ?? null,
  };
}

function normalizeSnapshot(snapshot: TaskflowSnapshot): TaskflowSnapshot {
  const users = snapshot.users?.length ? snapshot.users : [FALLBACK_USER];
  const currentUser =
    snapshot.currentUser ??
    users.find((user) => user.isActive) ??
    users[0] ??
    FALLBACK_USER;

  return {
    currentUser,
    users,
    settings: snapshot.settings ?? FALLBACK_SETTINGS,
    projects: snapshot.projects ?? [],
    boards: snapshot.boards ?? [],
    tasks: snapshot.tasks ?? [],
    invitations: snapshot.invitations ?? [],
  };
}

export class TaskflowService {
  private readonly repository = createTaskflowRepository();

  private async loadSnapshotWithFallback() {
    try {
      return normalizeSnapshot(await this.repository.loadSnapshot());
    } catch {
      const fallbackRepository: TaskflowRepository = new MockTaskflowRepository();
      return normalizeSnapshot(await fallbackRepository.loadSnapshot());
    }
  }

  async getShellData() {
    const snapshot = await this.loadSnapshotWithFallback();
    const primaryProject = snapshot.projects.find((project) => !project.archived);

    return {
      currentUser: snapshot.currentUser,
      settings: snapshot.settings,
      primaryProject,
    };
  }

  async getLoginData() {
    const snapshot = await this.loadSnapshotWithFallback();

    return {
      settings: snapshot.settings,
      suggestedUser: snapshot.currentUser,
    };
  }

  async getRegisterData() {
    const snapshot = await this.loadSnapshotWithFallback();

    return {
      settings: snapshot.settings,
      passwordPolicy: snapshot.settings.passwordPolicy,
    };
  }

  async getProjectsPageData(search: { query?: string; state?: string }) {
    const snapshot = await this.loadSnapshotWithFallback();
    const query = search.query?.trim().toLowerCase();

    const filteredProjects = snapshot.projects.filter((project) => {
      const matchesQuery =
        !query ||
        `${project.name} ${project.description}`.toLowerCase().includes(query);
      const matchesState =
        !search.state || search.state === "ALL" || project.state === search.state;

      return matchesQuery && matchesState;
    });

    const selectedProject = filteredProjects[0] ?? snapshot.projects[0] ?? null;

    return {
      currentUser: snapshot.currentUser,
      settings: snapshot.settings,
      projects: filteredProjects.map((project) => buildProjectCard(project, snapshot)),
      selectedProject,
      invitations: snapshot.invitations
        .filter((invitation) =>
          selectedProject ? invitation.projectId === selectedProject.id : true,
        )
        .map((invitation) => hydrateInvitation(invitation, snapshot)),
      projectStates: [
        "ALL",
        "PLANIFICADO",
        "EN_PROGRESO",
        "PAUSADO",
        "COMPLETADO",
        "ARCHIVADO",
      ] as const,
      activeQuery: search.query ?? "",
      activeState: search.state ?? "ALL",
    };
  }

  async getBoardPageData(
    projectId: string,
    boardId: string,
    filters: TaskFilters,
  ): Promise<BoardPageView | null> {
    const snapshot = await this.loadSnapshotWithFallback();
    const project = snapshot.projects.find((item) => item.id === projectId);
    const board = snapshot.boards.find((item) => item.id === boardId);

    if (!project || !board) {
      return null;
    }

    const boardTasks = snapshot.tasks
      .filter((task) => task.projectId === projectId && task.boardId === boardId)
      .filter((task) => isTaskMatching(task, filters));

    const labels = new Map<string, Label>();
    for (const task of snapshot.tasks.filter((item) => item.projectId === projectId)) {
      for (const label of task.labels) {
        labels.set(label.id, label);
      }
    }

    return {
      project,
      board,
      columns: board.columns
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((column) => ({
          ...column,
          tasks: boardTasks
            .filter((task) => task.columnId === column.id)
            .map((task) => hydrateBoardTask(task, snapshot)),
        })),
      currentUser: snapshot.currentUser,
      users: snapshot.users.filter((user) => project.memberIds.includes(user.id)),
      availableLabels: [...labels.values()],
      filters,
    };
  }

  async getSettingsPageData(): Promise<SettingsView> {
    const snapshot = await this.loadSnapshotWithFallback();

    return {
      currentUser: snapshot.currentUser,
      settings: snapshot.settings,
      users: snapshot.users,
    };
  }

  async getSearchHighlights(projectId?: string, filters: TaskFilters = {}) {
    const snapshot = await this.loadSnapshotWithFallback();

    return snapshot.tasks
      .filter((task) => (projectId ? task.projectId === projectId : true))
      .filter((task) => isTaskMatching(task, filters))
      .slice(0, 5)
      .map((task) => ({
        ...hydrateBoardTask(task, snapshot),
        projectName:
          snapshot.projects.find((project) => project.id === task.projectId)?.name ?? "",
      }));
  }

  async getInvitationByToken(token: string) {
    const snapshot = await this.loadSnapshotWithFallback();
    const invitation =
      snapshot.invitations.find((item) => item.token === token) ?? null;

    return invitation ? hydrateInvitation(invitation, snapshot) : null;
  }

  async registerUser(input: RegisterUserInput) {
    return this.repository.registerUser(input);
  }

  async createInvitation(input: CreateInvitationInput) {
    return this.repository.createInvitation(input);
  }

  async revokeInvitation(invitationId: string) {
    return this.repository.updateInvitationStatus({
      invitationId,
      status: "REVOKED",
    });
  }

  async resendInvitation(invitationId: string) {
    return this.repository.resendInvitation(invitationId);
  }

  async acceptInvitation(token: string) {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      return null;
    }

    return this.repository.updateInvitationStatus({
      invitationId: invitation.id,
      status: "ACCEPTED",
    });
  }
}
