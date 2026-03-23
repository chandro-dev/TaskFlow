import type {
  PasswordAuthInput,
  TaskflowAuthProvider,
} from "@/lib/domain/auth-provider";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import { HttpError } from "@/lib/shared/http-error";

export class MockAuthProvider implements TaskflowAuthProvider {
  constructor(private readonly repository: TaskflowRepository) {}

  async authenticateWithPassword(input: PasswordAuthInput) {
    const email = input.email.trim().toLowerCase();
    const user = await this.repository.findUserByEmail(email);

    if (!user) {
      throw new HttpError("Credenciales invalidas.", 401);
    }

    if (!input.password.trim()) {
      throw new HttpError("La contrasena es obligatoria.", 422);
    }

    return {
      user,
    };
  }
}
