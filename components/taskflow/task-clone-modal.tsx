"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskModalShell } from "@/components/taskflow/task-modal-shell";
import type { BoardColumn, BoardTaskView, UserProfile } from "@/lib/domain/models";

type CloneFormState = {
  title: string;
  description: string;
  dueDate: string;
  estimateHours: string;
  columnId: string;
  assigneeIds: string[];
  subtaskIds: string[];
  resetCompletedSubtasks: boolean;
};

function toggleSelection(current: string[], userId: string) {
  return current.includes(userId)
    ? current.filter((item) => item !== userId)
    : [...current, userId];
}

export function TaskCloneModal({
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
  const [form, setForm] = useState<CloneFormState>({
    title: `${task.title} - copia`,
    description: task.description,
    dueDate: task.dueDate,
    estimateHours: String(task.estimateHours),
    columnId: task.columnId,
    assigneeIds: task.assigneeIds,
    subtaskIds: task.subtasks.map((subtask) => subtask.id),
    resetCompletedSubtasks: true,
  });

  function updateField<K extends keyof CloneFormState>(
    key: K,
    value: CloneFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(
      `/api/projects/${projectId}/boards/${boardId}/tasks/${task.id}/clone`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          dueDate: form.dueDate,
          estimateHours: Number(form.estimateHours),
          assigneeIds: form.assigneeIds,
          columnId: form.columnId,
          subtaskIds: form.subtaskIds,
          resetCompletedSubtasks: form.resetCompletedSubtasks,
        }),
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible clonar la tarea.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] transition hover:text-[color:var(--color-text-primary)]"
      >
        Clonar
      </button>

      {open ? (
        <TaskModalShell
          title="Clonar tarea"
          description="La copia conserva la estructura funcional de la tarea origen. Desde aqui puedes dejar la asignacion igual o reasignarla a otra persona."
          onClose={() => setOpen(false)}
        >
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
                <div>
                  <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
                    Datos de la copia
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                    Ajusta el contenido tecnico antes de crear la nueva tarea.
                  </p>
                </div>

                <input
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="taskflow-input"
                  required
                />

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  className="taskflow-input min-h-32 resize-none"
                  required
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <select
                    value={form.columnId}
                    onChange={(event) => updateField("columnId", event.target.value)}
                    className="taskflow-input"
                  >
                    {columns.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => updateField("dueDate", event.target.value)}
                    className="taskflow-input"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    value={form.estimateHours}
                    onChange={(event) =>
                      updateField("estimateHours", event.target.value)
                    }
                    className="taskflow-input"
                    required
                  />
                </div>

                <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                        Subtareas
                      </h4>
                      <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                        Elige que checklist se replica en la copia usando la misma
                        estructura tecnica de la tarea origen.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "subtaskIds",
                          task.subtasks.map((subtask) => subtask.id),
                        )
                      }
                      className="rounded-2xl border border-[color:var(--color-border)] px-3 py-2 text-xs font-medium text-[color:var(--color-text-secondary)]"
                    >
                      Usar todas
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("subtaskIds", [])}
                      className="rounded-2xl border border-[color:var(--color-border)] px-3 py-2 text-xs font-medium text-[color:var(--color-text-secondary)]"
                    >
                      Quitar todas
                    </button>
                  </div>

                  {task.subtasks.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {task.subtasks.map((subtask) => {
                        const checked = form.subtaskIds.includes(subtask.id);

                        return (
                          <label
                            key={subtask.id}
                            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                              checked
                                ? "border-[color:var(--color-accent)] bg-[color:rgba(28,63,111,0.08)]"
                                : "border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                updateField(
                                  "subtaskIds",
                                  toggleSelection(form.subtaskIds, subtask.id),
                                )
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
                                {subtask.title}
                              </p>
                              <p className="text-xs text-[color:var(--color-text-secondary)]">
                                {subtask.isCompleted
                                  ? "Completada en la tarea origen"
                                  : "Pendiente en la tarea origen"}
                              </p>
                            </div>
                          </label>
                        );
                      })}

                      <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3">
                        <input
                          type="checkbox"
                          checked={form.resetCompletedSubtasks}
                          onChange={(event) =>
                            updateField(
                              "resetCompletedSubtasks",
                              event.target.checked,
                            )
                          }
                        />
                        <div>
                          <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
                            Reiniciar avance de subtareas
                          </p>
                          <p className="text-xs text-[color:var(--color-text-secondary)]">
                            Las subtareas marcadas como completadas volveran como
                            pendientes en la nueva copia.
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm text-[color:var(--color-text-secondary)]">
                      La tarea origen no tiene subtareas para clonar.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(28,63,111,0.08),rgba(255,255,255,0.92))] p-5">
                <div>
                  <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
                    Asignacion
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                    Mantén los responsables actuales o reasigna la copia a otra
                    persona del proyecto.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => updateField("assigneeIds", task.assigneeIds)}
                  className="rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-medium text-[color:var(--color-text-secondary)]"
                >
                  Usar responsables actuales
                </button>

                <div className="space-y-3">
                  {users.map((user) => {
                    const checked = form.assigneeIds.includes(user.id);

                    return (
                      <label
                        key={user.id}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                          checked
                            ? "border-[color:var(--color-accent)] bg-[color:rgba(28,63,111,0.08)]"
                            : "border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            updateField(
                              "assigneeIds",
                              toggleSelection(form.assigneeIds, user.id),
                            )
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
                            {user.name}
                          </p>
                          <p className="text-xs text-[color:var(--color-text-secondary)]">
                            {user.email}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

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
                {loading ? "Clonando..." : "Crear copia"}
              </button>
            </div>
          </form>
        </TaskModalShell>
      ) : null}
    </>
  );
}
