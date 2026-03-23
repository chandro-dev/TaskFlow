import { TaskflowService } from "@/lib/application/taskflow-service";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };

  try {
    const result = await service.registerUser({
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
      confirmPassword: body.confirmPassword ?? "",
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
