import type { TaskflowSnapshot } from "@/lib/domain/models";

export function assertColumnWipCapacity(
  snapshot: TaskflowSnapshot,
  input: {
    boardId: string;
    columnId: string;
    ignoredTaskId?: string;
  },
) {
  const board = snapshot.boards.find((item) => item.id === input.boardId);
  const column = board?.columns.find((item) => item.id === input.columnId);

  if (!board || !column) {
    throw new Error("La columna seleccionada no existe dentro del tablero.");
  }

  if (!column.wipLimit) {
    return;
  }

  const currentTasks = snapshot.tasks.filter(
    (task) =>
      task.boardId === input.boardId &&
      task.columnId === input.columnId &&
      task.id !== input.ignoredTaskId,
  ).length;

  if (currentTasks >= column.wipLimit) {
    throw new Error(
      `La columna "${column.name}" alcanzo su limite WIP de ${column.wipLimit} tarea(s).`,
    );
  }
}
