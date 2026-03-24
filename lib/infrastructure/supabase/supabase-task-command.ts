import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateTaskInput,
  Task,
  TaskHistoryEntry,
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
      },
    );

    if (taskError || !taskRow) {
      throw new Error(taskError?.message ?? "No fue posible crear la tarea.");
    }

    const historyEntry = await this.createCreationHistory(
      taskRow as SupabaseTaskRow,
      input.actorId,
    );
    const createdTask = normalizeTask(taskRow as SupabaseTaskRow, {}, {}, {});

    return new TaskBuilder(createdTask).withHistory(historyEntry).build();
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

    const builder = new TaskBuilder(task);

    for (const assigneeId of input.assigneeIds ?? []) {
      builder.withAssignee(assigneeId);
    }

    return builder.build();
  }

  private async createCreationHistory(
    task: SupabaseTaskRow,
    actorId: string,
  ): Promise<TaskHistoryEntry> {
    const { data, error } = await this.client
      .from("task_history")
      .insert({
        task_id: task.id,
        actor_id: actorId,
        action: "Tarea creada",
        to_column_id: task.column_id,
      })
      .select("*")
      .single();

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
}
