# Referencia de Clases por Patrones de Diseno

Este documento resume las clases, interfaces y tipos mas importantes que evidencian patrones de diseno en Taskflow.

Objetivo:

- servir como guion tecnico para la sustentacion,
- dejar claro que clase implementa el patron y que clase solo participa en el flujo,
- enlazar con el anexo exhaustivo y el PlantUML completo.

## Alcance

- Se documentan clases, interfaces y `abstract class` del dominio, aplicacion, infraestructura y `lib/patterns/*`.
- Tambien se listan tipos auxiliares y funciones activadoras cuando son relevantes para explicar el patron.
- No se incluyen componentes React funcionales ni `route.ts` porque no son clases UML.

## 1. Singleton

### `ThemeSingleton`

- Archivo: `lib/patterns/singleton/theme-singleton.ts`
- Rol: unica instancia compartida del tema en cliente.
- Evidencia:
  - expone `getInstance()`
  - concentra el estado global de tema
  - evita multiples fuentes de verdad para CSS variables

### `MockTaskflowStore`

- Archivo: `lib/infrastructure/mock/mock-store.ts`
- Rol: store unico en memoria para fallback mock.
- Evidencia:
  - expone `getInstance()`
  - comparte un snapshot unico entre operaciones mock

## 2. Abstract Factory

### Implementacion directa

- `ThemeFactory`
- `ThemePalette`
- `ThemeArtifacts`
- `LightThemeFactory`
- `DarkThemeFactory`

- Archivo: `lib/patterns/abstract-factory/theme-factory.ts`
- Rol del patron:
  - `ThemeFactory` define la familia visual
  - `LightThemeFactory` y `DarkThemeFactory` crean variantes coherentes
  - `ThemePalette` y `ThemeArtifacts` son los productos abstractos

### Colaboradora principal

- `ThemeSingleton`
- Rol: consume la familia visual resultante a traves de las funciones helper del modulo.

## 3. Builder

### Builders del proyecto

- `UserRegistrationBuilder`
- `ProjectBuilder`
- `TaskBuilder`
- `TaskUpdateBuilder`
- `MemberInvitationBuilder`
- `ProjectNotificationBuilder`

- Carpeta: `lib/patterns/builder/`
- Rol: construir objetos complejos normalizados y validos sin mutacion dispersa.

### Donde se usan de forma directa

- `SupabaseAuthCommand`
- `SupabaseProjectCommand`
- `SupabaseTaskCommand`
- `SupabaseInvitationCommand`
- `SupabaseNotificationCommand`
- `MockTaskflowStore`
- `ProjectCloneService`
- `TaskUpdateService`

## 4. Factory Method

### Familias concretas

- Tareas:
  - `TaskFactory`
  - `BugTaskFactory`
  - `FeatureTaskFactory`
  - `ImprovementTaskFactory`
  - `StandardTaskFactory`
- Tableros:
  - `BoardFactory`
  - `DefaultKanbanBoardFactory`
  - `BoardFactoryResult`
- Perfiles:
  - `UserProfileFactory`
  - `DeveloperProfileFactory`
- Invitaciones:
  - `InvitationFactory`
  - `InAppInvitationFactory`
- Notificaciones:
  - `NotificationComposer`
  - `BaseNotificationComposer`
  - `ProjectCreatedNotificationComposer`
  - `ProjectUpdatedNotificationComposer`
  - `BoardCreatedNotificationComposer`
  - `TaskCreatedNotificationComposer`
  - `MemberInvitedNotificationComposer`
  - `MemberJoinedNotificationComposer`

### Tipos de soporte del flujo

- `TaskFactoryInput`
- `InvitationSeed`
- `UserProfile`

### Donde se usan de forma directa

- `SupabaseAuthCommand`
- `SupabaseProjectCommand`
- `SupabaseBoardCommand`
- `SupabaseTaskCommand`
- `SupabaseInvitationCommand`
- `ProjectNotificationSubscriber`
- `MockTaskflowStore`

### Activadores indirectos del flujo

- `AuthCommandService`
- `BoardCommandService`
- `TaskCommandService`
- `InvitationCommandService`

Estas clases no importan las factorias concretas, pero activan el caso de uso que termina en ellas a traves del puerto `IRepositroyFlow`.

