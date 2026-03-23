import { TaskflowService } from "@/lib/application/taskflow-service";
import type { ThemeMode } from "@/lib/domain/models";
import { requireAdminRouteUser } from "@/lib/api/route-authorization";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    platformName?: string;
    maxAttachmentMb?: number;
    passwordPolicy?: string;
    defaultTheme?: ThemeMode;
  };

  try {
    await requireAdminRouteUser();
    const settings = await service.updateSettings({
      platformName: body.platformName ?? "",
      maxAttachmentMb: Number(body.maxAttachmentMb ?? 0),
      passwordPolicy: body.passwordPolicy ?? "",
      defaultTheme: body.defaultTheme ?? "light",
    });

    return Response.json(settings);
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
