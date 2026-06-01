"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible completar el registro.");
      setLoading(false);
      return;
    }

    startTransition(() => {
      const message = encodeURIComponent(
        payload?.requiresEmailConfirmation
          ? "Registro creado. Revisa tu correo para confirmar la cuenta."
          : "Registro creado correctamente. Ya puedes ingresar.",
      );
      router.push(`/?registered=${message}&email=${encodeURIComponent(form.email)}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="taskflow-panel space-y-6 p-8 md:p-10">
      <div className="space-y-3">
        <label htmlFor="name" className="text-base font-medium">
          Nombre completo
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          className="taskflow-input"
          placeholder="Tu nombre"
          required
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="email" className="text-base font-medium">
          Correo electronico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          className="taskflow-input"
          placeholder="correo@taskflow.dev"
          required
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="password" className="text-base font-medium">
          Contrasena
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          className="taskflow-input"
          placeholder="Minimo 10 caracteres"
          required
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="confirmPassword" className="text-base font-medium">
          Confirmar contrasena
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={(event) => updateField("confirmPassword", event.target.value)}
          className="taskflow-input"
          placeholder="Repite tu contrasena"
          required
        />
      </div>

      {error ? (
        <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="taskflow-button-primary w-full justify-center disabled:opacity-60"
      >
        Crear cuenta
      </button>

      <p className="text-center text-sm text-[color:var(--color-text-secondary)]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/" className="font-semibold text-[color:var(--color-text-primary)]">
          Inicia sesion
        </Link>
      </p>
    </form>
  );
}
