import type {
  Board,
  BoardColumn,
  CreateInvitationInput,
  Label,
  MemberInvitation,
  Project,
  RegisterUserInput,
  RegisterUserResult,
  SystemSettings,
  Task,
  TaskComment,
  TaskHistoryEntry,
  TaskflowSnapshot,
  UserProfile,
} from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { SupabaseSingleton } from "@/lib/patterns/singleton/supabase-singleton";
import { UserRegistrationBuilder } from "@/lib/patterns/builder/user-registration-builder";
import { createUserProfileFactory } from "@/lib/patterns/factory/user-profile-factory";

interface SupabaseTaskRow {
  id: string;
  project_id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string;
  priority: Task["priority"];
  type: Task["type"];
  due_date: string;
  estimate_hours: number;
  spent_hours: number;
  assignee_ids: string[];
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: UserProfile["role"];
  avatar_initials: string | null;
  bio: string | null;
  theme_preference: UserProfile["themePreference"] | null;
  last_access_at: string;
  is_active: boolean | null;
}

interface ProjectRow {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  state: Project["state"];
  archived: boolean;
}

interface ProjectMemberRow {
  project_id: string;
  user_id: string;
}

interface BoardRow {
  id: string;
  project_id: string;
  name: string;
}

interface BoardColumnRow {
  id: string;
  board_id: string;
  name: string;
  position: number;
  color: string;
  wip_limit: number | null;
}

interface LabelRow {
  id: string;
  name: string;
  color: string;
}

interface TaskLabelRow {
  task_id: string;
  label_id: string;
}

