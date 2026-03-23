import { AuthCommandService } from "@/lib/application/auth/auth-command-service";
import { AuthQueryService } from "@/lib/application/auth/auth-query-service";
import { SessionCommandService } from "@/lib/application/auth/session-command-service";
import { BoardCommandService } from "@/lib/application/boards/board-command-service";
import { InvitationCommandService } from "@/lib/application/invitations/invitation-command-service";
import { InvitationQueryService } from "@/lib/application/invitations/invitation-query-service";
import { NotificationCommandService } from "@/lib/application/notifications/notification-command-service";
import { NotificationQueryService } from "@/lib/application/notifications/notification-query-service";
import { ProjectNotificationSubscriber } from "@/lib/application/notifications/project-notification-subscriber";
import { ProjectCommandService } from "@/lib/application/projects/project-command-service";
import { ProjectQueryService } from "@/lib/application/projects/project-query-service";
import { SettingsCommandService } from "@/lib/application/settings/settings-command-service";
import { TaskCommandService } from "@/lib/application/tasks/task-command-service";
import { WorkspaceQueryService } from "@/lib/application/workspace/workspace-query-service";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export function createApplicationServices(repository: TaskflowRepository) {
  const notificationPublisher = new ProjectEventPublisher([
    new ProjectNotificationSubscriber(repository),
  ]);

  return {
    authQueries: new AuthQueryService(repository),
    authCommands: new AuthCommandService(repository),
    sessionCommands: new SessionCommandService(repository),
    boardCommands: new BoardCommandService(repository, notificationPublisher),
    projectQueries: new ProjectQueryService(repository),
    projectCommands: new ProjectCommandService(repository, notificationPublisher),
    invitationQueries: new InvitationQueryService(repository),
    invitationCommands: new InvitationCommandService(repository, notificationPublisher),
    notificationQueries: new NotificationQueryService(repository),
    notificationCommands: new NotificationCommandService(repository),
    settingsCommands: new SettingsCommandService(repository),
    taskCommands: new TaskCommandService(repository, notificationPublisher),
    workspaceQueries: new WorkspaceQueryService(repository),
  };
}
