import { clearSession } from "@/lib/auth/session-cookie";

export async function POST() {
  await clearSession();
  return Response.json({ success: true });
}
