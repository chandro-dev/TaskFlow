"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { AppModalShell } from "@/components/taskflow/app-modal-shell";
import {
  ProjectFormFields,
  type ProjectFormValues,
} from "@/components/taskflow/project-form-fields";
import type { ProjectCardView } from "@/lib/domain/models";

function buildCloneForm(project: ProjectCardView): ProjectFormValues {
  return {
    name: `${project.name} - copia`,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
  };
}

export function ProjectCloneModal({ project }: { project: ProjectCardView }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormValues>(() => buildCloneForm(project));

  function updateField<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function closeModal() {
    if (loading) {
      return;
    }

    setOpen(false);
    setError(null);
    setForm(buildCloneForm(project));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/projects/${project.id}/clone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible clonar el proyecto.");
      setLoading(false);
      return;
    }

    setLoading(false);
    closeModal();
    startTransition(() => router.refresh());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-medium"
      >
        Clonar estructura
      </button>

      {open ? (
        <AppModalShell
          eyebrow="Prototype"
          title="Clonar proyecto"
          description="La copia conserva la estructura de tableros y columnas del proyecto origen. No replica tareas, miembros, invitaciones ni notificaciones."
          onClose={closeModal}
          maxWidthClass="max-w-3xl"
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
                Alcance del clon
              </h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm">
                  Se copiaran los tableros y sus columnas configuradas.
                </div>
                <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm">
                  El nuevo proyecto iniciara limpio, sin tareas y en estado planificado.
                </div>
              </div>
              <p className="mt-4 text-sm text-[color:var(--color-text-secondary)]">
                Proyecto origen: <span className="font-medium text-[color:var(--color-text-primary)]">{project.name}</span>. Tareas actuales no copiadas:{" "}
                <span className="font-medium text-[color:var(--color-text-primary)]">
                  {project.totalTasks}
                </span>
                .
              </p>
            </div>

            <ProjectFormFields form={form} onChange={updateField} />

            {error ? (
              <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="taskflow-button-primary justify-center disabled:opacity-60"
              >
                {loading ? "Clonando..." : "Crear clon"}
              </button>
            </div>
          </form>
        </AppModalShell>
      ) : null}
    </>
  );
}
