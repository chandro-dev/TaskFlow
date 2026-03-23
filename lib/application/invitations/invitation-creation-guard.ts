import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import type { InvitationDraft } from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";

export class InvitationCreationGuard {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(repository: TaskflowRepository) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async validate(draft: InvitationDraft) {
    const snapshot = await this.snapshotLoader.load();
    const project = snapshot.projects.find((item) => item.id === draft.projectId);

    if (!project) {
      throw new Error("El proyecto seleccionado no existe.");
    }

    if (project.archived) {
      throw new Error("No puedes invitar miembros a un proyecto archivado.");
    }

    const normalizedEmail = draft.email.trim().toLowerCase();
    const alreadyMember = snapshot.users.find(
      (user) =>
        user.email.toLowerCase() === normalizedEmail &&
        project.memberIds.includes(user.id),
    );

    if (alreadyMember) {
      throw new Error("Ese usuario ya pertenece al proyecto seleccionado.");
    }

    const pendingInvitation = snapshot.invitations.find(
      (invitation) =>
        invitation.projectId === draft.projectId &&
        invitation.email.toLowerCase() === normalizedEmail &&
        invitation.status === "PENDING",
    );

    if (pendingInvitation) {
      throw new Error("Ya existe una invitacion pendiente para ese correo en este proyecto.");
    }
  }
}
