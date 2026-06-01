"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function TaskDeleteButton({
  taskId,
  projectId,
  boardId,
}: {
  taskId: string;
  projectId: string;
  boardId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Esta accion eliminara la tarea y su historial asociado. ¿Deseas continuar?",
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    const response = await fetch(
      `/api/projects/${projectId}/boards/${boardId}/tasks/${taskId}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      window.alert(payload?.error ?? "No fue posible eliminar la tarea.");
      setLoading(false);
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={() => void handleDelete()}
      disabled={loading}
      className="rounded-2xl border border-[color:rgba(217,83,111,0.28)] px-3 py-2 text-sm font-medium text-[color:var(--color-danger)] transition hover:bg-[color:rgba(217,83,111,0.10)] disabled:opacity-60"
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
