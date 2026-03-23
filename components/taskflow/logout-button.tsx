"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setLoading(false);

    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm font-medium text-[color:var(--color-text-primary)] disabled:opacity-60"
    >
      {loading ? "Cerrando..." : "Cerrar sesion"}
    </button>
  );
}
