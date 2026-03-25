# Design Patterns Guide

Esta guia explica, punto por punto, como se aplican los patrones de diseno dentro de Taskflow y en que flujo real del sistema se activan.

## Vista rapida

| Patron | Problema que resuelve | Implementacion principal | Flujo donde aparece |
| --- | --- | --- | --- |
| `Abstract Factory` | Mantener una familia coherente de tokens visuales por tema | `lib/patterns/abstract-factory/theme-factory.ts` | Bootstrap del layout, `ThemeSingleton`, toggle y configuracion |
| `Singleton` | Tener una unica fuente de verdad compartida | `lib/patterns/singleton/theme-singleton.ts`, `lib/infrastructure/mock/mock-store.ts` | Tema global del cliente y store mock compartido |
| `Builder` | Construir agregados complejos paso a paso | `lib/patterns/builder/*` | Registro, proyectos, tareas, invitaciones, notificaciones |
| `Factory Method` | Delegar la creacion concreta segun el tipo o contexto | `lib/patterns/factory/*` | Tipos de tarea, tablero por defecto, perfiles, invitaciones, notificaciones |
| `Prototype` | Clonar objetos existentes aplicando overrides tecnicos | `lib/patterns/prototype/*` | Clonacion de tareas/subtareas, reenvio de invitaciones, plantillas |
| `Observer` | Desacoplar comandos de notificaciones | `lib/patterns/observer/project-event-publisher.ts` | Eventos de proyecto, tablero, tarea e invitaciones |

## 1. Abstract Factory

### Objetivo en la app

La app necesita producir una familia de artefactos visuales consistente para cada tema resuelto. No basta con cambiar un color suelto: cada tema debe entregar fondo, superficie, borde, tipografia, acento y gradientes de avatar.

### Implementacion

- `lib/patterns/abstract-factory/theme-factory.ts`
  - `ThemeFactory`
  - `LightThemeFactory`
  - `DarkThemeFactory`
  - `createThemeFactory(mode)`
  - `createThemeArtifacts(mode)`
  - `resolveThemeMode(mode, prefersDark)`

### Flujo real

1. El sistema guarda una preferencia `ThemeMode`: `light`, `dark` o `system`.
2. Si la preferencia es `system`, `resolveThemeMode(...)` la convierte en un modo efectivo `light` o `dark`.
3. `createThemeFactory(mode)` selecciona la fabrica concreta.
4. La fabrica concreta crea la `ThemePalette`.
5. `createThemeArtifacts(mode)` transforma esa paleta en variables CSS listas para aplicar.
6. Esas variables se consumen en:
   - `app/layout.tsx`
   - `lib/patterns/singleton/theme-singleton.ts`

### Por que aqui si aplica el patron

No hay una sola variante de objeto. Hay una familia completa de artefactos visuales que cambia junta. Por eso el patron correcto es `Abstract Factory`, no un simple helper con condicionales.

## 2. Singleton

### Objetivo en la app

Hay dos lugares donde una unica instancia compartida tiene sentido:

1. El tema global del cliente.
2. El store mock en memoria.

### Implementacion

- Tema global:
  - `lib/patterns/singleton/theme-singleton.ts`
- Store mock:
  - `lib/infrastructure/mock/mock-store.ts`

### Flujo del tema global

1. `ThemeSingleton.getInstance()` devuelve una unica instancia para toda la app cliente.
2. Esa instancia conserva:
   - modo elegido
   - modo efectivo
   - listeners suscritos
3. `initialize(defaultMode)` lee `localStorage`, el DOM y el tema del sistema.
4. `setMode(nextMode)` actualiza la preferencia y aplica variables CSS al `document`.
5. `subscribe(listener)` permite que header, toggle y configuracion reaccionen al mismo estado.

### Consumidores reales

- `components/taskflow/theme-toggle.tsx`
- `components/taskflow/settings-form.tsx`

### Flujo del mock store

1. `MockTaskflowStore.getInstance()` crea una sola base en memoria.
2. Todas las operaciones mock leen y escriben sobre ese mismo snapshot.
3. Eso evita que cada request mock vea un estado distinto.

### Por que aqui si aplica el patron

Tanto el tema global como el store mock representan estado compartido que debe ser unico dentro del runtime. Multiplicar instancias haria inconsistente la app.

## 3. Builder

### Objetivo en la app

Taskflow construye objetos con varias reglas de normalizacion, validacion y enriquecimiento. Hacer eso con constructores gigantes o `Object.assign` dispersos haria el dominio opaco.

