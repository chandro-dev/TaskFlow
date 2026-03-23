import type { CreateInvitationInput } from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { InvitationQueryService } from "@/lib/application/invitations/invitation-query-service";
import { InvitationCreationGuard } from "@/lib/application/invitations/invitation-creation-guard";
import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import { createInvitationEmailDelivery } from "@/lib/infrastructure/email/invitation-email-delivery-factory";
import type { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export class InvitationCommandService {
  private readonly invitationQueryService: InvitationQueryService;
  private readonly invitationCreationGuard: InvitationCreationGuard;
  private readonly snapshotLoader: SnapshotLoader;
  private readonly invitationEmailDelivery = createInvitationEmailDelivery();

  constructor(
    private readonly repository: TaskflowRepository,
    private readonly notificationPublisher: ProjectEventPublisher,
  ) {
    this.invitationQueryService = new InvitationQueryService(repository);
    this.invitationCreationGuard = new InvitationCreationGuard(repository);
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async createInvitation(input: CreateInvitationInput) {
    await this.invitationCreationGuard.validate(input);
    const invitation = await this.repository.createInvitation(input);
    await this.notifyInvitedInternalUser(invitation);
    await this.sendInvitationEmail(invitation);

    await this.notificationPublisher.publish({
      kind: "MEMBER_INVITED",
      projectId: invitation.projectId,
      actorId: input.invitedBy,
    });

    return invitation;
  }

  async createInvitations(
    input: Omit<CreateInvitationInput, "email"> & { emails: string[] },
  ) {
    const uniqueEmails = [...new Set(input.emails.map((email) => email.trim().toLowerCase()))]
      .filter(Boolean);

    if (!uniqueEmails.length) {
      throw new Error("Debes seleccionar al menos un correo o usuario interno.");
    }

    const invitations = [];

    for (const email of uniqueEmails) {
      invitations.push(
        await this.createInvitation({
          ...input,
          email,
        }),
      );
    }

    return invitations;
  }

  async revokeInvitation(invitationId: string) {
    return this.repository.updateInvitationStatus({
      invitationId,
      status: "REVOKED",
    });
  }

  async resendInvitation(invitationId: string) {
    const invitation = await this.repository.resendInvitation(invitationId);
    await this.sendInvitationEmail(invitation);
    return invitation;
  }

  async acceptInvitation(token: string) {
    const invitation = await this.invitationQueryService.getInvitationByToken(token);

    if (!invitation) {
      return null;
    }

    const updatedInvitation = await this.repository.updateInvitationStatus({
      invitationId: invitation.id,
      status: "ACCEPTED",
    });
    const joinedUser = await this.repository
      .findUserByEmail(updatedInvitation.email)
      .catch(() => null);

    await this.notificationPublisher.publish({
      kind: "MEMBER_JOINED",
      projectId: invitation.projectId,
      actorId: joinedUser?.id ?? updatedInvitation.invitedBy,
    });

    return updatedInvitation;
  }

  private async notifyInvitedInternalUser(invitation: Awaited<ReturnType<TaskflowRepository["createInvitation"]>>) {
    const invitedUser = await this.repository
      .findUserByEmail(invitation.email)
      .catch(() => null);

    if (!invitedUser) {
      return;
    }

    const snapshot = await this.snapshotLoader.load();
    const project = snapshot.projects.find((item) => item.id === invitation.projectId);
    const inviter = snapshot.users.find((item) => item.id === invitation.invitedBy);

    if (!project) {
      return;
    }

    await this.repository.createNotifications([
      {
        projectId: invitation.projectId,
        recipientId: invitedUser.id,
        actorId: invitation.invitedBy,
        kind: "MEMBER_INVITED",
        title: `Te invitaron a ${project.name}`,
        message: `${inviter?.name ?? "Un miembro del proyecto"} te ha enviado una invitacion para unirte.`,
        linkHref: `/invitations/${invitation.token}`,
      },
    ]);
  }

  private async sendInvitationEmail(invitation: Awaited<ReturnType<TaskflowRepository["createInvitation"]>>) {
    const snapshot = await this.snapshotLoader.load();
    const project = snapshot.projects.find((item) => item.id === invitation.projectId);
    const inviter = snapshot.users.find((item) => item.id === invitation.invitedBy);

    if (!project) {
      return;
    }

    await this.invitationEmailDelivery.send({
      invitation,
      projectName: project.name,
      inviterName: inviter?.name ?? "Taskflow",
    });
  }
}
