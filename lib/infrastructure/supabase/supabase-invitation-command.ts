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
    const { data, error } = await this.client.rpc(
      "create_internal_member_invitation",
      {
        target_project_id: input.projectId,
        target_invited_user_id: input.invitedUserId,
        target_role: input.role,
        target_message: input.message ?? null,
      },
    );

    if (error || !data) {
      throw new Error(
        error?.message ?? "No fue posible crear la invitacion.",
      );
    }

    return normalizeInvitation(data as InvitationRow);
  }

  async updateInvitationStatus(
    input: UpdateInvitationStatusInput,
  ): Promise<MemberInvitation> {
    if (input.status === "ACCEPTED") {
      return this.acceptInvitation(input.invitationId);
    }

    const updatePayload = {
      status: input.status,
      accepted_at: null,
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

    return normalizeInvitation(data as InvitationRow);
  }

  async resendInvitation(invitationId: string): Promise<MemberInvitation> {
    const { data, error } = await this.client.rpc(
      "resend_internal_member_invitation",
      {
        target_invitation_id: invitationId,
      },
    );

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

  private async acceptInvitation(invitationId: string) {
    const { data: invitation, error: lookupError } = await this.client
      .from("member_invitations")
      .select("token")
      .eq("id", invitationId)
      .single();

    if (lookupError || !invitation?.token) {
      throw new Error(
        lookupError?.message ?? "No fue posible localizar la invitacion a aceptar.",
      );
    }

    const { data, error } = await this.client.rpc(
      "accept_internal_member_invitation",
      {
        target_token: invitation.token,
      },
    );

    if (error || !data) {
      throw new Error(
        error?.message ?? "No fue posible aceptar la invitacion.",
      );
    }

    return normalizeInvitation(data as InvitationRow);
  }
}
