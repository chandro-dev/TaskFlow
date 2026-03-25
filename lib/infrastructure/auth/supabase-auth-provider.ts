import { getSupabaseAuthClientOrThrow } from "@/lib/infrastructure/supabase/supabase-client";
import type {
  PasswordAuthInput,
  TaskflowAuthProvider,
} from "@/lib/domain/auth-provider";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { hasSupabaseServiceRoleKey } from "@/lib/infrastructure/auth/auth-mode";
import { mapAuthUserToProfile } from "@/lib/infrastructure/supabase/supabase-auth-user-mapper";
import { ensureProfileForAuthUser } from "@/lib/infrastructure/supabase/supabase-profile-admin";
import { HttpError } from "@/lib/shared/http-error";

export class SupabaseAuthProvider implements TaskflowAuthProvider {
  constructor(private readonly repository: IRepositroyFlow) {}

  async authenticateWithPassword(input: PasswordAuthInput) {
    const client = getSupabaseAuthClientOrThrow();
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!email || !password) {
      throw new HttpError("Correo y contrasena son obligatorios.", 422);
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user?.id) {
      const message = error?.message ?? "Credenciales invalidas.";

      if (message.toLowerCase().includes("email not confirmed")) {
        throw new HttpError(
          "Tu correo aun no esta confirmado. Revisa tu bandeja y confirma la cuenta antes de iniciar sesion.",
          401,
        );
      }

      if (message.toLowerCase().includes("invalid login credentials")) {
        throw new HttpError(
          "Correo o contrasena invalidos. Si acabas de registrarte, confirma primero tu correo.",
          401,
        );
      }

      throw new HttpError(message, 401);
    }

    return {
      user: await this.resolveAuthenticatedUser(data.user),
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      accessTokenExpiresAt: data.session?.expires_at
        ? new Date(data.session.expires_at * 1000).toISOString()
        : undefined,
    };
  }

  private async resolveAuthenticatedUser(
    authUser: Parameters<typeof mapAuthUserToProfile>[0],
  ) {
    const fallbackProfile = mapAuthUserToProfile(authUser);

    try {
      const repositoryUser = await this.repository.findUserById(authUser.id);

      if (repositoryUser) {
        return repositoryUser;
      }
    } catch {
      // If the profile query fails we still keep the authenticated session
      // alive. The app can recover with a minimal profile while the admin sync
      // path tries to recreate public.profiles out of band.
    }

    if (hasSupabaseServiceRoleKey()) {
      try {
        return await ensureProfileForAuthUser(authUser);
      } catch {
        return fallbackProfile;
      }
    }

    return fallbackProfile;
  }
}
