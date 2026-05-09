import { TaskflowService } from "@/lib/application/taskflow-service";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { requireProjectMemberRouteUser } from "@/lib/api/route-authorization";

const service = new TaskflowService();

type CloneProjectBody = {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

export async function POST(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/clone">,
) {
  const { projectId } = await context.params;
  const body = (await request.json()) as CloneProjectBody;

  try {
    const currentUser = await requireProjectMemberRouteUser(projectId);
    const result = await service.cloneProject({
      sourceProjectId: projectId,
      actorId: currentUser.id,
      name: body.name ?? "",
      description: body.description ?? "",
      startDate: body.startDate ?? "",
      endDate: body.endDate ?? "",
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
