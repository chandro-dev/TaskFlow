import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasConfiguredSupabaseAuth, hasSupabaseServiceRoleKey } from "@/lib/infrastructure/auth/auth-mode";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClientOrThrow() {
  if (!hasConfiguredSupabaseAuth() || !hasSupabaseServiceRoleKey()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY no esta configurada. Para omitir confirmacion por correo necesitas esa clave o desactivar Confirm email en Supabase.",
    );
  }

  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return adminClient;
}
