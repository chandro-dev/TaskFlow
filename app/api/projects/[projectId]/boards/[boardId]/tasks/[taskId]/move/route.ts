import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectMemberRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

export async function PATCH(
  request: Request,
  context: RouteContext<
    "/api/projects/[projectId]/boards/[boardId]/tasks/[taskId]/move"
  >,
) {
  const { projectId, boardId, taskId } = await context.params;
  const body = (await request.json()) as {
    toColumnId?: string;
  };

  try {
    const currentUser = await requireProjectMemberRouteUser(projectId);
    const task = await service.moveTask({
      taskId,
      projectId,
      boardId,
      actorId: currentUser.id,
      toColumnId: body.toColumnId ?? "",
    });

    return Response.json(task);
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
