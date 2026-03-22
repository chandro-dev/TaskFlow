import { NextResponse } from "next/server";
import { TaskflowService } from "@/lib/application/taskflow-service";

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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible completar el registro.",
      },
      { status: 400 },
    );
  }
}
