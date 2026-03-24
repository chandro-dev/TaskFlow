import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectMemberRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import type { TaskPriority, TaskSubtaskInput, TaskType } from "@/lib/domain/models";

const service = new TaskflowService();

export async function PATCH(
  request: Request,
  context: RouteContext<
    "/api/projects/[projectId]/boards/[boardId]/tasks/[taskId]"
  >,
) {
  const { projectId, boardId, taskId } = await context.params;
  const body = (await request.json()) as {
    title?: string;
    description?: string;
    type?: TaskType;
    priority?: TaskPriority;
    dueDate?: string;
    estimateHours?: number;
    assigneeIds?: string[];
    subtasks?: TaskSubtaskInput[];
    columnId?: string;
  };

  try {
    const currentUser = await requireProjectMemberRouteUser(projectId);
    const task = await service.updateTask({
      taskId,
      projectId,
      boardId,
      actorId: currentUser.id,
      columnId: body.columnId ?? "",
      title: body.title ?? "",
      description: body.description ?? "",
      type: body.type ?? "TASK",
      priority: body.priority ?? "MEDIA",
      dueDate: body.dueDate ?? "",
      estimateHours: Number(body.estimateHours ?? 0),
      assigneeIds: body.assigneeIds ?? [],
      subtasks: body.subtasks ?? [],
    });

    return Response.json(task);
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
