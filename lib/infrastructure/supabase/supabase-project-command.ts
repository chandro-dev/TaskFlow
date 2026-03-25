import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateProjectInput,
  CreateProjectResult,
  UpdateProjectInput,
  UserRole,
} from "@/lib/domain/models";
import { getSession } from "@/lib/auth/session-cookie";
import { hasSupabaseServiceRoleKey } from "@/lib/infrastructure/auth/auth-mode";
import { getSupabaseAdminClientOrThrow } from "@/lib/infrastructure/supabase/supabase-admin-client";
import { ProjectBuilder } from "@/lib/patterns/builder/project-builder";
import { createBoardFactory } from "@/lib/patterns/factory/board-factory";
import {
  normalizeBoard,
  normalizeBoardColumn,
  normalizeProject,
} from "@/lib/infrastructure/supabase/supabase-normalizers";
import type {
  BoardColumnRow,
  BoardRow,
  ProjectRow,
} from "@/lib/infrastructure/supabase/supabase-row-types";

export class SupabaseProjectCommand {
  constructor(private readonly client: SupabaseClient) {}

  async createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
    await this.ensureOwnerProfile(input.ownerId);

    // Builder validates project data first. The board factory then provides the
    // default Kanban board and columns that will be persisted for the project.
    const projectDraft = new ProjectBuilder(input).normalize().validate();
    const tempProjectId = crypto.randomUUID();
    const builtProject = projectDraft.buildProject(tempProjectId);
    const { board, columns } = createBoardFactory().create(tempProjectId);

    const { data: projectRow, error: projectError } = await this.client
      .from("projects")
      .insert({
        owner_id: builtProject.ownerId,
        name: builtProject.name,
        description: builtProject.description,
        start_date: builtProject.startDate,
        end_date: builtProject.endDate,
        state: builtProject.state,
        archived: builtProject.archived,
      })
      .select("*")
      .single();

    if (projectError || !projectRow) {
      throw new Error(
        projectError?.message ?? "No fue posible crear el proyecto.",
      );
    }

    const projectId = (projectRow as ProjectRow).id;

    const { error: memberError } = await this.client.from("project_members").upsert({
      project_id: projectId,
      user_id: builtProject.ownerId,
      member_role: "PROJECT_MANAGER",
      invited_by: builtProject.ownerId,
    });

    if (memberError) {
      await this.client.from("projects").delete().eq("id", projectId);
      throw new Error(
        memberError.message ??
          "El proyecto fue creado, pero no fue posible registrar al propietario.",
      );
    }

    const { data: boardRow, error: boardError } = await this.client
      .from("boards")
      .insert({
        project_id: projectId,
        name: board.name,
      })
      .select("*")
      .single();

    if (boardError || !boardRow) {
      await this.client.from("projects").delete().eq("id", projectId);
      throw new Error(
        boardError?.message ??
          "El proyecto fue creado, pero no fue posible crear el tablero.",
      );
    }

    const persistedBoardId = (boardRow as BoardRow).id;

    const { data: persistedColumns, error: columnsError } = await this.client
      .from("board_columns")
      .insert(
        columns.map((column) => ({
          board_id: persistedBoardId,
          name: column.name,
          position: column.order,
          color: column.color,
          wip_limit: column.wipLimit ?? null,
        })),
      )
      .select("*");

    if (columnsError) {
      await this.client.from("boards").delete().eq("id", persistedBoardId);
      await this.client.from("projects").delete().eq("id", projectId);
      throw new Error(
        columnsError.message ??
          "El proyecto fue creado, pero no fue posible crear las columnas.",
      );
    }