interface CommentRow {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

interface HistoryRow {
  id: string;
  task_id: string;
  actor_id: string;
  action: string;
  occurred_at: string;
  from_column_id: string | null;
  to_column_id: string | null;
}

interface SettingsRow {
  platform_name: string | null;
  max_attachment_mb: number | null;
  password_policy: string | null;
  default_theme: SystemSettings["defaultTheme"] | null;
}

interface InvitationRow {
  id: string;
  project_id: string;
  email: string;
  role: MemberInvitation["role"];
  status: MemberInvitation["status"];
  channel: MemberInvitation["channel"];
  invited_by: string;
  token: string;
  message: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

function groupByKey<T, K extends keyof T>(
  rows: T[],
  key: K,
): Record<string, T[]> {
  return rows.reduce<Record<string, T[]>>((accumulator, row) => {
    const group = String(row[key]);
    accumulator[group] ??= [];
    accumulator[group].push(row);
    return accumulator;
  }, {});
}

function normalizeProject(
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

function normalizeBoard(row: BoardRow, columns: BoardColumn[]): Board {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    columns,
  };
}

function normalizeUser(row: ProfileRow): UserProfile {
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

function normalizeTask(
  row: SupabaseTaskRow,
  labelsByTask: Record<string, Label[]>,
  commentsByTask: Record<string, TaskComment[]>,
  historyByTask: Record<string, TaskHistoryEntry[]>,
) {
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
    labels: labelsByTask[row.id] ?? [],
    assigneeIds: row.assignee_ids ?? [],
    subtasks: [],
    comments: commentsByTask[row.id] ?? [],
    attachments: [],
    history: historyByTask[row.id] ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies Task;
}

function normalizeInvitation(row: InvitationRow): MemberInvitation {
  return {
    id: row.id,
    projectId: row.project_id,
    email: row.email,
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

export class SupabaseTaskflowRepository implements TaskflowRepository {
  async loadSnapshot(): Promise<TaskflowSnapshot> {
    const client = SupabaseSingleton.getClient();

    if (!client) {
      throw new Error("Supabase no está configurado.");
    }

    const [
      usersResult,
      projectsResult,
      boardsResult,
      columnsResult,
      projectMembersResult,
      tasksResult,
      labelsResult,
      taskLabelsResult,
      commentsResult,
      historyResult,
      invitationsResult,
      settingsResult,
    ] = await Promise.all([
      client.from("profiles").select("*"),
      client.from("projects").select("*"),
      client.from("boards").select("*"),
      client.from("board_columns").select("*"),
      client.from("project_members").select("project_id, user_id"),
      client.from("tasks").select("*"),
      client.from("labels").select("*"),
      client.from("task_labels").select("*"),
      client.from("task_comments").select("*"),
      client.from("task_history").select("*"),
      client.from("member_invitations").select("*"),
      client.from("system_settings").select("*").limit(1).maybeSingle(),
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
      commentsResult.error ||
      historyResult.error ||
      invitationsResult.error ||
      settingsResult.error
    ) {
      throw new Error("No fue posible cargar los datos desde Supabase.");
    }

    const users = ((usersResult.data ?? []) as ProfileRow[]).map(normalizeUser);
    const currentUser = users[0];
    const labelsMap = new Map(
      ((labelsResult.data ?? []) as LabelRow[]).map((row) => [
        row.id,
        { id: row.id, name: row.name, color: row.color } satisfies Label,
      ]),
    );

    const labelsByTask = groupByKey(
      (taskLabelsResult.data ?? []) as TaskLabelRow[],
      "task_id",
    );

    const hydratedLabelsByTask = Object.fromEntries(
      Object.entries(labelsByTask).map(([taskId, relations]) => [
        taskId,
        relations
          .map((relation) => labelsMap.get(relation.label_id))
          .filter(Boolean),
      ]),
    ) as Record<string, Label[]>;

    const commentsByTask = Object.fromEntries(
      Object.entries(
        groupByKey((commentsResult.data ?? []) as CommentRow[], "task_id"),
      ).map(([taskId, rows]) => [
        taskId,
        rows.map(
          (row) =>
            ({
              id: row.id,
              authorId: row.author_id,
              content: row.content,
              createdAt: row.created_at,
              updatedAt: row.updated_at ?? undefined,
            }) satisfies TaskComment,
        ),
      ]),
    );

    const historyByTask = Object.fromEntries(
      Object.entries(
        groupByKey((historyResult.data ?? []) as HistoryRow[], "task_id"),
      ).map(([taskId, rows]) => [
        taskId,
        rows.map(
          (row) =>
            ({
              id: row.id,
              actorId: row.actor_id,
              action: row.action,
              occurredAt: row.occurred_at,
              fromColumnId: row.from_column_id ?? undefined,
              toColumnId: row.to_column_id ?? undefined,
            }) satisfies TaskHistoryEntry,
        ),
      ]),
    );

    const columnsByBoard = groupByKey(
      (columnsResult.data ?? []) as BoardColumnRow[],
      "board_id",
    );
    const boardIdsByProject = groupByKey(
      (boardsResult.data ?? []) as BoardRow[],
      "project_id",
    );
    const membersByProject = groupByKey(
      (projectMembersResult.data ?? []) as ProjectMemberRow[],
      "project_id",
    );

    const boards = ((boardsResult.data ?? []) as BoardRow[]).map((row) =>
      normalizeBoard(
        row,
        (columnsByBoard[row.id] ?? []).map(
          (column) =>
            ({
              id: column.id,
              boardId: column.board_id,
              name: column.name,
              order: column.position,
              color: column.color,
              wipLimit: column.wip_limit ?? undefined,
            }) satisfies BoardColumn,
        ),
      ),
    );

    const settings: SystemSettings = {
      platformName: (settingsResult.data as SettingsRow | null)?.platform_name ?? "Taskflow",
      maxAttachmentMb:
        (settingsResult.data as SettingsRow | null)?.max_attachment_mb ?? 10,
      passwordPolicy:
        (settingsResult.data as SettingsRow | null)?.password_policy ??
        "Mínimo 10 caracteres, mayúscula, número y símbolo.",
      defaultTheme:
        (settingsResult.data as SettingsRow | null)?.default_theme ?? "light",
    };

    return {
      currentUser,
      users,
      settings,
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
        normalizeTask(row, hydratedLabelsByTask, commentsByTask, historyByTask),
      ),
      invitations: ((invitationsResult.data ?? []) as InvitationRow[]).map(
        normalizeInvitation,
      ),
    };
  }

  async registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
    const client = SupabaseSingleton.getClient();

    if (!client) {
      throw new Error("Supabase no esta configurado.");
    }

    const registration = new UserRegistrationBuilder(input)
      .normalize()
      .validate()
      .build();

    const { data, error } = await client.auth.signUp({
      email: registration.email,
      password: registration.password,
      options: {
        data: {
          full_name: registration.name,
          role: "DEVELOPER",
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = createUserProfileFactory().create(registration);

    if (data.user?.id) {
      user.id = data.user.id;
    }

    return {
      user,
      requiresEmailConfirmation:
        !data.session || !data.user?.email_confirmed_at,
    };
  }

  async createInvitation(input: CreateInvitationInput): Promise<MemberInvitation> {
    const client = SupabaseSingleton.getClient();

    if (!client) {
      throw new Error("Supabase no esta configurado.");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await client
      .from("member_invitations")
      .insert({
        project_id: input.projectId,
        email: input.email,
        role: input.role,
        status: "PENDING",
        channel: "EMAIL",
        invited_by: input.invitedBy,
        token: crypto.randomUUID().replace(/-/g, ""),
        message: input.message ?? null,
        expires_at: expiresAt.toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error("No fue posible crear la invitacion.");
    }

    return normalizeInvitation(data as InvitationRow);
  }

  async updateInvitationStatus(input: {
    invitationId: string;
    status: "REVOKED" | "ACCEPTED" | "EXPIRED";
  }): Promise<MemberInvitation> {
    const client = SupabaseSingleton.getClient();

    if (!client) {
      throw new Error("Supabase no esta configurado.");
    }

    const updatePayload = {
      status: input.status,
      accepted_at: input.status === "ACCEPTED" ? new Date().toISOString() : null,
    };

    const { data, error } = await client
      .from("member_invitations")
      .update(updatePayload)
      .eq("id", input.invitationId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error("No fue posible actualizar la invitacion.");
    }

    if (input.status === "ACCEPTED") {
      const invitation = data as InvitationRow;
      const { data: user } = await client
        .from("profiles")
        .select("id")
        .eq("email", invitation.email)
        .maybeSingle();

      if (user?.id) {
        await client.from("project_members").upsert({
          project_id: invitation.project_id,
          user_id: user.id,
          member_role: invitation.role,
          invited_by: invitation.invited_by,
        });
      }
    }

    return normalizeInvitation(data as InvitationRow);
  }

  async resendInvitation(invitationId: string): Promise<MemberInvitation> {
    const client = SupabaseSingleton.getClient();

    if (!client) {
      throw new Error("Supabase no esta configurado.");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await client
      .from("member_invitations")
      .update({
        status: "PENDING",
        accepted_at: null,
        token: crypto.randomUUID().replace(/-/g, ""),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", invitationId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error("No fue posible reenviar la invitacion.");
    }

    return normalizeInvitation(data as InvitationRow);
  }

  async findInvitationByToken(token: string): Promise<MemberInvitation | null> {
    const client = SupabaseSingleton.getClient();

    if (!client) {
      throw new Error("Supabase no esta configurado.");
    }

    const { data, error } = await client
      .from("member_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      throw new Error("No fue posible consultar la invitacion.");
    }

    return data ? normalizeInvitation(data as InvitationRow) : null;
  }
}
