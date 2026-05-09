import type { BoardTaskView, Task, TaskflowSnapshot } from "@/lib/domain/models";
import { createTaskWorkComposite } from "@/lib/patterns/structural/composite/task-work-item";

function isDoneColumn(columnId: string) {
  return ["column-done", "column-archive-done", "column-mobile-done"].includes(
    columnId,
  );
}

export class BoardTaskDecorator {
  constructor(
    private readonly task: Task,
    private readonly snapshot: TaskflowSnapshot,
    private readonly now: Date = new Date(),
  ) {}

  decorate(): BoardTaskView {
    const composite = createTaskWorkComposite(this.task);

    return {
      ...this.task,
      assignees: this.snapshot.users.filter((user) =>
        this.task.assigneeIds.includes(user.id),
      ),
      isOverdue:
        new Date(this.task.dueDate) < this.now && !isDoneColumn(this.task.columnId),
      subtaskProgress: composite.progress(),
    };
  }
}

export function decorateBoardTask(
  task: Task,
  snapshot: TaskflowSnapshot,
  now?: Date,
) {
  return new BoardTaskDecorator(task, snapshot, now).decorate();
}
