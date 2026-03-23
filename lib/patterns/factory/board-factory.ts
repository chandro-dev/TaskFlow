import type { Board, BoardColumn } from "@/lib/domain/models";

export interface BoardFactoryResult {
  board: Board;
  columns: BoardColumn[];
}

abstract class BoardFactory {
  create(projectId: string, name?: string): BoardFactoryResult {
    const boardId = crypto.randomUUID();
    const columns = this.createColumns(boardId);

    return {
      board: {
        id: boardId,
        projectId,
        name: this.boardName(name),
        columns,
      },
      columns,
    };
  }

  protected abstract boardName(name?: string): string;
  protected abstract createColumns(boardId: string): BoardColumn[];
}

class DefaultKanbanBoardFactory extends BoardFactory {
  protected boardName(name?: string) {
    return name?.trim() || "Tablero Kanban";
  }

  protected createColumns(boardId: string): BoardColumn[] {
    return [
      {
        id: crypto.randomUUID(),
        boardId,
        name: "Por hacer",
        order: 1,
        color: "#b8c2d4",
        wipLimit: 4,
      },
      {
        id: crypto.randomUUID(),
        boardId,
        name: "En progreso",
        order: 2,
        color: "#d7ca1c",
        wipLimit: 3,
      },
      {
        id: crypto.randomUUID(),
        boardId,
        name: "En revision",
        order: 3,
        color: "#4786ff",
        wipLimit: 2,
      },
      {
        id: crypto.randomUUID(),
        boardId,
        name: "Completadas",
        order: 4,
        color: "#35d446",
        wipLimit: 999,
      },
    ];
  }
}

export function createBoardFactory() {
  return new DefaultKanbanBoardFactory();
}
