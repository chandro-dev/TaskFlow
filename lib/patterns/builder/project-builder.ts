import type { CreateProjectInput, Project } from "@/lib/domain/models";

// Pattern traceability: Builder.
// Projects are validated and normalized before becoming a persisted aggregate.
export class ProjectBuilder {
  private readonly draft: CreateProjectInput;

  constructor(input: CreateProjectInput) {
    this.draft = structuredClone(input);
  }

  normalize() {
    this.draft.name = this.draft.name.trim();
    this.draft.description = this.draft.description.trim();
    this.draft.state = this.draft.state ?? "PLANIFICADO";
    return this;
  }

  validate() {
    if (!this.draft.name) {
      throw new Error("El nombre del proyecto es obligatorio.");
    }

    if (!this.draft.description) {
      throw new Error("La descripcion del proyecto es obligatoria.");
    }

    if (!this.draft.startDate || !this.draft.endDate) {
      throw new Error("Las fechas de inicio y fin son obligatorias.");
    }

    if (this.draft.endDate < this.draft.startDate) {
      throw new Error("La fecha de fin no puede ser menor a la fecha de inicio.");
    }

    if (!this.draft.ownerId) {
      throw new Error("No fue posible identificar el propietario del proyecto.");
    }

    return this;
  }

  buildProject(id: string): Project {
    return {
      id,
      name: this.draft.name,
      description: this.draft.description,
      startDate: this.draft.startDate,
      endDate: this.draft.endDate,
      state: this.draft.state ?? "PLANIFICADO",
      archived: false,
      memberIds: [this.draft.ownerId],
      ownerId: this.draft.ownerId,
      boardIds: [],
    };
  }
}
