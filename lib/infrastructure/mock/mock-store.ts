import type {
  CreateInvitationInput,
  MemberInvitation,
  RegisterUserInput,
  RegisterUserResult,
  TaskflowSnapshot,
  UpdateInvitationStatusInput,
} from "@/lib/domain/models";
import { buildMockSnapshot } from "@/lib/infrastructure/mock/seed-data";
import { MemberInvitationBuilder } from "@/lib/patterns/builder/member-invitation-builder";
import { UserRegistrationBuilder } from "@/lib/patterns/builder/user-registration-builder";
import { createInvitationFactory } from "@/lib/patterns/factory/invitation-factory";
import { createUserProfileFactory } from "@/lib/patterns/factory/user-profile-factory";
import { InvitationPrototype } from "@/lib/patterns/prototype/invitation-prototype";

export class MockTaskflowStore {
  private static instance: MockTaskflowStore | null = null;
  private snapshot: TaskflowSnapshot;

  private constructor() {
    this.snapshot = buildMockSnapshot();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new MockTaskflowStore();
    }

    return this.instance;
  }

  loadSnapshot() {
    return structuredClone(this.snapshot);
  }

  registerUser(input: RegisterUserInput): RegisterUserResult {
    const registration = new UserRegistrationBuilder(input)
      .normalize()
      .validate()
      .build();

    const emailExists = this.snapshot.users.some(
      (user) => user.email.toLowerCase() === registration.email,
    );

    if (emailExists) {
      throw new Error("Ya existe un usuario registrado con ese correo.");
    }

    const user = createUserProfileFactory().create(registration);
    this.snapshot.users.unshift(user);
    this.snapshot.currentUser = user;

    return {
      user: structuredClone(user),
      requiresEmailConfirmation: false,
    };
  }

  createInvitation(input: CreateInvitationInput) {
    const invitation = new MemberInvitationBuilder(
      createInvitationFactory("EMAIL").create(input),
    )
      .withMessage(input.message)
      .withExpiry(7)
      .asPending()
      .build();

    this.snapshot.invitations.unshift(invitation);
    return structuredClone(invitation);
  }

  updateInvitationStatus(input: UpdateInvitationStatusInput) {
    const invitation = this.snapshot.invitations.find(
      (item) => item.id === input.invitationId,
    );

    if (!invitation) {
      throw new Error("Invitacion no encontrada.");
    }

    const builder = new MemberInvitationBuilder(invitation);
    const updated = (() => {
      if (input.status === "ACCEPTED") {
        return builder.asAccepted().build();
      }

      if (input.status === "REVOKED") {
        return builder.asRevoked().build();
      }

      return {
        ...builder.asPending().build(),
        status: "EXPIRED" as const,
      };
    })();

    this.replaceInvitation(updated);

    if (input.status === "ACCEPTED") {
      const project = this.snapshot.projects.find(
        (item) => item.id === updated.projectId,
      );
      const user = this.snapshot.users.find(
        (item) => item.email.toLowerCase() === updated.email.toLowerCase(),
      );

      if (project && user && !project.memberIds.includes(user.id)) {
        project.memberIds.push(user.id);
      }
    }

    return structuredClone(updated);
  }

  resendInvitation(invitationId: string) {
    const invitation = this.snapshot.invitations.find(
      (item) => item.id === invitationId,
    );

    if (!invitation) {
      throw new Error("Invitacion no encontrada.");
    }

    const resent = new MemberInvitationBuilder(
      new InvitationPrototype(invitation).clone({
        id: invitation.id,
        status: "PENDING",
      }),
    )
      .refreshToken()
      .withExpiry(7)
      .asPending()
      .build();

    this.replaceInvitation(resent);
    return structuredClone(resent);
  }

  findInvitationByToken(token: string): MemberInvitation | null {
    const invitation =
      this.snapshot.invitations.find((item) => item.token === token) ?? null;
    return invitation ? structuredClone(invitation) : null;
  }

  private replaceInvitation(next: MemberInvitation) {
    this.snapshot.invitations = this.snapshot.invitations.map((item) =>
      item.id === next.id ? next : item,
    );
  }
}
