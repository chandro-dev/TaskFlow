# Patrón Command — TaskFlow

## ¿Qué problema resuelve?

Mover una tarea entre columnas es una acción que puede necesitar **deshacerse** (undo) o **rehacerse** (redo). Sin el patrón Command, esa lógica estaría dispersa en el componente de UI, mezclada con llamadas a la API y sin ningún historial.

El patrón Command encapsula cada operación como un **objeto** independiente que sabe cómo ejecutarse y cómo revertirse. El historial de esas operaciones vive en un único lugar (`CommandManager`) separado de la UI.

---

## Participantes

| Rol (GoF) | Clase / Archivo |
|---|---|
| **Command** (interfaz) | [`Command`](../lib/patterns/comportamiento/command/command.ts) |
| **Concrete Command** | [`MoveTaskCommand`](../lib/patterns/comportamiento/command/move-task-command.ts) |
| **Invoker** | [`CommandManager`](../lib/patterns/comportamiento/command/command-manager.ts) |
| **Receiver** | `IRepositroyFlow` → implementación Supabase/Mock |
| **Client** | [`TaskMoveService`](../lib/application/tasks/task-move-service.ts) |
| **UI de historial** | [`UndoRedoBar`](../components/taskflow/undo-redo-bar.tsx) |

---

## Diagrama de flujo

```
Usuario arrastra tarea
        │
        ▼
TaskKanbanBoard.handleDrop()
  └─► persistMove()  ──────────────────────────────────────────────►  PATCH /api/.../move
                                                                              │
                                                                              ▼
                                                                    TaskMoveService.moveTask()
                                                                              │
                                                                    new MoveTaskCommand(repo, input)
                                                                              │
                                                                    CommandManager.executeCommand(cmd)
                                                                      ├─ cmd.execute()   → repository.moveTask()
                                                                      └─ undoStack.push(cmd)
```

---

## La interfaz `Command`

```typescript
// lib/patterns/comportamiento/command/command.ts
export interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  getName(): string;
}
```

Todo comando concreto debe implementar estos tres métodos:
- **`execute()`** — realiza la acción.
- **`undo()`** — revierte la acción.
- **`getName()`** — descripción legible para mostrar en la UI.

---

## Concrete Command: `MoveTaskCommand`

```typescript
// lib/patterns/comportamiento/command/move-task-command.ts
export class MoveTaskCommand implements Command {
  private previousColumnId: string | null = null; // snapshot antes del move
  private taskTitle: string = "";
  public result: Task | null = null;

  async execute(): Promise<void> {
    // 1. Carga el snapshot para capturar el columnId ACTUAL de la tarea.
    //    Esto es crucial: en un redo, el columnId anterior puede haber cambiado.
    const snapshot = await this.repository.loadSnapshot();
    const task = snapshot.tasks.find((t) => t.id === this.input.taskId);

    this.previousColumnId = task.columnId; // guardamos para el undo
    this.taskTitle = task.title;

    // 2. Ejecuta el move en el repositorio (Supabase / Mock)
    this.result = await this.repository.moveTask({ ...this.input });
  }

  async undo(): Promise<void> {
    // Mueve la tarea de vuelta a la columna original
    await this.repository.moveTask({
      ...this.input,
      toColumnId: this.previousColumnId!,
    });
  }

  getName(): string {
    return `Mover tarea "${this.taskTitle}"`;
  }
}
```

> **Nota clave:** `execute()` siempre recarga el snapshot antes de guardar `previousColumnId`. Esto garantiza que en un flujo _execute → undo → redo_, el `redo` tenga el `previousColumnId` correcto y no uno stale del primer `execute`.

---

## Invoker: `CommandManager`

El `CommandManager` es un **Singleton** que mantiene dos pilas:

```
undoStack: [cmd1, cmd2, cmd3]  ← tope = última acción
redoStack: [cmd4]
```

### Ciclo de vida completo

```
executeCommand(cmd)
  └─► cmd.execute()
  └─► undoStack.push(cmd)
  └─► redoStack = []          ← cualquier acción nueva borra el redo

undo()
  └─► cmd = undoStack.pop()
  └─► cmd.undo()
  └─► redoStack.push(cmd)

redo()
  └─► cmd = redoStack.pop()
  └─► cmd.execute()           ← re-ejecuta (recarga snapshot internamente)
  └─► undoStack.push(cmd)
```

### Singleton en Next.js

En Next.js, las rutas API y los Server Components se compilan como módulos separados. Usar `private static instance` hace que cada módulo tenga su propia instancia — el historial se perdería entre llamadas.

La solución es anclar la instancia en `globalThis`, que persiste entre compilaciones y recargas en caliente (HMR):

```typescript
static getInstance(): CommandManager {
  const g = globalThis as any;
  if (!g.commandManagerInstance) {
    g.commandManagerInstance = new CommandManager();
  }
  return g.commandManagerInstance;
}
```

### Límite de historial

Para evitar consumo ilimitado de memoria, el `undoStack` tiene un máximo de **20 entradas**. Cuando se supera, se elimina el comando más antiguo (`undoStack.shift()`).

---

## API REST del historial

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/tasks/history` | Devuelve `{ canUndo, canRedo, lastUndoName, lastRedoName }` |
| `POST` | `/api/tasks/undo` | Ejecuta `CommandManager.undo()` |
| `POST` | `/api/tasks/redo` | Ejecuta `CommandManager.redo()` |
| `DELETE` | `/api/tasks/history` | Llama `CommandManager.clear()` — limpia ambas pilas |

---

## UI: `UndoRedoBar`

El componente [`UndoRedoBar`](../components/taskflow/undo-redo-bar.tsx) hace polling a `GET /api/tasks/history` cada vez que detecta el evento personalizado `taskflow-action` (lanzado después de cada move, undo o redo). Muestra u oculta los botones según `canUndo` / `canRedo`.

---

## Limpieza al salir del board

Cuando el usuario navega fuera de la página del tablero, `TaskKanbanBoard` desmonta y su `useEffect` de cleanup llama `DELETE /api/tasks/history`:

```typescript
// components/taskflow/task-kanban-board.tsx
useEffect(() => {
  return () => {
    // Al desmontar: limpia el historial para que no persista en otras rutas
    fetch("/api/tasks/history", { method: "DELETE" }).catch(() => {});
  };
}, []);
```

Esto garantiza que los botones de undo/redo **solo aparezcan mientras el usuario esté en el board**.

---

## Añadir un nuevo comando

Para agregar una nueva operación con soporte de undo/redo:

1. **Crear** una clase en `lib/patterns/comportamiento/command/` que implemente `Command`.
2. En `execute()`, guardar el snapshot del estado previo.
3. En `undo()`, restaurar ese snapshot a través del repositorio.
4. **Instanciar** el comando en el service correspondiente y pasarlo a `CommandManager.getInstance().executeCommand(cmd)`.

No hay que tocar ni `CommandManager` ni la `UndoRedoBar` — el patrón es abierto para extensión.
