import type { RegisterUserInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";

export class AuthCommandService {
  constructor(private readonly repository: IRepositroyFlow) {}

  async registerUser(input: RegisterUserInput) {
    return this.repository.registerUser(input);
  }
}
