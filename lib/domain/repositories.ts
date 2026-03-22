import type {
  CreateInvitationInput,
  MemberInvitation,
  RegisterUserInput,
  RegisterUserResult,
  TaskflowSnapshot,
  UpdateInvitationStatusInput,
} from "@/lib/domain/models";

export interface TaskflowRepository {
  loadSnapshot(): Promise<TaskflowSnapshot>;
  registerUser(input: RegisterUserInput): Promise<RegisterUserResult>;
  createInvitation(input: CreateInvitationInput): Promise<MemberInvitation>;
  updateInvitationStatus(
    input: UpdateInvitationStatusInput,
  ): Promise<MemberInvitation>;
  resendInvitation(invitationId: string): Promise<MemberInvitation>;
  findInvitationByToken(token: string): Promise<MemberInvitation | null>;
}
