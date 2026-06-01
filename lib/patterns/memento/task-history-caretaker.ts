import { TaskMemento } from "./task-memento";

/**
 * Caretaker: Gestiona y almacena los Mementos sin acceder a su contenido.
 * Organiza el historial por taskId para soportar undo independiente por tarea.
 */
export class TaskHistoryCaretaker {
  private static instance: TaskHistoryCaretaker;
  // Mapa de taskId -> pila de mementos
  private readonly history: Map<string, TaskMemento[]> = new Map();

  private constructor() {}

  public static getInstance(): TaskHistoryCaretaker {
    if (!TaskHistoryCaretaker.instance) {
      TaskHistoryCaretaker.instance = new TaskHistoryCaretaker();
    }
    return TaskHistoryCaretaker.instance;
  }

  public addSnapshot(taskId: string, memento: TaskMemento): void {
    if (!this.history.has(taskId)) {
      this.history.set(taskId, []);
    }
    this.history.get(taskId)!.push(memento);
  }

  public getLastSnapshot(taskId: string): TaskMemento | null {
    const stack = this.history.get(taskId);
    if (!stack || stack.length === 0) return null;
    return stack[stack.length - 1];
  }

  public popLastSnapshot(taskId: string): TaskMemento | null {
    const stack = this.history.get(taskId);
    if (!stack || stack.length === 0) return null;
    return stack.pop() ?? null;
  }

  public getHistorySize(taskId: string): number {
    return this.history.get(taskId)?.length ?? 0;
  }

  public clearHistory(taskId: string): void {
    this.history.delete(taskId);
  }
}
