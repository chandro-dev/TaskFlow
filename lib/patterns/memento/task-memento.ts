import type { TaskFormState } from "@/components/taskflow/task-form-state";

export class TaskMemento {
  constructor(private readonly state: TaskFormState) {}

  public getState(): TaskFormState {
    return structuredClone(this.state);
  }
}
