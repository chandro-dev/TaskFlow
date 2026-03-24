"use client";

import type { TaskSubtaskInput } from "@/lib/domain/models";

export function TaskSubtaskEditor({
  subtasks,
  onAdd,
  onChange,
  onRemove,
}: {
  subtasks: TaskSubtaskInput[];
  onAdd: () => void;
  onChange: <K extends keyof TaskSubtaskInput>(
    index: number,
    key: K,
    value: TaskSubtaskInput[K],
  ) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
            Subtareas
          </h3>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Descompone la tarea en un checklist editable desde el mismo flujo.
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-medium text-[color:var(--color-text-secondary)]"
        >
          Agregar subtarea
        </button>
      </div>

      {subtasks.length > 0 ? (
        <div className="space-y-3">
          {subtasks.map((subtask, index) => (
            <div
              key={subtask.id ?? `draft-${index}`}
              className="grid gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 md:grid-cols-[1fr_auto_auto]"
            >
              <input
                value={subtask.title}
                onChange={(event) => onChange(index, "title", event.target.value)}
                placeholder={`Subtarea ${index + 1}`}
                className="taskflow-input"
              />

              <label className="flex items-center gap-2 rounded-2xl border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={subtask.isCompleted}
                  onChange={(event) =>
                    onChange(index, "isCompleted", event.target.checked)
                  }
                />
                Completada
              </label>

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-2xl border border-[color:rgba(217,83,111,0.24)] px-4 py-2 text-sm font-medium text-[color:var(--color-danger)]"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4 text-sm text-[color:var(--color-text-secondary)]">
          Esta tarea aun no tiene checklist.
        </div>
      )}
    </section>
  );
}
