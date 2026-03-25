import { TaskflowService } from "@/lib/application/taskflow-service";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { requireProjectCoordinatorRouteUser } from "@/lib/api/route-authorization";
import { HttpError } from "@/lib/shared/http-error";

const service = new TaskflowService();

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/members/[memberId]">,
) {
  try {
    const { projectId, memberId } = await context.params;
    const body = (await request.json()) as { memberRole?: string };
    await requireProjectCoordinatorRouteUser(projectId);

    if (body.memberRole !== "PROJECT_MANAGER" && body.memberRole !== "DEVELOPER") {
      throw new HttpError("El rol del proyecto no es valido.", 422);
    }

    const project = await service.updateProjectMemberRole(
      projectId,
      memberId,
      body.memberRole,
    );
    return Response.json({ project });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/projects/[projectId]/members/[memberId]">,
) {
  try {
    const { projectId, memberId } = await context.params;
    await requireProjectCoordinatorRouteUser(projectId);
    const project = await service.removeProjectMember(projectId, memberId);
    return Response.json({ project });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
