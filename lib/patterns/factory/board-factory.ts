import type {
  Board,
  BoardColumn,
  BoardColumnDraftInput,
} from "@/lib/domain/models";

// Pattern traceability: Factory Method.
// Board creation encapsulates the default Kanban structure so project creation
// does not manually rebuild columns every time.
export interface BoardFactoryResult {
  board: Board;
  columns: BoardColumn[];
}

abstract class BoardFactory {
  create(
    projectId: string,
    name?: string,
    columnDrafts?: BoardColumnDraftInput[],
  ): BoardFactoryResult {
    const boardId = crypto.randomUUID();
    const columns = this.createColumns(boardId, columnDrafts);

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
  protected abstract createColumns(
    boardId: string,
    columnDrafts?: BoardColumnDraftInput[],
  ): BoardColumn[];
}

class DefaultKanbanBoardFactory extends BoardFactory {
  private readonly defaultColumns: Array<Required<BoardColumnDraftInput>> = [
    {
      name: "Por hacer",
      color: "#b8c2d4",
      wipLimit: 4,
    },
    {
      name: "En progreso",
      color: "#d7ca1c",
      wipLimit: 3,
    },
    {
      name: "En revision",
      color: "#4786ff",
      wipLimit: 2,
    },
    {
      name: "Completadas",
      color: "#35d446",
      wipLimit: 999,
    },
  ];

  protected boardName(name?: string) {
    return name?.trim() || "Tablero Kanban";
  }

  protected createColumns(
    boardId: string,
    columnDrafts?: BoardColumnDraftInput[],
  ): BoardColumn[] {
    const sourceColumns =
      columnDrafts && columnDrafts.length > 0 ? columnDrafts : this.defaultColumns;

    return sourceColumns.map((column, index) => {
      const fallback = this.defaultColumns[index % this.defaultColumns.length];

      return {
        id: crypto.randomUUID(),
        boardId,
        name: column.name.trim(),
        order: index + 1,
        color: column.color ?? fallback.color,
        wipLimit: column.wipLimit ?? fallback.wipLimit,
      };
    });
  }
}

export function createBoardFactory() {
  return new DefaultKanbanBoardFactory();
}

export function getDefaultBoardColumnDrafts(): BoardColumnDraftInput[] {
  return createBoardFactory()
    .create("board-draft")
    .columns.map((column) => ({
      name: column.name,
      color: column.color,
      wipLimit: column.wipLimit,
    }));
}
