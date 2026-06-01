import type { User } from "@supabase/supabase-js";
import { getSupabaseAdminClientOrThrow } from "@/lib/infrastructure/supabase/supabase-admin-client";
import { normalizeUser } from "@/lib/infrastructure/supabase/supabase-normalizers";
import { mapAuthUserToProfile } from "@/lib/infrastructure/supabase/supabase-auth-user-mapper";
import type { ProfileRow } from "@/lib/infrastructure/supabase/supabase-row-types";

export async function ensureProfileForAuthUser(user: User) {
  const adminClient = getSupabaseAdminClientOrThrow();
  const fallbackProfile = mapAuthUserToProfile(user);

  const { error: upsertError } = await adminClient.from("profiles").upsert({
    id: fallbackProfile.id,
    email: fallbackProfile.email,
    full_name: fallbackProfile.name,
    role: fallbackProfile.role,
    avatar_initials: fallbackProfile.avatar,
    bio: fallbackProfile.bio,
    theme_preference: fallbackProfile.themePreference,
    last_access_at: fallbackProfile.lastAccess,
    is_active: fallbackProfile.isActive,
  });

  if (upsertError) {
    throw new Error("El usuario autentico, pero no fue posible sincronizar su perfil.");
  }

  const { data, error } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("El usuario autentico, pero no fue posible leer su perfil.");
  }

  return data ? normalizeUser(data as ProfileRow) : fallbackProfile;
}
