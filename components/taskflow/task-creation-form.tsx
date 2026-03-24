"use client";

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

export function TaskCreationForm({
  form,
  columns,
  users,
  onFieldChange,
  onAssigneeToggle,
}: {
  form: FormState;
  columns: BoardColumn[];
  users: UserProfile[];
  onFieldChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onAssigneeToggle: (userId: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-6">
        <section className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
              Contexto principal
            </h3>
            <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
              Define el alcance funcional y el estado inicial dentro del tablero.
            </p>
          </div>

          <input
            value={form.title}
            onChange={(event) => onFieldChange("title", event.target.value)}
            placeholder="Titulo de la tarea"
            className="taskflow-input"
            required
          />

          <textarea
            value={form.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
            placeholder="Descripcion funcional, criterios o contexto tecnico"
            className="taskflow-input min-h-36 resize-none"
            required
          />

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.columnId}
              onChange={(event) => onFieldChange("columnId", event.target.value)}
              className="taskflow-input"
              required
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>

            <select
              value={form.type}
              onChange={(event) =>
                onFieldChange("type", event.target.value as TaskType)
              }
              className="taskflow-input"
            >
              <option value="TASK">Task</option>
              <option value="BUG">Bug</option>
              <option value="FEATURE">Feature</option>
              <option value="IMPROVEMENT">Improvement</option>
            </select>
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
              Planificacion
            </h3>
            <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
              Prioridad, fecha limite y esfuerzo estimado.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <select
              value={form.priority}
              onChange={(event) =>
                onFieldChange("priority", event.target.value as TaskPriority)
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
              onChange={(event) => onFieldChange("dueDate", event.target.value)}
              className="taskflow-input"
              required
            />
            <input
              type="number"
              min="1"
              value={form.estimateHours}
              onChange={(event) =>
                onFieldChange("estimateHours", event.target.value)
              }
              className="taskflow-input"
              required
            />
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(28,63,111,0.08),rgba(255,255,255,0.92))] p-5">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
            Responsables
          </h3>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Puedes asignar uno o varios miembros del proyecto desde la misma
            creacion.
          </p>
        </div>

        <div className="space-y-3">
          {users.length ? (
            users.map((user) => {
              const checked = form.assigneeIds.includes(user.id);

              return (
                <label
                  key={user.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    checked
                      ? "border-[color:var(--color-accent)] bg-[color:rgba(28,63,111,0.08)]"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onAssigneeToggle(user.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
                      {user.name}
                    </p>
                    <p className="text-xs text-[color:var(--color-text-secondary)]">
                      {user.email}
                    </p>
                  </div>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: "var(--avatar-gradient)" }}
                  >
                    {user.avatar}
                  </div>
                </label>
              );
            })
          ) : (
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4 text-sm text-[color:var(--color-text-secondary)]">
              No hay miembros disponibles para asignar.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
