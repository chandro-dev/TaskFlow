import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SystemSettings,
  UpdateSystemSettingsInput,
} from "@/lib/domain/models";
import { normalizeSettings } from "@/lib/infrastructure/supabase/supabase-normalizers";
import type { SettingsRow } from "@/lib/infrastructure/supabase/supabase-row-types";

export class SupabaseSettingsCommand {
  constructor(private readonly client: SupabaseClient) {}

  async updateSettings(input: UpdateSystemSettingsInput): Promise<SystemSettings> {
    const payload = {
      platform_name: input.platformName.trim(),
      max_attachment_mb: input.maxAttachmentMb,
      password_policy: input.passwordPolicy.trim(),
      default_theme: input.defaultTheme,
    };

    const { data: existing, error: existingError } = await this.client
      .from("system_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw new Error("No fue posible consultar la configuracion actual.");
    }

    if (!existing?.id) {
      const { data, error } = await this.client
        .from("system_settings")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error("No fue posible crear la configuracion del sistema.");
      }

      return normalizeSettings(data as SettingsRow);
    }

    const { data, error } = await this.client
      .from("system_settings")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error("No fue posible actualizar la configuracion del sistema.");
    }

    return normalizeSettings(data as SettingsRow);
  }
}
