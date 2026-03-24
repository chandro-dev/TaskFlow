"use client";

import type {
  BoardColumn,
  BoardTaskView,
  TaskPriority,
  TaskSubtaskInput,
  TaskType,
} from "@/lib/domain/models";

export type TaskFormState = {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  dueDate: string;
  estimateHours: string;
  assigneeIds: string[];
  columnId: string;
  subtasks: TaskSubtaskInput[];
};

export function createEmptyTaskForm(columns: BoardColumn[]): TaskFormState {
  return {
    title: "",
    description: "",
    type: "TASK",
    priority: "MEDIA",
    dueDate: "",
    estimateHours: "4",
    assigneeIds: [],
    columnId: columns[0]?.id ?? "",
    subtasks: [],
  };
}

export function createTaskFormFromTask(task: BoardTaskView): TaskFormState {
  return {
    title: task.title,
    description: task.description,
    type: task.type,
    priority: task.priority,
    dueDate: task.dueDate,
    estimateHours: String(task.estimateHours),
    assigneeIds: task.assigneeIds,
    columnId: task.columnId,
    subtasks: task.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      isCompleted: subtask.isCompleted,
    })),
  };
}

export function toggleTaskFormSelection(current: string[], value: string) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}
