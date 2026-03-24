"use client";

import { startTransition, useEffect, useState } from "react";
import type { ThemeMode } from "@/lib/domain/models";
import { MoonIcon, SunIcon } from "@/components/taskflow/icons";
import { ThemeSingleton } from "@/lib/patterns/singleton/theme-singleton";

export function ThemeToggle({ defaultMode }: { defaultMode: ThemeMode }) {
  const [mode, setMode] = useState<ThemeMode>(() =>
    typeof window === "undefined"
      ? defaultMode
      : ThemeSingleton.getInstance().initialize(defaultMode),
  );

  useEffect(() => {
    const themeManager = ThemeSingleton.getInstance();
    themeManager.initialize(defaultMode);

    // The toggle listens to the singleton so changes coming from Settings are
    // reflected here without forcing a full page reload.
    return themeManager.subscribe((nextMode) => setMode(nextMode));
  }, [defaultMode]);

  function toggleTheme() {
    const nextMode = mode === "dark" ? "light" : "dark";
    const themeManager = ThemeSingleton.getInstance();

    startTransition(() => {
      themeManager.setMode(nextMode);
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
