import type { MemberInvitation } from "@/lib/domain/models";

export class MemberInvitationBuilder {
  private readonly draft: MemberInvitation;

  constructor(base: MemberInvitation) {
    this.draft = structuredClone(base);
  }

  withMessage(message?: string) {
    this.draft.message = message?.trim() || undefined;
    return this;
  }

  withExpiry(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    this.draft.expiresAt = date.toISOString();
    return this;
  }

  asPending() {
    this.draft.status = "PENDING";
    this.draft.acceptedAt = undefined;
    return this;
  }

  asAccepted() {
    this.draft.status = "ACCEPTED";
    this.draft.acceptedAt = new Date().toISOString();
    return this;
  }

  asRevoked() {
    this.draft.status = "REVOKED";
    return this;
  }

  refreshToken() {
    this.draft.token = crypto.randomUUID().replace(/-/g, "");
    return this;
  }

  build() {
    this.draft.updatedAt = new Date().toISOString();
    return structuredClone(this.draft);
  }
}
