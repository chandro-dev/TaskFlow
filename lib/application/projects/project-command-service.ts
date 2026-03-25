import type { CreateProjectInput, UpdateProjectInput } from "@/lib/domain/models";
import type { TaskflowRepository } from "@/lib/domain/repositories";
import type { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export class ProjectCommandService {
  constructor(
    private readonly repository: TaskflowRepository,
    private readonly notificationPublisher: ProjectEventPublisher,
  ) {}

  async createProject(input: Omit<CreateProjectInput, "ownerId">, ownerId: string) {
    const result = await this.repository.createProject({
      ...input,
      ownerId,
    });

    // Observer traceability: the command publishes a domain event and does not
    // know which subscribers will turn it into notifications.
    await this.notificationPublisher.publish({
      kind: "PROJECT_CREATED",
      projectId: result.project.id,
      actorId: ownerId,
      boardId: result.board.id,
    });

    return result;
  }

  async updateProject(input: UpdateProjectInput, actorId: string) {
    const project = await this.repository.updateProject(input);

    await this.notificationPublisher.publish({
      kind: "PROJECT_UPDATED",
      projectId: project.id,
      actorId,
    });

    return project;
  }

  async deleteProject(projectId: string) {
    await this.repository.deleteProject(projectId);
  }

  async removeProjectMember(projectId: string, memberId: string) {
    return this.repository.removeProjectMember(projectId, memberId);
  }

  async updateProjectMemberRole(
    projectId: string,
    memberId: string,
    memberRole: "PROJECT_MANAGER" | "DEVELOPER",
  ) {
    return this.repository.updateProjectMemberRole(projectId, memberId, memberRole);
  }
}
