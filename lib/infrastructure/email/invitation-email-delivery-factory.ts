import type { InvitationEmailDelivery } from "@/lib/domain/invitation-email-delivery";
import { NoopInvitationEmailDelivery } from "@/lib/infrastructure/email/noop-invitation-email-delivery";
import { ResendInvitationEmailDelivery } from "@/lib/infrastructure/email/resend-invitation-email-delivery";

export function createInvitationEmailDelivery(): InvitationEmailDelivery {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (apiKey && from) {
    return new ResendInvitationEmailDelivery(apiKey, from);
  }

  return new NoopInvitationEmailDelivery();
}
