import type { MoveTaskInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import { assertColumnWipCapacity } from "@/lib/application/tasks/wip-limit-guard";
import { CommandManager } from "@/lib/patterns/comportamiento/command/command-manager";
import { MoveTaskCommand } from "@/lib/patterns/comportamiento/command/move-task-command";

export class TaskMoveService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(private readonly repository: IRepositroyFlow) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async moveTask(input: MoveTaskInput) {
    if (!input.actorId) {
      throw new Error("No fue posible identificar al usuario que mueve la tarea.");
    }

    if (!input.toColumnId.trim()) {
      throw new Error("Debes seleccionar una columna de destino.");
    }

    const targetColumnId = input.toColumnId.trim();
    const snapshot = await this.snapshotLoader.load();

    assertColumnWipCapacity(snapshot, {
      boardId: input.boardId,
      columnId: targetColumnId,
      ignoredTaskId: input.taskId,
    });

    const command = new MoveTaskCommand(this.repository, {
      ...input,
      toColumnId: targetColumnId,
    });

    await CommandManager.getInstance().executeCommand(command);

    if (!command.result) {
      throw new Error("Ocurrio un error al ejecutar el comando de movimiento.");
    }

    return command.result;
  }
}
