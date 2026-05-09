import { createTaskflowRepository } from "@/lib/infrastructure/repository-factory";
import { requireRouteUser } from "@/lib/api/require-route-user";
import { getSupabaseClientOrThrow } from "@/lib/infrastructure/supabase/supabase-client";
import { RouteAuthorizationProxy } from "@/lib/patterns/structural/proxy/route-authorization-proxy";

const routeAuthorizationProxy = new RouteAuthorizationProxy(
  undefined,
  resolveProjectCoordinatorRole,
);

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
  return routeAuthorizationProxy.requireAdmin(currentUser);
}

export async function requireProjectMemberRouteUser(projectId: string) {
  const currentUser = await requireRouteUser();
  const repository = createTaskflowRepository();
  const snapshot = await repository.loadSnapshot();
  const project = snapshot.projects.find((item) => item.id === projectId);

  return routeAuthorizationProxy.requireProjectMember(project, currentUser);
}

export async function requireProjectManagerRouteUser(projectId: string) {
  const currentUser = await requireRouteUser();
  const repository = createTaskflowRepository();
  const snapshot = await repository.loadSnapshot();
  const project = snapshot.projects.find((item) => item.id === projectId);

  return routeAuthorizationProxy.requireProjectManager(project, currentUser);
}

export async function requireProjectCoordinatorRouteUser(projectId: string) {
  const currentUser = await requireRouteUser();
  const repository = createTaskflowRepository();
  const snapshot = await repository.loadSnapshot();
  const project = snapshot.projects.find((item) => item.id === projectId);

  return routeAuthorizationProxy.requireProjectCoordinator(project, currentUser);
}
