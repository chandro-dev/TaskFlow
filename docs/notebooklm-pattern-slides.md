# Taskflow - Patrones de diseno, clases e interfaces para NotebookLM

Este documento esta preparado para NotebookLM con el fin de generar diapositivas sobre la aplicacion. La idea es que cada seccion pueda convertirse en una o varias slides sin tener que reinterpretar demasiado el codigo.

## 1. Contexto general de la aplicacion

Taskflow es una aplicacion de gestion de proyectos y tareas construida con `Next.js`, `TypeScript` y `Supabase`. Su arquitectura esta separada en capas:

- `domain`
- `application`
- `infrastructure`
- `patterns`
- `app` y `components` como capa de entrega y presentacion

Los patrones de diseno no estan aislados: se conectan con servicios, repositorios, factories, builders, clones y publicadores de eventos.

## 2. Contratos base que sostienen la arquitectura

### Interfaces principales

- `IRepositroyFlow`
  - Archivo: `lib/domain/repositories.ts`
  - Papel: puerto principal entre aplicacion e infraestructura

- `TaskflowAuthProvider`
  - Archivo: `lib/domain/auth-provider.ts`
  - Papel: contrato de autenticacion por password

- `ProjectEventSubscriber`
  - Archivo: `lib/patterns/observer/project-event-publisher.ts`
  - Papel: contrato de observadores para eventos del proyecto

- `ThemeFactory`
  - Archivo: `lib/patterns/abstract-factory/theme-factory.ts`
  - Papel: contrato para crear familias de tema

- `ThemePalette`
  - Archivo: `lib/patterns/abstract-factory/theme-factory.ts`
  - Papel: contrato de paleta visual

- `ThemeArtifacts`
  - Archivo: `lib/patterns/abstract-factory/theme-factory.ts`
  - Papel: contrato de variables CSS y artefactos visuales

- `NotificationComposer`
  - Archivo: `lib/patterns/factory/notification-composer-factory.ts`
  - Papel: contrato para construir notificaciones a partir de eventos

### Clases de fachada o coordinacion

- `TaskflowService`
  - Archivo: `lib/application/taskflow-service.ts`
  - Papel: fachada principal usada por las rutas y paginas

- `SnapshotLoader`
  - Archivo: `lib/application/shared/snapshot-loader.ts`
  - Papel: normaliza snapshots y aplica fallback mock

## 3. Patron Abstract Factory

### Clases e interfaces del patron

- `ThemeFactory` <<interface>>
- `ThemePalette` <<interface>>
- `ThemeArtifacts` <<interface>>
- `LightThemeFactory`
- `DarkThemeFactory`

Archivo principal:
- `lib/patterns/abstract-factory/theme-factory.ts`

### Clases que usan este patron

- `ThemeSingleton`
  - `lib/patterns/singleton/theme-singleton.ts`
- `RootLayout`
  - `app/layout.tsx`

### Flujo tecnico

1. La app recibe una preferencia de tema: `light`, `dark` o `system`.
2. `resolveThemeMode(...)` convierte `system` en un modo efectivo.
3. `createThemeFactory(mode)` selecciona la fabrica concreta.
4. La fabrica concreta construye la paleta.
5. `createThemeArtifacts(mode)` devuelve las variables CSS finales.
6. `ThemeSingleton` aplica esas variables al `document`.

### Mensaje para diapositiva

`Abstract Factory` permite producir una familia completa de artefactos visuales por tema, manteniendo consistencia en toda la interfaz.

## 4. Patron Singleton

### Clases del patron

- `ThemeSingleton`
  - `lib/patterns/singleton/theme-singleton.ts`
- `MockTaskflowStore`
  - `lib/infrastructure/mock/mock-store.ts`

### Clases que lo consumen

- `ThemeToggle`
  - `components/taskflow/theme-toggle.tsx`
- `SettingsForm`
  - `components/taskflow/settings-form.tsx`
- `MockTaskflowRepository`
  - `lib/infrastructure/mock/mock-repository.ts`

### Flujo tecnico del tema

1. `ThemeSingleton.getInstance()` devuelve una unica instancia.
2. Guarda:
   - preferencia seleccionada
   - modo efectivo
   - listeners
3. Escucha cambios del sistema si el tema es `system`.
4. Actualiza el DOM y notifica a los consumidores.

### Flujo tecnico del mock

1. `MockTaskflowStore.getInstance()` crea una base en memoria compartida.
2. `MockTaskflowRepository` delega en esa instancia.
3. Todo el fallback mock observa el mismo snapshot.

### Mensaje para diapositiva

`Singleton` se usa cuando el sistema necesita una fuente de verdad unica y compartida.

## 5. Patron Builder

### Clases del patron

- `UserRegistrationBuilder`
- `ProjectBuilder`
- `TaskBuilder`
- `TaskUpdateBuilder`
- `MemberInvitationBuilder`
- `ProjectNotificationBuilder`

