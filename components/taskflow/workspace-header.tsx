"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ThemeMode, UserProfile } from "@/lib/domain/models";
import {
  BellIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/taskflow/icons";
import { TaskflowLogo } from "@/components/taskflow/logo";
import { ThemeToggle } from "@/components/taskflow/theme-toggle";

function isActive(pathname: string, href: string) {
  if (href === "/projects") {
    return pathname.startsWith("/projects");
  }

  return pathname === href;
}

export function WorkspaceHeader({
  currentUser,
  defaultTheme,
  boardHref,
}: {
  currentUser: UserProfile;
  defaultTheme: ThemeMode;
  boardHref: string;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/projects", label: "Proyectos" },
    { href: boardHref, label: "Tableros" },
    { href: "/settings", label: "Configuración" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.82)] backdrop-blur-xl dark:bg-[color:rgba(9,17,29,0.82)]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-5 py-4 lg:px-8">
        <TaskflowLogo subtitle="Tu gestor de tareas inteligente" />

        <nav className="hidden items-center gap-2 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive(pathname, link.href)
                  ? "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-primary)]"
                  : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <form action="/projects" className="hidden items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3 md:flex">
            <SearchIcon className="h-5 w-5 text-[color:var(--color-text-secondary)]" />
            <input
              name="query"
              placeholder="Buscar tareas..."
              className="min-w-[12rem] bg-transparent text-sm outline-none placeholder:text-[color:var(--color-text-secondary)]"
            />
          </form>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
            aria-label="Notificaciones"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          <Link
            href="/settings"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
            aria-label="Configuración"
          >
            <SettingsIcon className="h-5 w-5" />
          </Link>
          <ThemeToggle defaultMode={defaultTheme} />
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white shadow-[0_12px_30px_rgba(66,86,244,0.35)]"
            style={{ background: "var(--avatar-gradient)" }}
            title={currentUser.name}
          >
            {currentUser.avatar}
          </div>
        </div>
      </div>
    </header>
  );
}
