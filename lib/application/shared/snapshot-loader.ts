import type { TaskflowSnapshot } from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { MockTaskflowRepository } from "@/lib/infrastructure/mock/mock-repository";
import {
  FALLBACK_SETTINGS,
  FALLBACK_USER,
} from "@/lib/application/shared/workspace-fallbacks";

function normalizeSnapshot(snapshot: TaskflowSnapshot): TaskflowSnapshot {
  const users = snapshot.users?.length ? snapshot.users : [FALLBACK_USER];
  const currentUser =
    snapshot.currentUser ??
    users.find((user) => user.isActive) ??
    users[0] ??
    FALLBACK_USER;

  return {
    currentUser,
    users,
    settings: snapshot.settings ?? FALLBACK_SETTINGS,
    projects: snapshot.projects ?? [],
    boards: snapshot.boards ?? [],
    tasks: snapshot.tasks ?? [],
    invitations: snapshot.invitations ?? [],
    notifications: snapshot.notifications ?? [],
  };
}

export class SnapshotLoader {
  constructor(private readonly repository: TaskflowRepository) {}

  async load() {
    try {
      return normalizeSnapshot(await this.repository.loadSnapshot());
    } catch {
      const fallbackRepository = new MockTaskflowRepository();
      return normalizeSnapshot(await fallbackRepository.loadSnapshot());
    }
  }
}
