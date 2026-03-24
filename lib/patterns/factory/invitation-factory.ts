import type {
  CreateInvitationInput,
  InvitationChannel,
  MemberInvitation,
  UserRole,
} from "@/lib/domain/models";

interface InvitationSeed extends CreateInvitationInput {
  id?: string;
  token?: string;
  status?: MemberInvitation["status"];
  expiresAt?: string;
}

abstract class InvitationFactory {
  create(seed: InvitationSeed): MemberInvitation {
    const now = new Date().toISOString();
    return {
      id: seed.id ?? crypto.randomUUID(),
      projectId: seed.projectId,
      invitedUserId: seed.invitedUserId,
      role: this.normalizeRole(seed.role),
      status: seed.status ?? "PENDING",
      channel: this.channel(),
      invitedBy: seed.invitedBy,
      token: seed.token ?? this.buildToken(),
      message: seed.message,
      expiresAt: seed.expiresAt ?? this.defaultExpiry(),
      acceptedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };
  }

  protected abstract channel(): InvitationChannel;

  protected buildToken() {
    return crypto.randomUUID().replace(/-/g, "");
  }

  protected defaultExpiry() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString();
  }

  protected normalizeRole(role: UserRole) {
    return role;
  }
}

class InAppInvitationFactory extends InvitationFactory {
  protected channel(): InvitationChannel {
    return "IN_APP";
  }
}

export function createInvitationFactory(channel: InvitationChannel) {
  switch (channel) {
    case "IN_APP":
    default:
      return new InAppInvitationFactory();
  }
}
