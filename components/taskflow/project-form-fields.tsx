import type { ProjectState } from "@/lib/domain/models";

export type ProjectFormValues = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  state?: ProjectState;
  archived?: boolean;
};

const projectStates: ProjectState[] = [
  "PLANIFICADO",
  "EN_PROGRESO",
  "PAUSADO",
  "COMPLETADO",
  "ARCHIVADO",
];

type ProjectFormFieldsProps = {
  form: ProjectFormValues;
  onChange: <K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) => void;
  showManagementFields?: boolean;
};

export function ProjectFormFields({
  form,
  onChange,
  showManagementFields = false,
}: ProjectFormFieldsProps) {
  return (
    <>
      <input
        value={form.name}
        onChange={(event) => onChange("name", event.target.value)}
        placeholder="Nombre del proyecto"
        className="taskflow-input"
        required
      />
      <textarea
        value={form.description}
        onChange={(event) => onChange("description", event.target.value)}
        placeholder="Descripcion"
        className="taskflow-input min-h-28 resize-none"
        required
      />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="date"
          value={form.startDate}
          onChange={(event) => onChange("startDate", event.target.value)}
          className="taskflow-input"
          required
        />
        <input
          type="date"
          value={form.endDate}
          onChange={(event) => onChange("endDate", event.target.value)}
          className="taskflow-input"
          required
        />
      </div>

      {showManagementFields ? (
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <select
            value={form.state ?? "PLANIFICADO"}
            onChange={(event) => onChange("state", event.target.value as ProjectState)}
            className="taskflow-input"
          >
            {projectStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.archived)}
              onChange={(event) => onChange("archived", event.target.checked)}
            />
            Marcar como archivado
          </label>
        </div>
      ) : null}
    </>
  );
}
