import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegisterUserInput, RegisterUserResult } from "@/lib/domain/models";
import { hasSupabaseServiceRoleKey } from "@/lib/infrastructure/auth/auth-mode";
import { getSupabaseAdminClientOrThrow } from "@/lib/infrastructure/supabase/supabase-admin-client";
import { UserRegistrationBuilder } from "@/lib/patterns/builder/user-registration-builder";
import { createUserProfileFactory } from "@/lib/patterns/factory/user-profile-factory";

export class SupabaseAuthCommand {
  constructor(private readonly client: SupabaseClient) {}

  async registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
    const registration = new UserRegistrationBuilder(input)
      .normalize()
      .validate()
      .build();

    if (hasSupabaseServiceRoleKey()) {
      return this.registerWithoutEmailConfirmation(registration);
    }

    const { data, error } = await this.client.auth.signUp({
      email: registration.email,
      password: registration.password,
      options: {
        data: {
          full_name: registration.name,
          role: "DEVELOPER",
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = createUserProfileFactory().create(registration);

    if (data.user?.id) {
      user.id = data.user.id;
    }

    return {
      user,
      requiresEmailConfirmation: !data.session || !data.user?.email_confirmed_at,
    };
  }

  private async registerWithoutEmailConfirmation(
    registration: ReturnType<UserRegistrationBuilder["build"]>,
  ): Promise<RegisterUserResult> {
    const adminClient = getSupabaseAdminClientOrThrow();
    const { data, error } = await adminClient.auth.admin.createUser({
      email: registration.email,
      password: registration.password,
      email_confirm: true,
      user_metadata: {
        full_name: registration.name,
        role: "DEVELOPER",
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? "No fue posible crear el usuario en Supabase.");
    }

    const user = createUserProfileFactory().create(registration);
    user.id = data.user.id;

    return {
      user,
      requiresEmailConfirmation: false,
    };
  }
}
