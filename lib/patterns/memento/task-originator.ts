import type { TaskFormState } from "@/components/taskflow/task-form-state";
import { TaskMemento } from "./task-memento";

/**
 * Originator: Crea un Memento que contiene una instantánea (snapshot) de su estado interno.
 * También utiliza el Memento para restaurar su estado interno.
 */
export class TaskOriginator {
  private formState: TaskFormState;

  constructor(formState: TaskFormState) {
    this.formState = formState;
  }

  // Permite mutar o actualizar el estado del formulario en memoria (antes de guardar)
  public setFormState(formState: TaskFormState): void {
    this.formState = formState;
  }

  // Devuelve el estado del formulario actual
  public getFormState(): TaskFormState {
    return this.formState;
  }

  // Crea y devuelve el snapshot del estado actual
  public saveToMemento(): TaskMemento {
    return new TaskMemento(this.formState);
  }

  // Restaura el estado interno utilizando el snapshot del Memento
  public restoreFromMemento(memento: TaskMemento): void {
    this.formState = memento.getState();
  }
}
