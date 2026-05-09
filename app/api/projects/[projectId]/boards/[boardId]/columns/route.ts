import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectCoordinatorRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

export async function POST(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/boards/[boardId]/columns">,
) {
  const { projectId, boardId } = await context.params;
  const body = (await request.json()) as { name?: string };

  try {
    await requireProjectCoordinatorRouteUser(projectId);
    const board = await service.createBoardColumn({
      projectId,
      boardId,
      name: body.name ?? "",
    });

    return Response.json(board, { status: 201 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
