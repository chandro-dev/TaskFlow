import { TaskflowService } from "@/lib/application/taskflow-service";
import { createSession } from "@/lib/auth/session-cookie";
import { buildRouteErrorResponse } from "@/lib/api/route-errors";

const service = new TaskflowService();

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };
  console.log("Login request body:", body);
  try {
    const result = await service.login({
      email: body.email ?? "",
      password: body.password ?? "",
    });

    await createSession({
      userId: result.user.id,
      email: result.user.email,
      accessToken: result.accessToken,
    });

    return Response.json({ user: result.user });
  } catch (error) {
    return buildRouteErrorResponse(error);
  }
}
