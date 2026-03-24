"use client";
import type { ThemeMode } from "@/lib/domain/models";
import { getThemeVariables } from "@/lib/patterns/abstract-factory/theme-factory";

const STORAGE_KEY = "taskflow-theme";

type ThemeListener = (mode: ThemeMode) => void;

export class ThemeSingleton {
  private static instance: ThemeSingleton | null = null;
  private listeners = new Set<ThemeListener>();
  private mode: ThemeMode = "light";
  private initialized = false;

  static getInstance() {
    if (!this.instance) {
      this.instance = new ThemeSingleton();
    }

    return this.instance;
  }

  initialize(defaultMode: ThemeMode) {
    if (this.initialized) {
      return this.mode;
    }

    const storedMode = this.readStoredMode();
    this.mode = storedMode ?? defaultMode;
    this.applyTheme(this.mode);
    this.initialized = true;
    return this.mode;
  }

  getMode() {
    return this.mode;
  }

  setMode(nextMode: ThemeMode) {
    if (this.mode === nextMode && this.initialized) {
      this.applyTheme(nextMode);
      return;
    }

    this.mode = nextMode;
    this.initialized = true;
    this.applyTheme(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    this.listeners.forEach((listener) => listener(nextMode));
  }

  subscribe(listener: ThemeListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private readStoredMode() {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    return storedValue === "dark" || storedValue === "light"
      ? storedValue
      : null;
  }

  private applyTheme(mode: ThemeMode) {
    const variables = getThemeVariables(mode);
    const root = document.documentElement;

    // The singleton is the only place that mutates CSS theme tokens, so every
    // client component sees the same visual state immediately after a change.
    root.dataset.theme = mode;
    for (const [key, value] of Object.entries(variables)) {
      root.style.setProperty(key, value);
    }
  }
}
