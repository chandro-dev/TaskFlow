"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({
  emailHint,
  usesSupabaseAuth,
}: {
  emailHint: string;
  usesSupabaseAuth: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Correo y contrasena son obligatorios.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible iniciar sesion.");
      setLoading(false);
      return;
    }

    setLoading(false);

    startTransition(() => {
      router.push("/projects");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="taskflow-panel space-y-8 p-8 md:p-10">
      <div className="space-y-3">
        <label htmlFor="email" className="text-base font-medium">
          Correo electronico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={emailHint}
          className="taskflow-input"
          placeholder="correo@taskflow.dev"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-base font-medium">
            Contrasena
          </label>
          <a
            href="#"
            className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-accent)]"
          >
            Olvidaste tu contrasena?
          </a>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          defaultValue={usesSupabaseAuth ? "" : "Taskflow2026*"}
          className="taskflow-input"
          placeholder={
            usesSupabaseAuth ? "Tu contrasena registrada" : "Taskflow2026*"
          }
          autoComplete="current-password"
          required
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-[color:var(--color-text-secondary)]">
        <input type="checkbox" className="h-5 w-5 rounded-md border" />
        Recordarme en este dispositivo
      </label>

      <button
        type="submit"
        disabled={loading}
        className="taskflow-button-primary w-full disabled:opacity-60"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      {error ? (
        <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {error}
        </div>
      ) : null}

    </form>
  );
}
