import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectMemberRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

export const dynamic = "force-dynamic";

const service = new TaskflowService();

export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string; boardId: string; taskId: string }> },
) {
  const { projectId, boardId, taskId } = await context.params;

  try {
    const currentUser = await requireProjectMemberRouteUser(projectId);
    const task = await service.undoTask({
      taskId,
      projectId,
      boardId,
      actorId: currentUser.id,
    });

    return Response.json(task);
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