    return {
      project: normalizeProject(projectRow as ProjectRow, [builtProject.ownerId], [persistedBoardId]),
      board: normalizeBoard(
        boardRow as BoardRow,
        ((persistedColumns ?? []) as BoardColumnRow[]).map((column) =>
          normalizeBoardColumn(column),
        ),
      ),
    };
  }

  async updateProject(input: UpdateProjectInput) {
    const existingProject = await this.findProjectById(input.projectId);
    const validated = new ProjectBuilder({
      name: input.name,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      ownerId: existingProject.owner_id,
      state: input.state,
    })
      .normalize()
      .validate();

    const { data: memberRows, error: membersError } = await this.client
      .from("project_members")
      .select("user_id")
      .eq("project_id", input.projectId);

    if (membersError) {
      throw new Error(
        membersError.message ??
          "No fue posible consultar los miembros del proyecto.",
      );
    }

    const { data: boardRows, error: boardsError } = await this.client
      .from("boards")
      .select("id")
      .eq("project_id", input.projectId);

    if (boardsError) {
      throw new Error(
        boardsError.message ??
          "No fue posible consultar los tableros del proyecto.",
      );
    }

    const { data: projectRow, error } = await this.client
      .from("projects")
      .update({
        name: input.name.trim(),
        description: input.description.trim(),
        start_date: input.startDate,
        end_date: input.endDate,
        state: validated.buildProject(input.projectId).state,
        archived: input.archived,
      })
      .eq("id", input.projectId)
      .select("*")
      .single();

    if (error || !projectRow) {
      throw new Error(
        error?.message ?? "No fue posible actualizar el proyecto.",
      );
    }

    const memberIds = [
      existingProject.owner_id,
      ...new Set(
        ((memberRows ?? []) as Array<{ user_id: string }>).map((row) => row.user_id),
      ),
    ];
    const boardIds = ((boardRows ?? []) as Array<{ id: string }>).map((row) => row.id);

    return normalizeProject(projectRow as ProjectRow, memberIds, boardIds);
  }

  async deleteProject(projectId: string) {
    await this.findProjectById(projectId);

    const { error } = await this.client.from("projects").delete().eq("id", projectId);

    if (error) {
      throw new Error(
        error.message ?? "No fue posible eliminar el proyecto.",
      );
    }
  }

  async removeProjectMember(projectId: string, memberId: string) {
    const project = await this.findProjectById(projectId);

    if (project.owner_id === memberId) {
      throw new Error("No puedes revocar al propietario del proyecto.");
    }

    const { data: profileRow, error: profileError } = await this.client
      .from("profiles")
      .select("role")
      .eq("id", memberId)
      .maybeSingle();

    if (profileError) {
      throw new Error(
        profileError.message ?? "No fue posible validar el usuario a revocar.",
      );
    }

    if (profileRow?.role === "ADMIN") {
      throw new Error(
        "Los administradores globales mantienen acceso. Ajusta su rol si necesitas restringirlo.",
      );
    }

    const { data: memberRow, error: memberLookupError } = await this.client
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", memberId)
      .maybeSingle();

    if (memberLookupError) {
      throw new Error(
        memberLookupError.message ?? "No fue posible consultar al miembro del proyecto.",
      );
    }

    if (!memberRow) {
      throw new Error("El usuario ya no pertenece a este proyecto.");
    }

    const { error: deleteMemberError } = await this.client
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", memberId);

    if (deleteMemberError) {
      throw new Error(
        deleteMemberError.message ?? "No fue posible revocar el acceso del miembro.",
      );
    }

    const { data: assignedTasks, error: assignedTasksError } = await this.client
      .from("tasks")
      .select("id, assignee_ids")
      .eq("project_id", projectId)
      .contains("assignee_ids", [memberId]);

    if (assignedTasksError) {
      throw new Error(
        assignedTasksError.message ??
          "El acceso fue revocado, pero no fue posible desasignar sus tareas.",
      );
    }

    for (const task of assignedTasks ?? []) {
      const nextAssignees = ((task.assignee_ids as string[] | null) ?? []).filter(
        (assigneeId) => assigneeId !== memberId,
      );

      const { error: taskUpdateError } = await this.client
        .from("tasks")
        .update({ assignee_ids: nextAssignees })
        .eq("id", task.id);

      if (taskUpdateError) {
        throw new Error(
          taskUpdateError.message ??
            "El acceso fue revocado, pero no fue posible desasignar sus tareas.",
        );
      }
    }

    const { data: memberRows, error: membersError } = await this.client
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId);

    if (membersError) {
      throw new Error(
        membersError.message ??
          "No fue posible consultar los miembros del proyecto tras la revocacion.",
      );
    }

    const { data: boardRows, error: boardsError } = await this.client
      .from("boards")
      .select("id")
      .eq("project_id", projectId);

    if (boardsError) {
      throw new Error(
        boardsError.message ??
          "No fue posible consultar los tableros del proyecto tras la revocacion.",
      );
    }

    return normalizeProject(
      project,
      [
        project.owner_id,
        ...new Set(
          ((memberRows ?? []) as Array<{ user_id: string }>).map((row) => row.user_id),
        ),
      ],
      ((boardRows ?? []) as Array<{ id: string }>).map((row) => row.id),
    );
  }

  async updateProjectMemberRole(
    projectId: string,
    memberId: string,
    memberRole: UserRole,
  ) {
    const project = await this.findProjectById(projectId);

    if (project.owner_id === memberId) {
      throw new Error("El propietario conserva su privilegio principal.");
    }

    const { data: profileRow, error: profileError } = await this.client
      .from("profiles")
      .select("role")
      .eq("id", memberId)
      .maybeSingle();

    if (profileError) {
      throw new Error(
        profileError.message ?? "No fue posible validar el usuario a actualizar.",
      );
    }

    if (profileRow?.role === "ADMIN") {
      throw new Error(
        "Los administradores globales mantienen acceso. Ajusta su rol global si necesitas restringirlo.",
      );
    }

    const { data: memberRow, error: memberLookupError } = await this.client
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", memberId)
      .maybeSingle();

    if (memberLookupError) {
      throw new Error(
        memberLookupError.message ?? "No fue posible consultar al miembro del proyecto.",
      );
    }

    if (!memberRow) {
      throw new Error("El usuario no pertenece actualmente a este proyecto.");
    }

    const nextRole: UserRole =
      memberRole === "PROJECT_MANAGER" ? "PROJECT_MANAGER" : "DEVELOPER";

    const { error: updateError } = await this.client
      .from("project_members")
      .update({ member_role: nextRole })
      .eq("project_id", projectId)
      .eq("user_id", memberId);

    if (updateError) {
      throw new Error(
        updateError.message ?? "No fue posible actualizar el rol del miembro.",
      );
    }

    return this.loadProjectAggregate(project);
  }

  private async ensureOwnerProfile(ownerId: string) {
    const { data, error } = await this.client
      .from("profiles")
      .select("id")
      .eq("id", ownerId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `No fue posible validar el perfil del propietario: ${error.message}`,
      );
    }

    if (data?.id) {
      return;
    }

    if (!hasSupabaseServiceRoleKey()) {
      throw new Error(
        "Tu usuario existe en Auth pero no tiene perfil en public.profiles. Ejecuta el backfill de perfiles o configura SUPABASE_SERVICE_ROLE_KEY para sincronizarlo automaticamente.",
      );
    }

    const session = await getSession();

    if (!session?.email) {
      throw new Error(
        "No fue posible sincronizar el perfil del propietario porque la sesion no incluye correo.",
      );
    }

    const adminClient = getSupabaseAdminClientOrThrow();
    const inferredName = session.email.split("@")[0] || "Usuario";
    const { error: upsertError } = await adminClient.from("profiles").upsert({
      id: ownerId,
      email: session.email,
      full_name: inferredName,
      avatar_initials: inferredName.slice(0, 2).toUpperCase(),
      role: "DEVELOPER",
      bio: "",
      theme_preference: "system",
      is_active: true,
      last_access_at: new Date().toISOString(),
    });

    if (upsertError) {
      throw new Error(
        `No fue posible sincronizar el perfil del propietario: ${upsertError.message}`,
      );
    }
  }

  private async findProjectById(projectId: string) {
    const { data, error } = await this.client
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Proyecto no encontrado.");
    }

    return data as ProjectRow;
  }

  private async loadProjectAggregate(project: ProjectRow) {
    const { data: memberRows, error: membersError } = await this.client
      .from("project_members")
      .select("user_id")
      .eq("project_id", project.id);

    if (membersError) {
      throw new Error(
        membersError.message ??
          "No fue posible consultar los miembros actualizados del proyecto.",
      );
    }

    const { data: boardRows, error: boardsError } = await this.client
      .from("boards")
      .select("id")
      .eq("project_id", project.id);

    if (boardsError) {
      throw new Error(
        boardsError.message ??
          "No fue posible consultar los tableros del proyecto actualizado.",
      );
    }

    return normalizeProject(
      project,
      [
        project.owner_id,
        ...new Set(
          ((memberRows ?? []) as Array<{ user_id: string }>).map((row) => row.user_id),
        ),
      ],
      ((boardRows ?? []) as Array<{ id: string }>).map((row) => row.id),
    );
  }
}
