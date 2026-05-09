import type { Project, UserProfile, UserRole } from "@/lib/domain/models";
import { ProjectAccessPolicy } from "@/lib/domain/policies/project-access-policy";
import { HttpError } from "@/lib/shared/http-error";

type CoordinatorRoleResolver = (
  projectId: string,
  userId: string,
) => Promise<UserRole | null>;

export class RouteAuthorizationProxy {
  constructor(
    private readonly accessPolicy = new ProjectAccessPolicy(),
    private readonly resolveCoordinatorRole?: CoordinatorRoleResolver,
  ) {}

  requireAdmin(user: UserProfile) {
    if (user.role !== "ADMIN") {
      throw new HttpError("No tienes permisos para administrar la configuracion.", 403);
    }

    return user;
  }

  requireProjectMember(project: Project | undefined, user: UserProfile) {
    const currentProject = this.requireProject(project);

    if (!this.accessPolicy.canAccess(currentProject, user)) {
      throw new HttpError("No tienes permisos para operar sobre este proyecto.", 403);
    }

    return user;
  }

  requireProjectManager(project: Project | undefined, user: UserProfile) {
    const currentProject = this.requireProject(project);

    if (!this.accessPolicy.canManage(currentProject, user)) {
      throw new HttpError(
        "Solo el creador del proyecto o un administrador pueden gestionarlo.",
        403,
      );
    }

    return user;
  }

  async requireProjectCoordinator(project: Project | undefined, user: UserProfile) {
    const currentProject = this.requireProject(project);

    if (this.accessPolicy.canManage(currentProject, user)) {
      return user;
    }

    const memberRole = await this.resolveCoordinatorRole?.(
      currentProject.id,
      user.id,
    );

    if (memberRole === "PROJECT_MANAGER") {
      return user;
    }

    throw new HttpError(
      "Solo el creador, un administrador o un project manager del proyecto pueden realizar esta accion.",
      403,
    );
  }

  private requireProject(project: Project | undefined) {
    if (!project) {
      throw new HttpError("Proyecto no encontrado.", 404);
    }

    return project;
  }
}
