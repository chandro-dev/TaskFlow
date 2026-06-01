import {
  buildBoardSummary,
  buildProjectCard,
} from "@/lib/application/shared/workspace-mappers";
import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import type { BoardsPageView, SettingsView, UserProfile } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";

export class WorkspaceQueryService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(repository: IRepositroyFlow) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async getShellData() {
    const snapshot = await this.snapshotLoader.load();
    const primaryProject = snapshot.projects.find((project) => !project.archived);

    return {
      currentUser: snapshot.currentUser,
      settings: snapshot.settings,
      primaryProject,
    };
  }

  async getBoardsPageData(currentUser?: UserProfile): Promise<BoardsPageView> {
    const snapshot = await this.snapshotLoader.load();
    const activeUser = currentUser ?? snapshot.currentUser;

    return {
      currentUser: activeUser,
      groups: snapshot.projects.map((project) => ({
        project: buildProjectCard(project, snapshot, activeUser),
        boards: snapshot.boards
          .filter((board) => board.projectId === project.id)
          .map((board) => buildBoardSummary(board, snapshot)),
      })),
    };
  }

  async getSettingsPageData(): Promise<SettingsView> {
    const snapshot = await this.snapshotLoader.load();

    return {
      currentUser: snapshot.currentUser,
      settings: snapshot.settings,
      users: snapshot.users,
    };
  }
}
