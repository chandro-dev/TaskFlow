import { NextResponse } from "next/server";
import { TaskflowService } from "@/lib/application/taskflow-service";

const service = new TaskflowService();

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const invitation = await service.acceptInvitation(token);

  if (!invitation) {
    return NextResponse.json(
      { error: "Invitacion no encontrada." },
      { status: 404 },
    );
  }

  return NextResponse.json({ invitation });
}
