import type { CreateTaskInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
<<<<<<< HEAD
import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import { assertColumnWipCapacity } from "@/lib/application/tasks/wip-limit-guard";
import type { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export class TaskCommandService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(
    private readonly repository: IRepositroyFlow,
    private readonly notificationPublisher: ProjectEventPublisher,
  ) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }
=======
import type { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export class TaskCommandService {
  constructor(
    private readonly repository: IRepositroyFlow,
    private readonly notificationPublisher: ProjectEventPublisher,
  ) {}
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29

  async createTask(input: CreateTaskInput) {
    if (!input.actorId) {
      throw new Error("No fue posible identificar al usuario que crea la tarea.");
    }

    const title = input.title.trim();
    const description = input.description.trim();

    if (!title) {
      throw new Error("La tarea requiere un titulo.");
    }

    if (!description) {
      throw new Error("La tarea requiere una descripcion.");
    }

    if (!input.dueDate) {
      throw new Error("La tarea requiere una fecha limite.");
    }

    if (input.estimateHours <= 0) {
      throw new Error("La estimacion debe ser mayor que cero.");
    }

    if ((input.spentHours ?? 0) < 0) {
      throw new Error("Las horas trabajadas no pueden ser negativas.");
    }

    const subtasks = (input.subtasks ?? []).map((subtask) => ({
      title: subtask.title.trim(),
      isCompleted: subtask.isCompleted,
    }));

    if (subtasks.some((subtask) => !subtask.title)) {
      throw new Error("Todas las subtareas deben tener un titulo.");
    }

<<<<<<< HEAD
    const snapshot = await this.snapshotLoader.load();
    const board = snapshot.boards.find((item) => item.id === input.boardId);
    const targetColumnId = input.columnId ?? board?.columns[0]?.id;

    if (!targetColumnId) {
      throw new Error("El tablero no tiene columnas disponibles.");
    }

    assertColumnWipCapacity(snapshot, {
      boardId: input.boardId,
      columnId: targetColumnId,
    });

    const task = await this.repository.createTask({
      ...input,
      columnId: targetColumnId,
=======
    const task = await this.repository.createTask({
      ...input,
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29
      title,
      description,
      spentHours: input.spentHours ?? 0,
      subtasks,
    });

    await this.notificationPublisher.publish({
      kind: "TASK_CREATED",
      projectId: input.projectId,
      boardId: input.boardId,
      taskId: task.id,
      actorId: input.actorId,
    });

    return task;
  }
}
