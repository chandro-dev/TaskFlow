import type { CreateBoardInput } from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import type { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export class BoardCommandService {
  constructor(
    private readonly repository: IRepositroyFlow,
    private readonly notificationPublisher: ProjectEventPublisher,
  ) {}

  async createBoard(input: CreateBoardInput, actorId: string) {
    const name = input.name.trim();

    if (!name) {
      throw new Error("El tablero requiere un nombre.");
    }

    const board = await this.repository.createBoard({
      ...input,
      name,
    });

    await this.notificationPublisher.publish({
      kind: "BOARD_CREATED",
      projectId: input.projectId,
      actorId,
      boardId: board.id,
    });

    return board;
  }
}
