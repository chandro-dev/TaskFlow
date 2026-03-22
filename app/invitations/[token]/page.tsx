import { notFound } from "next/navigation";
import { InvitationAcceptCard } from "@/components/taskflow/invitation-accept-card";
import { TaskflowService } from "@/lib/application/taskflow-service";

const service = new TaskflowService();

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await service.getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <InvitationAcceptCard invitation={invitation} />
    </main>
  );
}
