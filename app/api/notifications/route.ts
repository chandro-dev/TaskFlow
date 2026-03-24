import { TaskflowService } from "@/lib/application/taskflow-service";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { requireRouteUser } from "@/lib/api/require-route-user";

const service = new TaskflowService();

export async function GET() {
  try {
    const currentUser = await requireRouteUser();
    const notificationCenter = await service.getNotificationCenter(currentUser);
    return Response.json(notificationCenter);
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
