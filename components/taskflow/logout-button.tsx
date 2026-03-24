"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/taskflow/icons";

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
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] shadow-[0_10px_25px_rgba(15,47,87,0.08)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      aria-label={loading ? "Cerrando sesion" : "Cerrar sesion"}
      title={loading ? "Cerrando sesion" : "Cerrar sesion"}
    >
      <LogoutIcon className={`h-5 w-5 ${loading ? "animate-pulse" : ""}`} />
    </button>
  );
}
