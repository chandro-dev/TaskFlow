import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import type {
  CreateProjectNotificationInput,
  ProjectNotificationEvent,
} from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { createNotificationComposer } from "@/lib/patterns/factory/notification-composer-factory";
import type { ProjectEventSubscriber } from "@/lib/patterns/observer/project-event-publisher";

export class ProjectNotificationSubscriber implements ProjectEventSubscriber {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(private readonly repository: IRepositroyFlow) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async handle(event: ProjectNotificationEvent) {
    const snapshot = await this.snapshotLoader.load();
    // Factory Method resolves the composer that knows how to translate this
    // event kind into user-facing notification payloads.
    const notifications = createNotificationComposer(event.kind).compose(
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
