# Anexo Exhaustivo de Participantes por Patron

Este anexo enumera de forma literal las clases, interfaces, abstract classes y tipos de soporte que intervienen en los flujos donde se evidencian patrones de diseno en Taskflow.

Objetivo:

- dejar trazabilidad completa para sustentacion,
- anexar todas las clases `Factory` y sus concretas,
- separar implementacion directa del patron frente a colaboracion o activacion indirecta,
- apoyar la lectura del PlantUML completo.

## Convenciones

- `Implementa`: la clase es parte directa del patron.
- `Usa directo`: la clase importa o instancia directamente las clases del patron.
- `Activa flujo`: la clase dispara el caso de uso y el patron aparece aguas abajo por repositorio o fabrica helper.
- `Contrato`: interfaz o puerto clave para el desacople.
- `Soporte`: tipo o entidad que ayuda a explicar el patron aunque no sea una clase ejecutable.

## 1. Singleton

| Elemento | Tipo | Participacion | Archivo | Rol |
| --- | --- | --- | --- | --- |
| `ThemeSingleton` | `class` | Implementa | `lib/patterns/singleton/theme-singleton.ts` | Instancia global del tema en cliente |
| `MockTaskflowStore` | `class` | Implementa | `lib/infrastructure/mock/mock-store.ts` | Snapshot unico compartido en modo mock |
| `MockTaskflowRepository` | `class` | Usa directo | `lib/infrastructure/mock/mock-repository.ts` | Consume el store singleton |

## 2. Abstract Factory

| Elemento | Tipo | Participacion | Archivo | Rol |
| --- | --- | --- | --- | --- |
| `ThemeFactory` | `interface` | Implementa | `lib/patterns/abstract-factory/theme-factory.ts` | Contrato de la familia visual |
| `ThemePalette` | `interface` | Implementa | `lib/patterns/abstract-factory/theme-factory.ts` | Producto abstracto de colores |
| `ThemeArtifacts` | `interface` | Implementa | `lib/patterns/abstract-factory/theme-factory.ts` | Producto abstracto final |
| `LightThemeFactory` | `class` | Implementa | `lib/patterns/abstract-factory/theme-factory.ts` | Fabrica concreta para tema claro |
| `DarkThemeFactory` | `class` | Implementa | `lib/patterns/abstract-factory/theme-factory.ts` | Fabrica concreta para tema oscuro |
| `ThemeSingleton` | `class` | Activa flujo | `lib/patterns/singleton/theme-singleton.ts` | Aplica la familia visual resultante al DOM |

## 3. Builder

| Elemento | Tipo | Participacion | Archivo | Rol |
| --- | --- | --- | --- | --- |
| `UserRegistrationBuilder` | `class` | Implementa | `lib/patterns/builder/user-registration-builder.ts` | Normaliza y valida registro |
| `ProjectBuilder` | `class` | Implementa | `lib/patterns/builder/project-builder.ts` | Construye agregados `Project` |
| `TaskBuilder` | `class` | Implementa | `lib/patterns/builder/task-builder.ts` | Enriquece tareas con historia y subtareas |
| `TaskUpdateBuilder` | `class` | Implementa | `lib/patterns/builder/task-update-builder.ts` | Reconstruye tareas editadas |
| `MemberInvitationBuilder` | `class` | Implementa | `lib/patterns/builder/member-invitation-builder.ts` | Lleva invitaciones al estado correcto |
| `ProjectNotificationBuilder` | `class` | Implementa | `lib/patterns/builder/project-notification-builder.ts` | Construye notificaciones persistibles |
| `ProjectCloneService` | `class` | Usa directo | `lib/application/projects/project-clone-service.ts` | Revalida el proyecto clonado con `ProjectBuilder` |
| `TaskUpdateService` | `class` | Usa directo | `lib/application/tasks/task-update-service.ts` | Edita tareas con `TaskUpdateBuilder` |
| `SupabaseAuthCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-auth-command.ts` | Usa `UserRegistrationBuilder` |
| `SupabaseProjectCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-project-command.ts` | Usa `ProjectBuilder` |
| `SupabaseTaskCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-task-command.ts` | Usa `TaskBuilder` |
| `SupabaseInvitationCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-invitation-command.ts` | Usa `MemberInvitationBuilder` |
| `SupabaseNotificationCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-notification-command.ts` | Usa `ProjectNotificationBuilder` |
| `MockTaskflowStore` | `class` | Usa directo | `lib/infrastructure/mock/mock-store.ts` | Usa varios builders en modo mock |
| `AuthCommandService` | `class` | Activa flujo | `lib/application/auth/auth-command-service.ts` | Dispara registro que termina usando builder en infraestructura |
| `InvitationCommandService` | `class` | Activa flujo | `lib/application/invitations/invitation-command-service.ts` | Dispara creacion o reenvio de invitaciones |

