import type { SystemSettings, UserProfile } from "@/lib/domain/models";

export const FALLBACK_USER: UserProfile = {
  id: "demo-user",
  name: "Demo Admin",
  email: "demo@taskflow.dev",
  role: "ADMIN",
  avatar: "DA",
  bio: "Usuario de respaldo para entornos sin datos iniciales.",
  lastAccess: new Date().toISOString(),
  themePreference: "light",
  isActive: true,
};

export const FALLBACK_SETTINGS: SystemSettings = {
  platformName: "Taskflow",
  maxAttachmentMb: 10,
  passwordPolicy: "Minimo 10 caracteres, mayuscula, numero y simbolo.",
  defaultTheme: "light",
};
