"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ProjectCardView,
  ProjectInvitationView,
  UserProfile,
  UserRole,
} from "@/lib/domain/models";
import { formatDateTime, roleLabel } from "@/lib/utils/format";

type StatusMessage =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

type InvitationPersonOption = {
  userId: string;
  label: string;
  total: number;
  pending: number;
};

type InternalCandidateView = {
  user: UserProfile;
  selectable: boolean;
  reason: string;
};

async function requestJson(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "No fue posible procesar la solicitud.");
  }

  return payload;
}

function toggleSelection(current: string[], userId: string) {
  return current.includes(userId)
    ? current.filter((item) => item !== userId)
    : [...current, userId];
}

function buildCandidateReason(
  user: UserProfile,
  selectedProject: ProjectCardView,
  invitedUserIds: Set<string>,
) {
  // The UI intentionally shows every user in the system and explains why a
  // person can or cannot receive a new invitation for the selected project.
  if (selectedProject.members.some((member) => member.id === user.id)) {
    return {
      selectable: false,
      reason: "Ya pertenece al proyecto",
    };
  }

  if (invitedUserIds.has(user.id)) {
    return {
      selectable: false,
      reason: "Invitacion pendiente",
    };
  }

  if (!user.isActive) {
    return {
      selectable: false,
      reason: "Usuario inactivo",
    };
  }

  return {
    selectable: true,
    reason: "Disponible para invitar",
  };
}

function resolveInvitationPerson(invitation: ProjectInvitationView) {
  return invitation.invitedUser ?? null;
}

