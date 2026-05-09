import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import type {
  CreateProjectNotificationInput,
  ProjectNotificationEvent,
} from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import type { ProjectEventSubscriber } from "@/lib/patterns/observer/project-event-publisher";
import { NotificationEventAdapter } from "@/lib/patterns/structural/adapter/notification-event-adapter";

export class ProjectNotificationSubscriber implements ProjectEventSubscriber {
  private readonly snapshotLoader: SnapshotLoader;
  private readonly notificationAdapter = new NotificationEventAdapter();

  constructor(private readonly repository: IRepositroyFlow) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async handle(event: ProjectNotificationEvent) {
    const snapshot = await this.snapshotLoader.load();
    // Adapter translates domain events into notification persistence inputs.
    const notifications = this.notificationAdapter.toNotificationInputs(
      event,
      snapshot,
    );

    if (!notifications.length) {
      return;
    }

    const uniqueNotifications = this.deduplicate(notifications);

    if (!uniqueNotifications.length) {
      return;
    }

    await this.repository.createNotifications(uniqueNotifications);
  }

  private deduplicate(notifications: CreateProjectNotificationInput[]) {
    return notifications.filter(
      (notification, index, collection) =>
        collection.findIndex(
          (candidate) =>
            candidate.projectId === notification.projectId &&
            candidate.recipientId === notification.recipientId &&
            candidate.kind === notification.kind &&
            candidate.linkHref === notification.linkHref,
        ) === index,
    );
  }
}
