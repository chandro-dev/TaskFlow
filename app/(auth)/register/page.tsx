import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/current-user";
import { RegisterForm } from "@/components/taskflow/register-form";
import { TaskflowLogo } from "@/components/taskflow/logo";
import { TaskflowService } from "@/lib/application/taskflow-service";

const service = new TaskflowService();

export default async function RegisterPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (authenticatedUser) {
    redirect("/projects");
  }

  const { passwordPolicy } = await service.getRegisterData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,86,244,0.11),_transparent_32%),linear-gradient(180deg,_var(--color-bg-accent),_var(--color-bg))] px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <section className="space-y-8">
            <TaskflowLogo withLink={false} subtitle="Registro de nuevos usuarios" />
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
                RF-01 · Gestion de Usuarios
              </p>
              <h1 className="max-w-xl font-[family-name:var(--font-display)] text-5xl font-semibold leading-tight text-[color:var(--color-text-primary)]">
                Crea tu cuenta para trabajar en proyectos y tableros de Taskflow.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
                El modulo de registro valida nombre, correo y contrasena y deja
                preparado el flujo para Supabase Auth o modo demo.
              </p>
            </div>

            <div className="taskflow-panel p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
                Politica de acceso
              </p>
              <p className="mt-4 text-base leading-8 text-[color:var(--color-text-primary)]">
                {passwordPolicy}
              </p>
            </div>
          </section>

          <section className="mx-auto w-full max-w-lg">
            <RegisterForm />
          </section>
        </div>
      </div>
    </main>
  );
}
