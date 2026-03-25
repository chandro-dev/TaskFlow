import type { MoveTaskInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";

export class TaskMoveService {
  constructor(private readonly repository: IRepositroyFlow) {}

  async moveTask(input: MoveTaskInput) {
    if (!input.actorId) {
      throw new Error("No fue posible identificar al usuario que mueve la tarea.");
    }

    if (!input.toColumnId.trim()) {
      throw new Error("Debes seleccionar una columna de destino.");
    }

    return this.repository.moveTask({
      ...input,
      toColumnId: input.toColumnId.trim(),
    });
  }
}