## 5. Prototype

### Implementacion directa

- `TaskPrototype`
- `SubtaskPrototype`
- `ProjectPrototype`
- `BoardPrototype`
- `BoardColumnPrototype`
- `InvitationPrototype`

### Donde se usan de forma directa

- `ProjectCloneService`
- `TaskCloneService`
- `MockTaskflowStore`
- `SupabaseInvitationCommand`

### Aclaracion importante

- `MockTaskflowStore` usa prototypes para tareas, subtareas e invitaciones.
- El clonado de proyectos en mock hoy se hace con copia manual, no con `ProjectPrototype`.

## 6. Observer

### Implementacion directa

- `ProjectEventSubscriber`
- `ProjectEventPublisher`
- `ProjectNotificationSubscriber`

### Publicadores reales de eventos

- `ProjectCommandService`
- `ProjectCloneService`
- `BoardCommandService`
- `InvitationCommandService`

### Tipos de soporte del flujo

- `ProjectNotificationEvent`
- `CreateProjectNotificationInput`

### Aclaracion importante

- `TaskCommandService` publica `TASK_CREATED` despues de crear la tarea.
- `ProjectNotificationSubscriber` es el observador concreto y usa un adapter para transformar eventos de dominio en entradas persistibles de notificacion.

## 7. Facade

### Implementacion directa

- `TaskflowService`

### Rol del patron

- Archivo: `lib/application/taskflow-service.ts`
- Rol: fachada principal para paginas y rutas API.
- Evidencia:
  - expone metodos de alto nivel como `createProject`, `createTask`, `getBoardPageData`, `getWorkspaceReport`, `renderWorkspaceReport`, `login` y `acceptInvitation`
  - oculta la creacion de repositorio y servicios internos
  - mantiene rutas y componentes desacoplados de la orquestacion interna

## 8. Composite

### Implementacion directa

- `WorkItemComponent`
- `SubtaskLeaf`
- `TaskComposite`
- `createTaskWorkComposite`

### Rol del patron

- Archivo: `lib/patterns/structural/composite/task-work-item.ts`
- Rol: representar tarea y subtareas como una estructura jerarquica con operaciones comunes.
- Evidencia:
  - `TaskComposite.progress()` calcula avance con base en sus hijos
  - `SubtaskLeaf` representa el nodo hoja
  - la UI consume el resultado sin conocer el detalle del calculo

## 9. Decorator

### Implementacion directa

- `BoardTaskDecorator`
- `decorateBoardTask`

### Rol del patron

- Archivo: `lib/patterns/structural/decorator/board-task-decorator.ts`
- Rol: enriquecer `Task` con datos visuales y calculados para el tablero.
- Evidencia:
  - agrega `assignees`
  - agrega `isOverdue`
  - agrega `subtaskProgress`
  - mantiene intacta la identidad de la tarea base

## 10. Proxy

### Implementacion directa

- `RouteAuthorizationProxy`

### Rol del patron

- Archivo: `lib/patterns/structural/proxy/route-authorization-proxy.ts`
- Rol: validar acceso antes de ejecutar operaciones sensibles.
- Evidencia:
  - `requireAdmin`
  - `requireProjectMember`
  - `requireProjectManager`
  - `requireProjectCoordinator`
  - se integra desde `lib/api/route-authorization.ts`

## 11. Adapter

### Implementacion directa

- `NotificationEventAdapter`
- `SupabaseTaskflowRepository`
- `MockTaskflowRepository`

### Rol del patron

- Archivos:
  - `lib/patterns/structural/adapter/notification-event-adapter.ts`
  - `lib/infrastructure/supabase/supabase-repository.ts`
  - `lib/infrastructure/mock/mock-repository.ts`
- Rol: traducir contratos y eventos del dominio hacia infraestructura concreta.
- Evidencia:
  - `NotificationEventAdapter` convierte `ProjectNotificationEvent` en `CreateProjectNotificationInput`
  - los repositorios implementan el puerto `IRepositroyFlow`
  - la aplicacion no depende directamente del SDK de Supabase

## 12. Bridge

### Implementacion directa

- `ReportQueryService`
- `ReportRenderer`
- `HtmlReportRenderer`
- `CsvReportRenderer`
- `JsonReportRenderer`

