import { requireRouteUser } from "@/lib/api/require-route-user";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { CommandManager } from "@/lib/patterns/comportamiento/command/command-manager";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRouteUser();
    const state = CommandManager.getInstance().getHistoryState();
    return Response.json(state);
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    await requireRouteUser();
    CommandManager.getInstance().clear();
    const state = CommandManager.getInstance().getHistoryState();
    return Response.json(state);
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
