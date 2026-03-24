"use client";

import { useState } from "react";
import { AppModalShell } from "@/components/taskflow/app-modal-shell";
import { InvitationManager } from "@/components/taskflow/invitation-manager";
import { PlusIcon } from "@/components/taskflow/icons";
import type {
  ProjectCardView,
  ProjectInvitationView,
  UserProfile,
} from "@/lib/domain/models";

export function InvitationManagerModal({
  projects,
  users,
  defaultProjectId,
  invitations,
}: {
  projects: ProjectCardView[];
  users: UserProfile[];
  defaultProjectId?: string | null;
  invitations: ProjectInvitationView[];
}) {
  const [open, setOpen] = useState(false);
  const pendingCount = invitations.filter(
    (invitation) => invitation.status === "PENDING",
  ).length;

  return (
    <>
      <section className="taskflow-panel p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Invitaciones</h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-secondary)]">
              Gestiona invitaciones internas por proyecto en un flujo dedicado.
            </p>
          </div>
          <div className="taskflow-chip">{pendingCount} pendientes</div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="taskflow-button-primary"
          >
            <PlusIcon className="h-5 w-5" />
            Abrir invitaciones
          </button>
        </div>
      </section>

      {open ? (
        <AppModalShell
          eyebrow="Colaboracion"
          title="Invitaciones de miembros"
          description="Selecciona proyecto, revisa usuarios internos disponibles y gestiona el historial de invitaciones desde un solo modal."
          onClose={() => setOpen(false)}
          maxWidthClass="max-w-6xl"
        >
          <InvitationManager
            projects={projects}
            users={users}
            defaultProjectId={defaultProjectId}
            invitations={invitations}
          />
        </AppModalShell>
      ) : null}
    </>
  );
}
