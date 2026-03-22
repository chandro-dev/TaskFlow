import type { MemberInvitation } from "@/lib/domain/models";

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
