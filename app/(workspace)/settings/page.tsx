import { requireAuthenticatedUser } from "@/lib/auth/current-user";
import { SettingsForm } from "@/components/taskflow/settings-form";
import { TaskflowService } from "@/lib/application/taskflow-service";
import { formatDateTime, roleLabel } from "@/lib/utils/format";

const service = new TaskflowService();

export default async function SettingsPage() {
  const currentUser = await requireAuthenticatedUser();
  const data = await service.getSettingsPageData();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
          Administración
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-semibold text-[color:var(--color-text-primary)]">
          Configuración del sistema
        </h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
          RF-09 cubierto con gestión de usuarios, parámetros globales y soporte
          de temas visuales claro/oscuro desde una capa preparada para Supabase.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="taskflow-panel p-6">
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Nombre de plataforma
          </p>
          <div className="mt-3 text-3xl font-semibold">{data.settings.platformName}</div>
        </section>
        <section className="taskflow-panel p-6">
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Límite de adjuntos
          </p>
          <div className="mt-3 text-3xl font-semibold">
            {data.settings.maxAttachmentMb} MB
          </div>
        </section>
        <section className="taskflow-panel p-6">
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Tema predeterminado
          </p>
          <div className="mt-3 text-3xl font-semibold capitalize">
            {data.settings.defaultTheme}
          </div>
        </section>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="taskflow-panel p-6">
          <h2 className="text-2xl font-semibold">Parámetros globales</h2>
          <div className="mt-6 space-y-5">
            <SettingsForm
              settings={data.settings}
              currentUser={data.currentUser}
            />
            <div>
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                Política de contraseñas
              </p>
              <p className="mt-2 text-base leading-7">
                {data.settings.passwordPolicy}
              </p>
            </div>
            <div>
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                Tema y experiencia visual
              </p>
              <p className="mt-2 text-base leading-7">
                La aplicación implementa modo claro y oscuro con una Abstract
                Factory que centraliza tokens visuales y mantiene consistencia
                entre vistas.
              </p>
            </div>
            <div>
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                Permisos
              </p>
              <p className="mt-2 text-base leading-7">
                Los roles `ADMIN`, `PROJECT_MANAGER` y `DEVELOPER` separan la
                gestión global, el control de proyectos y la ejecución diaria.
              </p>
            </div>
          </div>
        </section>

        <section className="taskflow-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Usuarios del sistema</h2>
              <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                Crear, editar y desactivar cuentas desde el panel administrativo.
              </p>
            </div>
            <div className="taskflow-chip">{currentUser.role}</div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[color:var(--color-border)]">
            <table className="w-full text-left">
              <thead className="bg-[color:var(--color-surface-muted)] text-sm text-[color:var(--color-text-secondary)]">
                <tr>
                  <th className="px-4 py-4 font-medium">Usuario</th>
                  <th className="px-4 py-4 font-medium">Rol</th>
                  <th className="px-4 py-4 font-medium">Último acceso</th>
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
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-[color:var(--color-text-secondary)]">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">{roleLabel(user.role)}</td>
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
    </div>
  );
}
