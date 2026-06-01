import type { RegisterUserInput } from "@/lib/domain/models";

// Pattern traceability: Builder.
// Registration needs normalization plus validation before persistence, so the
// builder turns raw form input into a safe domain-ready payload.
export class UserRegistrationBuilder {
  private readonly draft: RegisterUserInput;

  constructor(input: RegisterUserInput) {
    this.draft = structuredClone(input);
  }

  normalize() {
    this.draft.name = this.draft.name.trim();
    this.draft.email = this.draft.email.trim().toLowerCase();
    return this;
  }

  validate() {
    if (!this.draft.name) {
      throw new Error("El nombre es obligatorio.");
    }

    if (!this.draft.email || !this.draft.email.includes("@")) {
      throw new Error("Correo electronico invalido.");
    }

    if (this.draft.password.length < 10) {
      throw new Error("La contrasena debe tener al menos 10 caracteres.");
    }

    if (this.draft.password !== this.draft.confirmPassword) {
      throw new Error("Las contrasenas no coinciden.");
    }

    return this;
  }

  build() {
    return structuredClone(this.draft);
  }
}
