import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectCoordinatorRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

export async function POST(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/boards/[boardId]/columns">,
) {
  const { projectId, boardId } = await context.params;
<<<<<<< HEAD
  const body = (await request.json()) as { name?: string; wipLimit?: number };
=======
  const body = (await request.json()) as { name?: string };
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29

  try {
    await requireProjectCoordinatorRouteUser(projectId);
    const board = await service.createBoardColumn({
      projectId,
      boardId,
      name: body.name ?? "",
<<<<<<< HEAD
      wipLimit:
        body.wipLimit === undefined ? undefined : Number(body.wipLimit),
=======
>>>>>>> 84a25b47994113f208b85e4dd092ef33ab896f29
    });

    return Response.json(board, { status: 201 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
