import type { Task, TaskPriority, TaskType } from "@/lib/domain/models";

interface TaskFactoryInput {
  id: string;
  projectId: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  dueDate: string;
  estimateHours: number;
  spentHours?: number;
  priority?: TaskPriority;
}

abstract class TaskFactory {
  create(input: TaskFactoryInput): Task {
    const priority = input.priority ?? this.defaultPriority();
    const now = new Date().toISOString();

    return {
      ...this.createTask(input, priority),
      spentHours: input.spentHours ?? 0,
      labels: [],
      assigneeIds: [],
      subtasks: [],
      comments: [],
      attachments: [],
      history: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  protected abstract createTask(
    input: TaskFactoryInput,
    priority: TaskPriority,
  ): Omit<
    Task,
    | "labels"
    | "assigneeIds"
    | "subtasks"
    | "comments"
    | "attachments"
    | "history"
    | "createdAt"
    | "updatedAt"
  >;

  protected abstract defaultPriority(): TaskPriority;
}

class BugTaskFactory extends TaskFactory {
  protected createTask(input: TaskFactoryInput, priority: TaskPriority) {
    return {
      id: input.id,
      projectId: input.projectId,
      boardId: input.boardId,
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      priority,
      type: "BUG" as TaskType,
      dueDate: input.dueDate,
      estimateHours: input.estimateHours,
      spentHours: input.spentHours ?? 0,
    };
  }

  protected defaultPriority() {
    return "ALTA" as TaskPriority;
  }
}

class FeatureTaskFactory extends TaskFactory {
  protected createTask(input: TaskFactoryInput, priority: TaskPriority) {
    return {
      id: input.id,
      projectId: input.projectId,
      boardId: input.boardId,
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      priority,
      type: "FEATURE" as TaskType,
      dueDate: input.dueDate,
      estimateHours: input.estimateHours,
      spentHours: input.spentHours ?? 0,
    };
  }

  protected defaultPriority() {
    return "MEDIA" as TaskPriority;
  }
}

class ImprovementTaskFactory extends TaskFactory {
  protected createTask(input: TaskFactoryInput, priority: TaskPriority) {
    return {
      id: input.id,
      projectId: input.projectId,
      boardId: input.boardId,
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      priority,
      type: "IMPROVEMENT" as TaskType,
      dueDate: input.dueDate,
      estimateHours: input.estimateHours,
      spentHours: input.spentHours ?? 0,
    };
  }

  protected defaultPriority() {
    return "MEDIA" as TaskPriority;
  }
}

class StandardTaskFactory extends TaskFactory {
  protected createTask(input: TaskFactoryInput, priority: TaskPriority) {
    return {
      id: input.id,
      projectId: input.projectId,
      boardId: input.boardId,
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      priority,
      type: "TASK" as TaskType,
      dueDate: input.dueDate,
      estimateHours: input.estimateHours,
      spentHours: input.spentHours ?? 0,
    };
  }

  protected defaultPriority() {
    return "BAJA" as TaskPriority;
  }
}

export function createTaskFactory(type: TaskType) {
  switch (type) {
    case "BUG":
      return new BugTaskFactory();
    case "FEATURE":
      return new FeatureTaskFactory();
    case "IMPROVEMENT":
      return new ImprovementTaskFactory();
    default:
      return new StandardTaskFactory();
  }
}
