import type { ProjectNotificationEvent } from "@/lib/domain/models";

export interface ProjectEventSubscriber {
  handle(event: ProjectNotificationEvent): Promise<void>;
}

// Pattern traceability: Observer.
// Command services publish project events here instead of depending directly on
// notification infrastructure.
export class ProjectEventPublisher {
  constructor(private readonly subscribers: ProjectEventSubscriber[]) {}

  async publish(event: ProjectNotificationEvent) {
    for (const subscriber of this.subscribers) {
      await subscriber.handle(event);
    }
  }
}
