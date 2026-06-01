import { TaskflowService } from "@/lib/application/taskflow-service";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { requireRouteUser } from "@/lib/api/require-route-user";

const service = new TaskflowService();

export async function PATCH(
  _request: Request,
  context: RouteContext<"/api/notifications/[notificationId]/read">,
) {
  const { notificationId } = await context.params;

  try {
    const currentUser = await requireRouteUser();
    const notification = await service.markNotificationRead(
      notificationId,
      currentUser.id,
    );

    return Response.json({ notification });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
