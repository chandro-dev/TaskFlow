"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppModalShell } from "@/components/taskflow/app-modal-shell";
import { SettingsIcon } from "@/components/taskflow/icons";
import type { ProjectMemberView } from "@/lib/domain/models";

export function BoardMemberManagerModal({
  projectId,
  projectName,
  projectMembers,
  canManageMembers,
}: {
  projectId: string;
  projectName: string;
  projectMembers: ProjectMemberView[];
  canManageMembers: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedMembers = useMemo(
    () =>
      [...projectMembers].sort((left, right) =>
        left.user.name.localeCompare(right.user.name, "es"),
      ),
    [projectMembers],
  );

  if (!canManageMembers) {
    return null;
  }

  async function revokeMember(memberId: string) {
    setBusyMemberId(memberId);
    setError(null);

    const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
      method: "DELETE",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible revocar el acceso del usuario.");
      setBusyMemberId(null);
      return;
    }

    setBusyMemberId(null);
    startTransition(() => {
      router.refresh();
    });
  }

  async function updateRole(
    memberId: string,
    memberRole: "PROJECT_MANAGER" | "DEVELOPER",
  ) {
    setBusyMemberId(memberId);
    setError(null);

    const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberRole }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible actualizar el privilegio del usuario.");
      setBusyMemberId(null);
      return;
    }

    setBusyMemberId(null);
    startTransition(() => {
      router.refresh();
    });
  }

  function resolveMemberBadge(member: ProjectMemberView) {
    if (member.isOwner) {
      return "Propietario";
    }

    if (member.isGlobalAdmin) {
      return "Admin global";
    }

    return member.memberRole === "PROJECT_MANAGER"
      ? "Project manager"
      : "Developer";
  }

  function canManage(member: ProjectMemberView) {
    return canManageMembers && !member.isOwner && !member.isGlobalAdmin;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm font-medium text-[color:var(--color-text-primary)] shadow-[0_12px_30px_rgba(15,47,87,0.08)]"
      >
        <SettingsIcon className="h-4 w-4" />
        Gestionar miembros
      </button>

      {open ? (
        <AppModalShell
          eyebrow="Acceso Kanban"
          title="Miembros y acceso del proyecto"
          description="El acceso al tablero se hereda del proyecto. Desde aqui puedes cambiar privilegios del proyecto o revocar al usuario. Si revocas, tambien se remueve de todos los tableros del proyecto y se limpian sus asignaciones de tareas."
          onClose={() => setOpen(false)}
          maxWidthClass="max-w-4xl"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-[color:var(--color-text-primary)]">
                  {projectName}
                </h3>
                <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                  {projectMembers.length} integrante(s) con acceso a este proyecto.
                </p>
              </div>
              <div className="taskflow-chip">{projectMembers.length} miembros</div>
            </div>

            {error ? (
              <div className="rounded-2xl bg-[color:rgba(217,83,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
                {error}
              </div>
            ) : null}

            <div className="space-y-3">
              {sortedMembers.map((member) => (
                <article
                  key={member.user.id}
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white shadow-[0_12px_30px_rgba(66,86,244,0.35)]"
                      style={{ background: "var(--avatar-gradient)" }}
                    >
                      {member.user.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-[color:var(--color-text-primary)]">
                        {member.user.name}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                        {member.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <span className="rounded-full bg-[color:var(--color-surface)] px-3 py-2 text-xs font-semibold text-[color:var(--color-text-secondary)]">
                      {resolveMemberBadge(member)}
                    </span>

                    {canManage(member) ? (
                      <>
                        <select
                          value={member.memberRole}
                          onChange={(event) =>
                            void updateRole(
                              member.user.id,
                              event.target.value as "PROJECT_MANAGER" | "DEVELOPER",
                            )
                          }
                          disabled={busyMemberId === member.user.id}
                          className="taskflow-input min-w-[13rem]"
                        >
                          <option value="PROJECT_MANAGER">Project manager</option>
                          <option value="DEVELOPER">Developer</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => void revokeMember(member.user.id)}
                          disabled={busyMemberId === member.user.id}
                          className="rounded-2xl border border-[color:rgba(217,83,111,0.22)] px-4 py-3 text-sm font-medium text-[color:var(--color-danger)] disabled:opacity-60"
                        >
                          {busyMemberId === member.user.id
                            ? "Guardando..."
                            : "Revocar acceso"}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-[color:var(--color-text-secondary)]">
                        {member.isOwner
                          ? "El propietario mantiene acceso."
                          : member.isGlobalAdmin
                            ? "El admin global conserva acceso por su rol."
                            : "Sin permisos de gestion"}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </AppModalShell>
      ) : null}
    </>
  );
}
