import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateProjectNotificationInput,
  ProjectNotification,
} from "@/lib/domain/models";
import { ProjectNotificationBuilder } from "@/lib/patterns/builder/project-notification-builder";
import { normalizeNotification } from "@/lib/infrastructure/supabase/supabase-normalizers";
import type { NotificationRow } from "@/lib/infrastructure/supabase/supabase-row-types";

export class SupabaseNotificationCommand {
  constructor(private readonly client: SupabaseClient) {}

  async createNotifications(
    input: CreateProjectNotificationInput[],
  ): Promise<ProjectNotification[]> {
    if (!input.length) {
      return [];
    }

    const payload = input.map((notification) =>
      new ProjectNotificationBuilder(notification).normalize().build(crypto.randomUUID()),
    );

    const { data, error } = await this.client
      .from("project_notifications")
      .insert(
        payload.map((notification) => ({
          id: notification.id,
          project_id: notification.projectId,
          recipient_id: notification.recipientId,
          actor_id: notification.actorId ?? null,
          board_id: notification.boardId ?? null,
          task_id: notification.taskId ?? null,
          kind: notification.kind,
          title: notification.title,
          message: notification.message,
          link_href: notification.linkHref,
          is_read: notification.isRead,
          read_at: notification.readAt ?? null,
          created_at: notification.createdAt,
        })),
      )
      .select("*");

    if (error) {
      throw new Error(
        error.message ?? "No fue posible persistir las notificaciones.",
      );
    }

    return ((data ?? []) as NotificationRow[]).map(normalizeNotification);
  }

  async markNotificationRead(notificationId: string, recipientId: string) {
    const { data, error } = await this.client
      .from("project_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("recipient_id", recipientId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        error?.message ?? "No fue posible marcar la notificacion como leida.",
      );
    }

    return normalizeNotification(data as NotificationRow);
  }

  async markAllNotificationsRead(recipientId: string) {
    const { error } = await this.client
      .from("project_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_id", recipientId)
      .eq("is_read", false);

    if (error) {
      throw new Error(
        error.message ?? "No fue posible marcar las notificaciones como leidas.",
      );
    }
  }
}
