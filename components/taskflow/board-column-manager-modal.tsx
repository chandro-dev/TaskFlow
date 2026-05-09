"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppModalShell } from "@/components/taskflow/app-modal-shell";
import type { BoardColumnView } from "@/lib/domain/models";

type ColumnRow = {
  id: string;
  name: string;
  taskCount: number;
};

function mapColumns(columns: BoardColumnView[]): ColumnRow[] {
  return columns
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((column) => ({
      id: column.id,
      name: column.name,
      taskCount: column.tasks.length,
    }));
}

function moveItem(rows: ColumnRow[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= rows.length) {
    return rows;
  }

  const next = rows.slice();
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

function reorderRows(rows: ColumnRow[], draggedId: string, targetId: string) {
  if (draggedId === targetId) {
    return rows;
  }

  const draggedIndex = rows.findIndex((row) => row.id === draggedId);
  const targetIndex = rows.findIndex((row) => row.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) {
    return rows;
  }

  const next = rows.slice();
  const [draggedRow] = next.splice(draggedIndex, 1);
  next.splice(targetIndex, 0, draggedRow);
  return next;
}

export function BoardColumnManagerModal({
  projectId,
  boardId,
  columns,
}: {
  projectId: string;
  boardId: string;
  columns: BoardColumnView[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ColumnRow[]>(() => mapColumns(columns));
  const [newColumnName, setNewColumnName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dropColumnId, setDropColumnId] = useState<string | null>(null);

  useEffect(() => {
    setRows(mapColumns(columns));
  }, [columns]);

  async function handleCreateColumn() {
    if (!newColumnName.trim()) {
      setError("La nueva columna requiere un nombre.");
      return;
    }

    setPendingAction("create");
    setError(null);

    const response = await fetch(
      `/api/projects/${projectId}/boards/${boardId}/columns`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newColumnName }),
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible crear la columna.");
      setPendingAction(null);
      return;
    }

    setNewColumnName("");
    setPendingAction(null);
    startTransition(() => router.refresh());
  }

  async function handleRename(columnId: string, name: string) {
    setPendingAction(`rename:${columnId}`);
    setError(null);

    const response = await fetch(
      `/api/projects/${projectId}/boards/${boardId}/columns/${columnId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible renombrar la columna.");
      setPendingAction(null);
      return;
    }

    setPendingAction(null);
    startTransition(() => router.refresh());
  }

  async function handleReorder(nextRows: ColumnRow[]) {
    const previousRows = rows;
    setRows(nextRows);
    setPendingAction("reorder");
    setError(null);

    const response = await fetch(
      `/api/projects/${projectId}/boards/${boardId}/columns/reorder`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedColumnIds: nextRows.map((row) => row.id),
        }),
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setRows(previousRows);
      setError(payload?.error ?? "No fue posible reordenar las columnas.");
      setPendingAction(null);
      return;
    }

    setPendingAction(null);
    startTransition(() => router.refresh());
  }

  async function handleDelete(row: ColumnRow) {
    const confirmed = window.confirm(
      `Se eliminara la columna "${row.name}". Esta accion no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setPendingAction(`delete:${row.id}`);
    setError(null);

    const response = await fetch(
      `/api/projects/${projectId}/boards/${boardId}/columns/${row.id}`,
      {
        method: "DELETE",
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible eliminar la columna.");
      setPendingAction(null);
      return;
    }

    setPendingAction(null);
    startTransition(() => router.refresh());
  }

  async function handleDrop(targetColumnId: string) {
    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      setDraggedColumnId(null);
      setDropColumnId(null);
      return;
    }

    const nextRows = reorderRows(rows, draggedColumnId, targetColumnId);

    setDraggedColumnId(null);
    setDropColumnId(null);
    await handleReorder(nextRows);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-medium"
      >
        Gestionar columnas
      </button>

      {open ? (
        <AppModalShell
          eyebrow="RF-03.3"
          title="Gestion de columnas"
          description="Crea, renombra, reordena y elimina columnas dentro del tablero. No se pueden borrar columnas con tareas ni dejar el tablero sin columnas."
          onClose={() => {
            if (pendingAction) {
              return;
            }

            setOpen(false);
            setError(null);
          }}
          maxWidthClass="max-w-4xl"
        >
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1">
                  <label className="mb-2 block text-sm font-medium text-[color:var(--color-text-primary)]">
                    Nueva columna
                  </label>
                  <input
                    value={newColumnName}
                    onChange={(event) => setNewColumnName(event.target.value)}
                    placeholder="Nombre de la columna"
                    className="taskflow-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreateColumn()}
                  disabled={pendingAction !== null}
                  className="taskflow-button-primary justify-center disabled:opacity-60"
                >
                  Agregar columna
                </button>
              </div>
            </div>

            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Arrastra el asa de cada columna para cambiar su posicion dentro del tablero.
            </p>

            <div className="space-y-3">
              {rows.map((row, index) => {
                const deleteBlocked = row.taskCount > 0 || rows.length <= 1;
                const isDropTarget =
                  dropColumnId === row.id && draggedColumnId !== row.id;

                return (
                  <div
                    key={row.id}
                    draggable={pendingAction === null}
                    onDragStart={() => {
                      if (pendingAction !== null) {
                        return;
                      }

                      setDraggedColumnId(row.id);
                      setDropColumnId(row.id);
                      setError(null);
                    }}
                    onDragEnd={() => {
                      setDraggedColumnId(null);
                      setDropColumnId(null);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();

                      if (pendingAction === null && draggedColumnId) {
                        setDropColumnId(row.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dropColumnId === row.id) {
                        setDropColumnId(null);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleDrop(row.id);
                    }}
                    className={`grid cursor-grab gap-3 rounded-[1.5rem] border p-4 transition active:cursor-grabbing lg:grid-cols-[minmax(0,1fr)_auto] ${
                      isDropTarget
                        ? "border-[color:var(--color-accent)] bg-[color:rgba(28,63,111,0.08)]"
                        : "border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="taskflow-chip">Posicion {index + 1}</span>
                        <span className="text-sm text-[color:var(--color-text-secondary)]">
                          {row.taskCount} tarea(s) en esta columna
                        </span>
                      </div>
                      <input
                        value={row.name}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item) =>
                              item.id === row.id
                                ? { ...item, name: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="taskflow-input"
                        required
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => void handleRename(row.id, row.name)}
                        disabled={pendingAction !== null}
                        className="rounded-2xl border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium disabled:opacity-60"
                      >
                        Guardar nombre
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReorder(moveItem(rows, index, -1))}
                        disabled={pendingAction !== null || index === 0}
                        className="rounded-2xl border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium disabled:opacity-60"
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReorder(moveItem(rows, index, 1))}
                        disabled={pendingAction !== null || index === rows.length - 1}
                        className="rounded-2xl border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium disabled:opacity-60"
                      >
                        Bajar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row)}
                        disabled={pendingAction !== null || deleteBlocked}
                        className="rounded-2xl border border-[color:rgba(217,83,111,0.3)] px-3 py-2 text-sm font-medium text-[color:var(--color-danger)] disabled:opacity-60"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {error ? (
              <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
                {error}
              </div>
            ) : null}
          </div>
        </AppModalShell>
      ) : null}
    </>
  );
}
