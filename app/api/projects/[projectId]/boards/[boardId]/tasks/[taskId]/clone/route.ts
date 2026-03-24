import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectMemberRouteUser } from "@/lib/api/route-authorization";
import type { BoardTaskView } from "@/lib/domain/models";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

type CloneTaskRequestBody = Partial<
  Pick<
    BoardTaskView,
    "title" | "description" | "dueDate" | "estimateHours" | "assigneeIds" | "columnId"
  >
> & {
  subtaskIds?: string[];
  resetCompletedSubtasks?: boolean;
};

export async function POST(
  request: Request,
  context: RouteContext<
    "/api/projects/[projectId]/boards/[boardId]/tasks/[taskId]/clone"
  >,
) {
  const { projectId, boardId, taskId } = await context.params;
  const body = (await request.json()) as CloneTaskRequestBody;

  try {
    const currentUser = await requireProjectMemberRouteUser(projectId);
    const source = await service.getBoardPageData(projectId, boardId, {});
    const sourceTask = source?.columns.flatMap((column) => column.tasks).find((task) => task.id === taskId);

    if (!sourceTask) {
      return Response.json({ error: "Tarea origen no encontrada." }, { status: 404 });
    }

    const task = await service.cloneTask({
      sourceTaskId: taskId,
      projectId,
      boardId,
      actorId: currentUser.id,
      title: body.title ?? `${sourceTask.title} - copia`,
      description: body.description ?? sourceTask.description,
      priority: sourceTask.priority,
      type: sourceTask.type,
      dueDate: body.dueDate ?? sourceTask.dueDate,
      estimateHours: Number(body.estimateHours ?? sourceTask.estimateHours),
      assigneeIds: body.assigneeIds ?? sourceTask.assigneeIds,
      columnId: body.columnId ?? sourceTask.columnId,
      subtaskIds: body.subtaskIds ?? sourceTask.subtasks.map((subtask) => subtask.id),
      resetCompletedSubtasks: body.resetCompletedSubtasks ?? true,
    });

    return Response.json(task, { status: 201 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
