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
<<<<<<< HEAD
  const body = (await request.json()) as { name?: string; wipLimit?: number };
=======
  const body = (await request.json()) as { name?: string };
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29

  try {
    await requireProjectCoordinatorRouteUser(projectId);
    const board = await service.updateBoardColumn({
      projectId,
      boardId,
      columnId,
      name: body.name ?? "",
<<<<<<< HEAD
      wipLimit:
        body.wipLimit === undefined ? undefined : Number(body.wipLimit),
=======
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29
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
