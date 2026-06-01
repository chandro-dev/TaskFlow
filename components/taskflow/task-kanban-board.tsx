"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskCard } from "@/components/taskflow/task-card";
import { TaskCloneModal } from "@/components/taskflow/task-clone-modal";
import { TaskDeleteButton } from "@/components/taskflow/task-delete-button";
import { TaskEditorModal } from "@/components/taskflow/task-editor-modal";
import { UndoRedoBar } from "@/components/taskflow/undo-redo-bar";
import type {
  BoardColumnView,
  ProjectActionPermissions,
  UserProfile,
} from "@/lib/domain/models";

type MoveStatus = {
  taskId: string;
  toColumnId: string;
} | null;

function moveTaskBetweenColumns(
  columns: BoardColumnView[],
  taskId: string,
  fromColumnId: string,
  toColumnId: string,
) {
  if (fromColumnId === toColumnId) {
    return columns;
  }

  const sourceColumn = columns.find((column) => column.id === fromColumnId);
  const destinationColumn = columns.find((column) => column.id === toColumnId);
  const task = sourceColumn?.tasks.find((item) => item.id === taskId);

  if (!sourceColumn || !destinationColumn || !task) {
    return columns;
  }

  return columns.map((column) => {
    if (column.id === fromColumnId) {
      return {
        ...column,
        tasks: column.tasks.filter((item) => item.id !== taskId),
      };
    }

    if (column.id === toColumnId) {
      return {
        ...column,
        tasks: [{ ...task, columnId: toColumnId }, ...column.tasks],
      };
    }

    return column;
  });
}

