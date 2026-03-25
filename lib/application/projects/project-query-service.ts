import type {
  BoardPageView,
  TaskFilters,
  UserProfile,
} from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import {
  buildProjectMembers,
  buildProjectCard,
  collectProjectLabels,
  hydrateBoardTask,
  isTaskMatching,
} from "@/lib/application/shared/workspace-mappers";

export class ProjectQueryService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(repository: TaskflowRepository) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async getProjectsPageData(
    search: { query?: string; state?: string },
    currentUser?: UserProfile,
  ) {
    const snapshot = await this.snapshotLoader.load();
    const activeUser = currentUser ?? snapshot.currentUser;
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
      users: snapshot.users,
      projects: filteredProjects.map((project) =>
        buildProjectCard(project, snapshot, activeUser),
      ),
      selectedProject,
      selectedProjectBoards: selectedProject
        ? snapshot.boards.filter((board) => board.projectId === selectedProject.id)
        : [],
      invitations: snapshot.invitations
        .filter((invitation) =>
          filteredProjects.some((project) => project.id === invitation.projectId),
        )
        .filter((invitation) => invitation.status !== "REVOKED")
        .map((invitation) => ({
          ...invitation,
          inviter:
            snapshot.users.find((user) => user.id === invitation.invitedBy) ?? null,
          invitedUser:
            snapshot.users.find(
              (user) => user.id === invitation.invitedUserId,
            ) ?? null,
          project:
            snapshot.projects.find(
              (project) => project.id === invitation.projectId,
            ) ?? null,
        })),
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
    currentUser?: UserProfile,
  ): Promise<BoardPageView | null> {
    const snapshot = await this.snapshotLoader.load();
    const activeUser = currentUser ?? snapshot.currentUser;
    const project = snapshot.projects.find((item) => item.id === projectId);
    const board = snapshot.boards.find((item) => item.id === boardId);

    if (!project || !board) {
      return null;
    }

    const boardTasks = snapshot.tasks
      .filter((task) => task.projectId === projectId && task.boardId === boardId)
      .filter((task) => isTaskMatching(task, filters));

    return {
      project,
      board,
      projectBoards: snapshot.boards.filter((item) => item.projectId === projectId),
      columns: board.columns
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((column) => ({
          ...column,
          tasks: boardTasks
            .filter((task) => task.columnId === column.id)
            .map((task) => hydrateBoardTask(task, snapshot)),
        })),
      currentUser: activeUser,
      users: snapshot.users.filter((user) => project.memberIds.includes(user.id)),
      projectMembers: buildProjectMembers(project, snapshot),
      availableLabels: collectProjectLabels(snapshot, projectId),
      filters,
    };
  }

  async getSearchHighlights(projectId?: string, filters: TaskFilters = {}) {
    const snapshot = await this.snapshotLoader.load();

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
}