## 4. Factory Method

### 4.1 Tareas

| Elemento | Tipo | Participacion | Archivo | Rol |
| --- | --- | --- | --- | --- |
| `TaskFactoryInput` | `interface` | Soporte | `lib/patterns/factory/task-factory.ts` | Datos base de creacion |
| `TaskFactory` | `abstract class` | Implementa | `lib/patterns/factory/task-factory.ts` | Contrato de creacion base |
| `BugTaskFactory` | `class` | Implementa | `lib/patterns/factory/task-factory.ts` | Fabrica concreta para `BUG` |
| `FeatureTaskFactory` | `class` | Implementa | `lib/patterns/factory/task-factory.ts` | Fabrica concreta para `FEATURE` |
| `ImprovementTaskFactory` | `class` | Implementa | `lib/patterns/factory/task-factory.ts` | Fabrica concreta para `IMPROVEMENT` |
| `StandardTaskFactory` | `class` | Implementa | `lib/patterns/factory/task-factory.ts` | Fabrica concreta para `TASK` |
| `SupabaseTaskCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-task-command.ts` | Resuelve la fabrica segun el tipo |
| `MockTaskflowStore` | `class` | Usa directo | `lib/infrastructure/mock/mock-store.ts` | Resuelve la fabrica segun el tipo |
| `TaskCommandService` | `class` | Activa flujo | `lib/application/tasks/task-command-service.ts` | Valida entrada y dispara `repository.createTask()` |

### 4.2 Tableros

| Elemento | Tipo | Participacion | Archivo | Rol |
| --- | --- | --- | --- | --- |
| `BoardFactoryResult` | `interface` | Soporte | `lib/patterns/factory/board-factory.ts` | Resultado de la fabrica |
| `BoardFactory` | `abstract class` | Implementa | `lib/patterns/factory/board-factory.ts` | Contrato de tablero y columnas |
| `DefaultKanbanBoardFactory` | `class` | Implementa | `lib/patterns/factory/board-factory.ts` | Fabrica concreta Kanban |
| `SupabaseProjectCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-project-command.ts` | Crea el tablero inicial del proyecto |
| `SupabaseBoardCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-board-command.ts` | Crea tableros bajo demanda |
| `MockTaskflowStore` | `class` | Usa directo | `lib/infrastructure/mock/mock-store.ts` | Crea tablero y columnas por defecto o configuradas |
| `BoardCommandService` | `class` | Activa flujo | `lib/application/boards/board-command-service.ts` | Valida y dispara `repository.createBoard()` |

### 4.3 Perfiles

| Elemento | Tipo | Participacion | Archivo | Rol |
| --- | --- | --- | --- | --- |
| `UserProfile` | `interface` | Soporte | `lib/domain/models.ts` | Producto creado por la factoria de perfil |
| `UserProfileFactory` | `abstract class` | Implementa | `lib/patterns/factory/user-profile-factory.ts` | Contrato del perfil inicial |
| `DeveloperProfileFactory` | `class` | Implementa | `lib/patterns/factory/user-profile-factory.ts` | Perfil concreto usado hoy |
| `SupabaseAuthCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-auth-command.ts` | Crea el perfil de usuario |
| `MockTaskflowStore` | `class` | Usa directo | `lib/infrastructure/mock/mock-store.ts` | Crea el perfil en fallback mock |
| `AuthCommandService` | `class` | Activa flujo | `lib/application/auth/auth-command-service.ts` | Dispara registro de usuario |

### 4.4 Invitaciones

