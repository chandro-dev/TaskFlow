import { TaskflowService } from "@/lib/application/taskflow-service";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { requireRouteUser } from "@/lib/api/require-route-user";

const service = new TaskflowService();

export async function POST() {
  try {
    const currentUser = await requireRouteUser();
    await service.markAllNotificationsRead(currentUser.id);
    return Response.json({ success: true });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
