import { getAuthenticatedUser } from "@/lib/auth/current-user";
import { UnauthorizedRouteError } from "@/lib/api/route-errors";

export async function requireRouteUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new UnauthorizedRouteError();
  }

  return user;
}
