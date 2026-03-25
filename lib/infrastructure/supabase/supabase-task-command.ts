import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CloneTaskInput,
  CreateTaskInput,
  MoveTaskInput,
  Task,
  TaskHistoryEntry,
  TaskSubtaskInput,
  UpdateTaskInput,
} from "@/lib/domain/models";
import { TaskBuilder } from "@/lib/patterns/builder/task-builder";
import { createTaskFactory } from "@/lib/patterns/factory/task-factory";
import {
  normalizeHistoryEntry,
  normalizeTask,
} from "@/lib/infrastructure/supabase/supabase-normalizers";
import type {
  BoardColumnRow,
  HistoryRow,
  SupabaseTaskRow,
  TaskSubtaskRow,
} from "@/lib/infrastructure/supabase/supabase-row-types";
export class SupabaseTaskCommand {
  constructor(private readonly client: SupabaseClient) {}

  async createTask(input: CreateTaskInput): Promise<Task> {
    const boardColumns = await this.loadBoardColumns(input.boardId);
    const targetColumnId = input.columnId ?? boardColumns[0]?.id;

    if (!targetColumnId) {
      throw new Error("El tablero no tiene columnas disponibles.");
    }

    const draftTask = this.buildDraftTask(input, targetColumnId);
    const { data: taskRow, error: taskError } = await this.client.rpc(
      "create_project_task_with_notifications",
      {
        target_project_id: draftTask.projectId,
        target_board_id: draftTask.boardId,
        target_column_id: draftTask.columnId,
        target_title: draftTask.title,
        target_description: draftTask.description,
        target_priority: draftTask.priority,
        target_type: draftTask.type,
        target_due_date: draftTask.dueDate,
        target_estimate_hours: draftTask.estimateHours,
        target_assignee_ids: draftTask.assigneeIds,
        target_subtasks: this.serializeSubtasks(input.subtasks ?? []),
      },
    );

    if (taskError || !taskRow) {
      throw new Error(taskError?.message ?? "No fue posible crear la tarea.");
    }

    const historyEntry = await this.loadCreationHistory(
      taskRow as SupabaseTaskRow,
      input.actorId,
    );
    const subtasksByTask = await this.loadTaskSubtasks((taskRow as SupabaseTaskRow).id);
    const createdTask = normalizeTask(taskRow as SupabaseTaskRow, {}, subtasksByTask, {}, {});

    return new TaskBuilder(createdTask).withHistory(historyEntry).build();
  }

  async updateTask(input: UpdateTaskInput): Promise<Task> {
    const { data, error } = await this.client.rpc("update_project_task_details", {
      target_task_id: input.taskId,
      target_project_id: input.projectId,
      target_board_id: input.boardId,
      target_column_id: input.columnId,
      target_title: input.title,
      target_description: input.description,
      target_priority: input.priority,
      target_type: input.type,
      target_due_date: input.dueDate,
      target_estimate_hours: input.estimateHours,
      target_assignee_ids: input.assigneeIds,
      target_subtasks: this.serializeSubtasks(input.subtasks),
    });

    if (error || !data) {
      throw new Error(error?.message ?? "No fue posible actualizar la tarea.");
    }

    const subtasksByTask = await this.loadTaskSubtasks((data as SupabaseTaskRow).id);
    const updatedTask = normalizeTask(data as SupabaseTaskRow, {}, subtasksByTask, {}, {});
    const historyEntry = await this.loadUpdateHistory(
      data as SupabaseTaskRow,
      input.actorId,
    );

    return new TaskBuilder(updatedTask).withHistory(historyEntry).build();
  }

  async deleteTask(input: {
    taskId: string;
    projectId: string;
    boardId: string;
  }): Promise<void> {
    // Clearing clone ancestry first avoids FK violations when the source task
    // already has copies linked through cloned_from_task_id.
    const { error: unlinkError } = await this.client
      .from("tasks")
      .update({ cloned_from_task_id: null })
      .eq("cloned_from_task_id", input.taskId)
      .eq("project_id", input.projectId);

    if (unlinkError) {
      throw new Error(
        unlinkError.message ?? "No fue posible preparar la eliminacion de la tarea.",
      );
    }

    const { error } = await this.client
      .from("tasks")
      .delete()
      .eq("id", input.taskId)
      .eq("project_id", input.projectId)
      .eq("board_id", input.boardId);

    if (error) {
      throw new Error(error.message ?? "No fue posible eliminar la tarea.");
    }
  }

  async moveTask(input: MoveTaskInput): Promise<Task> {
    const { data, error } = await this.client.rpc("move_project_task", {
      target_task_id: input.taskId,
      target_project_id: input.projectId,
      target_board_id: input.boardId,
      target_to_column_id: input.toColumnId,
    });

    if (error || !data) {
      throw new Error(error?.message ?? "No fue posible mover la tarea.");
    }

    const movedTask = normalizeTask(data as SupabaseTaskRow, {}, {}, {}, {});
    const historyEntry = await this.createMoveHistory(
      data as SupabaseTaskRow,
      input.actorId,
      input.toColumnId,
    );

    return new TaskBuilder(movedTask).withHistory(historyEntry).build();
  }

