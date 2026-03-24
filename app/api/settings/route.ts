import { TaskflowService } from "@/lib/application/taskflow-service";
import type { ThemeMode } from "@/lib/domain/models";
import { requireRouteUser } from "@/lib/api/require-route-user";
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
    const currentUser = await requireRouteUser();
    const requestedTheme = body.defaultTheme ?? "light";
    await service.updateThemePreference(currentUser.id, requestedTheme);

    if (currentUser.role !== "ADMIN") {
      return Response.json({
        themePreference: requestedTheme,
        updatedScope: "user",
      });
    }

    const settings = await service.updateSettings({
      platformName: body.platformName ?? "",
      maxAttachmentMb: Number(body.maxAttachmentMb ?? 0),
      passwordPolicy: body.passwordPolicy ?? "",
      defaultTheme: requestedTheme,
    });

    return Response.json({
      ...settings,
      themePreference: requestedTheme,
      updatedScope: "system",
    });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
