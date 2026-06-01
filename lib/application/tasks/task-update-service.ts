import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
<<<<<<< HEAD
import { assertColumnWipCapacity } from "@/lib/application/tasks/wip-limit-guard";
import type { UpdateTaskInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { TaskUpdateBuilder } from "@/lib/patterns/builder/task-update-builder";

export class TaskUpdateService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(private readonly repository: IRepositroyFlow) {
    this.snapshotLoader = new SnapshotLoader(repository);
=======
import type { UpdateTaskInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { TaskUpdateBuilder } from "@/lib/patterns/builder/task-update-builder";
import { CommandManager } from "@/lib/patterns/comportamiento/command/command-manager";
import { UpdateTaskCommand } from "@/lib/patterns/comportamiento/command/update-task-command";
import { TaskHistoryCaretaker } from "@/lib/patterns/memento/task-history-caretaker";
import { TaskOriginator } from "@/lib/patterns/memento/task-originator";

export class TaskUpdateService {
  private readonly snapshotLoader: SnapshotLoader;
  // Caretaker singleton que almacena el historial de mementos por taskId
  private readonly caretaker: TaskHistoryCaretaker;

  constructor(private readonly repository: IRepositroyFlow) {
    this.snapshotLoader = new SnapshotLoader(repository);
    this.caretaker = TaskHistoryCaretaker.getInstance();
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29
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

    if (input.spentHours < 0) {
      throw new Error("Las horas trabajadas no pueden ser negativas.");
    }

    const normalizedSubtasks = input.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title.trim(),
      isCompleted: subtask.isCompleted,
    }));

    if (normalizedSubtasks.some((subtask) => !subtask.title)) {
      throw new Error("Todas las subtareas deben tener un titulo.");
    }

<<<<<<< HEAD
    assertColumnWipCapacity(snapshot, {
      boardId: input.boardId,
      columnId: input.columnId.trim(),
      ignoredTaskId: input.taskId,
    });
=======
    // [MEMENTO PATTERN] Guardar el estado previo de la tarea antes de modificarla.
    // El Originator captura el estado actual del formulario y delega la creación
    // del Memento; el Caretaker lo almacena por taskId sin conocer su contenido.
    const originator = new TaskOriginator({
      columnId: sourceTask.columnId,
      title: sourceTask.title,
      description: sourceTask.description,
      priority: sourceTask.priority,
      type: sourceTask.type,
      dueDate: sourceTask.dueDate,
      estimateHours: String(sourceTask.estimateHours),
      spentHours: String(sourceTask.spentHours),
      assigneeIds: sourceTask.assigneeIds,
      subtasks: sourceTask.subtasks,
    });
    const memento = originator.saveToMemento();
    this.caretaker.addSnapshot(input.taskId, memento);
    console.log("📸 [MEMENTO PATTERN] Snapshot guardado para tarea:", sourceTask.title);
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29

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
        spentHours: input.spentHours,
      })
      .withAssignees(input.assigneeIds)
      .withSubtasks(normalizedSubtasks)
      .build();

<<<<<<< HEAD
    return this.repository.updateTask({
=======
    const command = new UpdateTaskCommand(this.repository, {
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29
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
      spentHours: updatedTask.spentHours,
      assigneeIds: updatedTask.assigneeIds,
      subtasks: updatedTask.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        isCompleted: subtask.isCompleted,
      })),
    });
<<<<<<< HEAD
=======

    await CommandManager.getInstance().executeCommand(command);

    if (!command.result) {
      throw new Error("Ocurrio un error al ejecutar la actualización de la tarea.");
    }

    return command.result;
  }

  async undoTask(input: { taskId: string; projectId: string; boardId: string; actorId: string }) {
    // 1. Obtener el último memento del Caretaker para esta tarea
    const memento = this.caretaker.popLastSnapshot(input.taskId);
    if (!memento) {
      throw new Error("No hay cambios recientes para deshacer en esta tarea.");
    }

    // 2. [MEMENTO PATTERN] Usar el Originator para restaurar el estado.
    // El Originator es el único responsable de leer e interpretar el contenido
    // del Memento; el Caretaker nunca accede directamente a su estado interno.
    const originator = new TaskOriginator(memento.getState());
    originator.restoreFromMemento(memento);
    const previousState = originator.getFormState();

    console.log("⏪ [MEMENTO PATTERN] Deshaciendo cambios. Restaurando tarea:", previousState.title);

    // 3. Persistir el estado restaurado en la base de datos
    return this.repository.updateTask({
      taskId: input.taskId,
      projectId: input.projectId,
      boardId: input.boardId,
      actorId: input.actorId,
      columnId: previousState.columnId,
      title: previousState.title,
      description: previousState.description,
      priority: previousState.priority,
      type: previousState.type,
      dueDate: previousState.dueDate,
      estimateHours: Number(previousState.estimateHours),
      spentHours: Number(previousState.spentHours),
      assigneeIds: previousState.assigneeIds,
      subtasks: previousState.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        isCompleted: subtask.isCompleted,
      })),
    });
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29
  }
}
