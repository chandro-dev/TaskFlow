import type { Command } from "./command";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import type { MoveTaskInput, Task } from "@/lib/domain/models";

// Uso de command para Mover tareas
export class MoveTaskCommand implements Command {
  private previousColumnId: string | null = null;
  private taskTitle: string = "";
  public result: Task | null = null;

  constructor(
    private readonly repository: IRepositroyFlow,
    private readonly input: MoveTaskInput
  ) { }

  getName(): string {
    const titleSnippet = this.taskTitle ? `"${this.taskTitle}"` : `con ID ${this.input.taskId}`;
    return `Mover tarea ${titleSnippet}`;
  }

  async execute(): Promise<void> {
    // If we don't have the previous column or task title yet, load snapshot to find them
    if (!this.previousColumnId) {
      const snapshot = await this.repository.loadSnapshot();
      const task = snapshot.tasks.find((t) => t.id === this.input.taskId);
      if (task) {
        this.previousColumnId = task.columnId;
        this.taskTitle = task.title;
      } else {
        throw new Error("No se pudo encontrar la tarea a mover.");
      }
    }

    this.result = await this.repository.moveTask({
      ...this.input,
      toColumnId: this.input.toColumnId.trim(),
    });
  }

  async undo(): Promise<void> {
    if (!this.previousColumnId) {
      throw new Error("No hay un estado previo registrado para deshacer el movimiento.");
    }

    await this.repository.moveTask({
      ...this.input,
      toColumnId: this.previousColumnId,
    });
  }
}
