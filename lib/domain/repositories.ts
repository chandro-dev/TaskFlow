import type {
  Board,
  CreateProjectNotificationInput,
  CreateProjectInput,
  CreateProjectResult,
  CreateBoardInput,
  CreateInvitationInput,
  CreateTaskInput,
  CloneTaskInput,
  MemberInvitation,
  MoveTaskInput,
  ProjectNotification,
  Project,
  RegisterUserInput,
  RegisterUserResult,
  SystemSettings,
  TaskflowSnapshot,
  ThemeMode,
  UpdateTaskInput,
  UpdateProjectInput,
  UpdateInvitationStatusInput,
  UpdateSystemSettingsInput,
  Task,
  UserProfile,
} from "@/lib/domain/models";

export interface TaskflowRepository {
  loadSnapshot(): Promise<TaskflowSnapshot>;
  findUserById(userId: string): Promise<UserProfile | null>;
  findUserByEmail(email: string): Promise<UserProfile | null>;
  registerUser(input: RegisterUserInput): Promise<RegisterUserResult>;
  createProject(input: CreateProjectInput): Promise<CreateProjectResult>;
  updateProject(input: UpdateProjectInput): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  createBoard(input: CreateBoardInput): Promise<Board>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(input: UpdateTaskInput): Promise<Task>;
  cloneTask(input: CloneTaskInput): Promise<Task>;
  moveTask(input: MoveTaskInput): Promise<Task>;
  createNotifications(
    input: CreateProjectNotificationInput[],
  ): Promise<ProjectNotification[]>;
  markNotificationRead(
    notificationId: string,
    recipientId: string,
  ): Promise<ProjectNotification>;
  markAllNotificationsRead(recipientId: string): Promise<void>;
  updateSettings(input: UpdateSystemSettingsInput): Promise<SystemSettings>;
  updateUserThemePreference(userId: string, mode: ThemeMode): Promise<UserProfile>;
  createInvitation(input: CreateInvitationInput): Promise<MemberInvitation>;
  updateInvitationStatus(
    input: UpdateInvitationStatusInput,
  ): Promise<MemberInvitation>;
  resendInvitation(invitationId: string): Promise<MemberInvitation>;
  findInvitationByToken(token: string): Promise<MemberInvitation | null>;
}
