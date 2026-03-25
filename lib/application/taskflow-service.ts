import type {
  CloneTaskRequestInput,
  CreateBoardInput,
  CreateInvitationInput,
  CreateProjectInput,
  CreateTaskInput,
  MoveTaskInput,
  TaskFilters,
  ThemeMode,
  UpdateTaskInput,
  UpdateProjectInput,
  UpdateSystemSettingsInput,
  UserProfile,
} from "@/lib/domain/models";
import type { PasswordAuthInput } from "@/lib/domain/auth-provider";
import { createApplicationServices } from "@/lib/application/application-service-factory";
import { createTaskflowRepository } from "@/lib/infrastructure/repository-factory";
import type { IRepositroyFlow } from "@/lib/domain/repositories";

export class TaskflowService {
  private readonly repository: IRepositroyFlow;
  private readonly services: ReturnType<typeof createApplicationServices>;

  constructor(repository: IRepositroyFlow = createTaskflowRepository()) {
    // This facade keeps route handlers thin. They talk to one entry point while
    // the real work stays split into focused application services.
    this.repository = repository;
    this.services = createApplicationServices(this.repository);
  }

  async getShellData() {
    return this.services.workspaceQueries.getShellData();
  }

  async getNotificationCenter(currentUser?: UserProfile) {
    return this.services.notificationQueries.getNotificationCenter(currentUser);
  }

  async getLoginData() {
    return this.services.authQueries.getLoginData();
  }

  async getRegisterData() {
    return this.services.authQueries.getRegisterData();
  }

  async createProject(input: Omit<CreateProjectInput, "ownerId">, ownerId: string) {
    return this.services.projectCommands.createProject(input, ownerId);
  }

  async updateProject(input: UpdateProjectInput, actorId: string) {
    return this.services.projectCommands.updateProject(input, actorId);
  }

  async deleteProject(projectId: string) {
    return this.services.projectCommands.deleteProject(projectId);
  }

  async removeProjectMember(projectId: string, memberId: string) {
    return this.services.projectCommands.removeProjectMember(projectId, memberId);
  }

  async updateProjectMemberRole(
    projectId: string,
    memberId: string,
    memberRole: "PROJECT_MANAGER" | "DEVELOPER",
  ) {
    return this.services.projectCommands.updateProjectMemberRole(
      projectId,
      memberId,
      memberRole,
    );
  }

  async createBoard(input: CreateBoardInput, actorId: string) {
    return this.services.boardCommands.createBoard(input, actorId);
  }

  async createTask(input: CreateTaskInput) {
    return this.services.taskCommands.createTask(input);
  }

  async updateTask(input: UpdateTaskInput) {
    return this.services.taskUpdates.updateTask(input);
  }

  async moveTask(input: MoveTaskInput) {
    return this.services.taskMoves.moveTask(input);
  }

  async cloneTask(input: CloneTaskRequestInput) {
    return this.services.taskClones.cloneTask(input);
  }

  async getProjectsPageData(
    search: { query?: string; state?: string },
    currentUser?: UserProfile,
  ) {
    return this.services.projectQueries.getProjectsPageData(search, currentUser);
  }

  async getBoardPageData(
    projectId: string,
    boardId: string,
    filters: TaskFilters,
    currentUser?: UserProfile,
  ) {
    return this.services.projectQueries.getBoardPageData(
      projectId,
      boardId,
      filters,
      currentUser,
    );
  }

  async getSettingsPageData() {
    return this.services.workspaceQueries.getSettingsPageData();
  }

  async getBoardsPageData(currentUser?: UserProfile) {
    return this.services.workspaceQueries.getBoardsPageData(currentUser);
  }

  async updateSettings(input: UpdateSystemSettingsInput) {
    return this.services.settingsCommands.updateSettings(input);
  }

  async updateThemePreference(userId: string, mode: ThemeMode) {
    return this.services.themePreferenceCommands.updateThemePreference(userId, mode);
  }

  async markNotificationRead(notificationId: string, recipientId: string) {
    return this.services.notificationCommands.markNotificationRead(
      notificationId,
      recipientId,
    );
  }

  async markAllNotificationsRead(recipientId: string) {
    return this.services.notificationCommands.markAllNotificationsRead(recipientId);
  }

  async clearNotifications(recipientId: string) {
    return this.services.notificationCommands.clearNotifications(recipientId);
  }

  async getSearchHighlights(projectId?: string, filters: TaskFilters = {}) {
    return this.services.projectQueries.getSearchHighlights(projectId, filters);
  }

  async getInvitationByToken(token: string) {
    return this.services.invitationQueries.getInvitationByToken(token);
  }

  async registerUser(input: Parameters<IRepositroyFlow["registerUser"]>[0]) {
    return this.services.authCommands.registerUser(input);
  }

  async login(input: PasswordAuthInput) {
    return this.services.sessionCommands.login(input);
  }

  async createInvitation(input: CreateInvitationInput) {
    return this.services.invitationCommands.createInvitation(input);
  }

  async createInvitations(
    input: Omit<CreateInvitationInput, "invitedUserId"> & { invitedUserIds: string[] },
  ) {
    return this.services.invitationCommands.createInvitations(input);
  }

  async revokeInvitation(invitationId: string) {
    return this.services.invitationCommands.revokeInvitation(invitationId);
  }

  async resendInvitation(invitationId: string) {
    return this.services.invitationCommands.resendInvitation(invitationId);
  }

  async acceptInvitation(token: string) {
    return this.services.invitationCommands.acceptInvitation(token);
  }
}
