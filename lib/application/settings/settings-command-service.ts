import type { UpdateSystemSettingsInput } from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";

export class SettingsCommandService {
  constructor(private readonly repository: TaskflowRepository) {}

  async updateSettings(input: UpdateSystemSettingsInput) {
    const platformName = input.platformName.trim();
    const passwordPolicy = input.passwordPolicy.trim();

    if (!platformName) {
      throw new Error("La plataforma requiere un nombre.");
    }

    if (!passwordPolicy) {
      throw new Error("La politica de contrasenas es obligatoria.");
    }

    if (input.maxAttachmentMb <= 0) {
      throw new Error("El limite de adjuntos debe ser mayor que cero.");
    }

    return this.repository.updateSettings({
      ...input,
      platformName,
      passwordPolicy,
    });
  }
}
