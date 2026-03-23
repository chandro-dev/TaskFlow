import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import { hydrateInvitation } from "@/lib/application/shared/workspace-mappers";
import type { TaskflowRepository } from "@/lib/domain/repositories";

export class InvitationQueryService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(private readonly repository: TaskflowRepository) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async getInvitationByToken(token: string) {
    console.log(token);
    const invitation = await this.repository.findInvitationByToken(token);
    console.log(invitation);
    if (!invitation) {
      return null;
    }

    const snapshot = await this.snapshotLoader.load();
    return hydrateInvitation(invitation, snapshot);
  }
}
