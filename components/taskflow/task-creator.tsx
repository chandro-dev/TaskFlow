"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/taskflow/icons";
import type { BoardColumn, TaskPriority, TaskType, UserProfile } from "@/lib/domain/models";

type FormState = {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  dueDate: string;
  estimateHours: string;
  assigneeId: string;
  columnId: string;
};

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
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    type: "TASK",
    priority: "MEDIA",
    dueDate: "",
    estimateHours: "4",
    assigneeId: "",
    columnId: columns[0]?.id ?? "",
  });

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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
        assigneeIds: form.assigneeId ? [form.assigneeId] : [],
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
    setForm({
      title: "",
      description: "",
      type: "TASK",
      priority: "MEDIA",
      dueDate: "",
      estimateHours: "4",
      assigneeId: "",
      columnId: columns[0]?.id ?? "",
    });

    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <button type="button" onClick={() => setOpen((current) => !current)} className="taskflow-button-primary">
        <PlusIcon className="h-5 w-5" />
        Nueva tarea
      </button>

      {open ? (
        <form onSubmit={onSubmit} className="taskflow-panel w-full max-w-3xl space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Titulo de la tarea"
              className="taskflow-input"
              required
            />
            <select
              value={form.columnId}
              onChange={(event) => updateField("columnId", event.target.value)}
              className="taskflow-input"
              required
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Descripcion funcional"
            className="taskflow-input min-h-28 resize-none"
            required
          />

          <div className="grid gap-4 md:grid-cols-4">
            <select
              value={form.type}
              onChange={(event) => updateField("type", event.target.value as TaskType)}
              className="taskflow-input"
            >
              <option value="TASK">Task</option>
              <option value="BUG">Bug</option>
              <option value="FEATURE">Feature</option>
              <option value="IMPROVEMENT">Improvement</option>
            </select>
            <select
              value={form.priority}
              onChange={(event) =>
                updateField("priority", event.target.value as TaskPriority)
              }
              className="taskflow-input"
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
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
              onChange={(event) => updateField("estimateHours", event.target.value)}
              className="taskflow-input"
              required
            />
          </div>

          <select
            value={form.assigneeId}
            onChange={(event) => updateField("assigneeId", event.target.value)}
            className="taskflow-input"
          >
            <option value="">Sin responsable</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          {error ? (
            <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
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
              Crear tarea
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