Carpeta:
- `lib/patterns/builder/`

### Clases que consumen estos builders

- `SupabaseAuthCommand`
- `SupabaseProjectCommand`
- `SupabaseTaskCommand`
- `SupabaseInvitationCommand`
- `SupabaseNotificationCommand`
- `MockTaskflowStore`
- `TaskUpdateService`
- `ProjectNotificationSubscriber`

### Flujo tecnico por builder

#### `UserRegistrationBuilder`

- Normaliza nombre y correo
- Valida password y confirmacion
- Prepara la entrada antes de crear el perfil

Consumido por:
- `lib/infrastructure/supabase/supabase-auth-command.ts`
- `lib/infrastructure/mock/mock-store.ts`

#### `ProjectBuilder`

- Valida datos del proyecto
- Prepara el agregado final

Consumido por:
- `lib/infrastructure/supabase/supabase-project-command.ts`
- `lib/infrastructure/mock/mock-store.ts`
- `lib/application/projects/project-command-service.ts`

#### `TaskBuilder`

- Completa la tarea con:
  - historial
  - responsables
  - subtareas
  - etiquetas
  - comentarios

Consumido por:
- `lib/infrastructure/supabase/supabase-task-command.ts`
- `lib/infrastructure/mock/mock-store.ts`

#### `TaskUpdateBuilder`

- Estructura la modificacion de una tarea existente

Consumido por:
- `lib/application/tasks/task-update-service.ts`
- `lib/infrastructure/supabase/supabase-task-command.ts`

#### `MemberInvitationBuilder`

- Ajusta mensaje, expiracion y estado de la invitacion

Consumido por:
- `lib/application/invitations/invitation-command-service.ts`
- `lib/infrastructure/supabase/supabase-invitation-command.ts`
- `lib/infrastructure/mock/mock-store.ts`

#### `ProjectNotificationBuilder`

- Construye la notificacion final persistible

Consumido por:
- `lib/application/notifications/project-notification-subscriber.ts`
- `lib/infrastructure/supabase/supabase-notification-command.ts`
- `lib/infrastructure/mock/mock-store.ts`

### Mensaje para diapositiva

`Builder` se usa para armar objetos complejos en pasos visibles, evitando constructores monoliticos y reglas dispersas.

## 6. Patron Factory Method

### Clases e interfaces del patron

#### Tareas

- `TaskFactory` <<abstract>>
- `BugTaskFactory`
- `FeatureTaskFactory`
- `ImprovementTaskFactory`
- `StandardTaskFactory`

Archivo:
- `lib/patterns/factory/task-factory.ts`

#### Tableros

- `BoardFactory` <<abstract>>
- `DefaultKanbanBoardFactory`
- `BoardFactoryResult` <<interface>>

Archivo:
- `lib/patterns/factory/board-factory.ts`

#### Perfiles de usuario

- `UserProfileFactory` <<abstract>>
- `DeveloperProfileFactory`

Archivo:
- `lib/patterns/factory/user-profile-factory.ts`

#### Invitaciones

- `InvitationFactory` <<abstract>>
- `InAppInvitationFactory`

Archivo:
- `lib/patterns/factory/invitation-factory.ts`

#### Notificaciones

- `NotificationComposer` <<interface>>
- `BaseNotificationComposer` <<abstract>>
- `ProjectCreatedNotificationComposer`
- `ProjectUpdatedNotificationComposer`
- `BoardCreatedNotificationComposer`
- `TaskCreatedNotificationComposer`
- `MemberInvitedNotificationComposer`
- `MemberJoinedNotificationComposer`

Archivo:
- `lib/patterns/factory/notification-composer-factory.ts`

### Clases que consumen estas fabricas

- `SupabaseTaskCommand`
- `MockTaskflowStore`
- `SupabaseProjectCommand`
- `SupabaseAuthCommand`
- `InvitationCommandService`
- `SupabaseInvitationCommand`
- `ProjectNotificationSubscriber`

### Flujo tecnico

1. El llamador conoce el contexto: tipo de tarea, canal de invitacion o evento.
2. Una funcion `create...Factory(...)` selecciona la implementacion concreta.
3. La clase concreta crea el objeto base o compone la salida.
4. El llamador no depende de la clase concreta.

### Mensaje para diapositiva

`Factory Method` encapsula decisiones de creacion que dependen del contexto pero no deben contaminar al servicio llamador.

## 7. Patron Prototype

### Clases del patron

- `TaskPrototype`
- `SubtaskPrototype`
- `ProjectPrototype`
- `InvitationPrototype`

Archivos:
- `lib/patterns/prototype/clone.ts`
- `lib/patterns/prototype/invitation-prototype.ts`

### Clases que consumen este patron

