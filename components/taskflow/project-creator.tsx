"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/taskflow/icons";
import { AppModalShell } from "@/components/taskflow/app-modal-shell";
import {
  ProjectFormFields,
  type ProjectFormValues,
} from "@/components/taskflow/project-form-fields";

const emptyProjectForm: ProjectFormValues = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
};

export function ProjectCreator() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormValues>(emptyProjectForm);

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
    setForm(emptyProjectForm);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible crear el proyecto.");
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
        className="taskflow-button-primary"
      >
        <PlusIcon className="h-5 w-5" />
        Nuevo proyecto
      </button>

      {open ? (
        <AppModalShell
          eyebrow="Proyectos"
          title="Crear proyecto"
          description="Define la base del proyecto y deja listo su tablero Kanban inicial desde un solo flujo."
          onClose={closeModal}
          maxWidthClass="max-w-3xl"
        >
          <form onSubmit={onSubmit} className="space-y-5">
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
                {loading ? "Creando..." : "Crear proyecto"}
              </button>
            </div>
          </form>
        </AppModalShell>
      ) : null}
    </>
  );
}
