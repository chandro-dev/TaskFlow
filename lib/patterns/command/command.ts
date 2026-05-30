// Pattern traceability: Command
export interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  getName(): string;
}