### Builders implementados

- `lib/patterns/builder/user-registration-builder.ts`
- `lib/patterns/builder/project-builder.ts`
- `lib/patterns/builder/task-builder.ts`
- `lib/patterns/builder/task-update-builder.ts`
- `lib/patterns/builder/member-invitation-builder.ts`
- `lib/patterns/builder/project-notification-builder.ts`

### Flujos principales

#### Registro de usuario

1. La ruta de registro delega al servicio de autenticacion.
2. `UserRegistrationBuilder`
   - normaliza nombre y correo
   - valida password y confirmacion
   - produce un objeto consistente antes de persistir
3. Luego una fabrica crea el perfil final del usuario.

Uso real:
- `lib/infrastructure/supabase/supabase-auth-command.ts`
- `lib/infrastructure/mock/mock-store.ts`

#### Creacion de proyecto

1. `ProjectBuilder` normaliza y valida nombre, descripcion, fechas y estado.
2. Construye el agregado `Project`.
3. Luego `BoardFactory` crea el tablero y columnas por defecto.

Uso real:
- `lib/infrastructure/supabase/supabase-project-command.ts`
- `lib/infrastructure/mock/mock-store.ts`

#### Creacion y edicion de tareas

1. `TaskFactory` crea la tarea base segun su tipo.
2. `TaskBuilder` agrega historial, responsables, etiquetas y subtareas.
3. `TaskUpdateBuilder` controla los cambios estructurados al editar.

Uso real:
- `lib/infrastructure/supabase/supabase-task-command.ts`
- `lib/infrastructure/mock/mock-store.ts`

#### Invitaciones y notificaciones

1. La fabrica crea el objeto base.
2. El builder lo mueve al estado final:
   - `pending`
   - `accepted`
   - `revoked`
   - expiracion y mensaje

Uso real:
- `lib/application/invitations/invitation-command-service.ts`
- `lib/infrastructure/supabase/supabase-invitation-command.ts`
- `lib/infrastructure/supabase/supabase-notification-command.ts`

### Por que aqui si aplica el patron

Cada agregado se arma en pasos, con reglas distintas segun el contexto. `Builder` hace visible ese armado y evita constructores monoliticos.

## 4. Factory Method

### Objetivo en la app

La app necesita decidir, en runtime, que clase concreta se encarga de crear un objeto base. El llamador conoce el contexto, pero no la implementacion concreta.

### Fabricas implementadas

- Tareas por tipo: `lib/patterns/factory/task-factory.ts`
- Tablero por defecto: `lib/patterns/factory/board-factory.ts`
- Perfil inicial de usuario: `lib/patterns/factory/user-profile-factory.ts`
- Invitacion por canal: `lib/patterns/factory/invitation-factory.ts`
- Compositor de notificaciones por evento: `lib/patterns/factory/notification-composer-factory.ts`

### Flujos principales

#### Tarea por tipo

1. El servicio recibe `BUG`, `FEATURE`, `TASK` o `IMPROVEMENT`.
2. `createTaskFactory(type)` selecciona una fabrica concreta.
3. La fabrica concreta define defaults como prioridad y tipo base.
4. `TaskBuilder` completa la tarea.

#### Tablero por defecto

1. Al crear proyecto o tablero, `createBoardFactory()` devuelve `DefaultKanbanBoardFactory`.
2. Esa fabrica encapsula:
   - nombre por defecto
   - columnas iniciales
   - WIP limits
   - colores base

#### Perfil inicial de usuario

1. El registro valida la entrada.
2. `createUserProfileFactory()` crea el perfil inicial.
3. Hoy devuelve `DeveloperProfileFactory`, pero el llamador no depende de esa clase concreta.

#### Invitacion por canal

1. La app pide una invitacion por `IN_APP`.
2. `createInvitationFactory(channel)` decide la fabrica concreta.
3. La invitacion base se construye sin exponer al servicio el detalle del canal.

#### Notificaciones por evento

1. Se publica un evento de dominio.
2. `createNotificationComposer(kind)` selecciona el compositor adecuado.
3. Cada compositor produce `title`, `message`, `linkHref` y destinatarios.

### Por que aqui si aplica el patron

La decision cambia segun el tipo de objeto o evento, pero el codigo cliente solo conoce la interfaz o la clase abstracta.

## 5. Prototype

### Objetivo en la app

Cuando una tarea, subtarea, proyecto o invitacion nace a partir de otra, es mas claro clonar una base existente y aplicar overrides que reconstruir todos los campos desde cero.

### Implementacion

