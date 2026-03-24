import type { Project, Subtask, Task } from "@/lib/domain/models";

// Pattern traceability: Prototype.
// A clone starts from an existing aggregate and then applies technical
// overrides, which is clearer than rebuilding every field from scratch.
export class TaskPrototype {
  constructor(private readonly source: Task) {}

  clone(overrides: Partial<Task> = {}) {
    // The prototype keeps the functional skeleton of the source task while
    // resetting runtime artifacts such as comments, attachments and history.
    const clone = structuredClone(this.source);
    return {
      ...clone,
      ...overrides,
      id: overrides.id ?? crypto.randomUUID(),
      comments: overrides.comments ?? [],
      attachments: overrides.attachments ?? [],
      history: overrides.history ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export class SubtaskPrototype {
  constructor(private readonly source: Subtask) {}

  clone(overrides: Partial<Subtask> = {}) {
    // Subtasks keep their functional intent, but the clone always receives a
    // fresh identifier so it can belong to a different task lifecycle.
    const clone = structuredClone(this.source);
    return {
      ...clone,
      ...overrides,
      id: overrides.id ?? crypto.randomUUID(),
    };
  }
}

export class ProjectPrototype {
  constructor(private readonly source: Project) {}

  clone(overrides: Partial<Project> = {}) {
    const clone = structuredClone(this.source);
    return {
      ...clone,
      ...overrides,
      id: overrides.id ?? crypto.randomUUID(),
    };
  }
}
