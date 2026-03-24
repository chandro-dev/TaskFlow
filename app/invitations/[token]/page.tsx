import { notFound } from "next/navigation";
import { InvitationAcceptCard } from "@/components/taskflow/invitation-accept-card";
import { TaskflowService } from "@/lib/application/taskflow-service";
import { requireAuthenticatedUser } from "@/lib/auth/current-user";

const service = new TaskflowService();

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const currentUser = await requireAuthenticatedUser();
  const invitation = await service.getInvitationByToken(token);

  if (!invitation || invitation.invitedUserId !== currentUser.id) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <InvitationAcceptCard invitation={invitation} />
    </main>
  );
}
