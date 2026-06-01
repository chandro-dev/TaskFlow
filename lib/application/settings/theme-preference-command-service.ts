import type { ThemeMode } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";

export class ThemePreferenceCommandService {
  constructor(private readonly repository: IRepositroyFlow) {}

  async updateThemePreference(userId: string, mode: ThemeMode) {
    return this.repository.updateUserThemePreference(userId, mode);
  }
}
