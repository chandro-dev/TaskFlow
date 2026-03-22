"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ emailHint }: { emailHint: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(emailHint);
  const [password, setPassword] = useState("Taskflow2026*");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      router.push("/projects");
    });
  }

  return (
    <form onSubmit={onSubmit} className="taskflow-panel space-y-8 p-8 md:p-10">
      <div className="space-y-3">
        <label htmlFor="email" className="text-base font-medium">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="taskflow-input"
          placeholder="correo@taskflow.dev"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-base font-medium">
            Contraseña
          </label>
          <a
            href="#"
            className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-accent)]"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="taskflow-input"
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-[color:var(--color-text-secondary)]">
        <input type="checkbox" className="h-5 w-5 rounded-md border" />
        Recordarme en este dispositivo
      </label>

      <button type="submit" className="taskflow-button-primary w-full">
        Ingresar
      </button>
    </form>
  );
}
