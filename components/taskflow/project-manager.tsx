"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectCardView } from "@/lib/domain/models";
import {
  ProjectFormFields,
  type ProjectFormValues,
} from "@/components/taskflow/project-form-fields";

type ProjectManagerProps = {
  project: ProjectCardView;
};

function buildInitialForm(project: ProjectCardView): ProjectFormValues {
  return {
    name: project.name,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    state: project.state,
    archived: project.archived,
  };
}

export function ProjectManager({ project }: ProjectManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormValues>(() => buildInitialForm(project));

  function updateField<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(buildInitialForm(project));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible actualizar el proyecto.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    startTransition(() => router.refresh());
  }

  async function onDelete() {
    const confirmed = window.confirm(
      `Se eliminara el proyecto "${project.name}" y sus tableros asociados. Esta accion no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "No fue posible eliminar el proyecto.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen((current) => !current);
            if (open) {
              resetForm();
            }
          }}
          className="rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-medium"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={loading}
          className="rounded-2xl border border-[color:rgba(217,83,111,0.3)] px-4 py-3 text-sm font-medium text-[color:var(--color-danger)] disabled:opacity-60"
        >
          Eliminar
        </button>
      </div>

      {open ? (
        <form
          onSubmit={onSubmit}
          className="taskflow-panel w-full max-w-2xl space-y-4 p-5"
        >
          <ProjectFormFields
            form={form}
            onChange={updateField}
            showManagementFields
          />

          {error ? (
            <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
                resetForm();
              }}
              className="rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="taskflow-button-primary justify-center disabled:opacity-60"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
