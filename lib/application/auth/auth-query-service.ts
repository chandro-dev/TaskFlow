import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { hasConfiguredSupabaseAuth } from "@/lib/infrastructure/auth/auth-mode";

export class AuthQueryService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(repository: TaskflowRepository) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async getLoginData() {
    const snapshot = await this.snapshotLoader.load();
    const usesSupabaseAuth = hasConfiguredSupabaseAuth();

    return {
      settings: snapshot.settings,
      suggestedUser: usesSupabaseAuth ? null : snapshot.currentUser,
      usesSupabaseAuth,
    };
  }

  async getRegisterData() {
    const snapshot = await this.snapshotLoader.load();

    return {
      settings: snapshot.settings,
      passwordPolicy: snapshot.settings.passwordPolicy,
    };
  }
}
