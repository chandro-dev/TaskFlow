import type { Subtask, Task } from "@/lib/domain/models";

export interface WorkItemComponent {
  id: string;
  title: string;
  completedUnits(): number;
  totalUnits(): number;
  progress(): number;
}

export class SubtaskLeaf implements WorkItemComponent {
  constructor(private readonly subtask: Subtask) {}

  get id() {
    return this.subtask.id;
  }

  get title() {
    return this.subtask.title;
  }

  completedUnits() {
    return this.subtask.isCompleted ? 1 : 0;
  }

  totalUnits() {
    return 1;
  }

  progress() {
    return this.subtask.isCompleted ? 100 : 0;
  }
}

export class TaskComposite implements WorkItemComponent {
  private readonly children: WorkItemComponent[];

  constructor(private readonly task: Task) {
    this.children = task.subtasks.map((subtask) => new SubtaskLeaf(subtask));
  }

  get id() {
    return this.task.id;
  }

  get title() {
    return this.task.title;
  }

  completedUnits() {
    return this.children.reduce((sum, child) => sum + child.completedUnits(), 0);
  }

  totalUnits() {
    return this.children.reduce((sum, child) => sum + child.totalUnits(), 0);
  }

  progress() {
    const total = this.totalUnits();

    if (total === 0) {
      return 0;
    }

    return Math.round((this.completedUnits() / total) * 100);
  }
}

export function createTaskWorkComposite(task: Task) {
  return new TaskComposite(task);
}
