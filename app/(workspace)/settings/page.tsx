import { requireAuthenticatedUser } from "@/lib/auth/current-user";
import { SettingsForm } from "@/components/taskflow/settings-form";
import { TaskflowService } from "@/lib/application/taskflow-service";
import { formatDateTime, initials, roleLabel } from "@/lib/utils/format";

const service = new TaskflowService();

export default async function SettingsPage() {
  const currentUser = await requireAuthenticatedUser();
  const data = await service.getSettingsPageData();
  const activeUsers = data.users.filter((user) => user.isActive).length;
  const inactiveUsers = data.users.length - activeUsers;
  const adminUsers = data.users.filter((user) => user.role === "ADMIN").length;
  const managerUsers = data.users.filter(
    (user) => user.role === "PROJECT_MANAGER",
  ).length;
  const developerUsers = data.users.filter((user) => user.role === "DEVELOPER").length;
  const canManageSystemSettings = data.currentUser.role === "ADMIN";

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
            Administracion
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-semibold text-[color:var(--color-text-primary)]">
            Configuracion del sistema
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
            Panel para revisar usuarios, parametros globales, limites operativos
            y preferencia visual de la plataforma.
          </p>
        </div>

        <div className="taskflow-panel flex items-center gap-4 px-5 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-surface-muted)] text-sm font-semibold">
            {initials(currentUser.name)}
          </div>
          <div>
            <p className="font-semibold">{currentUser.name}</p>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              {roleLabel(currentUser.role)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SettingsMetric
          label="Plataforma"
          value={data.settings.platformName}
          detail={canManageSystemSettings ? "Modo administrador" : "Vista personal"}
        />
        <SettingsMetric
          label="Usuarios activos"
          value={activeUsers}
          detail={`${inactiveUsers} desactivados`}
        />
        <SettingsMetric
          label="Limite de adjuntos"
          value={`${data.settings.maxAttachmentMb} MB`}
          detail="Aplicado a tareas"
        />
        <SettingsMetric
          label="Tema base"
          value={themeLabel(data.settings.defaultTheme)}
          detail={`Tu tema: ${themeLabel(data.currentUser.themePreference)}`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="taskflow-panel p-6">
          <div className="border-b border-[color:var(--color-border)] pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
              Parametros
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Configuracion general</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">
              {canManageSystemSettings
                ? "Puedes editar parametros globales y tu preferencia de tema."
                : "Puedes ajustar tu tema personal; los parametros globales son solo de lectura."}
            </p>
          </div>

          <div className="mt-6">
            <SettingsForm
              settings={data.settings}
              currentUser={data.currentUser}
            />
          </div>
        </section>

        <section className="taskflow-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
                Accesos
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Usuarios del sistema</h2>
              <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                Revision de cuentas, roles y estado operativo.
              </p>
            </div>
            <div className="taskflow-chip">{data.users.length} usuarios</div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <RoleSummary label="Admins" value={adminUsers} />
            <RoleSummary label="Managers" value={managerUsers} />
            <RoleSummary label="Developers" value={developerUsers} />
          </div>

          <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-[color:var(--color-border)]">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-[color:var(--color-surface-muted)] text-sm text-[color:var(--color-text-secondary)]">
                <tr>
                  <th className="px-4 py-4 font-medium">Usuario</th>
                  <th className="px-4 py-4 font-medium">Rol</th>
                  <th className="px-4 py-4 font-medium">Ultimo acceso</th>
                  <th className="px-4 py-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--color-surface-muted)] text-sm font-semibold">
                          {initials(user.name)}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-[color:var(--color-text-secondary)]">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[color:var(--color-surface-muted)] px-3 py-1 text-sm font-medium">
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-[color:var(--color-text-secondary)]">
                      {formatDateTime(user.lastAccess)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          user.isActive
                            ? "bg-[color:rgba(46,162,111,0.16)] text-[color:var(--color-success)]"
                            : "bg-[color:rgba(217,83,111,0.16)] text-[color:var(--color-danger)]"
                        }`}
                      >
                        {user.isActive ? "Activo" : "Desactivado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="grid gap-5 xl:grid-cols-3">
        <InfoPanel
          title="Politica de contrasenas"
          body={data.settings.passwordPolicy}
        />
        <InfoPanel
          title="Tema y experiencia visual"
          body="La preferencia de tema se sincroniza con el estado global de la aplicacion para mantener consistencia entre vistas."
        />
        <InfoPanel
          title="Permisos"
          body="ADMIN gestiona configuracion global; PROJECT_MANAGER coordina proyectos; DEVELOPER ejecuta tareas y colabora en tableros."
        />
      </section>
    </div>
  );
}

function SettingsMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <section className="taskflow-panel p-5">
      <p className="text-sm text-[color:var(--color-text-secondary)]">{label}</p>
      <div className="mt-2 break-words text-2xl font-semibold">{value}</div>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{detail}</p>
    </section>
  );
}

function RoleSummary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3">
      <p className="text-sm text-[color:var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="taskflow-panel p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--color-text-secondary)]">
        {body}
      </p>
    </section>
  );
}

function themeLabel(theme: string) {
  const labels: Record<string, string> = {
    system: "Sistema",
    light: "Claro",
    dark: "Oscuro",
  };

  return labels[theme] ?? theme;
}
