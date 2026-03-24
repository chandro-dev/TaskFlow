import type {
  Label,
  Task,
  TaskAttachment,
  TaskComment,
  TaskHistoryEntry,
} from "@/lib/domain/models";

// Pattern traceability: Builder.
// Tasks are assembled in several steps (assignees, labels, history, subtasks),
// so this builder keeps that incremental construction out of services.
export class TaskBuilder {
  private readonly draft: Task;

  constructor(baseTask: Task) {
    this.draft = structuredClone(baseTask);
  }

  withLabel(label: Label) {
    this.draft.labels.push(label);
    return this;
  }

  withAssignee(userId: string) {
    if (!this.draft.assigneeIds.includes(userId)) {
      this.draft.assigneeIds.push(userId);
    }

    return this;
  }

  withSubtask(title: string, isCompleted = false) {
    this.draft.subtasks.push({
      id: crypto.randomUUID(),
      title,
      isCompleted,
    });

    return this;
  }

  withComment(comment: Omit<TaskComment, "id">) {
    this.draft.comments.push({
      id: crypto.randomUUID(),
      ...comment,
    });

    return this;
  }

  withAttachment(attachment: Omit<TaskAttachment, "id">) {
    this.draft.attachments.push({
      id: crypto.randomUUID(),
      ...attachment,
    });

    return this;
  }

  withHistory(entry: Omit<TaskHistoryEntry, "id">) {
    this.draft.history.push({
      id: crypto.randomUUID(),
      ...entry,
    });

    return this;
  }

  build() {
    this.draft.updatedAt = new Date().toISOString();
    return structuredClone(this.draft);
  }
}
