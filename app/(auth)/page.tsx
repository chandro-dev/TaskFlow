import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth/current-user";
import { LoginForm } from "@/components/taskflow/login-form";
import { TaskflowLogo } from "@/components/taskflow/logo";
import { TaskflowService } from "@/lib/application/taskflow-service";

const service = new TaskflowService();

function readParam(value: string | string[] | undefined, fallback = "") {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const authenticatedUser = await getAuthenticatedUser();

  if (authenticatedUser) {
    redirect("/projects");
  }

  const params = await searchParams;
  const { suggestedUser, usesSupabaseAuth } = await service.getLoginData();
  const registeredMessage = readParam(params.registered);
  const emailHint = readParam(params.email, suggestedUser?.email ?? "");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,86,244,0.11),_transparent_32%),linear-gradient(180deg,_var(--color-bg-accent),_var(--color-bg))] px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-8">
            <TaskflowLogo withLink={false} subtitle="Tu gestor de tareas inteligente" />
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
                Plataforma de Gestion de Tareas
              </p>
              <h1 className="max-w-xl font-[family-name:var(--font-display)] text-5xl font-semibold leading-tight text-[color:var(--color-text-primary)]">
                Arquitectura solida para usuarios, proyectos y tableros Kanban.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
                Esta version prioriza los RF de autenticacion, proyectos, tableros,
                tareas, busqueda y configuracion administrativa usando Next 16,
                TypeScript y una base preparada para Supabase.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="taskflow-panel p-5">
                <div className="text-3xl font-semibold text-[color:var(--color-accent)]">
                  3
                </div>
                <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                  Roles soportados: Admin, PM y Developer.
                </p>
              </div>
              <div className="taskflow-panel p-5">
                <div className="text-3xl font-semibold text-[color:var(--color-accent)]">
                  5
                </div>
                <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                  Patrones creacionales aplicados en la solucion.
                </p>
              </div>
              <div className="taskflow-panel p-5">
                <div className="text-3xl font-semibold text-[color:var(--color-accent)]">
                  10MB
                </div>
                <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                  Limite configurado para adjuntos por archivo.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-lg">
            {registeredMessage ? (
              <div className="mb-4 rounded-2xl bg-[color:rgba(46,162,111,0.12)] px-4 py-3 text-sm text-[color:var(--color-success)]">
                {registeredMessage}
              </div>
            ) : null}

            <div className="mb-6 text-center">
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                {usesSupabaseAuth
                  ? "Usa una cuenta registrada en Supabase Auth y confirma tu correo antes de ingresar."
                  : `Acceso de demostracion sugerido: ${emailHint}`}
              </p>
            </div>

            <LoginForm emailHint={emailHint} usesSupabaseAuth={usesSupabaseAuth} />

            <p className="mt-6 text-center text-sm text-[color:var(--color-text-secondary)]">
              ¿No tienes una cuenta?{" "}
              <Link
                href="/register"
                className="font-semibold text-[color:var(--color-text-primary)]"
              >
                Registrate ahora
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
