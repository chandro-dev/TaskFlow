import type { CreateTaskInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import type { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export class TaskCommandService {
  constructor(
    private readonly repository: IRepositroyFlow,
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

    const subtasks = (input.subtasks ?? []).map((subtask) => ({
      title: subtask.title.trim(),
      isCompleted: subtask.isCompleted,
    }));

    if (subtasks.some((subtask) => !subtask.title)) {
      throw new Error("Todas las subtareas deben tener un titulo.");
    }

    const task = await this.repository.createTask({
      ...input,
      title,
      description,
      subtasks,
    });

    return task;
  }
}
