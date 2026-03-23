import type { PasswordAuthInput } from "@/lib/domain/auth-provider";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { createAuthProvider } from "@/lib/infrastructure/auth/auth-provider-factory";

export class SessionCommandService {
  private readonly authProvider;

  constructor(repository: TaskflowRepository) {
    this.authProvider = createAuthProvider(repository);
  }

  async login(input: PasswordAuthInput) {
    return this.authProvider.authenticateWithPassword(input);
  }
}
