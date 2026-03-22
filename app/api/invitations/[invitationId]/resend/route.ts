import { NextResponse } from "next/server";
import { TaskflowService } from "@/lib/application/taskflow-service";

const service = new TaskflowService();

export async function POST(
  _request: Request,
  context: { params: Promise<{ invitationId: string }> },
) {
  const { invitationId } = await context.params;
  const invitation = await service.resendInvitation(invitationId);
  return NextResponse.json({ invitation });
}
