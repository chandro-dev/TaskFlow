"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/taskflow/icons";
import { TaskModalShell } from "@/components/taskflow/task-modal-shell";
import { TaskCreationForm } from "@/components/taskflow/task-creation-form";
import type { BoardColumn, TaskPriority, TaskType, UserProfile } from "@/lib/domain/models";

type FormState = {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  dueDate: string;
  estimateHours: string;
  assigneeIds: string[];
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
      assigneeIds: [],
      columnId: columns[0]?.id ?? "",
  });

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAssignee(userId: string) {
    setForm((current) => ({
      ...current,
      assigneeIds: current.assigneeIds.includes(userId)
        ? current.assigneeIds.filter((item) => item !== userId)
        : [...current.assigneeIds, userId],
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
        assigneeIds: form.assigneeIds,
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
      assigneeIds: [],
      columnId: columns[0]?.id ?? "",
    });

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
