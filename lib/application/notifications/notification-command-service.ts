import type { TaskflowRepository } from "@/lib/domain/repositories";

export class NotificationCommandService {
  constructor(private readonly repository: TaskflowRepository) {}

  async markNotificationRead(notificationId: string, recipientId: string) {
    return this.repository.markNotificationRead(notificationId, recipientId);
  }

  async markAllNotificationsRead(recipientId: string) {
    await this.repository.markAllNotificationsRead(recipientId);
  }

  async clearNotifications(recipientId: string) {
    await this.repository.clearNotifications(recipientId);
  }
}
