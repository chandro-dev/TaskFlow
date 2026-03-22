import type { TaskflowRepository } from "@/lib/domain/repositories";
import { MockTaskflowStore } from "@/lib/infrastructure/mock/mock-store";

export class MockTaskflowRepository implements TaskflowRepository {
  private readonly store = MockTaskflowStore.getInstance();

  async loadSnapshot() {
    return this.store.loadSnapshot();
  }

  async registerUser(input: Parameters<TaskflowRepository["registerUser"]>[0]) {
    return this.store.registerUser(input);
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
