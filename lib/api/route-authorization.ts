import { createTaskflowRepository } from "@/lib/infrastructure/repository-factory";
import { requireRouteUser } from "@/lib/api/require-route-user";
import { HttpError } from "@/lib/shared/http-error";
import { ProjectAccessPolicy } from "@/lib/domain/policies/project-access-policy";

const projectAccessPolicy = new ProjectAccessPolicy();

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
