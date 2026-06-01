import { SnapshotLoader } from "@/lib/application/shared/snapshot-loader";
import type {
  Board,
  CloneProjectRequestInput,
  Project,
} from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import { ProjectBuilder } from "@/lib/patterns/builder/project-builder";
import {
  BoardColumnPrototype,
  BoardPrototype,
  ProjectPrototype,
} from "@/lib/patterns/prototype/clone";
import type { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export class ProjectCloneService {
  private readonly snapshotLoader: SnapshotLoader;

  constructor(
    private readonly repository: IRepositroyFlow,
    private readonly notificationPublisher: ProjectEventPublisher,
  ) {
    this.snapshotLoader = new SnapshotLoader(repository);
  }

  async cloneProject(input: CloneProjectRequestInput) {
    if (!input.actorId) {
      throw new Error("No fue posible identificar al usuario que clona el proyecto.");
    }

    const snapshot = await this.snapshotLoader.load();
    const sourceProject = snapshot.projects.find(
      (project) => project.id === input.sourceProjectId,
    );

    if (!sourceProject) {
      throw new Error("El proyecto origen no existe o ya no esta disponible.");
    }

    const sourceBoards = this.resolveSourceBoards(sourceProject, snapshot.boards);

    // Pattern traceability: Prototype.
    // The new project starts from the source aggregate and then resets runtime
    // ownership and membership while preserving the board structure.
    const projectDraft = new ProjectPrototype(sourceProject).clone({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      ownerId: input.actorId,
      memberIds: [input.actorId],
      boardIds: [],
      state: "PLANIFICADO",
      archived: false,
    });

    const project = new ProjectBuilder({
      name: projectDraft.name,
      description: projectDraft.description,
      startDate: projectDraft.startDate,
      endDate: projectDraft.endDate,
      ownerId: projectDraft.ownerId,
      state: projectDraft.state,
    })
      .normalize()
      .validate()
      .buildProject(projectDraft.id);

    const clonedBoards = sourceBoards.map((board) => {
      const boardId = crypto.randomUUID();
      const columns = board.columns
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((column) =>
          new BoardColumnPrototype(column).clone({
            id: crypto.randomUUID(),
            boardId,
          }),
        );

      return new BoardPrototype(board).clone({
        id: boardId,
        projectId: project.id,
        columns,
      });
    });

    const result = await this.repository.cloneProject({
      sourceProjectId: sourceProject.id,
      ownerId: input.actorId,
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      state: project.state,
      boards: clonedBoards.map((board) => ({
        name: board.name,
        columns: board.columns.map((column) => ({
          name: column.name,
          order: column.order,
          color: column.color,
          wipLimit: column.wipLimit,
        })),
      })),
    });

    await this.notificationPublisher.publish({
      kind: "PROJECT_CREATED",
      projectId: result.project.id,
      actorId: input.actorId,
      boardId: result.boards[0]?.id,
    });

    return result;
  }

  private resolveSourceBoards(sourceProject: Project, boards: Board[]) {
    if (sourceProject.boardIds.length === 0) {
      return boards.filter((board) => board.projectId === sourceProject.id);
    }

    const sourceBoards = sourceProject.boardIds.map((boardId) => {
      const board = boards.find((candidate) => candidate.id === boardId);

      if (!board) {
        throw new Error(
          "La estructura del proyecto origen esta incompleta. Falta uno de sus tableros.",
        );
      }

      return board;
    });

    return sourceBoards;
  }
}
