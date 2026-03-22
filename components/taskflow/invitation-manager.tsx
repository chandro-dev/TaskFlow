"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Project,
  ProjectInvitationView,
  UserRole,
} from "@/lib/domain/models";
import { formatDateTime, roleLabel } from "@/lib/utils/format";

type StatusMessage =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

async function requestJson(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "No fue posible procesar la solicitud.");
  }

  return payload;
}

export function InvitationManager({
  project,
  invitations,
}: {
  project: Project | null;
  invitations: ProjectInvitationView[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("DEVELOPER");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!project) {
    return null;
  }

  const activeProject = project;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("create");
    setStatusMessage(null);

    try {
      await requestJson(`/api/projects/${activeProject.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, message }),
      });
      setEmail("");
      setRole("DEVELOPER");
      setMessage("");
      setStatusMessage({
        type: "success",
        text: "Invitacion creada correctamente.",
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function runAction(
    invitationId: string,
    action: "resend" | "revoke",
  ) {
    setBusyId(invitationId + action);
    setStatusMessage(null);

    try {
      await requestJson(`/api/invitations/${invitationId}/${action}`, {
        method: "POST",
      });
      setStatusMessage({
        type: "success",
        text:
          action === "resend"
            ? "Invitacion reenviada."
            : "Invitacion revocada.",
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="taskflow-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Invitaciones de miembros</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-secondary)]">
            Gestiona invitaciones por correo para el proyecto seleccionado.
          </p>
        </div>
        <div className="taskflow-chip">{activeProject.name}</div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="correo del miembro"
          className="taskflow-input"
          required
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          className="taskflow-input"
        >
          <option value="DEVELOPER">Developer</option>
          <option value="PROJECT_MANAGER">Project Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Mensaje de bienvenida"
          className="taskflow-input min-h-28 resize-none"
        />
        <button
          type="submit"
          disabled={busyId === "create"}
          className="taskflow-button-primary justify-center disabled:opacity-60"
        >
          Enviar invitacion
        </button>
      </form>

      {statusMessage ? (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            statusMessage.type === "success"
              ? "bg-[color:rgba(46,162,111,0.12)] text-[color:var(--color-success)]"
              : "bg-[color:rgba(217,83,111,0.12)] text-[color:var(--color-danger)]"
          }`}
        >
          {statusMessage.text}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {invitations.map((invitation) => (
          <article
            key={invitation.id}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-[color:var(--color-text-primary)]">
                  {invitation.email}
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                  {roleLabel(invitation.role)} · Invitado por{" "}
                  {invitation.inviter?.name ?? "Sistema"}
                </p>
              </div>
              <span className="rounded-full bg-[color:var(--color-surface)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-secondary)]">
                {invitation.status}
              </span>
            </div>

            {invitation.message ? (
              <p className="mt-3 text-sm leading-7 text-[color:var(--color-text-secondary)]">
                {invitation.message}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[color:var(--color-text-secondary)]">
                Creada {formatDateTime(invitation.createdAt)} · Expira{" "}
                {formatDateTime(invitation.expiresAt)}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === invitation.id + "resend"}
                  onClick={() => runAction(invitation.id, "resend")}
                  className="rounded-xl border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium"
                >
                  Reenviar
                </button>
                <button
                  type="button"
                  disabled={busyId === invitation.id + "revoke"}
                  onClick={() => runAction(invitation.id, "revoke")}
                  className="rounded-xl border border-[color:rgba(217,83,111,0.22)] px-3 py-2 text-sm font-medium text-[color:var(--color-danger)]"
                >
                  Revocar
                </button>
                <a
                  href={`/invitations/${invitation.token}`}
                  className="rounded-xl bg-[color:var(--color-accent)] px-3 py-2 text-sm font-medium text-white"
                >
                  Ver enlace
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
