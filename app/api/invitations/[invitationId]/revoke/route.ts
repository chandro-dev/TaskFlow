import { TaskflowService } from "@/lib/application/taskflow-service";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { requireRouteUser } from "@/lib/api/require-route-user";

const service = new TaskflowService();

export async function POST(
  _request: Request,
  context: { params: Promise<{ invitationId: string }> },
) {
  try {
    await requireRouteUser();
    const { invitationId } = await context.params;
    const invitation = await service.revokeInvitation(invitationId);
    return Response.json({ invitation });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
