import type { TaskflowAuthProvider } from "@/lib/domain/auth-provider";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { hasConfiguredSupabaseAuth } from "@/lib/infrastructure/auth/auth-mode";
import { MockAuthProvider } from "@/lib/infrastructure/auth/mock-auth-provider";
import { SupabaseAuthProvider } from "@/lib/infrastructure/auth/supabase-auth-provider";

export function createAuthProvider(repository: IRepositroyFlow): TaskflowAuthProvider {
  if (hasConfiguredSupabaseAuth()) {
    return new SupabaseAuthProvider(repository);
  }

  return new MockAuthProvider(repository);
}
