"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SystemSettings, ThemeMode, UserProfile } from "@/lib/domain/models";
import { ThemeSingleton } from "@/lib/patterns/singleton/theme-singleton";

type FormState = {
  platformName: string;
  maxAttachmentMb: string;
  passwordPolicy: string;
  defaultTheme: ThemeMode;
};

export function SettingsForm({
  settings,
  currentUser,
}: {
  settings: SystemSettings;
  currentUser: UserProfile;
}) {
  const router = useRouter();
  const canManageSystemSettings = currentUser.role === "ADMIN";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    platformName: settings.platformName,
    maxAttachmentMb: String(settings.maxAttachmentMb),
    passwordPolicy: settings.passwordPolicy,
    defaultTheme: currentUser.themePreference,
  });

  useEffect(() => {
    // Singleton keeps the selected theme synchronized across the whole client
    // app, so settings and navbar always point to the same visual state.
    ThemeSingleton.getInstance().initialize(currentUser.themePreference);
  }, [currentUser.themePreference]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxAttachmentMb: Number(form.maxAttachmentMb),
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible actualizar la configuracion.");
      setLoading(false);
      return;
    }

    // Applying the persisted theme through the singleton updates the full app
    // immediately, including the header toggle and all CSS tokens.
    ThemeSingleton.getInstance().setMode(form.defaultTheme);
    setLoading(false);
    setSuccess("Configuracion actualizada.");

    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {canManageSystemSettings ? (
        <>
          <input
            value={form.platformName}
            onChange={(event) => updateField("platformName", event.target.value)}
            className="taskflow-input"
            required
          />
          <input
            type="number"
            min="1"
            value={form.maxAttachmentMb}
            onChange={(event) => updateField("maxAttachmentMb", event.target.value)}
            className="taskflow-input"
            required
          />
          <textarea
            value={form.passwordPolicy}
            onChange={(event) => updateField("passwordPolicy", event.target.value)}
            className="taskflow-input min-h-28 resize-none"
            required
          />
        </>
      ) : (
        <div className="rounded-2xl bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm leading-7 text-[color:var(--color-text-secondary)]">
          Los parametros globales del sistema solo pueden modificarse con rol
          `ADMIN`. Desde esta vista puedes actualizar tu tema personal.
        </div>
      )}

      <select
        value={form.defaultTheme}
        onChange={(event) => updateField("defaultTheme", event.target.value as ThemeMode)}
        className="taskflow-input"
      >
        <option value="system">Sistema</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>

      {error ? (
        <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl bg-[color:rgba(46,162,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-success)]">
          {success}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="taskflow-button-primary justify-center disabled:opacity-60"
        >
          {canManageSystemSettings ? "Guardar configuracion" : "Guardar tema"}
        </button>
      </div>
    </form>
  );
}
