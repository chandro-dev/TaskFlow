import type { NotificationCenterView, UserProfile } from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";

export class NotificationQueryService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(repository: TaskflowRepository) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async getNotificationCenter(currentUser?: UserProfile): Promise<NotificationCenterView> {
    const snapshot = await this.snapshotLoader.load();
    const activeUser = currentUser ?? snapshot.currentUser;
    const notifications = snapshot.notifications
      .filter((notification) => notification.recipientId === activeUser.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 12)
      .map((notification) => ({
        ...notification,
        project:
          snapshot.projects.find((project) => project.id === notification.projectId) ??
          null,
        actor:
          (notification.actorId
            ? snapshot.users.find((user) => user.id === notification.actorId)
            : null) ?? null,
      }));

    return {
      notifications,
      unreadCount: notifications.filter((notification) => !notification.isRead).length,
    };
  }
}