  async cloneTask(input: CloneTaskInput): Promise<Task> {
    const { data, error } = await this.client.rpc("clone_project_task", {
      source_task_id: input.sourceTaskId,
      target_project_id: input.projectId,
      target_board_id: input.boardId,
      target_column_id: input.columnId ?? null,
      target_title: input.title,
      target_description: input.description,
      target_priority: input.priority,
      target_type: input.type,
      target_due_date: input.dueDate,
      target_estimate_hours: input.estimateHours,
      target_assignee_ids: input.assigneeIds,
      target_subtasks: this.serializeSubtasks(input.subtasks),
      target_cloned_from_task_id: input.clonedFromTaskId,
    });

    if (error || !data) {
      throw new Error(error?.message ?? "No fue posible clonar la tarea.");
    }

    const subtasksByTask = await this.loadTaskSubtasks((data as SupabaseTaskRow).id);
    const clonedTask = normalizeTask(data as SupabaseTaskRow, {}, subtasksByTask, {}, {});
    const historyEntry = await this.loadCloneHistory(
      data as SupabaseTaskRow,
      input.actorId,
    );

    return new TaskBuilder(clonedTask).withHistory(historyEntry).build();
  }

  private async loadBoardColumns(boardId: string) {
    const { data, error } = await this.client
      .from("board_columns")
      .select("*")
      .eq("board_id", boardId)
      .order("position", { ascending: true });

    if (error) {
      throw new Error("No fue posible consultar las columnas del tablero.");
    }

    return (data ?? []) as BoardColumnRow[];
  }

  private async loadTaskSubtasks(taskId: string) {
    const { data, error } = await this.client
      .from("task_subtasks")
      .select("*")
      .eq("task_id", taskId);

    if (error) {
      return {};
    }

    return {
      [taskId]: ((data ?? []) as TaskSubtaskRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        isCompleted: row.is_completed,
      })),
    };
  }

  private buildDraftTask(input: CreateTaskInput, columnId: string) {
    const taskFactory = createTaskFactory(input.type);
    const task = taskFactory.create({
      id: crypto.randomUUID(),
      projectId: input.projectId,
      boardId: input.boardId,
      columnId,
      title: input.title.trim(),
      description: input.description.trim(),
      dueDate: input.dueDate,
      estimateHours: input.estimateHours,
      priority: input.priority,
    });

    // Factory decides the base task shape by type. Builder then enriches the
    // draft with assignments before the RPC persists it atomically.
    const builder = new TaskBuilder(task);

    for (const assigneeId of input.assigneeIds ?? []) {
      builder.withAssignee(assigneeId);
    }

    return builder.build();
  }

  private serializeSubtasks(subtasks: TaskSubtaskInput[]) {
    // Supabase RPCs expect snake_case keys because jsonb_to_recordset maps
    // directly to SQL column names.
    return subtasks.map((subtask) => ({
      id: subtask.id ?? null,
      title: subtask.title,
      is_completed: subtask.isCompleted,
    }));
  }

  private async loadCreationHistory(
    task: SupabaseTaskRow,
    actorId: string,
  ): Promise<TaskHistoryEntry> {
    const { data, error } = await this.client
      .from("task_history")
      .select("*")
      .eq("task_id", task.id)
      .eq("actor_id", actorId)
      .eq("to_column_id", task.column_id)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        id: crypto.randomUUID(),
        actorId,
        action: "Tarea creada",
        occurredAt: new Date().toISOString(),
        toColumnId: task.column_id,
      };
    }

    return normalizeHistoryEntry(data as HistoryRow);
  }

  private async createMoveHistory(
    task: SupabaseTaskRow,
    actorId: string,
    toColumnId: string,
  ): Promise<TaskHistoryEntry> {
    const { data, error } = await this.client
      .from("task_history")
      .select("*")
      .eq("task_id", task.id)
      .eq("actor_id", actorId)
      .eq("to_column_id", toColumnId)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        id: crypto.randomUUID(),
        actorId,
        action: "Cambio de estado",
        occurredAt: new Date().toISOString(),
        toColumnId,
      };
    }

    return normalizeHistoryEntry(data as HistoryRow);
  }

  private async loadCloneHistory(
    task: SupabaseTaskRow,
    actorId: string,
  ): Promise<TaskHistoryEntry> {
    const { data, error } = await this.client
      .from("task_history")
      .select("*")
      .eq("task_id", task.id)
      .eq("actor_id", actorId)
      .eq("action", "Tarea clonada")
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        id: crypto.randomUUID(),
        actorId,
        action: "Tarea clonada",
        occurredAt: new Date().toISOString(),
        toColumnId: task.column_id,
      };
    }

    return normalizeHistoryEntry(data as HistoryRow);
  }

  private async loadUpdateHistory(
    task: SupabaseTaskRow,
    actorId: string,
  ): Promise<TaskHistoryEntry> {
    const { data, error } = await this.client
      .from("task_history")
      .select("*")
      .eq("task_id", task.id)
      .eq("actor_id", actorId)
      .eq("action", "Tarea actualizada")
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        id: crypto.randomUUID(),
        actorId,
        action: "Tarea actualizada",
        occurredAt: new Date().toISOString(),
        toColumnId: task.column_id,
      };
    }

    return normalizeHistoryEntry(data as HistoryRow);
  }
}
