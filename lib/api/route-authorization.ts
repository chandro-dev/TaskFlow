import { createTaskflowRepository } from "@/lib/infrastructure/repository-factory";
import { requireRouteUser } from "@/lib/api/require-route-user";
import { HttpError } from "@/lib/shared/http-error";
import { ProjectAccessPolicy } from "@/lib/domain/policies/project-access-policy";
import { getSupabaseClientOrThrow } from "@/lib/infrastructure/supabase/supabase-client";

const projectAccessPolicy = new ProjectAccessPolicy();

async function resolveProjectCoordinatorRole(projectId: string, userId: string) {
  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseEnv) {
    return null;
  }

  try {
    const client = await getSupabaseClientOrThrow();
    const { data, error } = await client
      .from("project_members")
      .select("member_role")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return (data?.member_role as "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER" | null) ?? null;
  } catch {
    return null;
  }
}

export async function requireAdminRouteUser() {
  const currentUser = await requireRouteUser();

  if (currentUser.role !== "ADMIN") {
    throw new HttpError("No tienes permisos para administrar la configuracion.", 403);
  }

  return currentUser;
}

export async function requireProjectMemberRouteUser(projectId: string) {
  const currentUser = await requireRouteUser();
  const repository = createTaskflowRepository();
  const snapshot = await repository.loadSnapshot();
  const project = snapshot.projects.find((item) => item.id === projectId);

  if (!project) {
    throw new HttpError("Proyecto no encontrado.", 404);
  }

  const isMember = projectAccessPolicy.canAccess(project, currentUser);

  if (!isMember) {
    throw new HttpError("No tienes permisos para operar sobre este proyecto.", 403);
  }

  return currentUser;
}

export async function requireProjectManagerRouteUser(projectId: string) {
  const currentUser = await requireRouteUser();
  const repository = createTaskflowRepository();
  const snapshot = await repository.loadSnapshot();
  const project = snapshot.projects.find((item) => item.id === projectId);

  if (!project) {
    throw new HttpError("Proyecto no encontrado.", 404);
  }

  if (!projectAccessPolicy.canManage(project, currentUser)) {
    throw new HttpError(
      "Solo el creador del proyecto o un administrador pueden gestionarlo.",
      403,
    );
  }

  return currentUser;
}

export async function requireProjectCoordinatorRouteUser(projectId: string) {
  const currentUser = await requireRouteUser();
  const repository = createTaskflowRepository();
  const snapshot = await repository.loadSnapshot();
  const project = snapshot.projects.find((item) => item.id === projectId);

  if (!project) {
    throw new HttpError("Proyecto no encontrado.", 404);
  }

  if (projectAccessPolicy.canManage(project, currentUser)) {
    return currentUser;
  }

  const memberRole = await resolveProjectCoordinatorRole(projectId, currentUser.id);

  if (memberRole === "PROJECT_MANAGER") {
    return currentUser;
  }

  throw new HttpError(
    "Solo el creador, un administrador o un project manager del proyecto pueden realizar esta accion.",
    403,
  );
}
