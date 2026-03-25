"use client";

import { startTransition, useEffect, useState } from "react";
import type { ThemeMode } from "@/lib/domain/models";
import { MoonIcon, SunIcon } from "@/components/taskflow/icons";
import {
  ThemeSingleton,
  type ThemeSnapshot,
} from "@/lib/patterns/singleton/theme-singleton";

export function ThemeToggle({ defaultMode }: { defaultMode: ThemeMode }) {
  const [themeState, setThemeState] = useState<ThemeSnapshot>(() => {
    if (typeof window === "undefined") {
      return {
        mode: defaultMode,
        effectiveMode: defaultMode === "dark" ? "dark" : "light",
      };
    }

    return ThemeSingleton.getInstance().getSnapshot();
  });

  useEffect(() => {
    const themeManager = ThemeSingleton.getInstance();
    const unsubscribe = themeManager.subscribe((nextState) => setThemeState(nextState));

    // The singleton owns the final theme decision. Initializing it here lets
    // the client reuse the persisted preference or the system mode resolution
    // without duplicating that logic inside the button.
    themeManager.initialize(defaultMode);
    return unsubscribe;
  }, [defaultMode]);

  function toggleTheme() {
    const nextMode = themeState.effectiveMode === "dark" ? "light" : "dark";
    const themeManager = ThemeSingleton.getInstance();

    startTransition(() => {
      themeManager.setMode(nextMode);
    });
  }

  const title =
    themeState.mode === "system"
      ? "Tema del sistema"
      : `Tema ${themeState.effectiveMode}`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] shadow-[0_10px_25px_rgba(15,47,87,0.08)] transition-transform hover:-translate-y-0.5"
      aria-label={title}
      title={title}
    >
      {themeState.effectiveMode === "dark" ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}
