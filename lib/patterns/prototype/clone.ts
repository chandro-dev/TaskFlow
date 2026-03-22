import type { Project, Task } from "@/lib/domain/models";

export class TaskPrototype {
  constructor(private readonly source: Task) {}

  clone(overrides: Partial<Task> = {}) {
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
