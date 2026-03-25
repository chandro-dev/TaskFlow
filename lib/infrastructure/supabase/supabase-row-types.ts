import type {
  MemberInvitation,
  ProjectNotification,
  Project,
  Subtask,
  SystemSettings,
  Task,
  UserProfile,
} from "@/lib/domain/models";

export interface SupabaseTaskRow {
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
  cloned_from_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
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

export interface ProjectRow {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  state: Project["state"];
  archived: boolean;
}

export interface ProjectMemberRow {
  project_id: string;
  user_id: string;
  member_role: UserProfile["role"];
  invited_by: string | null;
}

export interface BoardRow {
  id: string;
  project_id: string;
  name: string;
}

export interface BoardColumnRow {
  id: string;
  board_id: string;
  name: string;
  position: number;
  color: string;
  wip_limit: number | null;
}

export interface LabelRow {
  id: string;
  name: string;
  color: string;
}

export interface TaskLabelRow {
  task_id: string;
  label_id: string;
}

export interface TaskSubtaskRow {
  id: string;
  task_id: string;
  title: string;
  is_completed: Subtask["isCompleted"];
}

export interface CommentRow {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

export interface HistoryRow {
  id: string;
  task_id: string;
  actor_id: string;
  action: string;
  occurred_at: string;
  from_column_id: string | null;
  to_column_id: string | null;
}

export interface SettingsRow {
  platform_name: string | null;
  max_attachment_mb: number | null;
  password_policy: string | null;
  default_theme: SystemSettings["defaultTheme"] | null;
}

export interface InvitationRow {
  id: string;
  project_id: string;
  invited_user_id: string;
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

export interface NotificationRow {
  id: string;
  project_id: string;
  recipient_id: string;
  actor_id: string | null;
  board_id: string | null;
  task_id: string | null;
  kind: ProjectNotification["kind"];
  title: string;
  message: string;
  link_href: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}