| Elemento | Tipo | Participacion | Archivo | Rol |
| --- | --- | --- | --- | --- |
| `InvitationSeed` | `interface` | Soporte | `lib/patterns/factory/invitation-factory.ts` | Semilla base de invitacion |
| `InvitationFactory` | `abstract class` | Implementa | `lib/patterns/factory/invitation-factory.ts` | Contrato de creacion |
| `InAppInvitationFactory` | `class` | Implementa | `lib/patterns/factory/invitation-factory.ts` | Canal concreto `IN_APP` |
| `SupabaseInvitationCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-invitation-command.ts` | Crea invitaciones persistentes |
| `MockTaskflowStore` | `class` | Usa directo | `lib/infrastructure/mock/mock-store.ts` | Crea invitaciones mock |
| `InvitationCommandService` | `class` | Activa flujo | `lib/application/invitations/invitation-command-service.ts` | Dispara `createInvitation()` o `resendInvitation()` |

### 4.5 Notificaciones

| Elemento | Tipo | Participacion | Archivo | Rol |
| --- | --- | --- | --- | --- |
| `ProjectNotificationEvent` | `interface` | Soporte | `lib/domain/models.ts` | Evento observado por el sistema |
| `CreateProjectNotificationInput` | `interface` | Soporte | `lib/domain/models.ts` | Payload persistible generado por el compositor |
| `NotificationComposer` | `type` | Implementa | `lib/patterns/factory/notification-composer-factory.ts` | Contrato del compositor |
| `BaseNotificationComposer` | `abstract class` | Implementa | `lib/patterns/factory/notification-composer-factory.ts` | Logica comun |
| `ProjectCreatedNotificationComposer` | `class` | Implementa | `lib/patterns/factory/notification-composer-factory.ts` | Compositor para `PROJECT_CREATED` |
| `ProjectUpdatedNotificationComposer` | `class` | Implementa | `lib/patterns/factory/notification-composer-factory.ts` | Compositor para `PROJECT_UPDATED` |
| `BoardCreatedNotificationComposer` | `class` | Implementa | `lib/patterns/factory/notification-composer-factory.ts` | Compositor para `BOARD_CREATED` |
| `TaskCreatedNotificationComposer` | `class` | Implementa | `lib/patterns/factory/notification-composer-factory.ts` | Compositor para `TASK_CREATED` |
| `MemberInvitedNotificationComposer` | `class` | Implementa | `lib/patterns/factory/notification-composer-factory.ts` | Compositor para `MEMBER_INVITED` |
| `MemberJoinedNotificationComposer` | `class` | Implementa | `lib/patterns/factory/notification-composer-factory.ts` | Compositor para `MEMBER_JOINED` |
| `ProjectNotificationSubscriber` | `class` | Usa directo | `lib/application/notifications/project-notification-subscriber.ts` | Selecciona el compositor segun el evento |

## 5. Prototype

| Elemento | Tipo | Participacion | Archivo | Rol |
| --- | --- | --- | --- | --- |
| `TaskPrototype` | `class` | Implementa | `lib/patterns/prototype/clone.ts` | Clona tareas |
| `SubtaskPrototype` | `class` | Implementa | `lib/patterns/prototype/clone.ts` | Clona subtareas |
| `ProjectPrototype` | `class` | Implementa | `lib/patterns/prototype/clone.ts` | Clona proyectos |
| `BoardPrototype` | `class` | Implementa | `lib/patterns/prototype/clone.ts` | Clona tableros |
| `BoardColumnPrototype` | `class` | Implementa | `lib/patterns/prototype/clone.ts` | Clona columnas |
| `InvitationPrototype` | `class` | Implementa | `lib/patterns/prototype/invitation-prototype.ts` | Clona invitaciones |
| `ProjectCloneService` | `class` | Usa directo | `lib/application/projects/project-clone-service.ts` | Usa `ProjectPrototype`, `BoardPrototype` y `BoardColumnPrototype` |
| `TaskCloneService` | `class` | Usa directo | `lib/application/tasks/task-clone-service.ts` | Usa `TaskPrototype` y `SubtaskPrototype` |
| `SupabaseInvitationCommand` | `class` | Usa directo | `lib/infrastructure/supabase/supabase-invitation-command.ts` | Usa `InvitationPrototype` en reenvio |
| `MockTaskflowStore` | `class` | Usa directo | `lib/infrastructure/mock/mock-store.ts` | Usa `TaskPrototype`, `SubtaskPrototype` e `InvitationPrototype` |
| `InvitationCommandService` | `class` | Activa flujo | `lib/application/invitations/invitation-command-service.ts` | Dispara `resendInvitation()` |

