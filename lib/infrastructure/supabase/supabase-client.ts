import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import {
  clearSession,
  getSession,
  updateSessionTokens,
} from "@/lib/auth/session-cookie";
import { hasConfiguredSupabaseAuth } from "@/lib/infrastructure/auth/auth-mode";
import { HttpError } from "@/lib/shared/http-error";

function resolveSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase no esta configurado.");
  }

  return { url, anonKey };
}

function createBaseClient(url: string, anonKey: string) {
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function tryClearSession() {
  try {
    await clearSession();
  } catch {
    // En Server Components no siempre se puede escribir cookies.
  }
}

function isAccessTokenFresh(expiresAt?: string) {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() > Date.now() + 30_000;
}

async function resolveAccessTokenFromSession() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const { url, anonKey } = resolveSupabaseConfig();

  if (session.accessToken && isAccessTokenFresh(session.accessTokenExpiresAt)) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    if (hasConfiguredSupabaseAuth()) {
      await tryClearSession();
      throw new HttpError(
        "Tu sesion de Supabase expiro. Cierra sesion e inicia nuevamente.",
        401,
      );
    }

    return session.accessToken ?? null;
  }

  const authClient = createBaseClient(url, anonKey);
  const { data, error } = await authClient.auth.refreshSession({
    refresh_token: session.refreshToken,
  });

  if (error || !data.session?.access_token) {
    await tryClearSession();
    throw new HttpError(
      "Tu sesion de Supabase expiro. Inicia sesion nuevamente para continuar.",
      401,
    );
  }

  await updateSessionTokens({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    accessTokenExpiresAt: data.session.expires_at
      ? new Date(data.session.expires_at * 1000).toISOString()
      : session.accessTokenExpiresAt,
  });

  return data.session.access_token;
}

export function getSupabaseAuthClientOrThrow(): SupabaseClient {
  const { url, anonKey } = resolveSupabaseConfig();
  return createBaseClient(url, anonKey);
}

export async function getSupabaseClientOrThrow(): Promise<SupabaseClient> {
  const { url, anonKey } = resolveSupabaseConfig();
  const accessToken = await resolveAccessTokenFromSession();

  if (!accessToken) {
    return createBaseClient(url, anonKey);
  }

  return createClient(url, anonKey, {
    accessToken: async () => accessToken,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
