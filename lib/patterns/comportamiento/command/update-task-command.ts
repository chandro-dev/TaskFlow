import type { Command } from "@/lib/patterns/comportamiento/command/command";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import type { Task, UpdateTaskInput } from "@/lib/domain/models";
import { TaskOriginator } from "@/lib/patterns/memento/task-originator";

export class UpdateTaskCommand implements Command {
  public result: Task | null = null;
  private previousState: Task | null = null;
  private taskTitle: string = "";

  constructor(
    private readonly repository: IRepositroyFlow,
    private readonly input: UpdateTaskInput,
  ) {}

  getName(): string {
    return this.taskTitle
      ? `Actualizar tarea "${this.taskTitle}"`
      : `Actualizar tarea con ID ${this.input.taskId}`;
  }

  async execute(): Promise<void> {
    const snapshot = await this.repository.loadSnapshot();
    const task = snapshot.tasks.find((item) => item.id === this.input.taskId);

    if (!task) {
      throw new Error("No se pudo encontrar la tarea a actualizar.");
    }

    this.taskTitle = task.title;
    const originator = new TaskOriginator(task);
    this.previousState = originator.saveToMemento().getState();

    this.result = await this.repository.updateTask(this.input);
  }

  async undo(): Promise<void> {
    if (!this.previousState) {
      throw new Error("No hay un estado previo registrado para deshacer la actualización.");
    }

    await this.repository.updateTask({
      taskId: this.previousState.id,
      projectId: this.previousState.projectId,
      boardId: this.previousState.boardId,
      actorId: this.input.actorId,
      columnId: this.previousState.columnId,
      title: this.previousState.title,
      description: this.previousState.description,
      priority: this.previousState.priority,
      type: this.previousState.type,
      dueDate: this.previousState.dueDate,
      estimateHours: this.previousState.estimateHours,
      spentHours: this.previousState.spentHours,
      assigneeIds: this.previousState.assigneeIds,
      subtasks: this.previousState.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        isCompleted: subtask.isCompleted,
      })),
    });
  }
}
