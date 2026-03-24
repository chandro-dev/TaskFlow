"use client";

import type { ReactNode } from "react";

export function AppModalShell({
  eyebrow = "Panel",
  title,
  description,
  onClose,
  children,
  maxWidthClass = "max-w-4xl",
}: {
  eyebrow?: string;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:rgba(10,14,26,0.48)] px-4 py-6 backdrop-blur-sm">
      <div
        className={`w-full overflow-hidden rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_24px_80px_rgba(15,23,42,0.22)] ${maxWidthClass}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--color-border)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-text-primary)]">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--color-text-secondary)]">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium text-[color:var(--color-text-secondary)]"
          >
            Cerrar
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