## 6. Observer

| Elemento | Tipo | Participacion | Archivo | Rol |
| --- | --- | --- | --- | --- |
| `ProjectEventSubscriber` | `interface` | Implementa | `lib/patterns/observer/project-event-publisher.ts` | Contrato del observador |
| `ProjectEventPublisher` | `class` | Implementa | `lib/patterns/observer/project-event-publisher.ts` | Publicador de eventos |
| `ProjectNotificationSubscriber` | `class` | Implementa | `lib/application/notifications/project-notification-subscriber.ts` | Observador concreto |
| `ProjectCommandService` | `class` | Usa directo | `lib/application/projects/project-command-service.ts` | Publica eventos de proyecto |
| `ProjectCloneService` | `class` | Usa directo | `lib/application/projects/project-clone-service.ts` | Publica evento luego del clonado |
| `BoardCommandService` | `class` | Usa directo | `lib/application/boards/board-command-service.ts` | Publica evento de tablero |
| `InvitationCommandService` | `class` | Usa directo | `lib/application/invitations/invitation-command-service.ts` | Publica evento de invitacion |

Observacion:

- `TaskCommandService` no publica eventos en el codigo actual y por eso no aparece como publicador real.

## 7. Inventario literal de clases de aplicacion

| Clase | Archivo | Relacion con patrones |
| --- | --- | --- |
| `TaskflowService` | `lib/application/taskflow-service.ts` | Fachada principal |
| `SnapshotLoader` | `lib/application/shared/snapshot-loader.ts` | Base de consultas, clones y guardas |
| `AuthQueryService` | `lib/application/auth/auth-query-service.ts` | Consulta desacoplada |
| `AuthCommandService` | `lib/application/auth/auth-command-service.ts` | Activa Builder y Factory Method indirectos |
| `SessionCommandService` | `lib/application/auth/session-command-service.ts` | Usa provider auth via factory helper |
| `ProjectQueryService` | `lib/application/projects/project-query-service.ts` | Consulta de proyectos y tableros |
| `ProjectCommandService` | `lib/application/projects/project-command-service.ts` | Usa Observer directo |
| `ProjectCloneService` | `lib/application/projects/project-clone-service.ts` | Usa Prototype, Builder y Observer directo |
| `BoardCommandService` | `lib/application/boards/board-command-service.ts` | Usa Observer directo y activa Factory Method indirecto |
| `TaskCommandService` | `lib/application/tasks/task-command-service.ts` | Activa Factory Method y Builder indirectos |
| `TaskUpdateService` | `lib/application/tasks/task-update-service.ts` | Usa Builder directo |
| `TaskMoveService` | `lib/application/tasks/task-move-service.ts` | Caso de uso sin patron GoF protagonista |
| `TaskDeleteService` | `lib/application/tasks/task-delete-service.ts` | Caso de uso sin patron GoF protagonista |
| `TaskCloneService` | `lib/application/tasks/task-clone-service.ts` | Usa Prototype directo |
| `InvitationQueryService` | `lib/application/invitations/invitation-query-service.ts` | Usa `SnapshotLoader` |
| `InvitationCommandService` | `lib/application/invitations/invitation-command-service.ts` | Usa Observer directo y activa Factory/Builder/Prototype indirectos |
| `InvitationCreationGuard` | `lib/application/invitations/invitation-creation-guard.ts` | Guardia previa al flujo de invitaciones |
| `NotificationQueryService` | `lib/application/notifications/notification-query-service.ts` | Consulta notificaciones |
| `NotificationCommandService` | `lib/application/notifications/notification-command-service.ts` | Comandos simples de notificacion |
| `ProjectNotificationSubscriber` | `lib/application/notifications/project-notification-subscriber.ts` | Observer directo y activador de compositores |
| `WorkspaceQueryService` | `lib/application/workspace/workspace-query-service.ts` | Proyecciones generales |
| `SettingsCommandService` | `lib/application/settings/settings-command-service.ts` | Persistencia de settings |
| `ThemePreferenceCommandService` | `lib/application/settings/theme-preference-command-service.ts` | Actualiza preferencia visual |

## 8. Inventario literal de clases de infraestructura

