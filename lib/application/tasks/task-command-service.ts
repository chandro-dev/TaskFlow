import type { CreateTaskInput } from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import type { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export class TaskCommandService {
  constructor(
    private readonly repository: TaskflowRepository,
    private readonly notificationPublisher: ProjectEventPublisher,
  ) {}

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

    const task = await this.repository.createTask({
      ...input,
      title,
      description,
    });

    await this.notificationPublisher.publish({
      kind: "TASK_CREATED",
      projectId: task.projectId,
      actorId: input.actorId,
      boardId: task.boardId,
      taskId: task.id,
    });

    return task;
  }
}
