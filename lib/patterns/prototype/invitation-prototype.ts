import type { MemberInvitation } from "@/lib/domain/models";

// Pattern traceability: Prototype.
// Re-sent invitations inherit the original business data while receiving a new
// token and timestamps for a fresh delivery cycle.
export class InvitationPrototype {
  constructor(private readonly source: MemberInvitation) {}

  clone(overrides: Partial<MemberInvitation> = {}) {
    return {
      ...structuredClone(this.source),
      ...overrides,
      id: overrides.id ?? crypto.randomUUID(),
      token: overrides.token ?? crypto.randomUUID().replace(/-/g, ""),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      acceptedAt: overrides.acceptedAt,
    };
  }
}
