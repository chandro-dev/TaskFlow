import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Label,
  Subtask,
  TaskComment,
  TaskHistoryEntry,
  TaskflowSnapshot,
  UserProfile,
} from "@/lib/domain/models";
import {
  groupByKey,
  normalizeBoard,
  normalizeBoardColumn,
  normalizeComment,
  normalizeHistoryEntry,
  normalizeInvitation,
  normalizeNotification,
  normalizeProject,
  normalizeSettings,
  normalizeSubtask,
  normalizeTask,
  normalizeUser,
} from "@/lib/infrastructure/supabase/supabase-normalizers";
import type {
  BoardColumnRow,
  BoardRow,
  CommentRow,
  HistoryRow,
  InvitationRow,
  NotificationRow,
  LabelRow,
  ProfileRow,
  ProjectMemberRow,
  ProjectRow,
  SettingsRow,
  SupabaseTaskRow,
  TaskLabelRow,
  TaskSubtaskRow,
} from "@/lib/infrastructure/supabase/supabase-row-types";

export class SupabaseSnapshotQuery {
  constructor(private readonly client: SupabaseClient) {}

  async loadSnapshot(): Promise<TaskflowSnapshot> {
    const [
      usersResult,
      projectsResult,
      boardsResult,
      columnsResult,
      projectMembersResult,
      tasksResult,
      labelsResult,
      taskLabelsResult,
      taskSubtasksResult,
      commentsResult,
      historyResult,
      invitationsResult,
      notificationsResult,
      settingsResult,
    ] = await Promise.all([
      this.client.from("profiles").select("*"),
      this.client.from("projects").select("*"),
      this.client.from("boards").select("*"),
      this.client.from("board_columns").select("*"),
      this.client.from("project_members").select("project_id, user_id"),
      this.client.from("tasks").select("*"),
      this.client.from("labels").select("*"),
      this.client.from("task_labels").select("*"),
      this.client.from("task_subtasks").select("*"),
      this.client.from("task_comments").select("*"),
      this.client.from("task_history").select("*"),
      this.client.from("member_invitations").select("*"),
      this.client.from("project_notifications").select("*"),
      this.client.from("system_settings").select("*").limit(1).maybeSingle(),
    ]);

    if (
      usersResult.error ||
      projectsResult.error ||
      boardsResult.error ||
      columnsResult.error ||
      projectMembersResult.error ||
      tasksResult.error ||
      labelsResult.error ||
      taskLabelsResult.error ||
      taskSubtasksResult.error ||
      commentsResult.error ||
      historyResult.error ||
      invitationsResult.error ||
      this.isCriticalNotificationError(notificationsResult.error) ||
      settingsResult.error
    ) {
      throw new Error("No fue posible cargar los datos desde Supabase.");
    }

    const users = ((usersResult.data ?? []) as ProfileRow[]).map(normalizeUser);
    const currentUser = users[0] ?? this.fallbackUser();
    const labelsByTask = this.hydrateLabelsByTask(
      (labelsResult.data ?? []) as LabelRow[],
      (taskLabelsResult.data ?? []) as TaskLabelRow[],
    );
    const subtasksByTask = this.groupTaskSubtasks(
      (taskSubtasksResult.data ?? []) as TaskSubtaskRow[],
    );
    const commentsByTask = this.groupTaskComments((commentsResult.data ?? []) as CommentRow[]);
    const historyByTask = this.groupTaskHistory((historyResult.data ?? []) as HistoryRow[]);
    const columnsByBoard = groupByKey((columnsResult.data ?? []) as BoardColumnRow[], "board_id");
    const boardIdsByProject = groupByKey((boardsResult.data ?? []) as BoardRow[], "project_id");
    const membersByProject = groupByKey(
      (projectMembersResult.data ?? []) as ProjectMemberRow[],
      "project_id",
    );

    const boards = ((boardsResult.data ?? []) as BoardRow[]).map((row) =>
      normalizeBoard(
        row,
        (columnsByBoard[row.id] ?? []).map((column) => normalizeBoardColumn(column)),
      ),
    );

    return {
      currentUser,
      users,
      settings: normalizeSettings((settingsResult.data as SettingsRow | null) ?? null),
      projects: ((projectsResult.data ?? []) as ProjectRow[]).map((row) =>
        normalizeProject(
          row,
          [
            row.owner_id,
            ...new Set((membersByProject[row.id] ?? []).map((item) => item.user_id)),
          ],
          (boardIdsByProject[row.id] ?? []).map((item) => item.id),
        ),
      ),
      boards,
      tasks: ((tasksResult.data ?? []) as SupabaseTaskRow[]).map((row) =>
        normalizeTask(row, labelsByTask, subtasksByTask, commentsByTask, historyByTask),
      ),
      invitations: ((invitationsResult.data ?? []) as InvitationRow[]).map(
        normalizeInvitation,
      ),
      notifications: this.isCriticalNotificationError(notificationsResult.error)
        ? []
        : ((notificationsResult.data ?? []) as NotificationRow[]).map(
            normalizeNotification,
          ),
    };
  }

  private isCriticalNotificationError(error: { message?: string } | null) {
    if (!error) {
      return false;
    }

    return !error.message?.includes("project_notifications");
  }

  private hydrateLabelsByTask(labelRows: LabelRow[], taskLabelRows: TaskLabelRow[]) {
    const labelsMap = new Map(
      labelRows.map((row) => [row.id, { id: row.id, name: row.name, color: row.color } satisfies Label]),
    );
    const labelsByTask = groupByKey(taskLabelRows, "task_id");

    return Object.fromEntries(
      Object.entries(labelsByTask).map(([taskId, relations]) => [
        taskId,
        relations
          .map((relation) => labelsMap.get(relation.label_id))
          .filter((label): label is Label => Boolean(label)),
      ]),
    ) as Record<string, Label[]>;
  }

  private groupTaskComments(rows: CommentRow[]): Record<string, TaskComment[]> {
    return Object.fromEntries(
      Object.entries(groupByKey(rows, "task_id")).map(([taskId, taskRows]) => [
        taskId,
        taskRows.map((row) => normalizeComment(row)),
      ]),
    );
  }

  private groupTaskSubtasks(rows: TaskSubtaskRow[]): Record<string, Subtask[]> {
    return Object.fromEntries(
      Object.entries(groupByKey(rows, "task_id")).map(([taskId, taskRows]) => [
        taskId,
        taskRows.map((row) => normalizeSubtask(row)),
      ]),
    );
  }

  private groupTaskHistory(rows: HistoryRow[]): Record<string, TaskHistoryEntry[]> {
    return Object.fromEntries(
      Object.entries(groupByKey(rows, "task_id")).map(([taskId, taskRows]) => [
        taskId,
        taskRows.map((row) => normalizeHistoryEntry(row)),
      ]),
    );
  }

  private fallbackUser(): UserProfile {
    return {
      id: "system-user",
      name: "System User",
      email: "system@taskflow.dev",
      role: "ADMIN",
      avatar: "SY",
      bio: "Usuario tecnico de respaldo.",
      lastAccess: new Date().toISOString(),
      themePreference: "light",
      isActive: true,
    };
  }
}
