import type { SupabaseClient } from "@supabase/supabase-js";
import type { Board, CreateBoardInput } from "@/lib/domain/models";
import { createBoardFactory } from "@/lib/patterns/factory/board-factory";
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
    const { board, columns } = createBoardFactory().create(input.projectId, input.name);

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
}