- `lib/patterns/prototype/clone.ts`
  - `TaskPrototype`
  - `SubtaskPrototype`
  - `ProjectPrototype`
- `lib/patterns/prototype/invitation-prototype.ts`
  - `InvitationPrototype`

### Flujos principales

#### Clonacion de tareas

1. `TaskCloneService` toma la tarea origen.
2. `TaskPrototype` genera una copia limpia.
3. Se aplican overrides:
   - titulo
   - descripcion
   - fecha
   - columna destino
   - responsables
4. Se limpian artefactos de ejecucion:
   - comentarios
   - adjuntos
   - historial

Uso real:
- `lib/application/tasks/task-clone-service.ts`

#### Clonacion de subtareas

1. Cada subtarea origen se toma como prototipo.
2. `SubtaskPrototype` genera una copia con nuevo `id`.
3. La subtarea clonada pasa a la nueva tarea.

#### Reenvio de invitaciones

1. `InvitationPrototype` clona la invitacion previa.
2. Se refrescan token, fechas y estado.
3. El servicio reenvia sin recomponer todo el objeto manualmente.

#### Plantillas de proyecto en mock

1. `ProjectPrototype` toma un proyecto base.
2. Se crea una variacion usada como plantilla.

### Por que aqui si aplica el patron

El comportamiento de clonacion es parte del dominio. El patron deja claro que la nueva instancia hereda estructura funcional de otra previa.

## 6. Observer

### Objetivo en la app

Los comandos del dominio no deben conocer directamente la infraestructura de notificaciones. Necesitan publicar eventos y dejar que otros reaccionen.

### Implementacion

- Publicador: `lib/patterns/observer/project-event-publisher.ts`
- Suscriptor principal: `lib/application/notifications/project-notification-subscriber.ts`

### Flujo real

1. Un comando ejecuta una accion de dominio:
   - crear proyecto
   - actualizar proyecto
   - crear tablero
   - crear tarea
   - invitar miembro
2. El comando publica un `ProjectNotificationEvent`.
3. `ProjectEventPublisher` recorre sus suscriptores.
4. `ProjectNotificationSubscriber`
   - carga snapshot
   - usa `Factory Method` para seleccionar el compositor
   - usa `Builder` para construir notificaciones persistibles
   - delega al repositorio la persistencia final

### Publicadores reales

- `lib/application/projects/project-command-service.ts`
- `lib/application/boards/board-command-service.ts`
- `lib/application/tasks/task-command-service.ts`
- `lib/application/invitations/invitation-command-service.ts`

### Por que aqui si aplica el patron

El comando conoce el hecho que ocurrio, pero no a sus consumidores. Eso evita acoplar creacion de proyecto con notificaciones, historial u otros side effects.

## Como se combinan entre si

Los patrones no viven aislados. En esta app se encadenan:

### Crear tarea

1. `Factory Method`: elige fabrica concreta por tipo.
2. `Builder`: completa responsables, subtareas e historial.
3. `Observer`: publica evento de tarea creada.
4. `Factory Method` de notificaciones: elige compositor del evento.
5. `Builder` de notificaciones: construye cada registro final.

### Cambiar tema

1. `Abstract Factory`: crea la familia de artefactos del tema efectivo.
2. `Singleton`: mantiene una sola fuente global del tema y la aplica a toda la app.

### Registrar usuario

1. `Builder`: valida y normaliza la entrada.
2. `Factory Method`: crea el perfil inicial concreto.

### Clonar tarea

1. `Prototype`: copia la tarea fuente y sus subtareas.
2. `Builder`: termina de armar la nueva instancia si hace falta.

## Beneficios obtenidos en Taskflow

- Responsabilidades mas pequenas y visibles.
- Menos condicionales gigantes repartidos entre servicios.
- Dominio mas facil de extender sin romper codigo existente.
- UI desacoplada de la forma concreta de crear objetos del negocio.
- Mejor trazabilidad para documentacion, evaluacion y mantenimiento.

## Limites y decisiones conscientes

- No todo se modela con patrones. Se usan solo cuando aportan claridad real.
- Hay rutas y componentes React que siguen siendo funciones simples porque no necesitan un patron.
- `MockTaskflowStore` existe como fallback de desarrollo y demo; el contrato real sigue siendo `IRepositroyFlow`.

## Referencias rapidas de codigo

- Resumen corto: `docs/pattern-traceability.md`
- Arquitectura general: `docs/taskflow-architecture.md`
- Diagrama de clases: `docs/taskflow-class-diagram.puml`
