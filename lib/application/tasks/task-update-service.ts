import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import type { UpdateTaskInput } from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { TaskUpdateBuilder } from "@/lib/patterns/builder/task-update-builder";

export class TaskUpdateService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(private readonly repository: TaskflowRepository) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async updateTask(input: UpdateTaskInput) {
    if (!input.actorId) {
      throw new Error("No fue posible identificar al usuario que actualiza la tarea.");
    }

    const snapshot = await this.snapshotLoader.load();
    const sourceTask = snapshot.tasks.find((task) => task.id === input.taskId);

    if (!sourceTask) {
      throw new Error("La tarea no existe o ya no esta disponible.");
    }

    const normalizedTitle = input.title.trim();
    const normalizedDescription = input.description.trim();

    if (!normalizedTitle) {
      throw new Error("La tarea requiere un titulo.");
    }

    if (!normalizedDescription) {
      throw new Error("La tarea requiere una descripcion.");
    }

    if (!input.dueDate) {
      throw new Error("La tarea requiere una fecha limite.");
    }

    if (input.estimateHours <= 0) {
      throw new Error("La estimacion debe ser mayor que cero.");
    }

    const normalizedSubtasks = input.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title.trim(),
      isCompleted: subtask.isCompleted,
    }));

    if (normalizedSubtasks.some((subtask) => !subtask.title)) {
      throw new Error("Todas las subtareas deben tener un titulo.");
    }

    // The builder concentrates the task editing rules so the service only
    // orchestrates validation and persistence, not field-by-field mutation.
    const updatedTask = new TaskUpdateBuilder(sourceTask)
      .withCoreFields({
        columnId: input.columnId.trim(),
        title: normalizedTitle,
        description: normalizedDescription,
        priority: input.priority,
        type: input.type,
        dueDate: input.dueDate,
        estimateHours: input.estimateHours,
      })
      .withAssignees(input.assigneeIds)
      .withSubtasks(normalizedSubtasks)
      .build();

    return this.repository.updateTask({
      taskId: input.taskId,
      projectId: input.projectId,
      boardId: input.boardId,
      actorId: input.actorId,
      columnId: updatedTask.columnId,
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      type: updatedTask.type,
      dueDate: updatedTask.dueDate,
      estimateHours: updatedTask.estimateHours,
      assigneeIds: updatedTask.assigneeIds,
      subtasks: updatedTask.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        isCompleted: subtask.isCompleted,
      })),
    });
  }
}
