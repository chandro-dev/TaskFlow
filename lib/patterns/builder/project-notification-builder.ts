import type {
  CreateProjectNotificationInput,
  ProjectNotification,
} from "@/lib/domain/models";

export class ProjectNotificationBuilder {
  private readonly draft: CreateProjectNotificationInput;
  private readAt?: string;
  private isRead = false;

  constructor(input: CreateProjectNotificationInput) {
    this.draft = structuredClone(input);
  }

  normalize() {
    this.draft.title = this.draft.title.trim();
    this.draft.message = this.draft.message.trim();
    this.draft.linkHref = this.draft.linkHref.trim();
    return this;
  }

  asRead(readAt = new Date().toISOString()) {
    this.isRead = true;
    this.readAt = readAt;
    return this;
  }

  build(id: string, createdAt = new Date().toISOString()): ProjectNotification {
    return {
      id,
      projectId: this.draft.projectId,
      recipientId: this.draft.recipientId,
      actorId: this.draft.actorId,
      boardId: this.draft.boardId,
      taskId: this.draft.taskId,
      kind: this.draft.kind,
      title: this.draft.title,
      message: this.draft.message,
      linkHref: this.draft.linkHref,
      isRead: this.isRead,
      readAt: this.readAt,
      createdAt,
    };
  }
}
