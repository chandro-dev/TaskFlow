import { buildRouteErrorResponse } from "@/lib/api/route-errors";
import { requireRouteUser } from "@/lib/api/require-route-user";
import { TaskflowService } from "@/lib/application/taskflow-service";
import type { ReportFormat } from "@/lib/patterns/structural/bridge/report-renderer";

const service = new TaskflowService();

function parseFormat(value: string | null): ReportFormat {
  if (value === "html" || value === "csv" || value === "json") {
    return value;
  }

  return "html";
}

export async function GET(request: Request) {
  try {
    const currentUser = await requireRouteUser();
    const url = new URL(request.url);
    const format = parseFormat(url.searchParams.get("format"));
    const report = await service.renderWorkspaceReport(format, currentUser);

    return new Response(report.content, {
      headers: {
        "Content-Type": report.contentType,
        "Content-Disposition": `attachment; filename="${report.filename}"`,
      },
    });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
