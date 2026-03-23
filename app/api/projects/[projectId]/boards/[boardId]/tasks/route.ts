import { TaskflowService } from "@/lib/application/taskflow-service";
import type { TaskPriority, TaskType } from "@/lib/domain/models";
import { requireProjectMemberRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

export async function POST(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/boards/[boardId]/tasks">,
) {
  const { projectId, boardId } = await context.params;
  const body = (await request.json()) as {
    title?: string;
    description?: string;
    type?: TaskType;
    priority?: TaskPriority;
    dueDate?: string;
    estimateHours?: number;
    assigneeIds?: string[];
    columnId?: string;
  };

  try {
    const currentUser = await requireProjectMemberRouteUser(projectId);
    const task = await service.createTask({
      projectId,
      boardId,
      actorId: currentUser.id,
      columnId: body.columnId,
      title: body.title ?? "",
      description: body.description ?? "",
      type: body.type ?? "TASK",
      priority: body.priority,
      dueDate: body.dueDate ?? "",
      estimateHours: Number(body.estimateHours ?? 0),
      assigneeIds: body.assigneeIds ?? [],
    });

    return Response.json(task, { status: 201 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
