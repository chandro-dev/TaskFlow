"use client";

import { startTransition, useEffect, useState } from "react";
import type { ThemeMode } from "@/lib/domain/models";
import { getThemeVariables } from "@/lib/patterns/abstract-factory/theme-factory";
import { MoonIcon, SunIcon } from "@/components/taskflow/icons";

const STORAGE_KEY = "taskflow-theme";

function applyTheme(mode: ThemeMode) {
  const variables = getThemeVariables(mode);
  const root = document.documentElement;

  root.dataset.theme = mode;
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(key, value);
  }
}

export function ThemeToggle({ defaultMode }: { defaultMode: ThemeMode }) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  function toggleTheme() {
    const nextMode = mode === "dark" ? "light" : "dark";

    startTransition(() => {
      setMode(nextMode);
      window.localStorage.setItem(STORAGE_KEY, nextMode);
      applyTheme(nextMode);
    });
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] shadow-[0_10px_25px_rgba(15,47,87,0.08)] transition-transform hover:-translate-y-0.5"
      aria-label="Cambiar tema"
      title="Cambiar tema"
    >
      {mode === "dark" ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}
