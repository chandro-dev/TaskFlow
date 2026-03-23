"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/taskflow/icons";

export function BoardCreator({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setOpen(false);
    setName("");

    startTransition(() => {
      router.refresh();
      router.push(`/projects/${projectId}/boards/${payload.id}`);
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="taskflow-button-primary w-full justify-center"
      >
        <PlusIcon className="h-5 w-5" />
        Nuevo tablero
      </button>

      {open ? (
        <form onSubmit={onSubmit} className="taskflow-panel space-y-4 p-5">
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
              Crear tablero
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
