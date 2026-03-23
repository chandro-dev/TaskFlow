"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { SystemSettings, ThemeMode } from "@/lib/domain/models";

type FormState = {
  platformName: string;
  maxAttachmentMb: string;
  passwordPolicy: string;
  defaultTheme: ThemeMode;
};

export function SettingsForm({ settings }: { settings: SystemSettings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    platformName: settings.platformName,
    maxAttachmentMb: String(settings.maxAttachmentMb),
    passwordPolicy: settings.passwordPolicy,
    defaultTheme: settings.defaultTheme,
  });

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

    setLoading(false);
    setSuccess("Configuracion actualizada.");

    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
      <select
        value={form.defaultTheme}
        onChange={(event) => updateField("defaultTheme", event.target.value as ThemeMode)}
        className="taskflow-input"
      >
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
          Guardar configuracion
        </button>
      </div>
    </form>
  );
}
