"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  lastUndoName: string | null;
  lastRedoName: string | null;
}

export function UndoRedoBar({ onUndoRedo }: { onUndoRedo: () => void }) {
  const [history, setHistory] = useState<HistoryState>({
    canUndo: false,
    canRedo: false,
    lastUndoName: null,
    lastRedoName: null,
  });
  const [isPending, startTransition] = useTransition();

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Error al obtener historial de comandos:", err);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchHistory();
    }, 0);

    const handleAction = () => {
      void fetchHistory();
    };

    window.addEventListener("taskflow-action", handleAction);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("taskflow-action", handleAction);
    };
  }, [fetchHistory]);

  const handleUndo = useCallback(async () => {
    if (!history.canUndo || isPending) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/tasks/undo", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
          onUndoRedo();
        }
      } catch (err) {
        console.error("Error al deshacer:", err);
      }
    });
  }, [history.canUndo, isPending, onUndoRedo]);

  const handleRedo = useCallback(async () => {
    if (!history.canRedo || isPending) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/tasks/redo", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
          onUndoRedo();
        }
      } catch (err) {
        console.error("Error al rehacer:", err);
      }
    });
  }, [history.canRedo, isPending, onUndoRedo]);

  // Manejo de atajos de teclado globales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;

      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        void handleUndo();
      } else if (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        void handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleRedo, handleUndo]);

  // Si no hay nada en la pila de deshacer ni rehacer, no mostramos la barra flotante
  if (!history.canUndo && !history.canRedo) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-6 rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/85 px-6 py-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      {/* Sección informativa */}
      <div className="flex flex-col text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-text-secondary)]">
          Historial de cambios
        </span>
        <span className="text-sm font-semibold max-w-[280px] truncate text-[color:var(--color-text-primary)]">
          {history.canUndo
            ? history.lastUndoName
            : history.canRedo
            ? `Listo para rehacer: ${history.lastRedoName}`
            : "Sin cambios"}
        </span>
      </div>

      <div className="h-6 w-[1px] bg-[color:var(--color-border)]" />

      {/* Botones de acción */}
      <div className="flex items-center gap-3">
        {/* Deshacer */}
        <button
          onClick={handleUndo}
          disabled={!history.canUndo || isPending}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
            history.canUndo && !isPending
              ? "bg-[color:var(--color-bg-accent)] text-[color:var(--color-accent)] hover:scale-105 active:scale-95"
              : "opacity-40 cursor-not-allowed text-[color:var(--color-text-secondary)]"
          }`}
          title="Deshacer última acción (Ctrl + Z)"
        >
          <svg
            className="h-4.5 w-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Deshacer <kbd className="hidden sm:inline opacity-65 text-[10px] bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">Ctrl+Z</kbd>
        </button>

        {/* Rehacer */}
        <button
          onClick={handleRedo}
          disabled={!history.canRedo || isPending}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
            history.canRedo && !isPending
              ? "bg-[color:var(--color-bg-accent)] text-[color:var(--color-accent)] hover:scale-105 active:scale-95"
              : "opacity-40 cursor-not-allowed text-[color:var(--color-text-secondary)]"
          }`}
          title="Rehacer acción deshecha (Ctrl + Y)"
        >
          Redo
          <svg
            className="h-4.5 w-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
          Rehacer <kbd className="hidden sm:inline opacity-65 text-[10px] bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">Ctrl+Y</kbd>
        </button>
      </div>
    </div>
  );
}
