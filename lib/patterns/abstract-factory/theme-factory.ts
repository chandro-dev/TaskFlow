import type { ThemeMode } from "@/lib/domain/models";

export interface ThemePalette {
  background: string;
  backgroundAccent: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentStrong: string;
  success: string;
  warning: string;
  danger: string;
  avatarGradient: string;
}

export interface ThemeFactory {
  createPalette(): ThemePalette;
}

class LightThemeFactory implements ThemeFactory {
  createPalette(): ThemePalette {
    return {
      background: "#eef3fb",
      backgroundAccent: "#f8fbff",
      surface: "#ffffff",
      surfaceMuted: "#f3f6fb",
      border: "#d9e2ef",
      textPrimary: "#141c2f",
      textSecondary: "#7b8aa4",
      accent: "#1e4676",
      accentStrong: "#0f2f57",
      success: "#2ea26f",
      warning: "#d8be34",
      danger: "#d9536f",
      avatarGradient: "linear-gradient(135deg, #22c1c3, #4256f4)",
    };
  }
}

class DarkThemeFactory implements ThemeFactory {
  createPalette(): ThemePalette {
    return {
      background: "#09111d",
      backgroundAccent: "#0f1a29",
      surface: "#101c2c",
      surfaceMuted: "#152538",
      border: "#24354b",
      textPrimary: "#f2f6ff",
      textSecondary: "#9eb0c9",
      accent: "#5b9bff",
      accentStrong: "#3d7fe9",
      success: "#4ecf92",
      warning: "#edc84b",
      danger: "#ff7f96",
      avatarGradient: "linear-gradient(135deg, #43e7d8, #4e72ff)",
    };
  }
}

export function createThemeFactory(mode: ThemeMode): ThemeFactory {
  return mode === "dark" ? new DarkThemeFactory() : new LightThemeFactory();
}

export function getThemeVariables(mode: ThemeMode) {
  const palette = createThemeFactory(mode).createPalette();

  return {
    "--color-bg": palette.background,
    "--color-bg-accent": palette.backgroundAccent,
    "--color-surface": palette.surface,
    "--color-surface-muted": palette.surfaceMuted,
    "--color-border": palette.border,
    "--color-text-primary": palette.textPrimary,
    "--color-text-secondary": palette.textSecondary,
    "--color-accent": palette.accent,
    "--color-accent-strong": palette.accentStrong,
    "--color-success": palette.success,
    "--color-warning": palette.warning,
    "--color-danger": palette.danger,
    "--avatar-gradient": palette.avatarGradient,
  } as Record<string, string>;
}