export function TaskKanbanBoard({
  projectId,
  boardId,
  initialColumns,
  users,
  permissions,
}: {
  projectId: string;
  boardId: string;
  initialColumns: BoardColumnView[];
  users: UserProfile[];
  permissions: ProjectActionPermissions;
}) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedFromColumnId, setDraggedFromColumnId] = useState<string | null>(null);
  const [dropColumnId, setDropColumnId] = useState<string | null>(null);
  const [moveStatus, setMoveStatus] = useState<MoveStatus>(null);
  const [error, setError] = useState<string | null>(null);

  // Limpia el historial de comandos cuando el usuario abandona el board.
  // El cleanup de useEffect se ejecuta al desmontar el componente.
  useEffect(() => {
    return () => {
      // fire-and-forget: no necesitamos await aquí
      fetch("/api/tasks/history", { method: "DELETE" }).catch(() => {
        // silenciar errores de red al desmontar
      });
    };
  }, []); // sin dependencias → solo corre el cleanup al desmontar

  // Contador de generación: se incrementa cada vez que arranca un move
  // optimista. El useEffect captura el valor en ese instante y solo aplica
  // initialColumns si no ha habido ningún move nuevo desde entonces.
  // Esto evita que datos stale del servidor (llegados antes de que el
  // router.refresh() traiga la versión correcta) sobreescriban la UI.
  const moveGenRef = useRef(0);

  useEffect(() => {
    // Capturamos la generación vigente en el momento en que este efecto corre.
    // Si para cuando el servidor responde ya hay otra generación (otro move
    // arrancó), no tocamos el estado local.
    const capturedGen = moveGenRef.current;
    if (capturedGen === 0) {
      setColumns(initialColumns);
    }
  }, [initialColumns]);

  const isMovingTask = useMemo(
    () => moveStatus?.taskId ?? null,
    [moveStatus],
  );

  async function persistMove(taskId: string, toColumnId: string) {
    const response = await fetch(
      `/api/projects/${projectId}/boards/${boardId}/tasks/${taskId}/move`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toColumnId }),
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error ?? "No fue posible mover la tarea.");
    }
  }

  async function handleDrop(targetColumnId: string) {
    if (!permissions.canMoveTask) {
      return;
    }

    if (!draggedTaskId || !draggedFromColumnId) {
      return;
    }

    if (draggedFromColumnId === targetColumnId) {
      setDraggedTaskId(null);
      setDraggedFromColumnId(null);
      setDropColumnId(null);
      return;
    }

    const previousColumns = columns;
    const nextColumns = moveTaskBetweenColumns(
      columns,
      draggedTaskId,
      draggedFromColumnId,
      targetColumnId,
    );

    // Incrementamos la generación ANTES del update optimista para que el
    // useEffect ignore cualquier initialColumns stale que llegue del servidor
    // mientras el move está en vuelo.
    moveGenRef.current += 1;
    const currentGen = moveGenRef.current;

    setColumns(nextColumns);
    setMoveStatus({ taskId: draggedTaskId, toColumnId: targetColumnId });
    setDropColumnId(null);
    setError(null);

    try {
      await persistMove(draggedTaskId, targetColumnId);
      window.dispatchEvent(new CustomEvent("taskflow-action"));
      startTransition(() => {
        // Bajamos la generación a 0 justo antes del refresh para que cuando
        // lleguen los initialColumns frescos del servidor el useEffect los
        // aplique normalmente (capturedGen === 0).
        if (moveGenRef.current === currentGen) {
          moveGenRef.current = 0;
        }
        router.refresh();
      });
    } catch (moveError) {
      // En caso de error volvemos a 0 y restauramos el estado anterior.
      moveGenRef.current = 0;
      setColumns(previousColumns);
      setError(
        moveError instanceof Error
          ? moveError.message
          : "No fue posible mover la tarea.",
      );
    } finally {
      setMoveStatus(null);
      setDraggedTaskId(null);
      setDraggedFromColumnId(null);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-[color:rgba(217,83,111,0.22)] bg-[color:rgba(217,83,111,0.10)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {error}
        </div>
      ) : null}
      {permissions.isReadOnly ? (
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm text-[color:var(--color-text-secondary)]">
          Este proyecto esta en modo solo lectura. Puedes consultar tareas, pero
          no crear, mover ni editar elementos.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-4">
        {columns.map((column) => {
          const isDropTarget = dropColumnId === column.id;
          const wipLimit = column.wipLimit;
          const hasWipLimit = typeof wipLimit === "number";
          const isWipExceeded = hasWipLimit && column.tasks.length > wipLimit;

          return (
            <section key={column.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h2 className="text-2xl font-semibold">{column.name}</h2>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    isWipExceeded
                      ? "bg-[color:rgba(217,83,111,0.14)] text-[color:var(--color-danger)]"
                      : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)]"
                  }`}
                >
                  {column.tasks.length}
                  {hasWipLimit ? ` / WIP ${wipLimit}` : ""}
                </div>
              </div>
              {isWipExceeded ? (
                <p className="text-sm font-medium text-[color:var(--color-danger)]">
                  Esta columna supera el limite WIP configurado.
                </p>
              ) : null}

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  if (draggedTaskId) {
                    setDropColumnId(column.id);
                  }
                }}
                onDragLeave={() => {
                  if (dropColumnId === column.id) {
                    setDropColumnId(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleDrop(column.id);
                }}
                className={`space-y-4 rounded-[2rem] border border-dashed p-3 transition ${
                  isDropTarget
                    ? "border-[color:var(--color-accent)] bg-[color:rgba(28,63,111,0.08)]"
                    : "border-transparent"
                }`}
              >
                {column.tasks.length > 0 ? (
                  column.tasks.map((task) => {
                    const isDragging = draggedTaskId === task.id;
                    const isSaving =
                      isMovingTask === task.id && moveStatus?.toColumnId === column.id;

                    return (
                      <div
                        key={task.id}
                        draggable={permissions.canMoveTask && isMovingTask === null}
                        onDragStart={() => {
                          if (!permissions.canMoveTask) {
                            return;
                          }

                          setDraggedTaskId(task.id);
                          setDraggedFromColumnId(column.id);
                          setError(null);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDraggedFromColumnId(null);
                          setDropColumnId(null);
                        }}
                        className={`${
                          permissions.canMoveTask
                            ? "cursor-grab active:cursor-grabbing"
                            : ""
                        } ${
                          isDragging ? "opacity-55" : ""
                        } ${isSaving ? "animate-pulse" : ""}`}
                      >
                        <TaskCard
                          task={task}
                          actions={
                            <div className="flex flex-wrap justify-end gap-2">
                              {permissions.canUpdateTask ? (
                                <TaskEditorModal
                                  task={task}
                                  projectId={projectId}
                                  boardId={boardId}
                                  columns={columns}
                                  users={users}
                                />
                              ) : null}
                              {permissions.canCloneTask ? (
                                <TaskCloneModal
                                  task={task}
                                  projectId={projectId}
                                  boardId={boardId}
                                  columns={columns}
                                  users={users}
                                />
                              ) : null}
                              {permissions.canDeleteTask ? (
                                <TaskDeleteButton
                                  taskId={task.id}
                                  projectId={projectId}
                                  boardId={boardId}
                                />
                              ) : null}
                            </div>
                          }
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="taskflow-panel p-6 text-sm leading-7 text-[color:var(--color-text-secondary)]">
                    Suelta una tarea aqui o aplica otros filtros para verla en esta
                    columna.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {permissions.canMoveTask ? (
        <UndoRedoBar
          onUndoRedo={() => {
            startTransition(() => {
              router.refresh();
            });
            window.dispatchEvent(new CustomEvent("taskflow-action"));
          }}
        />
      ) : null}
    </div>
  );
}
