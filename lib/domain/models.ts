export type UserRole = "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";

export type ThemeMode = "light" | "dark";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
export type InvitationChannel = "EMAIL";
export type NotificationKind =
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "BOARD_CREATED"
  | "TASK_CREATED"
  | "MEMBER_INVITED"
  | "MEMBER_JOINED";

export type ProjectState =
  | "PLANIFICADO"
  | "EN_PROGRESO"
  | "PAUSADO"
  | "COMPLETADO"
  | "ARCHIVADO";

export type TaskPriority = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

export type TaskType = "BUG" | "FEATURE" | "TASK" | "IMPROVEMENT";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  bio: string;
  lastAccess: string;
  themePreference: ThemeMode;
  isActive: boolean;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface TaskComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  sizeMb: number;
}

export interface TaskHistoryEntry {
  id: string;
  actorId: string;
  action: string;
  occurredAt: string;
  fromColumnId?: string;
  toColumnId?: string;
}

export interface Task {
  id: string;
  projectId: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  type: TaskType;
  dueDate: string;
  estimateHours: number;
  spentHours: number;
  labels: Label[];
  assigneeIds: string[];
  subtasks: Subtask[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  history: TaskHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  order: number;
  color: string;
  wipLimit?: number;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  columns: BoardColumn[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  state: ProjectState;
  archived: boolean;
  memberIds: string[];
  ownerId: string;
  boardIds: string[];
}

export interface SystemSettings {
  platformName: string;
  maxAttachmentMb: number;
  passwordPolicy: string;
  defaultTheme: ThemeMode;
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterUserResult {
  user: UserProfile;
  requiresEmailConfirmation: boolean;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  ownerId: string;
  state?: ProjectState;
}

export interface CreateProjectResult {
  project: Project;
  board: Board;
}

export interface UpdateProjectInput {
  projectId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  state: ProjectState;
  archived: boolean;
}

export interface CreateBoardInput {
  projectId: string;
  name: string;
}

export interface CreateTaskInput {
  projectId: string;
  boardId: string;
  actorId: string;
  columnId?: string;
  title: string;
  description: string;
  priority?: TaskPriority;
  type: TaskType;
  dueDate: string;
  estimateHours: number;
  assigneeIds?: string[];
}

export interface UpdateSystemSettingsInput {
  platformName: string;
  maxAttachmentMb: number;
  passwordPolicy: string;
  defaultTheme: ThemeMode;
}

export interface MemberInvitation {
  id: string;
  projectId: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  channel: InvitationChannel;
  invitedBy: string;
  token: string;
  message?: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNotification {
  id: string;
  projectId: string;
  recipientId: string;
  actorId?: string;
  boardId?: string;
  taskId?: string;
  kind: NotificationKind;
  title: string;
  message: string;
  linkHref: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ProjectNotificationEvent {
  kind: NotificationKind;
  projectId: string;
  actorId: string;
  boardId?: string;
  taskId?: string;
}

export interface CreateProjectNotificationInput {
  projectId: string;
  recipientId: string;
  actorId?: string;
  boardId?: string;
  taskId?: string;
  kind: NotificationKind;
  title: string;
  message: string;
  linkHref: string;
}

export interface TaskFilters {
  query?: string;
  assigneeId?: string;
  labelId?: string;
  priority?: TaskPriority | "";
  type?: TaskType | "";
  from?: string;
  to?: string;
}

export interface TaskflowSnapshot {
  currentUser: UserProfile;
  users: UserProfile[];
  settings: SystemSettings;
  projects: Project[];
  boards: Board[];
  tasks: Task[];
  invitations: MemberInvitation[];
  notifications: ProjectNotification[];
}

export interface ProjectCardView {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  state: ProjectState;
  archived: boolean;
  ownerId: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  members: UserProfile[];
  defaultBoardId: string;
  canManage: boolean;
}

export interface BoardTaskView extends Task {
  assignees: UserProfile[];
  isOverdue: boolean;
  subtaskProgress: number;
}

export interface BoardColumnView extends BoardColumn {
  tasks: BoardTaskView[];
}

export interface BoardPageView {
  project: Project;
  board: Board;
  projectBoards: Board[];
  columns: BoardColumnView[];
  currentUser: UserProfile;
  users: UserProfile[];
  availableLabels: Label[];
  filters: TaskFilters;
}

export interface BoardSummaryView {
  id: string;
  projectId: string;
  name: string;
  columnsCount: number;
  totalTasks: number;
  completedTasks: number;
}

export interface ProjectBoardGroupView {
  project: ProjectCardView;
  boards: BoardSummaryView[];
}

export interface BoardsPageView {
  currentUser: UserProfile;
  groups: ProjectBoardGroupView[];
}

export interface ProjectNotificationView extends ProjectNotification {
  project: Project | null;
  actor: UserProfile | null;
}

export interface NotificationCenterView {
  notifications: ProjectNotificationView[];
  unreadCount: number;
}

export interface SettingsView {
  currentUser: UserProfile;
  settings: SystemSettings;
  users: UserProfile[];
}

export interface ProjectInvitationView extends MemberInvitation {
  inviter: UserProfile | null;
  project: Project | null;
}

export interface CreateInvitationInput {
  projectId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  message?: string;
}

export interface InvitationDraft {
  projectId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  message?: string;
}

export interface UpdateInvitationStatusInput {
  invitationId: string;
  status: Extract<InvitationStatus, "REVOKED" | "ACCEPTED" | "EXPIRED">;
}
