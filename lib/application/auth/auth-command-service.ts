import type { RegisterUserInput } from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";

export class AuthCommandService {
  constructor(private readonly repository: TaskflowRepository) {}

  async registerUser(input: RegisterUserInput) {
    return this.repository.registerUser(input);
  }
}
