import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-cookie";
import { createTaskflowRepository } from "@/lib/infrastructure/repository-factory";
import type { UserProfile } from "@/lib/domain/models";

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
    themePreference: "light",
    isActive: true,
  };
}

export const getAuthenticatedUser = cache(async () => {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const repository = createTaskflowRepository();
  const repositoryUser = await repository.findUserById(session.userId).catch(
    () => null,
  );

  return repositoryUser ?? buildSessionFallbackUser(session.userId, session.email);
});

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  return user;
}
