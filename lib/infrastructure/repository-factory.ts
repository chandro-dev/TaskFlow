import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { MockTaskflowRepository } from "@/lib/infrastructure/mock/mock-repository";
import { SupabaseTaskflowRepository } from "@/lib/infrastructure/supabase/supabase-repository";

function hasConfiguredSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return false;
  }

  const looksLikePlaceholder =
    url.includes("TU-PROYECTO") ||
    anonKey.includes("TU_SUPABASE_ANON_KEY") ||
    anonKey.includes("your_");

  return !looksLikePlaceholder;
}

export function createTaskflowRepository(): IRepositroyFlow {
  // The app always depends on the repository contract. This factory is the
  // only place that decides whether the runtime should use Supabase or the
  // in-memory mock fallback.
  if (hasConfiguredSupabaseEnv()) {
    return new SupabaseTaskflowRepository();
  }

  return new MockTaskflowRepository();
}
