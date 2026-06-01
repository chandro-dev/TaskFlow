import type {
  CreateBoardColumnInput,
  CreateBoardInput,
  DeleteBoardColumnInput,
  ReorderBoardColumnsInput,
  UpdateBoardColumnInput,
} from "@/lib/domain/models";
import type { IRepositroyFlow } from "@/lib/domain/repositories";
import type { ProjectEventPublisher } from "@/lib/patterns/observer/project-event-publisher";

export class BoardCommandService {
  constructor(
    private readonly repository: IRepositroyFlow,
    private readonly notificationPublisher: ProjectEventPublisher,
  ) {}

  async createBoard(input: CreateBoardInput, actorId: string) {
    const name = input.name.trim();
    const columns = (input.columns ?? []).map((column) => ({
      name: column.name.trim(),
      color: column.color,
      wipLimit: column.wipLimit,
    }));

    if (!name) {
      throw new Error("El tablero requiere un nombre.");
    }

    if (columns.length === 0) {
      throw new Error("El tablero debe tener al menos una columna.");
    }

    if (columns.some((column) => !column.name)) {
      throw new Error("Todas las columnas deben tener un nombre.");
    }

    const board = await this.repository.createBoard({
      ...input,
      name,
      columns,
    });

    await this.notificationPublisher.publish({
      kind: "BOARD_CREATED",
      projectId: input.projectId,
      actorId,
      boardId: board.id,
    });

    return board;
  }

  async createBoardColumn(input: CreateBoardColumnInput) {
    const name = input.name.trim();
<<<<<<< HEAD
    const wipLimit = this.normalizeWipLimit(input.wipLimit);
=======
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29

    if (!name) {
      throw new Error("La columna requiere un nombre.");
    }

    return this.repository.createBoardColumn({
      ...input,
      name,
<<<<<<< HEAD
      wipLimit,
=======
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29
    });
  }

  async updateBoardColumn(input: UpdateBoardColumnInput) {
    const name = input.name.trim();
<<<<<<< HEAD
    const wipLimit = this.normalizeWipLimit(input.wipLimit);
=======
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29

    if (!name) {
      throw new Error("La columna requiere un nombre.");
    }

    return this.repository.updateBoardColumn({
      ...input,
      name,
<<<<<<< HEAD
      wipLimit,
=======
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29
    });
  }

  async reorderBoardColumns(input: ReorderBoardColumnsInput) {
    const orderedColumnIds = input.orderedColumnIds.filter(Boolean);

    if (orderedColumnIds.length === 0) {
      throw new Error("Debes conservar al menos una columna en el tablero.");
    }

    if (new Set(orderedColumnIds).size !== orderedColumnIds.length) {
      throw new Error("El nuevo orden de columnas contiene elementos duplicados.");
    }

    return this.repository.reorderBoardColumns({
      ...input,
      orderedColumnIds,
    });
  }

  async deleteBoardColumn(input: DeleteBoardColumnInput) {
    return this.repository.deleteBoardColumn(input);
  }
<<<<<<< HEAD

  private normalizeWipLimit(value?: number) {
    if (value === undefined || Number.isNaN(value)) {
      return undefined;
    }

    if (value < 1) {
      throw new Error("El limite WIP debe ser mayor que cero.");
    }

    return Math.floor(value);
  }
=======
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29
}
