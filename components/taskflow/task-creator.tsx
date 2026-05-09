"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/taskflow/icons";
import { TaskModalShell } from "@/components/taskflow/task-modal-shell";
import { TaskCreationForm } from "@/components/taskflow/task-creation-form";
import {
  createEmptyTaskForm,
  toggleTaskFormSelection,
  type TaskFormState,
} from "@/components/taskflow/task-form-state";
import type { BoardColumn, TaskSubtaskInput, UserProfile } from "@/lib/domain/models";

export function TaskCreator({
  projectId,
  boardId,
  columns,
  users,
}: {
  projectId: string;
  boardId: string;
  columns: BoardColumn[];
  users: UserProfile[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(() => createEmptyTaskForm(columns));

  function updateField<K extends keyof TaskFormState>(
    key: K,
    value: TaskFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAssignee(userId: string) {
    setForm((current) => ({
      ...current,
      assigneeIds: toggleTaskFormSelection(current.assigneeIds, userId),
    }));
  }

  function addSubtask() {
    setForm((current) => ({
      ...current,
      subtasks: [
        ...current.subtasks,
        {
          id: crypto.randomUUID(),
          title: "",
          isCompleted: false,
        },
      ],
    }));
  }

  function updateSubtask<K extends keyof TaskSubtaskInput>(
    index: number,
    key: K,
    value: TaskSubtaskInput[K],
  ) {
    setForm((current) => ({
      ...current,
      subtasks: current.subtasks.map((subtask, subtaskIndex) =>
        subtaskIndex === index ? { ...subtask, [key]: value } : subtask,
      ),
    }));
  }

  function removeSubtask(index: number) {
    setForm((current) => ({
      ...current,
      subtasks: current.subtasks.filter((_, subtaskIndex) => subtaskIndex !== index),
    }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch(`/api/projects/${projectId}/boards/${boardId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        estimateHours: Number(form.estimateHours),
        spentHours: Number(form.spentHours),
        assigneeIds: form.assigneeIds,
        subtasks: form.subtasks,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible crear la tarea.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    setForm(createEmptyTaskForm(columns));

    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="taskflow-button-primary"
      >
        <PlusIcon className="h-5 w-5" />
        Nueva tarea
      </button>

      {open ? (
        <TaskModalShell
          title="Crear nueva tarea"
          description="Usa un flujo mas claro para definir estado inicial, responsables y esfuerzo estimado antes de incorporarla al tablero."
          onClose={() => setOpen(false)}
        >
          <form onSubmit={onSubmit} className="space-y-6">
            <TaskCreationForm
              form={form}
              columns={columns}
              users={users}
              onFieldChange={updateField}
              onAssigneeToggle={toggleAssignee}
              onSubtaskAdd={addSubtask}
              onSubtaskChange={updateSubtask}
              onSubtaskRemove={removeSubtask}
            />

            {error ? (
              <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 border-t border-[color:var(--color-border)] pt-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="taskflow-button-primary justify-center disabled:opacity-60"
              >
                {loading ? "Creando..." : "Crear tarea"}
              </button>
            </div>
          </form>
        </TaskModalShell>
      ) : null}
    </div>
  );
}
