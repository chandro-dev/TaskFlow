import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth/session-cookie";

export async function getSupabaseClientOrThrow(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase no esta configurado.");
  }

  const session = await getSession();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: session?.accessToken
      ? {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      : undefined,
  });
}
