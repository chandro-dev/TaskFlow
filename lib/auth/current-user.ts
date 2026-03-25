import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-cookie";
import { createTaskflowRepository } from "@/lib/infrastructure/repository-factory";
import type { UserProfile } from "@/lib/domain/models";
import { hasConfiguredSupabaseAuth } from "@/lib/infrastructure/auth/auth-mode";
import { getSupabaseClientOrThrow } from "@/lib/infrastructure/supabase/supabase-client";

function buildSessionFallbackUser(userId: string, email: string): UserProfile {
  const name = email.split("@")[0] || "Usuario";

  return {
    id: userId,
    name,
    email,
    role: "DEVELOPER",
    avatar: name.slice(0, 2).toUpperCase(),
    bio: "",
    lastAccess: new Date().toISOString(),
    themePreference: "system",
    isActive: true,
  };
}

export const getAuthenticatedUser = cache(async () => {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (hasConfiguredSupabaseAuth()) {
    try {
      await getSupabaseClientOrThrow();
    } catch {
      return null;
    }
  }

  const repository = createTaskflowRepository();
  const repositoryUser = await repository.findUserById(session.userId).catch(
    () => null,
  );

  if (repositoryUser) {
    return repositoryUser;
  }

  // Supabase Auth can validate the user before public.profiles is available.
  // In that case we still reconstruct a minimal user from the signed session
  // so the workspace can load while the profile is repaired separately.
  if (session.email) {
    return buildSessionFallbackUser(session.userId, session.email);
  }

  return null;
});

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  return user;
}
