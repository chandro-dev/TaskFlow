import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/domain/models";

function resolveRole(rawRole: unknown): UserProfile["role"] {
  if (
    rawRole === "ADMIN" ||
    rawRole === "PROJECT_MANAGER" ||
    rawRole === "DEVELOPER"
  ) {
    return rawRole;
  }

  return "DEVELOPER";
}

export function mapAuthUserToProfile(user: User): UserProfile {
  const fullName =
    typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] ?? "Usuario";

  return {
    id: user.id,
    name: fullName,
    email: user.email ?? "",
    role: resolveRole(user.user_metadata?.role),
    avatar: fullName.slice(0, 2).toUpperCase(),
    bio: "",
    lastAccess: new Date().toISOString(),
    themePreference: "system",
    isActive: true,
  };
}
