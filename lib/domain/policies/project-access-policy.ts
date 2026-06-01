<<<<<<< HEAD
import type { Project, UserProfile, UserRole } from "@/lib/domain/models";
=======
import type { Project, UserProfile } from "@/lib/domain/models";
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29

export class ProjectAccessPolicy {
  canManage(project: Project, user: UserProfile) {
    return project.ownerId === user.id || user.role === "ADMIN";
  }

<<<<<<< HEAD
  canCoordinate(project: Project, user: UserProfile, memberRole?: UserRole | null) {
    return this.canManage(project, user) || memberRole === "PROJECT_MANAGER";
  }

  canAccess(project: Project, user: UserProfile) {
    return this.canManage(project, user) || project.memberIds.includes(user.id);
  }

  buildActionPermissions(
    project: Project,
    user: UserProfile,
    memberRole?: UserRole | null,
  ) {
    const canAccess = this.canAccess(project, user);
    const canManageProject = this.canManage(project, user);
    const canCoordinateProject = this.canCoordinate(project, user, memberRole);
    const isArchived = project.archived || project.state === "ARCHIVADO";
    const canWorkOnTasks = canAccess && !isArchived;

    return {
      accessLabel: this.resolveAccessLabel(project, user, memberRole),
      canAccessProject: canAccess,
      canManageProject,
      canCoordinateProject,
      canManageMembers: canCoordinateProject,
      canManageColumns: canCoordinateProject && !isArchived,
      canCreateTask: canWorkOnTasks,
      canUpdateTask: canWorkOnTasks,
      canMoveTask: canWorkOnTasks,
      canCloneTask: canWorkOnTasks,
      canDeleteTask: canCoordinateProject && !isArchived,
      canCloneProject: canAccess,
      isReadOnly: !canWorkOnTasks,
    };
  }

  private resolveAccessLabel(
    project: Project,
    user: UserProfile,
    memberRole?: UserRole | null,
  ) {
    if (user.role === "ADMIN") {
      return "Administrador global";
    }

    if (project.ownerId === user.id) {
      return "Propietario";
    }

    if (memberRole === "PROJECT_MANAGER") {
      return "Project manager";
    }

    if (memberRole === "DEVELOPER" || project.memberIds.includes(user.id)) {
      return "Developer";
    }

    return "Sin acceso";
  }
=======
  canAccess(project: Project, user: UserProfile) {
    return this.canManage(project, user) || project.memberIds.includes(user.id);
  }
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29
}
