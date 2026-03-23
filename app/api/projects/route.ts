import { TaskflowService } from "@/lib/application/taskflow-service";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { requireRouteUser } from "@/lib/api/require-route-user";

const service = new TaskflowService();

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  };

  try {
    const currentUser = await requireRouteUser();
    const result = await service.createProject({
      name: body.name ?? "",
      description: body.description ?? "",
      startDate: body.startDate ?? "",
      endDate: body.endDate ?? "",
    }, currentUser.id);

    return Response.json(result, { status: 201 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
