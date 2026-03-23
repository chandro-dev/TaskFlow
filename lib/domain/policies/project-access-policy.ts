import type { Project, UserProfile } from "@/lib/domain/models";

export class ProjectAccessPolicy {
  canManage(project: Project, user: UserProfile) {
    return project.ownerId === user.id || user.role === "ADMIN";
  }

  canAccess(project: Project, user: UserProfile) {
    return this.canManage(project, user) || project.memberIds.includes(user.id);
  }
}
