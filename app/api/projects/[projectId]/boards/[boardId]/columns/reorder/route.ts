import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectCoordinatorRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/boards/[boardId]/columns/reorder">,
) {
  const { projectId, boardId } = await context.params;
  const body = (await request.json()) as { orderedColumnIds?: string[] };

  try {
    await requireProjectCoordinatorRouteUser(projectId);
    const board = await service.reorderBoardColumns({
      projectId,
      boardId,
      orderedColumnIds: body.orderedColumnIds ?? [],
    });

    return Response.json(board);
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
