"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/taskflow/icons";
import { AppModalShell } from "@/components/taskflow/app-modal-shell";
import {
  getDefaultBoardColumnDrafts,
} from "@/lib/patterns/factory/board-factory";

type BoardColumnForm = {
  name: string;
};

const defaultColumnForm = () =>
  getDefaultBoardColumnDrafts().map((column) => ({
    name: column.name,
  }));

export function BoardCreator({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [columns, setColumns] = useState<BoardColumnForm[]>(defaultColumnForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    if (loading) {
      return;
    }

    setOpen(false);
    setName("");
    setColumns(defaultColumnForm());
    setError(null);
  }

  function updateColumn(index: number, value: string) {
    setColumns((current) =>
      current.map((column, currentIndex) =>
        currentIndex === index ? { ...column, name: value } : column,
      ),
    );
  }

  function addColumn() {
    setColumns((current) => [...current, { name: "" }]);
  }

  function removeColumn(index: number) {
    setColumns((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function resetDefaultColumns() {
    setColumns(defaultColumnForm());
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch(`/api/projects/${projectId}/boards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        columns: columns.map((column) => ({
          name: column.name,
        })),
      }),
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

            <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
                    Columnas del tablero
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                    Parte de las cuatro columnas base del requerimiento y ajusta la estructura antes de crear el tablero.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={resetDefaultColumns}
                    className="rounded-2xl border border-[color:var(--color-border)] px-3 py-2 text-xs font-medium text-[color:var(--color-text-secondary)]"
                  >
                    Restaurar base
                  </button>
                  <button
                    type="button"
                    onClick={addColumn}
                    className="rounded-2xl border border-[color:var(--color-border)] px-3 py-2 text-xs font-medium text-[color:var(--color-text-secondary)]"
                  >
                    Agregar columna
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {columns.map((column, index) => (
                  <div
                    key={`column-${index}`}
                    className="grid gap-3 md:grid-cols-[1fr_auto]"
                  >
                    <input
                      value={column.name}
                      onChange={(event) => updateColumn(index, event.target.value)}
                      placeholder={`Columna ${index + 1}`}
                      className="taskflow-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeColumn(index)}
                      disabled={columns.length <= 1}
                      className="rounded-2xl border border-[color:rgba(217,83,111,0.3)] px-4 py-3 text-sm font-medium text-[color:var(--color-danger)] disabled:opacity-50"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>

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
