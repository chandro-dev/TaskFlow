import { requireRouteUser } from "@/lib/api/require-route-user";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { CommandManager } from "@/lib/patterns/comportamiento/command/command-manager";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireRouteUser();
    const commandName = await CommandManager.getInstance().undo();
    const state = CommandManager.getInstance().getHistoryState();
    return Response.json({
      success: commandName !== null,
      undoneCommand: commandName,
      ...state,
    });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
