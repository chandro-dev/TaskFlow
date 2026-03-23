export function hasConfiguredSupabaseAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return false;
  }

  return !url.includes("TU-PROYECTO") && !anonKey.includes("TU_SUPABASE_ANON_KEY");
}

export function hasSupabaseServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return false;
  }

  return !serviceRoleKey.includes("TU_SUPABASE_SERVICE_ROLE_KEY");
}
