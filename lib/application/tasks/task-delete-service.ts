import type { DeleteTaskInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";

export class TaskDeleteService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(private readonly repository: IRepositroyFlow) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async deleteTask(input: DeleteTaskInput) {
    if (!input.actorId) {
      throw new Error("No fue posible identificar al usuario que elimina la tarea.");
    }

    const snapshot = await this.snapshotLoader.load();
    const task = snapshot.tasks.find((item) => item.id === input.taskId);

    if (!task) {
      throw new Error("La tarea no existe o ya fue eliminada.");
    }

    if (task.projectId !== input.projectId || task.boardId !== input.boardId) {
      throw new Error("La tarea no pertenece al tablero actual.");
    }

    await this.repository.deleteTask({
      taskId: input.taskId,
      projectId: input.projectId,
      boardId: input.boardId,
    });
  }
}
