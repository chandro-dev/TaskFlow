import type {
  Board,
  BoardColumn,
  Label,
  MemberInvitation,
  ProjectNotification,
  Project,
  Subtask,
  SystemSettings,
  Task,
  TaskComment,
  TaskHistoryEntry,
  UserProfile,
} from "@/lib/domain/models";
import type {
  BoardColumnRow,
  BoardRow,
  CommentRow,
  HistoryRow,
  InvitationRow,
  NotificationRow,
  ProfileRow,
  ProjectRow,
  SettingsRow,
  SupabaseTaskRow,
  TaskSubtaskRow,
} from "@/lib/infrastructure/supabase/supabase-row-types";

export function groupByKey<T, K extends keyof T>(rows: T[], key: K): Record<string, T[]> {
  return rows.reduce<Record<string, T[]>>((accumulator, row) => {
    const group = String(row[key]);
    accumulator[group] ??= [];
    accumulator[group].push(row);
    return accumulator;
  }, {});
}

export function normalizeProject(
  row: ProjectRow,
  memberIds: string[],
  boardIds: string[],
): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    state: row.state,
    archived: row.archived,
    memberIds,
    ownerId: row.owner_id,
    boardIds,
  };
}

export function normalizeBoard(row: BoardRow, columns: BoardColumn[]): Board {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    columns,
  };
}

export function normalizeBoardColumn(row: BoardColumnRow): BoardColumn {
  return {
    id: row.id,
    boardId: row.board_id,
    name: row.name,
    order: row.position,
    color: row.color,
    wipLimit: row.wip_limit ?? undefined,
  };
}

export function normalizeUser(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    avatar: row.avatar_initials ?? row.full_name.slice(0, 2).toUpperCase(),
    bio: row.bio ?? "",
    lastAccess: row.last_access_at,
    themePreference: row.theme_preference ?? "light",
    isActive: row.is_active ?? true,
  };
}

export function normalizeComment(row: CommentRow): TaskComment {
  return {
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function normalizeHistoryEntry(row: HistoryRow): TaskHistoryEntry {
  return {
    id: row.id,
    actorId: row.actor_id,
    action: row.action,
    occurredAt: row.occurred_at,
    fromColumnId: row.from_column_id ?? undefined,
    toColumnId: row.to_column_id ?? undefined,
  };
}

export function normalizeSubtask(row: TaskSubtaskRow): Subtask {
  return {
    id: row.id,
    title: row.title,
    isCompleted: row.is_completed,
  };
}

export function normalizeTask(
  row: SupabaseTaskRow,
  labelsByTask: Record<string, Label[]>,
  subtasksByTask: Record<string, Subtask[]>,
  commentsByTask: Record<string, TaskComment[]>,
  historyByTask: Record<string, TaskHistoryEntry[]>,
): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    boardId: row.board_id,
    columnId: row.column_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    type: row.type,
    dueDate: row.due_date,
    estimateHours: row.estimate_hours,
    spentHours: row.spent_hours,
    clonedFromTaskId: row.cloned_from_task_id ?? undefined,
    labels: labelsByTask[row.id] ?? [],
    assigneeIds: row.assignee_ids ?? [],
    subtasks: subtasksByTask[row.id] ?? [],
    comments: commentsByTask[row.id] ?? [],
    attachments: [],
    history: historyByTask[row.id] ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeInvitation(row: InvitationRow): MemberInvitation {
  return {
    id: row.id,
    projectId: row.project_id,
    invitedUserId: row.invited_user_id,
    role: row.role,
    status: row.status,
    channel: row.channel,
    invitedBy: row.invited_by,
    token: row.token,
    message: row.message ?? undefined,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeNotification(row: NotificationRow): ProjectNotification {
  return {
    id: row.id,
    projectId: row.project_id,
    recipientId: row.recipient_id,
    actorId: row.actor_id ?? undefined,
    boardId: row.board_id ?? undefined,
    taskId: row.task_id ?? undefined,
    kind: row.kind,
    title: row.title,
    message: row.message,
    linkHref: row.link_href,
    isRead: row.is_read,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function normalizeSettings(row: SettingsRow | null): SystemSettings {
  return {
    platformName: row?.platform_name ?? "Taskflow",
    maxAttachmentMb: row?.max_attachment_mb ?? 10,
    passwordPolicy:
      row?.password_policy ?? "Minimo 10 caracteres, mayuscula, numero y simbolo.",
    defaultTheme: row?.default_theme ?? "light",
  };
}