| Clase | Archivo | Relacion con patrones |
| --- | --- | --- |
| `MockTaskflowRepository` | `lib/infrastructure/mock/mock-repository.ts` | Adaptador mock del puerto |
| `MockTaskflowStore` | `lib/infrastructure/mock/mock-store.ts` | Singleton y consumidor directo de builders/factories/prototypes |
| `MockAuthProvider` | `lib/infrastructure/auth/mock-auth-provider.ts` | Implementacion del contrato auth |
| `SupabaseTaskflowRepository` | `lib/infrastructure/supabase/supabase-repository.ts` | Adaptador real del puerto |
| `SupabaseSnapshotQuery` | `lib/infrastructure/supabase/supabase-snapshot-query.ts` | Reconstruye snapshot |
| `SupabaseAuthCommand` | `lib/infrastructure/supabase/supabase-auth-command.ts` | Usa Builder y Factory Method |
| `SupabaseProjectCommand` | `lib/infrastructure/supabase/supabase-project-command.ts` | Usa Builder y Factory Method |
| `SupabaseBoardCommand` | `lib/infrastructure/supabase/supabase-board-command.ts` | Usa Factory Method |
| `SupabaseTaskCommand` | `lib/infrastructure/supabase/supabase-task-command.ts` | Usa Factory Method y Builder |
| `SupabaseInvitationCommand` | `lib/infrastructure/supabase/supabase-invitation-command.ts` | Usa Factory Method, Builder y Prototype |
| `SupabaseNotificationCommand` | `lib/infrastructure/supabase/supabase-notification-command.ts` | Usa Builder |
| `SupabaseSettingsCommand` | `lib/infrastructure/supabase/supabase-settings-command.ts` | Persistencia de configuracion |
| `SupabaseAuthProvider` | `lib/infrastructure/auth/supabase-auth-provider.ts` | Implementacion del contrato auth |

## 9. Contratos, entidades y tipos de soporte

### Contratos y politicas

| Elemento | Tipo | Archivo | Rol |
| --- | --- | --- | --- |
| `IRepositroyFlow` | `interface` | `lib/domain/repositories.ts` | Puerto principal entre aplicacion e infraestructura |
| `TaskflowAuthProvider` | `interface` | `lib/domain/auth-provider.ts` | Contrato de autenticacion |
| `ProjectAccessPolicy` | `class` | `lib/domain/policies/project-access-policy.ts` | Politica de acceso usada por servicios y rutas |

### Entidades del flujo

| Elemento | Tipo | Archivo | Rol |
| --- | --- | --- | --- |
| `UserProfile` | `interface` | `lib/domain/models.ts` | Perfil producido por `UserProfileFactory` |
| `Project` | `interface` | `lib/domain/models.ts` | Agregado de proyecto |
| `Board` | `interface` | `lib/domain/models.ts` | Tablero del proyecto |
| `BoardColumn` | `interface` | `lib/domain/models.ts` | Columna del tablero |
| `Task` | `interface` | `lib/domain/models.ts` | Tarea del sistema |
| `Subtask` | `interface` | `lib/domain/models.ts` | Subtarea de checklist |
| `MemberInvitation` | `interface` | `lib/domain/models.ts` | Invitacion a proyecto |
| `ProjectNotification` | `interface` | `lib/domain/models.ts` | Notificacion persistida |
| `TaskflowSnapshot` | `interface` | `lib/domain/models.ts` | Snapshot leido por queries y observers |

## 10. Funciones activadoras relevantes

Estas funciones no son clases UML, pero conviene citarlas en la exposicion porque son la puerta de entrada real al patron:

| Funcion | Archivo | Patron o rol |
| --- | --- | --- |
| `createThemeFactory()` | `lib/patterns/abstract-factory/theme-factory.ts` | Abstract Factory |
| `createThemeArtifacts()` | `lib/patterns/abstract-factory/theme-factory.ts` | Abstract Factory |
| `createTaskFactory()` | `lib/patterns/factory/task-factory.ts` | Factory Method |
| `createBoardFactory()` | `lib/patterns/factory/board-factory.ts` | Factory Method |
| `getDefaultBoardColumnDrafts()` | `lib/patterns/factory/board-factory.ts` | Soporte de Factory Method |
| `createUserProfileFactory()` | `lib/patterns/factory/user-profile-factory.ts` | Factory Method |
| `createInvitationFactory()` | `lib/patterns/factory/invitation-factory.ts` | Factory Method |
| `createNotificationComposer()` | `lib/patterns/factory/notification-composer-factory.ts` | Factory Method |
| `createAuthProvider()` | `lib/infrastructure/auth/auth-provider-factory.ts` | Seleccion de provider auth |
| `createApplicationServices()` | `lib/application/application-service-factory.ts` | Ensamble de servicios y observer |
| `createTaskflowRepository()` | `lib/infrastructure/repository-factory.ts` | Seleccion del adaptador de infraestructura |

