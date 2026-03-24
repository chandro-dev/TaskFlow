"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/taskflow/icons";
import { AppModalShell } from "@/components/taskflow/app-modal-shell";

export function BoardCreator({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    if (loading) {
      return;
    }

    setOpen(false);
    setName("");
    setError(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch(`/api/projects/${projectId}/boards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible crear el tablero.");
      setLoading(false);
      return;
    }

    setLoading(false);
    closeModal();

    startTransition(() => {
      router.refresh();
      router.push(`/projects/${projectId}/boards/${payload.id}`);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="taskflow-button-primary justify-center"
      >
        <PlusIcon className="h-5 w-5" />
        Nuevo tablero
      </button>

      {open ? (
        <AppModalShell
          eyebrow="Tableros"
          title="Crear tablero"
          description="Define un nuevo tablero para este proyecto y entra directamente a trabajarlo."
          onClose={closeModal}
          maxWidthClass="max-w-2xl"
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre del tablero"
              className="taskflow-input"
              required
            />

            {error ? (
              <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-3">
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
                {loading ? "Creando..." : "Crear tablero"}
              </button>
            </div>
          </form>
        </AppModalShell>
      ) : null}
    </>
  );
}
