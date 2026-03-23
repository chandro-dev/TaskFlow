"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/taskflow/icons";
import {
  ProjectFormFields,
  type ProjectFormValues,
} from "@/components/taskflow/project-form-fields";

export function ProjectCreator() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormValues>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  function updateField<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
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
    setOpen(false);
    setForm({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    });

    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="taskflow-button-primary"
      >
        <PlusIcon className="h-5 w-5" />
        Nuevo proyecto
      </button>

      {open ? (
        <form
          onSubmit={onSubmit}
          className="taskflow-panel w-full max-w-xl space-y-4 p-5"
        >
          <ProjectFormFields form={form} onChange={updateField} />

          {error ? (
            <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
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
              Crear proyecto
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
