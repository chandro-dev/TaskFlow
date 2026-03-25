import type { CloneTaskRequestInput, Subtask } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import { SubtaskPrototype, TaskPrototype } from "@/lib/patterns/prototype/clone";

export class TaskCloneService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(private readonly repository: IRepositroyFlow) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async cloneTask(input: CloneTaskRequestInput) {
    const snapshot = await this.snapshotLoader.load();
    const sourceTask = snapshot.tasks.find((task) => task.id === input.sourceTaskId);

    if (!sourceTask) {
      throw new Error("La tarea origen no existe o ya no esta disponible.");
    }

    // Pattern traceability: Prototype.
    // Deep task cloning starts from the source task and its selected subtasks,
    // generating fresh technical identities while preserving business shape.
    const clonedSubtasks = this.buildClonedSubtasks(sourceTask.subtasks, input);

    // The prototype creates a technical draft that preserves the source
    // structure while allowing reassignment to the same or different people.
    const draft = new TaskPrototype(sourceTask).clone({
      id: crypto.randomUUID(),
      projectId: input.projectId,
      boardId: input.boardId,
      columnId: input.columnId ?? sourceTask.columnId,
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      type: input.type,
      dueDate: input.dueDate,
      estimateHours: input.estimateHours,
      assigneeIds: [...new Set(input.assigneeIds)],
      subtasks: clonedSubtasks.map((item) => item.clone),
      clonedFromTaskId: sourceTask.id,
    });

    return this.repository.cloneTask({
      sourceTaskId: sourceTask.id,
      projectId: draft.projectId,
      boardId: draft.boardId,
      actorId: input.actorId,
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
      type: draft.type,
      dueDate: draft.dueDate,
      estimateHours: draft.estimateHours,
      assigneeIds: draft.assigneeIds,
      subtasks: clonedSubtasks.map((subtask) => ({
        sourceSubtaskId: subtask.source.id,
        title: subtask.clone.title,
        isCompleted: subtask.clone.isCompleted,
      })),
      columnId: draft.columnId,
      clonedFromTaskId: sourceTask.id,
    });
  }

  private buildClonedSubtasks(
    sourceSubtasks: Subtask[],
    input: CloneTaskRequestInput,
  ) {
    const selectedSubtaskIds = new Set(
      (input.subtaskIds?.length
        ? input.subtaskIds
        : sourceSubtasks.map((item) => item.id)
      ).filter(Boolean),
    );

    const selectedSourceSubtasks = sourceSubtasks.filter((subtask) =>
      selectedSubtaskIds.has(subtask.id),
    );

    if (selectedSourceSubtasks.length !== selectedSubtaskIds.size) {
      throw new Error("Hay subtareas seleccionadas que ya no existen en la tarea origen.");
    }

    // Each subtask is cloned through its own prototype so the new task keeps
    // the checklist structure without sharing identifiers with the source.
    return selectedSourceSubtasks.map((subtask) => ({
      source: subtask,
      clone: new SubtaskPrototype(subtask).clone({
        isCompleted: input.resetCompletedSubtasks ? false : subtask.isCompleted,
      }),
    }));
  }
}
