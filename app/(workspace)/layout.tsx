import { WorkspaceHeader } from "@/components/taskflow/workspace-header";
import { TaskflowService } from "@/lib/application/taskflow-service";

const service = new TaskflowService();

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, settings, primaryProject } = await service.getShellData();
  const boardHref = primaryProject
    ? `/projects/${primaryProject.id}/boards/${primaryProject.boardIds[0]}`
    : "/projects";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_var(--color-bg-accent),_var(--color-bg))]">
      <WorkspaceHeader
        currentUser={currentUser}
        defaultTheme={settings.defaultTheme}
        boardHref={boardHref}
      />
      <main className="mx-auto max-w-[1280px] px-5 py-8 lg:px-8">{children}</main>
    </div>
  );
}
