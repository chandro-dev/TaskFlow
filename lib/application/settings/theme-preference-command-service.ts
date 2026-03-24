import type { ThemeMode } from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";

export class ThemePreferenceCommandService {
  constructor(private readonly repository: TaskflowRepository) {}

  async updateThemePreference(userId: string, mode: ThemeMode) {
    return this.repository.updateUserThemePreference(userId, mode);
  }
}
