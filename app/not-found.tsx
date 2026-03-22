import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="taskflow-panel max-w-xl p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
          Taskflow
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold">
          La vista solicitada no existe.
        </h1>
        <p className="mt-4 text-base leading-8 text-[color:var(--color-text-secondary)]">
          Revisa el proyecto o tablero seleccionado. La ruta actual no coincide
          con los datos disponibles del workspace.
        </p>
        <Link href="/projects" className="taskflow-button-primary mt-8">
          Volver a proyectos
        </Link>
      </div>
    </main>
  );
}
