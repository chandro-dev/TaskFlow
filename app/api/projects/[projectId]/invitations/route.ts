import type { UserRole } from "@/lib/domain/models";
import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectCoordinatorRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

function parseRole(value: string): UserRole {
  if (value === "ADMIN" || value === "PROJECT_MANAGER" || value === "DEVELOPER") {
    return value;
  }

  return "DEVELOPER";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;
  const body = (await request.json()) as {
    userIds?: string[];
    role?: string;
    message?: string;
  };

  const userIds = (body.userIds ?? []).map((userId) => userId.trim());

  if (!userIds.length) {
    return Response.json(
      { error: "Debes seleccionar al menos una persona interna." },
      { status: 422 },
    );
  }

  try {
    const currentUser = await requireProjectCoordinatorRouteUser(projectId);
    const invitations = await service.createInvitations({
      projectId,
      invitedUserIds: userIds,
      role: parseRole(body.role ?? "DEVELOPER"),
      invitedBy: currentUser.id,
      message: body.message?.trim(),
    });

    return Response.json({ invitations }, { status: 201 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
