import type {
  Board,
  CreateProjectNotificationInput,
  CreateBoardColumnInput,
  CloneProjectInput,
  CloneProjectResult,
  CreateProjectInput,
  CreateProjectResult,
  CreateBoardInput,
  DeleteBoardColumnInput,
  CreateInvitationInput,
  CreateTaskInput,
  CloneTaskInput,
  MemberInvitation,
  MoveTaskInput,
  ProjectNotification,
  Project,
  ReorderBoardColumnsInput,
  RegisterUserInput,
  RegisterUserResult,
  SystemSettings,
  TaskflowSnapshot,
  ThemeMode,
  UpdateTaskInput,
  UpdateBoardColumnInput,
  UpdateProjectInput,
  UpdateInvitationStatusInput,
  UpdateSystemSettingsInput,
  Task,
  UserProfile,
} from "@/lib/domain/models";

export interface IRepositroyFlow {
  loadSnapshot(): Promise<TaskflowSnapshot>;
  findUserById(userId: string): Promise<UserProfile | null>;
  findUserByEmail(email: string): Promise<UserProfile | null>;
  registerUser(input: RegisterUserInput): Promise<RegisterUserResult>;
  createProject(input: CreateProjectInput): Promise<CreateProjectResult>;
  cloneProject(input: CloneProjectInput): Promise<CloneProjectResult>;
  updateProject(input: UpdateProjectInput): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  removeProjectMember(projectId: string, memberId: string): Promise<Project>;
  updateProjectMemberRole(
    projectId: string,
    memberId: string,
    memberRole: UserProfile["role"],
  ): Promise<Project>;
  createBoard(input: CreateBoardInput): Promise<Board>;
  createBoardColumn(input: CreateBoardColumnInput): Promise<Board>;
  updateBoardColumn(input: UpdateBoardColumnInput): Promise<Board>;
  reorderBoardColumns(input: ReorderBoardColumnsInput): Promise<Board>;
  deleteBoardColumn(input: DeleteBoardColumnInput): Promise<Board>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(input: UpdateTaskInput): Promise<Task>;
  deleteTask(input: { taskId: string; projectId: string; boardId: string }): Promise<void>;
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
  clearNotifications(recipientId: string): Promise<void>;
  updateSettings(input: UpdateSystemSettingsInput): Promise<SystemSettings>;
  updateUserThemePreference(userId: string, mode: ThemeMode): Promise<UserProfile>;
  createInvitation(input: CreateInvitationInput): Promise<MemberInvitation>;
  updateInvitationStatus(
    input: UpdateInvitationStatusInput,
  ): Promise<MemberInvitation>;
  resendInvitation(invitationId: string): Promise<MemberInvitation>;
  findInvitationByToken(token: string): Promise<MemberInvitation | null>;
}
