"use client";

import type { ThemeMode } from "@/lib/domain/models";
import {
  createThemeArtifacts,
  resolveThemeMode,
  type ResolvedThemeMode,
} from "@/lib/patterns/abstract-factory/theme-factory";

const STORAGE_KEY = "taskflow-theme";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

export type ThemeSnapshot = {
  mode: ThemeMode;
  effectiveMode: ResolvedThemeMode;
};

type ThemeListener = (state: ThemeSnapshot) => void;

// Pattern traceability: Singleton.
// Theme changes must be global, so the UI relies on one shared client-side
// instance that owns the selected mode, the resolved mode and the CSS token
// mutation.
export class ThemeSingleton {
  private static instance: ThemeSingleton | null = null;
  private listeners = new Set<ThemeListener>();
  private mediaQuery: MediaQueryList | null = null;
  private systemListener: (() => void) | null = null;
  private mode: ThemeMode = "system";
  private effectiveMode: ResolvedThemeMode = "light";
  private initialized = false;

  private constructor() {
    this.seedFromDocument();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new ThemeSingleton();
    }

    return this.instance;
  }

  initialize(defaultMode: ThemeMode): ThemeSnapshot {
    if (this.initialized) {
      return this.getSnapshot();
    }

    const storedMode = this.readStoredMode();
    this.mode = storedMode ?? defaultMode;
    this.bindSystemThemeWatcher();
    this.syncAppliedTheme();
    this.initialized = true;
    return this.getSnapshot();
  }

  getMode() {
    return this.mode;
  }

  getEffectiveMode() {
    return this.effectiveMode;
  }

  getSnapshot(): ThemeSnapshot {
    return {
      mode: this.mode,
      effectiveMode: this.effectiveMode,
    };
  }

  setMode(nextMode: ThemeMode) {
    this.mode = nextMode;
    this.initialized = true;
    this.bindSystemThemeWatcher();
    this.syncAppliedTheme();
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  }

  subscribe(listener: ThemeListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private readStoredMode() {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    return storedValue === "dark" || storedValue === "light" || storedValue === "system"
      ? storedValue
      : null;
  }

  private seedFromDocument() {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const storedMode = root.dataset.themePreference;
    const storedEffectiveMode = root.dataset.theme;

    if (storedMode === "light" || storedMode === "dark" || storedMode === "system") {
      this.mode = storedMode;
    }

    if (storedEffectiveMode === "light" || storedEffectiveMode === "dark") {
      this.effectiveMode = storedEffectiveMode;
    }
  }

  private bindSystemThemeWatcher() {
    this.systemListener?.();
    this.systemListener = null;

    if (typeof window === "undefined") {
      return;
    }

    this.mediaQuery = window.matchMedia(SYSTEM_QUERY);
    const handleSystemChange = () => {
      if (this.mode !== "system") {
        return;
      }

      this.syncAppliedTheme();
    };

    this.mediaQuery.addEventListener("change", handleSystemChange);
    this.systemListener = () => {
      this.mediaQuery?.removeEventListener("change", handleSystemChange);
    };
  }

  private syncAppliedTheme() {
    const prefersDark = this.mediaQuery?.matches ?? false;
    this.effectiveMode = resolveThemeMode(this.mode, prefersDark);
    this.applyTheme(this.effectiveMode);
    this.notifyListeners();
  }

  private notifyListeners() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private applyTheme(mode: ResolvedThemeMode) {
    const { cssVariables } = createThemeArtifacts(mode);
    const root = document.documentElement;

    root.dataset.theme = mode;
    root.dataset.themePreference = this.mode;
    for (const [key, value] of Object.entries(cssVariables)) {
      root.style.setProperty(key, value);
    }
  }
}
