import { NextResponse } from "next/server";
import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireRouteUser } from "@/lib/api/require-route-user";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const currentUser = await requireRouteUser();
    const existingInvitation = await service.getInvitationByToken(token);

    if (!existingInvitation) {
      return NextResponse.json(
        { error: "Invitacion no encontrada." },
        { status: 404 },
      );
    }

    if (existingInvitation.invitedUserId !== currentUser.id) {
      return NextResponse.json(
        { error: "No puedes aceptar una invitacion asignada a otro usuario." },
        { status: 403 },
      );
    }

    const invitation = await service.acceptInvitation(token);
    return NextResponse.json({ invitation });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
