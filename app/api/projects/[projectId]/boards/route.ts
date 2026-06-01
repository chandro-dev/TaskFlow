import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectCoordinatorRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import type { BoardColumnDraftInput } from "@/lib/domain/models";

const service = new TaskflowService();

export async function POST(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/boards">,
) {
  const { projectId } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    columns?: BoardColumnDraftInput[];
  };

  try {
    const currentUser = await requireProjectCoordinatorRouteUser(projectId);
    const board = await service.createBoard({
      projectId,
      name: body.name ?? "",
      columns: body.columns ?? [],
    }, currentUser.id);

    return Response.json(board, { status: 201 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
