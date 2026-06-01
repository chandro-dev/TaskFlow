import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Board,
  CreateBoardColumnInput,
  CreateBoardInput,
  DeleteBoardColumnInput,
  ReorderBoardColumnsInput,
  UpdateBoardColumnInput,
} from "@/lib/domain/models";
import {
  createBoardFactory,
  getDefaultBoardColumnDrafts,
} from "@/lib/patterns/factory/board-factory";
import {
  normalizeBoard,
  normalizeBoardColumn,
} from "@/lib/infrastructure/supabase/supabase-normalizers";
import type {
  BoardColumnRow,
  BoardRow,
} from "@/lib/infrastructure/supabase/supabase-row-types";

export class SupabaseBoardCommand {
  constructor(private readonly client: SupabaseClient) {}

  async createBoard(input: CreateBoardInput): Promise<Board> {
    const { board, columns } = createBoardFactory().create(
      input.projectId,
      input.name,
      input.columns,
    );

    const { data: boardRow, error: boardError } = await this.client
      .from("boards")
      .insert({
        project_id: input.projectId,
        name: board.name,
      })
      .select("*")
      .single();

    if (boardError || !boardRow) {
      throw new Error("No fue posible crear el tablero.");
    }

    const persistedBoardId = (boardRow as BoardRow).id;
    const { data: columnRows, error: columnsError } = await this.client
      .from("board_columns")
      .insert(
        columns.map((column) => ({
          board_id: persistedBoardId,
          name: column.name,
          position: column.order,
          color: column.color,
          wip_limit: column.wipLimit ?? null,
        })),
      )
      .select("*");

    if (columnsError) {
      await this.client.from("boards").delete().eq("id", persistedBoardId);
      throw new Error("El tablero fue creado, pero no fue posible crear sus columnas.");
    }

    return normalizeBoard(
      boardRow as BoardRow,
      ((columnRows ?? []) as BoardColumnRow[]).map((column) => normalizeBoardColumn(column)),
    );
  }

  async createBoardColumn(input: CreateBoardColumnInput): Promise<Board> {
    const board = await this.loadBoardAggregate(input.projectId, input.boardId);
    const defaults = getDefaultBoardColumnDrafts();
    const fallback = defaults[board.columns.length % defaults.length];

    const { error } = await this.client.from("board_columns").insert({
      board_id: input.boardId,
      name: input.name.trim(),
      position: board.columns.length + 1,
      color: fallback?.color ?? "#b8c2d4",
      wip_limit: input.wipLimit ?? fallback?.wipLimit ?? null,
    });

    if (error) {
      throw new Error(error.message ?? "No fue posible crear la columna.");
    }

    return this.loadBoardAggregate(input.projectId, input.boardId);
  }

  async updateBoardColumn(input: UpdateBoardColumnInput): Promise<Board> {
    await this.ensureBoardColumn(input.projectId, input.boardId, input.columnId);

    const { error } = await this.client
      .from("board_columns")
      .update({
        name: input.name.trim(),
        wip_limit: input.wipLimit ?? null,
      })
      .eq("id", input.columnId)
      .eq("board_id", input.boardId);

    if (error) {
      throw new Error(error.message ?? "No fue posible actualizar la columna.");
    }

    return this.loadBoardAggregate(input.projectId, input.boardId);
  }

  async reorderBoardColumns(input: ReorderBoardColumnsInput): Promise<Board> {
    const board = await this.loadBoardAggregate(input.projectId, input.boardId);
    const currentIds = board.columns.map((column) => column.id);

    if (
      currentIds.length !== input.orderedColumnIds.length ||
      currentIds.some((columnId) => !input.orderedColumnIds.includes(columnId))
    ) {
      throw new Error("El nuevo orden no coincide con las columnas actuales del tablero.");
    }

    const upsertPayload = input.orderedColumnIds.map((columnId, index) => {
      const currentColumn = board.columns.find((column) => column.id === columnId);

      if (!currentColumn) {
        throw new Error("La columna no existe dentro del tablero.");
      }

      return {
        id: currentColumn.id,
        board_id: currentColumn.boardId,
        name: currentColumn.name,
        position: index + 1,
        color: currentColumn.color,
        wip_limit: currentColumn.wipLimit ?? null,
      };
    });

    const { error } = await this.client
      .from("board_columns")
      .upsert(upsertPayload, { onConflict: "id" });

    if (error) {
      throw new Error(error.message ?? "No fue posible reordenar las columnas.");
    }

    return this.loadBoardAggregate(input.projectId, input.boardId);
  }

  async deleteBoardColumn(input: DeleteBoardColumnInput): Promise<Board> {
    const board = await this.loadBoardAggregate(input.projectId, input.boardId);

    if (board.columns.length <= 1) {
      throw new Error("El tablero debe conservar al menos una columna.");
    }

    await this.ensureBoardColumn(input.projectId, input.boardId, input.columnId);

    const { data: taskRow, error: taskError } = await this.client
      .from("tasks")
      .select("id")
      .eq("board_id", input.boardId)
      .eq("column_id", input.columnId)
      .limit(1)
      .maybeSingle();

    if (taskError) {
      throw new Error(
        taskError.message ?? "No fue posible validar las tareas de la columna.",
      );
    }

    if (taskRow?.id) {
      throw new Error("No puedes eliminar una columna que todavia contiene tareas.");
    }

    const { error: deleteError } = await this.client
      .from("board_columns")
      .delete()
      .eq("id", input.columnId)
      .eq("board_id", input.boardId);

    if (deleteError) {
      throw new Error(deleteError.message ?? "No fue posible eliminar la columna.");
    }

    const reloadedBoard = await this.loadBoardAggregate(input.projectId, input.boardId);
    const reorderedPayload = reloadedBoard.columns.map((column, index) => ({
      id: column.id,
      board_id: column.boardId,
      name: column.name,
      position: index + 1,
      color: column.color,
      wip_limit: column.wipLimit ?? null,
    }));

    const { error: reorderError } = await this.client
      .from("board_columns")
      .upsert(reorderedPayload, { onConflict: "id" });

    if (reorderError) {
      throw new Error(
        reorderError.message ??
          "La columna fue eliminada, pero no fue posible normalizar el orden restante.",
      );
    }

    return this.loadBoardAggregate(input.projectId, input.boardId);
  }

  private async loadBoardAggregate(projectId: string, boardId: string) {
    const { data: boardRow, error: boardError } = await this.client
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .eq("project_id", projectId)
      .single();

    if (boardError || !boardRow) {
      throw new Error(boardError?.message ?? "Tablero no encontrado.");
    }

    const { data: columnRows, error: columnsError } = await this.client
      .from("board_columns")
      .select("*")
      .eq("board_id", boardId)
      .order("position", { ascending: true });

    if (columnsError) {
      throw new Error(
        columnsError.message ?? "No fue posible consultar las columnas del tablero.",
      );
    }

    return normalizeBoard(
      boardRow as BoardRow,
      ((columnRows ?? []) as BoardColumnRow[]).map((column) =>
        normalizeBoardColumn(column),
      ),
    );
  }

  private async ensureBoardColumn(
    projectId: string,
    boardId: string,
    columnId: string,
  ) {
    await this.loadBoardAggregate(projectId, boardId);

    const { data, error } = await this.client
      .from("board_columns")
      .select("id")
      .eq("id", columnId)
      .eq("board_id", boardId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message ?? "No fue posible validar la columna.");
    }

    if (!data?.id) {
      throw new Error("La columna no existe dentro del tablero.");
    }
  }
}
