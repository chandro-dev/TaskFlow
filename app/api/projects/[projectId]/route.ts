import { TaskflowService } from "@/lib/application/taskflow-service";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { requireProjectManagerRouteUser } from "@/lib/api/route-authorization";

const service = new TaskflowService();

type ProjectMutationBody = {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  state?: "PLANIFICADO" | "EN_PROGRESO" | "PAUSADO" | "COMPLETADO" | "ARCHIVADO";
  archived?: boolean;
};

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]">,
) {
  const { projectId } = await context.params;
  const body = (await request.json()) as ProjectMutationBody;

  try {
    const currentUser = await requireProjectManagerRouteUser(projectId);
    const project = await service.updateProject({
      projectId,
      name: body.name ?? "",
      description: body.description ?? "",
      startDate: body.startDate ?? "",
      endDate: body.endDate ?? "",
      state: body.state ?? "PLANIFICADO",
      archived: body.archived ?? false,
    }, currentUser.id);

    return Response.json({ project });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/projects/[projectId]">,
) {
  const { projectId } = await context.params;

  try {
    await requireProjectManagerRouteUser(projectId);
    await service.deleteProject(projectId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
