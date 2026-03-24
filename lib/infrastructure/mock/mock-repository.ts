import type { TaskflowRepository } from "@/lib/domain/repositories";
import { MockTaskflowStore } from "@/lib/infrastructure/mock/mock-store";

export class MockTaskflowRepository implements TaskflowRepository {
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

  async registerUser(input: Parameters<TaskflowRepository["registerUser"]>[0]) {
    return this.store.registerUser(input);
  }

  async createProject(input: Parameters<TaskflowRepository["createProject"]>[0]) {
    return this.store.createProject(input);
  }

  async updateProject(input: Parameters<TaskflowRepository["updateProject"]>[0]) {
    return this.store.updateProject(input);
  }

  async deleteProject(projectId: string) {
    return this.store.deleteProject(projectId);
  }

  async createBoard(input: Parameters<TaskflowRepository["createBoard"]>[0]) {
    return this.store.createBoard(input);
  }

  async createTask(input: Parameters<TaskflowRepository["createTask"]>[0]) {
    return this.store.createTask(input);
  }

  async moveTask(input: Parameters<TaskflowRepository["moveTask"]>[0]) {
    return this.store.moveTask(input);
  }

  async createNotifications(
    input: Parameters<TaskflowRepository["createNotifications"]>[0],
  ) {
    return this.store.createNotifications(input);
  }

  async markNotificationRead(notificationId: string, recipientId: string) {
    return this.store.markNotificationRead(notificationId, recipientId);
  }

  async markAllNotificationsRead(recipientId: string) {
    return this.store.markAllNotificationsRead(recipientId);
  }

  async updateSettings(input: Parameters<TaskflowRepository["updateSettings"]>[0]) {
    return this.store.updateSettings(input);
  }

  async createInvitation(input: Parameters<TaskflowRepository["createInvitation"]>[0]) {
    return this.store.createInvitation(input);
  }

  async updateInvitationStatus(
    input: Parameters<TaskflowRepository["updateInvitationStatus"]>[0],
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
