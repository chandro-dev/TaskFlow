import { requireAuthenticatedUser } from "@/lib/auth/current-user";
import { WorkspaceHeader } from "@/components/taskflow/workspace-header";
import { TaskflowService } from "@/lib/application/taskflow-service";

const service = new TaskflowService();

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireAuthenticatedUser();
  const { settings } = await service.getShellData();
  const notificationCenter = await service.getNotificationCenter(currentUser);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_var(--color-bg-accent),_var(--color-bg))]">
      <WorkspaceHeader
        currentUser={currentUser}
        defaultTheme={settings.defaultTheme}
        boardHref="/boards"
        notificationCenter={notificationCenter}
      />
      <main className="mx-auto max-w-[1280px] px-5 py-8 lg:px-8">{children}</main>
    </div>
  );
}
