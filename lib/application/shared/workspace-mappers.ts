import type {
  Board,
  BoardSummaryView,
  BoardTaskView,
  Label,
  MemberInvitation,
  Project,
  ProjectCardView,
  ProjectInvitationView,
  Task,
  TaskFilters,
  TaskflowSnapshot,
  UserProfile,
} from "@/lib/domain/models";
import { ProjectAccessPolicy } from "@/lib/domain/policies/project-access-policy";

const projectAccessPolicy = new ProjectAccessPolicy();

export function isTaskMatching(task: Task, filters: TaskFilters) {
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

export function buildProjectCard(
  project: Project,
  snapshot: TaskflowSnapshot,
  currentUser: UserProfile,
): ProjectCardView {
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
    startDate: project.startDate,
    endDate: project.endDate,
    state: project.state,
    archived: project.archived,
    ownerId: project.ownerId,
    progress: (completedTasks / Math.max(projectTasks.length, 1)) * 100,
    completedTasks,
    totalTasks: projectTasks.length,
    members: snapshot.users.filter((user) => project.memberIds.includes(user.id)),
    defaultBoardId: project.boardIds[0] ?? "",
    canManage: projectAccessPolicy.canManage(project, currentUser),
  };
}

export function hydrateBoardTask(
  task: Task,
  snapshot: TaskflowSnapshot,
): BoardTaskView {
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

export function buildBoardSummary(
  board: Board,
  snapshot: TaskflowSnapshot,
): BoardSummaryView {
  const boardTasks = snapshot.tasks.filter((task) => task.boardId === board.id);
  const completedTasks = boardTasks.filter((task) => {
    const column = board.columns.find((item) => item.id === task.columnId);
    return column?.name === "Completadas";
  }).length;

  return {
    id: board.id,
    projectId: board.projectId,
    name: board.name,
    columnsCount: board.columns.length,
    totalTasks: boardTasks.length,
    completedTasks,
  };
}

export function collectProjectLabels(snapshot: TaskflowSnapshot, projectId: string) {
  const labels = new Map<string, Label>();

  for (const task of snapshot.tasks.filter((item) => item.projectId === projectId)) {
    for (const label of task.labels) {
      labels.set(label.id, label);
    }
  }

  return [...labels.values()];
}

export function hydrateInvitation(
  invitation: MemberInvitation,
  snapshot: TaskflowSnapshot,
): ProjectInvitationView {
  return {
    ...invitation,
    inviter: snapshot.users.find((user) => user.id === invitation.invitedBy) ?? null,
    project:
      snapshot.projects.find((project) => project.id === invitation.projectId) ?? null,
  };
}