## 11. Diagramas recomendados

- Archivo unico consolidado: `docs/taskflow-all-in-one-diagram.puml`

## 12. Miembros UML clave

| Clase | Atributos clave | Metodos clave |
| --- | --- | --- |
| `ThemeSingleton` | `instance`, `listeners`, `mediaQuery`, `mode`, `effectiveMode`, `initialized` | `getInstance()`, `initialize()`, `setMode()`, `subscribe()`, `getSnapshot()` |
| `MockTaskflowStore` | `instance`, `snapshot` | `getInstance()`, `loadSnapshot()`, `registerUser()`, `createProject()`, `createTask()`, `createInvitation()` |
| `ProjectBuilder` | `draft` | `normalize()`, `validate()`, `buildProject()` |
| `TaskBuilder` | `draft` | `withLabel()`, `withAssignee()`, `withSubtask()`, `withHistory()`, `build()` |
| `TaskUpdateBuilder` | `draft`, `existingSubtaskIds` | `withCoreFields()`, `withAssignees()`, `withSubtasks()`, `build()` |
| `MemberInvitationBuilder` | `draft` | `withMessage()`, `withExpiry()`, `asPending()`, `asAccepted()`, `asRevoked()`, `refreshToken()`, `build()` |
| `ProjectNotificationBuilder` | `draft`, `readAt`, `isRead` | `normalize()`, `asRead()`, `build()` |
| `TaskFactory` | `-` | `create()`, `createTask()`, `defaultPriority()` |
| `BoardFactory` | `-` | `create()`, `boardName()`, `createColumns()` |
| `UserProfileFactory` | `-` | `create()`, `role()`, `defaultBio()` |
| `InvitationFactory` | `-` | `create()`, `channel()`, `buildToken()`, `defaultExpiry()`, `normalizeRole()` |
| `BaseNotificationComposer` | `-` | `compose()`, `getProjectMembers()`, `getProjectName()`, `getBoardName()`, `getTaskTitle()`, `buildNotifications()` |
| `TaskPrototype` | `source` | `clone()` |
| `ProjectPrototype` | `source` | `clone()` |
| `BoardPrototype` | `source` | `clone()` |
| `BoardColumnPrototype` | `source` | `clone()` |
| `InvitationPrototype` | `source` | `clone()` |
| `ProjectCommandService` | `repository`, `notificationPublisher` | `createProject()`, `updateProject()`, `deleteProject()`, `removeProjectMember()`, `updateProjectMemberRole()` |
| `ProjectCloneService` | `repository`, `notificationPublisher`, `snapshotLoader` | `cloneProject()`, `resolveSourceBoards()` |
| `BoardCommandService` | `repository`, `notificationPublisher` | `createBoard()`, `createBoardColumn()`, `updateBoardColumn()`, `reorderBoardColumns()`, `deleteBoardColumn()` |
| `TaskCommandService` | `repository`, `notificationPublisher` | `createTask()` |
| `TaskUpdateService` | `repository`, `snapshotLoader` | `updateTask()` |
| `TaskCloneService` | `repository`, `snapshotLoader` | `cloneTask()`, `buildClonedSubtasks()` |
| `InvitationCommandService` | `repository`, `notificationPublisher`, `invitationQueryService`, `invitationCreationGuard` | `createInvitation()`, `createInvitations()`, `revokeInvitation()`, `resendInvitation()`, `acceptInvitation()` |
| `ProjectNotificationSubscriber` | `repository`, `snapshotLoader` | `handle()`, `deduplicate()` |
| `SnapshotLoader` | `repository` | `load()` |
| `TaskflowService` | `repository`, `services` | `createProject()`, `cloneProject()`, `createBoard()`, `createTask()`, `updateTask()`, `createInvitation()`, `login()`, `registerUser()` |
