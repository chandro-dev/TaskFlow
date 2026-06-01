import type { MoveTaskInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { CommandManager } from "@/lib/patterns/comportamiento/command/command-manager";
import { MoveTaskCommand } from "@/lib/patterns/comportamiento/command/move-task-command";

export class TaskMoveService {
  constructor(private readonly repository: IRepositroyFlow) { }

  async moveTask(input: MoveTaskInput) {
    if (!input.actorId) {
      throw new Error("No fue posible identificar al usuario que mueve la tarea.");
    }

    if (!input.toColumnId.trim()) {
      throw new Error("Debes seleccionar una columna de destino.");
    }

    const command = new MoveTaskCommand(this.repository, {
      ...input,
      toColumnId: input.toColumnId.trim(),
    });

    await CommandManager.getInstance().executeCommand(command);

    if (!command.result) {
      throw new Error("Ocurrio un error al ejecutar el comando de movimiento.");
    }

    return command.result;
  }
}
