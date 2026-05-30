import type { Command } from "./command";

// Pattern traceability: Command Invoker / History Manager
export class CommandManager {
  private static instance: CommandManager | null = null;
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxHistory = 20;

  private constructor() {}

  static getInstance(): CommandManager {
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager();
    }
    return CommandManager.instance;
  }

  async executeCommand(command: Command): Promise<void> {
    await command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack when a new action is performed

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  async undo(): Promise<string | null> {
    const command = this.undoStack.pop();
    if (!command) {
      return null;
    }

    await command.undo();
    this.redoStack.push(command);
    return command.getName();
  }

  async redo(): Promise<string | null> {
    const command = this.redoStack.pop();
    if (!command) {
      return null;
    }

    await command.execute();
    this.undoStack.push(command);
    return command.getName();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getHistoryState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      lastUndoName: this.undoStack[this.undoStack.length - 1]?.getName() ?? null,
      lastRedoName: this.redoStack[this.redoStack.length - 1]?.getName() ?? null,
    };
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
