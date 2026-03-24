"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskCreationForm } from "@/components/taskflow/task-creation-form";
import {
  createTaskFormFromTask,
  toggleTaskFormSelection,
  type TaskFormState,
} from "@/components/taskflow/task-form-state";
import { TaskModalShell } from "@/components/taskflow/task-modal-shell";
import type {
  BoardColumn,
  BoardTaskView,
  TaskSubtaskInput,
  UserProfile,
} from "@/lib/domain/models";

export function TaskEditorModal({
  task,
  projectId,
  boardId,
  columns,
  users,
}: {
  task: BoardTaskView;
  projectId: string;
  boardId: string;
  columns: BoardColumn[];
  users: UserProfile[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(() => createTaskFormFromTask(task));

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
        { id: crypto.randomUUID(), title: "", isCompleted: false },
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
    setLoading(true);
    setError(null);

    const response = await fetch(
      `/api/projects/${projectId}/boards/${boardId}/tasks/${task.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimateHours: Number(form.estimateHours),
        }),
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible actualizar la tarea.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    startTransition(() => router.refresh());
  }

  function openEditor() {
    setForm(createTaskFormFromTask(task));
    setError(null);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="rounded-2xl border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] transition hover:text-[color:var(--color-text-primary)]"
      >
        Editar
      </button>

      {open ? (
        <TaskModalShell
          title="Editar tarea"
          description="Actualiza el contexto, los responsables y el checklist sin salir del tablero."
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
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </TaskModalShell>
      ) : null}
    </>
  );
}
