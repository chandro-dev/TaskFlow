import { HttpError } from "@/lib/shared/http-error";

export class UnauthorizedRouteError extends HttpError {
  constructor(message = "Debes iniciar sesion para continuar.") {
    super(message, 401);
  }
}

export function buildRouteErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 422 });
  }

  return Response.json(
    { error: "Ocurrio un error inesperado al procesar la solicitud." },
    { status: 500 },
  );
}