- `TaskCloneService`
- `MockTaskflowStore`
- `SupabaseInvitationCommand`

### Flujo tecnico

#### `TaskPrototype`

- clona una tarea existente
- limpia comentarios, adjuntos e historial
- permite overrides tecnicos

Consumido por:
- `lib/application/tasks/task-clone-service.ts`
- `lib/infrastructure/mock/mock-store.ts`

#### `SubtaskPrototype`

- clona subtareas con nuevos ids

Consumido por:
- `lib/application/tasks/task-clone-service.ts`
- `lib/infrastructure/mock/mock-store.ts`

#### `ProjectPrototype`

- genera plantillas o variaciones de proyectos

Consumido por:
- `lib/infrastructure/mock/seed-data.ts`
- `lib/infrastructure/mock/mock-store.ts`

#### `InvitationPrototype`

- clona invitaciones para reenvio
- refresca token, expiracion y estado

Consumido por:
- `lib/infrastructure/supabase/supabase-invitation-command.ts`
- `lib/infrastructure/mock/mock-store.ts`

### Mensaje para diapositiva

`Prototype` permite crear nuevos objetos a partir de objetos existentes, preservando estructura util y aplicando solo overrides relevantes.

## 8. Patron Observer

### Clases e interfaces del patron

- `ProjectEventSubscriber` <<interface>>
- `ProjectEventPublisher`
- `ProjectNotificationSubscriber`

Archivos:
- `lib/patterns/observer/project-event-publisher.ts`
- `lib/application/notifications/project-notification-subscriber.ts`

### Clases que publican eventos

- `ProjectCommandService`
- `BoardCommandService`
- `TaskCommandService`
- `InvitationCommandService`

### Flujo tecnico

1. Un comando termina una accion de dominio.
2. Publica un `ProjectNotificationEvent`.
3. `ProjectEventPublisher` envia el evento a todos los observadores.
4. `ProjectNotificationSubscriber`:
   - carga snapshot
   - selecciona compositor de notificacion
   - construye registros persistibles
   - persiste notificaciones

### Mensaje para diapositiva

`Observer` desacopla el nucleo del negocio de los efectos secundarios como notificaciones y auditoria.

## 9. Clases de aplicacion que conectan los patrones

### Servicios principales

- `TaskflowService`
- `AuthQueryService`
- `AuthCommandService`
- `SessionCommandService`
- `WorkspaceQueryService`
- `ProjectQueryService`
- `ProjectCommandService`
- `BoardCommandService`
- `TaskCommandService`
- `TaskUpdateService`
- `TaskMoveService`
- `TaskCloneService`
- `InvitationQueryService`
- `InvitationCommandService`
- `InvitationCreationGuard`
- `NotificationQueryService`
- `NotificationCommandService`
- `SettingsCommandService`
- `ThemePreferenceCommandService`
- `SnapshotLoader`

### Idea para diapositiva

Estos servicios son el punto donde los patrones dejan de ser teoria y se convierten en casos de uso reales de la aplicacion.

## 10. Clases de infraestructura donde los patrones aterrizan

### Mock

- `MockTaskflowRepository`
- `MockTaskflowStore`
- `MockAuthProvider`

### Supabase

- `SupabaseTaskflowRepository`
- `SupabaseSnapshotQuery`
- `SupabaseAuthCommand`
- `SupabaseProjectCommand`
- `SupabaseBoardCommand`
- `SupabaseTaskCommand`
- `SupabaseInvitationCommand`
- `SupabaseNotificationCommand`
- `SupabaseSettingsCommand`
- `SupabaseAuthProvider`

### Idea para diapositiva

La infraestructura no define el patron; lo ejecuta. Los patrones viven en el dominio y en la aplicacion, y la infraestructura los materializa sobre Supabase o el mock.

## 11. Como contar esto en diapositivas

### Secuencia recomendada

1. Problema general de la app
2. Arquitectura por capas
3. Tabla resumen de patrones
4. `Abstract Factory` + `Singleton` para tema
5. `Builder` para agregados complejos
6. `Factory Method` para creaciones por contexto
7. `Prototype` para clonacion y reenvio
8. `Observer` para eventos y notificaciones
9. Servicios de aplicacion que integran los patrones
10. Infraestructura `Mock` y `Supabase`
11. Beneficios reales en mantenibilidad y escalabilidad

## 12. Beneficios clave para resaltar

- Separacion de responsabilidades
- Menos acoplamiento entre modulos
- Codigo mas facil de extender
- Mejor trazabilidad para evaluacion academica
- Mayor claridad entre dominio, aplicacion e infraestructura

## 13. Fuentes internas recomendadas

- `docs/design-patterns-guide.md`
- `docs/pattern-traceability.md`
- `docs/taskflow-class-diagram.puml`
- `docs/taskflow-architecture.md`
