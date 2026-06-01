import type {
  CreateProjectNotificationInput,
  NotificationKind,
  ProjectNotificationEvent,
  TaskflowSnapshot,
} from "@/lib/domain/models";

// Pattern traceability: Factory Method.
// Each notification kind has a dedicated composer so message/title/link rules
// stay open to extension without filling a single giant conditional service.
type NotificationComposer = {
  compose(
    event: ProjectNotificationEvent,
    snapshot: TaskflowSnapshot,
  ): CreateProjectNotificationInput[];
};

abstract class BaseNotificationComposer implements NotificationComposer {
  abstract compose(
    event: ProjectNotificationEvent,
    snapshot: TaskflowSnapshot,
  ): CreateProjectNotificationInput[];

  protected getProjectMembers(event: ProjectNotificationEvent, snapshot: TaskflowSnapshot) {
    const project = snapshot.projects.find((item) => item.id === event.projectId);
    return project?.memberIds ?? [];
  }

  protected getProjectName(event: ProjectNotificationEvent, snapshot: TaskflowSnapshot) {
    return (
      snapshot.projects.find((item) => item.id === event.projectId)?.name ?? "Proyecto"
    );
  }

  protected getBoardName(event: ProjectNotificationEvent, snapshot: TaskflowSnapshot) {
    if (!event.boardId) {
      return "Tablero";
    }

    return snapshot.boards.find((item) => item.id === event.boardId)?.name ?? "Tablero";
  }

  protected getTaskTitle(event: ProjectNotificationEvent, snapshot: TaskflowSnapshot) {
    if (!event.taskId) {
      return "Tarea";
    }

    return snapshot.tasks.find((item) => item.id === event.taskId)?.title ?? "Tarea";
  }

  protected recipientsExcludingActor(
    event: ProjectNotificationEvent,
    snapshot: TaskflowSnapshot,
  ) {
    return this.getProjectMembers(event, snapshot).filter(
      (recipientId) => recipientId !== event.actorId,
    );
  }

  protected buildNotifications(
    recipients: string[],
    event: ProjectNotificationEvent,
    title: string,
    message: string,
    linkHref: string,
  ) {
    return recipients.map(
      (recipientId): CreateProjectNotificationInput => ({
        projectId: event.projectId,
        recipientId,
        actorId: event.actorId,
        boardId: event.boardId,
        taskId: event.taskId,
        kind: event.kind,
        title,
        message,
        linkHref,
      }),
    );
  }
}

class ProjectCreatedNotificationComposer extends BaseNotificationComposer {
  compose(event: ProjectNotificationEvent, snapshot: TaskflowSnapshot) {
    const projectName = this.getProjectName(event, snapshot);
    return this.buildNotifications(
      [event.actorId],
      event,
      `Proyecto creado: ${projectName}`,
      `El proyecto ${projectName} ya esta disponible en tu workspace.`,
      "/projects",
    );
  }
}

class ProjectUpdatedNotificationComposer extends BaseNotificationComposer {
  compose(event: ProjectNotificationEvent, snapshot: TaskflowSnapshot) {
    const projectName = this.getProjectName(event, snapshot);
    return this.buildNotifications(
      this.recipientsExcludingActor(event, snapshot),
      event,
      `Cambios en ${projectName}`,
      `Se actualizaron datos clave del proyecto ${projectName}.`,
      "/projects",
    );
  }
}

class BoardCreatedNotificationComposer extends BaseNotificationComposer {
  compose(event: ProjectNotificationEvent, snapshot: TaskflowSnapshot) {
    const boardName = this.getBoardName(event, snapshot);
    const projectName = this.getProjectName(event, snapshot);
    return this.buildNotifications(
      this.recipientsExcludingActor(event, snapshot),
      event,
      `Nuevo tablero en ${projectName}`,
      `Se agrego el tablero ${boardName} al proyecto ${projectName}.`,
      event.boardId
        ? `/projects/${event.projectId}/boards/${event.boardId}`
        : "/boards",
    );
  }
}

class TaskCreatedNotificationComposer extends BaseNotificationComposer {
  compose(event: ProjectNotificationEvent, snapshot: TaskflowSnapshot) {
    const taskTitle = this.getTaskTitle(event, snapshot);
    const boardName = this.getBoardName(event, snapshot);
    return this.buildNotifications(
      this.recipientsExcludingActor(event, snapshot),
      event,
      `Nueva tarea: ${taskTitle}`,
      `Se creo la tarea ${taskTitle} dentro del tablero ${boardName}.`,
      event.boardId && event.taskId
        ? `/projects/${event.projectId}/boards/${event.boardId}?query=${encodeURIComponent(
            taskTitle,
          )}`
        : "/projects",
    );
  }
}

class MemberInvitedNotificationComposer extends BaseNotificationComposer {
  compose(event: ProjectNotificationEvent, snapshot: TaskflowSnapshot) {
    const projectName = this.getProjectName(event, snapshot);
    return this.buildNotifications(
      this.recipientsExcludingActor(event, snapshot),
      event,
      `Invitacion enviada en ${projectName}`,
      `Se envio una nueva invitacion de miembro para el proyecto ${projectName}.`,
      "/projects",
    );
  }
}

class MemberJoinedNotificationComposer extends BaseNotificationComposer {
  compose(event: ProjectNotificationEvent, snapshot: TaskflowSnapshot) {
    const projectName = this.getProjectName(event, snapshot);
    return this.buildNotifications(
      this.recipientsExcludingActor(event, snapshot),
      event,
      `Nuevo miembro en ${projectName}`,
      `Un miembro se incorporo al proyecto ${projectName}.`,
      "/projects",
    );
  }
}

export function createNotificationComposer(kind: NotificationKind): NotificationComposer {
  switch (kind) {
    case "PROJECT_CREATED":
      return new ProjectCreatedNotificationComposer();
    case "PROJECT_UPDATED":
      return new ProjectUpdatedNotificationComposer();
    case "BOARD_CREATED":
      return new BoardCreatedNotificationComposer();
    case "TASK_CREATED":
      return new TaskCreatedNotificationComposer();
    case "MEMBER_INVITED":
      return new MemberInvitedNotificationComposer();
    case "MEMBER_JOINED":
      return new MemberJoinedNotificationComposer();
    default: {
      const exhaustiveCheck: never = kind;
      throw new Error(`No existe compositor para ${exhaustiveCheck}.`);
    }
  }
}
