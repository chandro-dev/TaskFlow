import type { CreateInvitationInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { InvitationQueryService } from "@/lib/application/invitations/invitation-query-service";
import { InvitationCreationGuard } from "@/lib/application/invitations/invitation-creation-guard";
import type { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export class InvitationCommandService {
  private readonly invitationQueryService: InvitationQueryService;
  private readonly invitationCreationGuard: InvitationCreationGuard;

  constructor(
    private readonly repository: IRepositroyFlow,
    private readonly notificationPublisher: ProjectEventPublisher,
  ) {
    this.invitationQueryService = new InvitationQueryService(repository);
    this.invitationCreationGuard = new InvitationCreationGuard(repository);
  }

  async createInvitation(input: CreateInvitationInput) {
    await this.invitationCreationGuard.validate(input);
    const invitation = await this.repository.createInvitation(input);

    await this.notificationPublisher.publish({
      kind: "MEMBER_INVITED",
      projectId: invitation.projectId,
      actorId: input.invitedBy,
    });

    return invitation;
  }

  async createInvitations(
    input: Omit<CreateInvitationInput, "invitedUserId"> & { invitedUserIds: string[] },
  ) {
    const uniqueUserIds = [...new Set(input.invitedUserIds.map((userId) => userId.trim()))]
      .filter(Boolean);

    if (!uniqueUserIds.length) {
      throw new Error("Debes seleccionar al menos una persona interna.");
    }

    const invitations = [];

    for (const invitedUserId of uniqueUserIds) {
      invitations.push(
        await this.createInvitation({
          ...input,
          invitedUserId,
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
    return this.repository.resendInvitation(invitationId);
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

    return updatedInvitation;
  }
}
