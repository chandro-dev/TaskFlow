import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateInvitationInput,
  MemberInvitation,
  UpdateInvitationStatusInput,
} from "@/lib/domain/models";
import { normalizeInvitation } from "@/lib/infrastructure/supabase/supabase-normalizers";
import type { InvitationRow } from "@/lib/infrastructure/supabase/supabase-row-types";

export class SupabaseInvitationCommand {
  constructor(private readonly client: SupabaseClient) {}

  async createInvitation(input: CreateInvitationInput): Promise<MemberInvitation> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await this.client
      .from("member_invitations")
      .insert({
        project_id: input.projectId,
        email: input.email,
        role: input.role,
        status: "PENDING",
        channel: "EMAIL",
        invited_by: input.invitedBy,
        token: crypto.randomUUID().replace(/-/g, ""),
        message: input.message ?? null,
        expires_at: expiresAt.toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error("No fue posible crear la invitacion.");
    }

    return normalizeInvitation(data as InvitationRow);
  }

  async updateInvitationStatus(
    input: UpdateInvitationStatusInput,
  ): Promise<MemberInvitation> {
    const updatePayload = {
      status: input.status,
      accepted_at: input.status === "ACCEPTED" ? new Date().toISOString() : null,
    };

    const { data, error } = await this.client
      .from("member_invitations")
      .update(updatePayload)
      .eq("id", input.invitationId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error("No fue posible actualizar la invitacion.");
    }

    if (input.status === "ACCEPTED") {
      await this.attachAcceptedInvitationMember(data as InvitationRow);
    }

    return normalizeInvitation(data as InvitationRow);
  }

  async resendInvitation(invitationId: string): Promise<MemberInvitation> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await this.client
      .from("member_invitations")
      .update({
        status: "PENDING",
        accepted_at: null,
        token: crypto.randomUUID().replace(/-/g, ""),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", invitationId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error("No fue posible reenviar la invitacion.");
    }

    return normalizeInvitation(data as InvitationRow);
  }

  async findInvitationByToken(token: string): Promise<MemberInvitation | null> {
    const { data, error } = await this.client
      .from("member_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      throw new Error("No fue posible consultar la invitacion.");
    }

    return data ? normalizeInvitation(data as InvitationRow) : null;
  }

  private async attachAcceptedInvitationMember(invitation: InvitationRow) {
    const { data: user } = await this.client
      .from("profiles")
      .select("id")
      .eq("email", invitation.email)
      .maybeSingle();

    if (!user?.id) {
      return;
    }

    await this.client.from("project_members").upsert({
      project_id: invitation.project_id,
      user_id: user.id,
      member_role: invitation.role,
      invited_by: invitation.invited_by,
    });
  }
}
