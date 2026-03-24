import type { TaskflowRepository } from "@/lib/domain/repositories";
import {
  getSupabaseAuthClientOrThrow,
  getSupabaseClientOrThrow,
} from "@/lib/infrastructure/supabase/supabase-client";
import { SupabaseAuthCommand } from "@/lib/infrastructure/supabase/supabase-auth-command";
import { SupabaseBoardCommand } from "@/lib/infrastructure/supabase/supabase-board-command";
import { SupabaseInvitationCommand } from "@/lib/infrastructure/supabase/supabase-invitation-command";
import { SupabaseNotificationCommand } from "@/lib/infrastructure/supabase/supabase-notification-command";
import { SupabaseProjectCommand } from "@/lib/infrastructure/supabase/supabase-project-command";
import { SupabaseSettingsCommand } from "@/lib/infrastructure/supabase/supabase-settings-command";
import { SupabaseSnapshotQuery } from "@/lib/infrastructure/supabase/supabase-snapshot-query";
import { SupabaseTaskCommand } from "@/lib/infrastructure/supabase/supabase-task-command";
import { normalizeUser } from "@/lib/infrastructure/supabase/supabase-normalizers";
import type { ProfileRow } from "@/lib/infrastructure/supabase/supabase-row-types";

export class SupabaseTaskflowRepository implements TaskflowRepository {
  async loadSnapshot() {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseSnapshotQuery(client).loadSnapshot();
  }

  async findUserById(userId: string) {
    const client = await getSupabaseClientOrThrow();
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error("No fue posible consultar el usuario actual.");
    }

    return data ? normalizeUser(data as ProfileRow) : null;
  }

  async findUserByEmail(email: string) {
    const client = await getSupabaseClientOrThrow();
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .ilike("email", email.trim())
      .maybeSingle();

    if (error) {
      throw new Error("No fue posible consultar el usuario por correo.");
    }

    return data ? normalizeUser(data as ProfileRow) : null;
  }

  async registerUser(input: Parameters<TaskflowRepository["registerUser"]>[0]) {
    const client = getSupabaseAuthClientOrThrow();
    return new SupabaseAuthCommand(client).registerUser(input);
  }

  async createProject(input: Parameters<TaskflowRepository["createProject"]>[0]) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseProjectCommand(client).createProject(input);
  }

  async updateProject(input: Parameters<TaskflowRepository["updateProject"]>[0]) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseProjectCommand(client).updateProject(input);
  }

  async deleteProject(projectId: string) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseProjectCommand(client).deleteProject(projectId);
  }

  async createBoard(input: Parameters<TaskflowRepository["createBoard"]>[0]) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseBoardCommand(client).createBoard(input);
  }

  async createTask(input: Parameters<TaskflowRepository["createTask"]>[0]) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseTaskCommand(client).createTask(input);
  }

  async updateTask(input: Parameters<TaskflowRepository["updateTask"]>[0]) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseTaskCommand(client).updateTask(input);
  }

  async cloneTask(input: Parameters<TaskflowRepository["cloneTask"]>[0]) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseTaskCommand(client).cloneTask(input);
  }

  async moveTask(input: Parameters<TaskflowRepository["moveTask"]>[0]) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseTaskCommand(client).moveTask(input);
  }

  async createNotifications(
    input: Parameters<TaskflowRepository["createNotifications"]>[0],
  ) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseNotificationCommand(client).createNotifications(input);
  }

  async markNotificationRead(notificationId: string, recipientId: string) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseNotificationCommand(client).markNotificationRead(
      notificationId,
      recipientId,
    );
  }

  async markAllNotificationsRead(recipientId: string) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseNotificationCommand(client).markAllNotificationsRead(
      recipientId,
    );
  }

  async updateSettings(input: Parameters<TaskflowRepository["updateSettings"]>[0]) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseSettingsCommand(client).updateSettings(input);
  }

  async updateUserThemePreference(
    userId: string,
    mode: Parameters<TaskflowRepository["updateUserThemePreference"]>[1],
  ) {
    const client = await getSupabaseClientOrThrow();
    const { data, error } = await client
      .from("profiles")
      .update({ theme_preference: mode })
      .eq("id", userId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error("No fue posible actualizar la preferencia de tema.");
    }

    return normalizeUser(data as ProfileRow);
  }

  async createInvitation(input: Parameters<TaskflowRepository["createInvitation"]>[0]) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseInvitationCommand(client).createInvitation(input);
  }

  async updateInvitationStatus(
    input: Parameters<TaskflowRepository["updateInvitationStatus"]>[0],
  ) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseInvitationCommand(client).updateInvitationStatus(input);
  }

  async resendInvitation(invitationId: string) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseInvitationCommand(client).resendInvitation(invitationId);
  }

  async findInvitationByToken(token: string) {
    const client = await getSupabaseClientOrThrow();
    return new SupabaseInvitationCommand(client).findInvitationByToken(token);
  }
}
