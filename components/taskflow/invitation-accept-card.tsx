"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectInvitationView } from "@/lib/domain/models";
import { formatDateTime, roleLabel } from "@/lib/utils/format";

export function InvitationAcceptCard({
  invitation,
}: {
  invitation: ProjectInvitationView;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function acceptInvitation() {
    setLoading(true);
    setStatus(null);

    const response = await fetch(`/api/invitations/token/${invitation.token}/accept`, {
      method: "POST",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(payload?.error ?? "No fue posible aceptar la invitacion.");
      setLoading(false);
      return;
    }

    setStatus("Invitacion aceptada. Ya puedes volver al panel de proyectos.");
    setLoading(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="taskflow-panel max-w-2xl p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
        Invitacion pendiente
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold">
        {invitation.project?.name ?? "Proyecto"} te espera en Taskflow
      </h1>
      <div className="mt-6 space-y-3 text-sm text-[color:var(--color-text-secondary)]">
        <p>Correo invitado: {invitation.email}</p>
        <p>Rol asignado: {roleLabel(invitation.role)}</p>
        <p>Invitado por: {invitation.inviter?.name ?? "Sistema"}</p>
        <p>Expira: {formatDateTime(invitation.expiresAt)}</p>
      </div>
      {invitation.message ? (
        <p className="mt-6 rounded-2xl bg-[color:var(--color-surface-muted)] p-4 text-sm leading-7 text-[color:var(--color-text-secondary)]">
          {invitation.message}
        </p>
      ) : null}
      <button
        type="button"
        onClick={acceptInvitation}
        disabled={loading || invitation.status !== "PENDING"}
        className="taskflow-button-primary mt-8"
      >
        Aceptar invitacion
      </button>
      {status ? <p className="mt-4 text-sm">{status}</p> : null}
    </div>
  );
}
