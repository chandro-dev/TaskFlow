import type { Task, TaskSubtaskInput, UpdateTaskInput } from "@/lib/domain/models";

export class TaskUpdateBuilder {
  private readonly draft: Task;
  private readonly existingSubtaskIds: Set<string>;

  constructor(baseTask: Task) {
    this.draft = structuredClone(baseTask);
    this.existingSubtaskIds = new Set(baseTask.subtasks.map((subtask) => subtask.id));
  }

  withCoreFields(
    fields: Pick<
      UpdateTaskInput,
      | "columnId"
      | "title"
      | "description"
      | "priority"
      | "type"
      | "dueDate"
      | "estimateHours"
    >,
  ) {
    this.draft.columnId = fields.columnId;
    this.draft.title = fields.title;
    this.draft.description = fields.description;
    this.draft.priority = fields.priority;
    this.draft.type = fields.type;
    this.draft.dueDate = fields.dueDate;
    this.draft.estimateHours = fields.estimateHours;
    return this;
  }

  withAssignees(assigneeIds: string[]) {
    this.draft.assigneeIds = [...new Set(assigneeIds)];
    return this;
  }

  withSubtasks(subtasks: TaskSubtaskInput[]) {
    // Existing checklist ids are preserved when possible so the edited task
    // keeps a stable subtask identity instead of recreating every row blindly.
    this.draft.subtasks = subtasks.map((subtask) => ({
      id:
        subtask.id && this.existingSubtaskIds.has(subtask.id)
          ? subtask.id
          : crypto.randomUUID(),
      title: subtask.title.trim(),
      isCompleted: subtask.isCompleted,
    }));
    return this;
  }

  build() {
    this.draft.updatedAt = new Date().toISOString();
    return structuredClone(this.draft);
  }
}