### Rol del patron

- Archivos:
  - `lib/application/reports/report-query-service.ts`
  - `lib/patterns/structural/bridge/report-renderer.ts`
- Rol: separar la abstraccion del reporte de sus formatos de salida.
- Evidencia:
  - `ReportQueryService` construye el documento base
  - `createReportRenderer(format)` selecciona el implementador
  - `/reports` y `/api/reports` reutilizan el mismo caso de uso

## 13. Clases de Aplicacion que unen los patrones

- `TaskflowService`: fachada principal.
- `SnapshotLoader`: carga snapshots desacoplados del repositorio.
- `AuthQueryService`, `AuthCommandService`, `SessionCommandService`
- `ProjectQueryService`, `ProjectCommandService`, `ProjectCloneService`
- `BoardCommandService`
- `TaskCommandService`, `TaskUpdateService`, `TaskMoveService`, `TaskDeleteService`, `TaskCloneService`
- `InvitationQueryService`, `InvitationCommandService`, `InvitationCreationGuard`
- `NotificationQueryService`, `NotificationCommandService`, `ProjectNotificationSubscriber`
- `WorkspaceQueryService`
- `SettingsCommandService`, `ThemePreferenceCommandService`

Estas clases no siempre implementan un patron GoF por si solas, pero muestran como se orquesta el uso profesional de patrones con SRP, DIP y separacion por capas.

## 14. Clases de Infraestructura que materializan los patrones

- `MockTaskflowRepository`
- `MockTaskflowStore`
- `MockAuthProvider`
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

## 15. Contratos y entidades clave para UML

### Contratos

- `IRepositroyFlow`
- `TaskflowAuthProvider`

### Politicas y entidades del flujo

- `ProjectAccessPolicy`
- `UserProfile`
- `Project`
- `Board`
- `BoardColumn`
- `Task`
- `Subtask`
- `MemberInvitation`
- `ProjectNotification`
- `TaskflowSnapshot`

## 16. Funciones activadoras no UML puro

Estas funciones no son clases, pero conviene nombrarlas en la exposicion porque disparan el patron real:

- `createThemeFactory()`
- `createThemeArtifacts()`
- `createTaskFactory()`
- `createBoardFactory()`
- `getDefaultBoardColumnDrafts()`
- `createUserProfileFactory()`
- `createInvitationFactory()`
- `createNotificationComposer()`
- `createAuthProvider()`
- `createApplicationServices()`
- `createTaskflowRepository()`
- `createTaskWorkComposite()`
- `decorateBoardTask()`
- `createReportRenderer()`

## 17. Archivos recomendados para exponer

- Mapa formal de patrones: `docs/pattern-map.md`
- Diagrama completo enfocado en patrones: `docs/taskflow-patterns-complete-diagram.puml`
- Diagrama unico consolidado: `docs/taskflow-all-in-one-diagram.puml`
- Anexo exhaustivo de participantes: `docs/pattern-participants-annex.md`
- Guia de soporte: `docs/design-patterns-guide.md`

## 18. Miembros UML clave

El anexo exhaustivo ya incluye los atributos y metodos mas relevantes de las clases principales:

- `ThemeSingleton`
- `MockTaskflowStore`
- `ProjectBuilder`
- `TaskBuilder`
- `TaskUpdateBuilder`
- `MemberInvitationBuilder`
- `ProjectNotificationBuilder`
- `TaskFactory`, `BoardFactory`, `UserProfileFactory`, `InvitationFactory`
- `BaseNotificationComposer`
- `TaskPrototype`, `ProjectPrototype`, `BoardPrototype`, `BoardColumnPrototype`, `InvitationPrototype`
- `TaskComposite`, `SubtaskLeaf`, `BoardTaskDecorator`, `RouteAuthorizationProxy`, `NotificationEventAdapter`
- `ReportQueryService`, `HtmlReportRenderer`, `CsvReportRenderer`, `JsonReportRenderer`
- `ProjectCommandService`, `ProjectCloneService`, `BoardCommandService`
- `TaskCommandService`, `TaskUpdateService`, `TaskCloneService`
- `InvitationCommandService`, `ProjectNotificationSubscriber`, `SnapshotLoader`, `TaskflowService`
