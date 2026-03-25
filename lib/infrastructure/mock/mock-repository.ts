import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { MockTaskflowStore } from "@/lib/infrastructure/mock/mock-store";

export class MockTaskflowRepository implements IRepositroyFlow {
  private readonly store = MockTaskflowStore.getInstance();

  async loadSnapshot() {
    return this.store.loadSnapshot();
  }

  async findUserById(userId: string) {
    return this.store.findUserById(userId);
  }

  async findUserByEmail(email: string) {
    return this.store.findUserByEmail(email);
  }

  async registerUser(input: Parameters<IRepositroyFlow["registerUser"]>[0]) {
    return this.store.registerUser(input);
  }

  async createProject(input: Parameters<IRepositroyFlow["createProject"]>[0]) {
    return this.store.createProject(input);
  }

  async updateProject(input: Parameters<IRepositroyFlow["updateProject"]>[0]) {
    return this.store.updateProject(input);
  }

  async deleteProject(projectId: string) {
    return this.store.deleteProject(projectId);
  }

  async removeProjectMember(projectId: string, memberId: string) {
    return this.store.removeProjectMember(projectId, memberId);
  }

  async updateProjectMemberRole(
    projectId: string,
    memberId: string,
    memberRole: Parameters<IRepositroyFlow["updateProjectMemberRole"]>[2],
  ) {
    return this.store.updateProjectMemberRole(projectId, memberId, memberRole);
  }

  async createBoard(input: Parameters<IRepositroyFlow["createBoard"]>[0]) {
    return this.store.createBoard(input);
  }

  async createTask(input: Parameters<IRepositroyFlow["createTask"]>[0]) {
    return this.store.createTask(input);
  }

  async updateTask(input: Parameters<IRepositroyFlow["updateTask"]>[0]) {
    return this.store.updateTask(input);
  }

  async deleteTask(input: Parameters<IRepositroyFlow["deleteTask"]>[0]) {
    return this.store.deleteTask(input);
  }

  async cloneTask(input: Parameters<IRepositroyFlow["cloneTask"]>[0]) {
    return this.store.cloneTask(input);
  }

  async moveTask(input: Parameters<IRepositroyFlow["moveTask"]>[0]) {
    return this.store.moveTask(input);
  }

  async createNotifications(
    input: Parameters<IRepositroyFlow["createNotifications"]>[0],
  ) {
    return this.store.createNotifications(input);
  }

  async markNotificationRead(notificationId: string, recipientId: string) {
    return this.store.markNotificationRead(notificationId, recipientId);
  }

  async markAllNotificationsRead(recipientId: string) {
    return this.store.markAllNotificationsRead(recipientId);
  }

  async clearNotifications(recipientId: string) {
    return this.store.clearNotifications(recipientId);
  }

  async updateSettings(input: Parameters<IRepositroyFlow["updateSettings"]>[0]) {
    return this.store.updateSettings(input);
  }

  async updateUserThemePreference(
    userId: string,
    mode: Parameters<IRepositroyFlow["updateUserThemePreference"]>[1],
  ) {
    return this.store.updateUserThemePreference(userId, mode);
  }

  async createInvitation(input: Parameters<IRepositroyFlow["createInvitation"]>[0]) {
    return this.store.createInvitation(input);
  }

  async updateInvitationStatus(
    input: Parameters<IRepositroyFlow["updateInvitationStatus"]>[0],
  ) {
    return this.store.updateInvitationStatus(input);
  }

  async resendInvitation(invitationId: string) {
    return this.store.resendInvitation(invitationId);
  }

  async findInvitationByToken(token: string) {
    return this.store.findInvitationByToken(token);
  }
}
