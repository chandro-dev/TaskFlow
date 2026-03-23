import type { UserRole } from "@/lib/domain/models";
import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireProjectMemberRouteUser } from "@/lib/api/route-authorization";
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
    email?: string;
    emails?: string[];
    role?: string;
    message?: string;
  };

  const emails = [
    ...(body.email?.trim() ? [body.email.trim().toLowerCase()] : []),
    ...((body.emails ?? []).map((email) => email.trim().toLowerCase())),
  ];

  if (!emails.length) {
    return Response.json(
      { error: "Debes indicar al menos un correo." },
      { status: 422 },
    );
  }

  try {
    const currentUser = await requireProjectMemberRouteUser(projectId);
    const invitations = await service.createInvitations({
      projectId,
      emails,
      role: parseRole(body.role ?? "DEVELOPER"),
      invitedBy: currentUser.id,
      message: body.message?.trim(),
    });

    return Response.json({ invitations }, { status: 201 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
