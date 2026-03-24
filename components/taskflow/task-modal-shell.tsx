"use client";

import type { ReactNode } from "react";
import { AppModalShell } from "@/components/taskflow/app-modal-shell";

export function TaskModalShell({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AppModalShell
      eyebrow="Flujo de tarea"
      title={title}
      description={description}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
    >
      {children}
    </AppModalShell>
  );
}
