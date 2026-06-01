import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectCoordinatorRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

export async function PATCH(
  request: Request,
  context: RouteContext<
    "/api/projects/[projectId]/boards/[boardId]/columns/[columnId]"
  >,
) {
  const { projectId, boardId, columnId } = await context.params;
  const body = (await request.json()) as { name?: string; wipLimit?: number };

  try {
    await requireProjectCoordinatorRouteUser(projectId);
    const board = await service.updateBoardColumn({
      projectId,
      boardId,
      columnId,
      name: body.name ?? "",
      wipLimit:
        body.wipLimit === undefined ? undefined : Number(body.wipLimit),
    });

    return Response.json(board);
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<
    "/api/projects/[projectId]/boards/[boardId]/columns/[columnId]"
  >,
) {
  const { projectId, boardId, columnId } = await context.params;

  try {
    await requireProjectCoordinatorRouteUser(projectId);
    const board = await service.deleteBoardColumn({
      projectId,
      boardId,
      columnId,
    });

    return Response.json(board);
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
