import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/domain/models";
import { TaskflowService } from "@/lib/application/taskflow-service";

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
    role?: string;
    message?: string;
  };

  if (!body.email?.trim()) {
    return NextResponse.json(
      { error: "El correo es obligatorio." },
      { status: 400 },
    );
  }

  const invitation = await service.createInvitation({
    projectId,
    email: body.email.trim().toLowerCase(),
    role: parseRole(body.role ?? "DEVELOPER"),
    invitedBy: "user-admin",
    message: body.message?.trim(),
  });

  return NextResponse.json({ invitation }, { status: 201 });
}
