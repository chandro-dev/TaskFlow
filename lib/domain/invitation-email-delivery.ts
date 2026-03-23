import type { MemberInvitation } from "@/lib/domain/models";

export interface InvitationEmailPayload {
  invitation: MemberInvitation;
  projectName: string;
  inviterName: string;
}

export interface InvitationEmailDelivery {
  send(payload: InvitationEmailPayload): Promise<void>;
}