export function InvitationManager({
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
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState(
    defaultProjectId ?? projects[0]?.id ?? "",
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [role, setRole] = useState<UserRole>("DEVELOPER");
  const [message, setMessage] = useState("");
  const [selectedViewProjectId, setSelectedViewProjectId] = useState("ALL");
  const [selectedInviteeUserId, setSelectedInviteeUserId] = useState("ALL");
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const projectInvitations = useMemo(
    () =>
      invitations.filter(
        (invitation) => invitation.projectId === selectedProject?.id,
      ),
    [invitations, selectedProject],
  );
  const visibleProjectInvitations = useMemo(
    () =>
      selectedViewProjectId === "ALL"
        ? invitations
        : invitations.filter(
            (invitation) => invitation.projectId === selectedViewProjectId,
          ),
    [invitations, selectedViewProjectId],
  );
  const invitedUserIds = useMemo(
    () =>
      new Set(
        projectInvitations
          .filter((invitation) => invitation.status === "PENDING")
          .map((invitation) => invitation.invitedUserId),
      ),
    [projectInvitations],
  );
  const internalCandidates = useMemo<InternalCandidateView[]>(() => {
    if (!selectedProject) {
      return [];
    }

    // Sorting and annotating candidates in one place keeps the render branch
    // simple and avoids duplicating membership checks in JSX.
    return [...users]
      .sort((left, right) => left.name.localeCompare(right.name, "es"))
      .map((user) => ({
        user,
        ...buildCandidateReason(user, selectedProject, invitedUserIds),
      }));
  }, [invitedUserIds, selectedProject, users]);
  const invitationPeople = useMemo<InvitationPersonOption[]>(() => {
    const peopleMap = new Map<string, InvitationPersonOption>();

    for (const invitation of visibleProjectInvitations) {
      const invitedUser = resolveInvitationPerson(invitation);
      const optionKey = invitation.invitedUserId;
      const current = peopleMap.get(optionKey);

      if (current) {
        current.total += 1;
        if (invitation.status === "PENDING") {
          current.pending += 1;
        }
        continue;
      }

      peopleMap.set(optionKey, {
        userId: optionKey,
        label: invitedUser?.name ?? `Usuario ${optionKey.slice(0, 8)}`,
        total: 1,
        pending: invitation.status === "PENDING" ? 1 : 0,
      });
    }

    return Array.from(peopleMap.values()).sort((left, right) =>
      left.label.localeCompare(right.label, "es"),
    );
  }, [visibleProjectInvitations]);
  const visibleInvitations = useMemo(
    () =>
      selectedInviteeUserId === "ALL"
        ? visibleProjectInvitations
        : visibleProjectInvitations.filter(
            (invitation) => invitation.invitedUserId === selectedInviteeUserId,
          ),
    [selectedInviteeUserId, visibleProjectInvitations],
  );

  if (!projects.length || !selectedProject) {
    return null;
  }

  const activeProject = selectedProject;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("create");
    setStatusMessage(null);

    const selectedIds = internalCandidates
      .filter(
        (candidate) =>
          candidate.selectable && selectedUserIds.includes(candidate.user.id),
      )
      .map((candidate) => candidate.user.id);

    if (!selectedIds.length) {
      setStatusMessage({
        type: "error",
        text: "Selecciona al menos una persona disponible para invitar.",
      });
      setBusyId(null);
      return;
    }

    try {
      const payload = await requestJson(
        `/api/projects/${activeProject.id}/invitations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: selectedIds,
            role,
            message,
          }),
        },
      );

      setSelectedUserIds([]);
      setRole("DEVELOPER");
      setMessage("");
      setSelectedInviteeUserId("ALL");
      setStatusMessage({
        type: "success",
        text: `Se registraron ${payload.invitations?.length ?? 0} invitaciones internas en ${activeProject.name}.`,
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
            ? "Recordatorio reenviado dentro de la aplicacion."
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
            Usa `member_invitations` enlazada a usuarios del sistema para
            gestionar invitaciones internas y notificaciones dentro de la
            aplicacion.
          </p>
        </div>
        <div className="taskflow-chip">{selectedProject.name}</div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <select
          value={selectedProjectId}
          onChange={(event) => {
            setSelectedProjectId(event.target.value);
            setSelectedUserIds([]);
            setStatusMessage(null);
          }}
          className="taskflow-input"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
          <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
            Personas dentro de la aplicacion
          </p>
          <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
            Se consideran todos los usuarios del sistema. Los no disponibles se
            muestran con su motivo.
          </p>

          <div className="mt-4 space-y-3">
            {internalCandidates.length ? (
              internalCandidates.map((candidate) => (
                <label
                  key={candidate.user.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                    candidate.selectable
                      ? "border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
                      : "border-[color:rgba(184,194,212,0.5)] bg-[color:rgba(184,194,212,0.12)] opacity-75"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(candidate.user.id)}
                    disabled={!candidate.selectable}
                    onChange={() =>
                      setSelectedUserIds((current) =>
                        toggleSelection(current, candidate.user.id),
                      )
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
                        {candidate.user.name}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          candidate.selectable
                            ? "bg-[color:rgba(46,162,111,0.12)] text-[color:var(--color-success)]"
                            : "bg-[color:var(--color-surface)] text-[color:var(--color-text-secondary)]"
                        }`}
                      >
                        {candidate.reason}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                      {candidate.user.email} - {roleLabel(candidate.user.role)}
                    </p>
                  </div>
                </label>
              ))
            ) : (
              <div className="rounded-2xl border border-[color:var(--color-border)] px-4 py-4 text-sm text-[color:var(--color-text-secondary)]">
                No hay usuarios registrados en el sistema para evaluar.
              </div>
            )}
          </div>
        </div>

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
          placeholder="Mensaje interno de bienvenida"
          className="taskflow-input min-h-28 resize-none"
        />
        <button
          type="submit"
          disabled={busyId === "create"}
          className="taskflow-button-primary justify-center disabled:opacity-60"
        >
          Enviar invitaciones
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

      <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
              Ver invitaciones por persona
            </p>
            <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
              Filtra por proyecto y destinatario para revisar todas las
              invitaciones registradas.
            </p>
          </div>
          <div className="grid gap-3 lg:w-[34rem] lg:grid-cols-2">
            <select
              value={selectedViewProjectId}
              onChange={(event) => {
                setSelectedViewProjectId(event.target.value);
                setSelectedInviteeUserId("ALL");
              }}
              className="taskflow-input"
            >
              <option value="ALL">Todos los proyectos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={selectedInviteeUserId}
              onChange={(event) => setSelectedInviteeUserId(event.target.value)}
              className="taskflow-input"
            >
              <option value="ALL">Todas las personas</option>
              {invitationPeople.map((person) => (
                <option key={person.userId} value={person.userId}>
                  {person.label} ({person.total})
                </option>
              ))}
            </select>
          </div>
        </div>

        {invitationPeople.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {invitationPeople.map((person) => (
              <button
                key={person.userId}
                type="button"
                onClick={() => setSelectedInviteeUserId(person.userId)}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                  selectedInviteeUserId === person.userId
                    ? "border-[color:var(--color-accent)] bg-[color:rgba(28,63,111,0.10)] text-[color:var(--color-accent)]"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-secondary)]"
                }`}
              >
                {person.label} - {person.pending} pendiente(s)
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        {visibleInvitations.length ? (
          visibleInvitations.map((invitation) => (
            <article
              key={invitation.id}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-[color:var(--color-text-primary)]">
                    {invitation.invitedUser?.name ??
                      `Usuario ${invitation.invitedUserId.slice(0, 8)}`}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                    {invitation.invitedUser?.email ?? "Sin correo"} -{" "}
                    {roleLabel(invitation.role)} -{" "}
                    {invitation.project?.name ?? "Proyecto sin nombre"} -
                    Invitado por {invitation.inviter?.name ?? "Sistema"}
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
                  Creada {formatDateTime(invitation.createdAt)} - Expira{" "}
                  {formatDateTime(invitation.expiresAt)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === invitation.id + "resend"}
                    onClick={() => runAction(invitation.id, "resend")}
                    className="rounded-xl border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium"
                  >
                    Recordar
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
                    Ver invitacion
                  </a>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-6 text-sm leading-7 text-[color:var(--color-text-secondary)]">
            {selectedInviteeUserId === "ALL"
              ? "No hay invitaciones registradas para el filtro actual."
              : "No hay invitaciones registradas para la persona seleccionada en el filtro actual."}
          </div>
        )}
      </div>
    </section>
  );
}
