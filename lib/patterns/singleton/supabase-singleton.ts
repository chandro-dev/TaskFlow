import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SupabaseSingleton {
  private static client: SupabaseClient | null = null;

  static getClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return null;
    }

    if (!this.client) {
      this.client = createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }

    return this.client;
  }
}
