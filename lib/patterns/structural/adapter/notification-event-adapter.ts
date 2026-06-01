import type {
  CreateProjectNotificationInput,
  ProjectNotificationEvent,
  TaskflowSnapshot,
} from "@/lib/domain/models";
import { createNotificationComposer } from "@/lib/patterns/factory/notification-composer-factory";

export class NotificationEventAdapter {
  toNotificationInputs(
    event: ProjectNotificationEvent,
    snapshot: TaskflowSnapshot,
  ): CreateProjectNotificationInput[] {
    return createNotificationComposer(event.kind).compose(event, snapshot);
  }
}
