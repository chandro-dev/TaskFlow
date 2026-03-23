import type {
  InvitationEmailDelivery,
  InvitationEmailPayload,
} from "@/lib/domain/invitation-email-delivery";

export class NoopInvitationEmailDelivery implements InvitationEmailDelivery {
  async send(payload: InvitationEmailPayload) {
    void payload;
    return;
  }
}
