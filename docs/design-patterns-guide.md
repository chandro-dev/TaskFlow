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
| `Facade` | Exponer una entrada simple hacia varios servicios de aplicacion | `lib/application/taskflow-service.ts` | Rutas API, paginas del workspace y flujos de autenticacion |
| `Composite` | Tratar tarea y subtareas como una estructura jerarquica para calcular progreso | `lib/domain/models.ts`, `lib/application/shared/workspace-mappers.ts` | Checklist de tareas y avance mostrado en tarjetas Kanban |
| `Decorator` | Agregar informacion visual y funcional a la tarea sin modificar su identidad | `components/taskflow/task-card.tsx`, `lib/domain/models.ts` | Etiquetas, responsables, vencimiento, horas y progreso en la UI |
| `Proxy` | Controlar acceso antes de ejecutar casos de uso sensibles | `lib/api/route-authorization.ts`, `lib/auth/current-user.ts` | Endpoints de proyectos, tableros, tareas e invitaciones |
| `Adapter` | Traducir contratos de dominio hacia servicios externos o infraestructura concreta | `lib/infrastructure/supabase/*`, `lib/application/notifications/project-notification-subscriber.ts` | Persistencia Supabase y composicion de notificaciones |
| `Bridge` | Separar el origen de datos del formato de salida de reportes | `lib/application/reports/report-query-service.ts`, `lib/patterns/structural/bridge/report-renderer.ts` | Reportes exportables en HTML, CSV y JSON |

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
  - `BoardPrototype`
  - `BoardColumnPrototype`
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

#### Clonacion de proyectos

1. `ProjectCloneService` toma el proyecto origen y resuelve sus tableros.
2. `ProjectPrototype` crea un nuevo agregado con nombre, fechas y propietario actualizados.
3. `BoardPrototype` y `BoardColumnPrototype` replican la estructura de tableros y columnas.
4. La persistencia crea un proyecto limpio, sin tareas, miembros ni invitaciones heredadas.

Uso real:
- `lib/application/projects/project-clone-service.ts`

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

## 7. Facade

### Objetivo en la app

Las paginas y rutas API no deberian conocer todos los servicios internos que participan en un caso de uso. Crear proyectos, mover tareas, registrar usuarios, aceptar invitaciones o marcar notificaciones como leidas requiere coordinar servicios de aplicacion, repositorios, autenticacion y eventos. `TaskflowService` funciona como una fachada que ofrece una entrada estable y mas simple.

### Implementacion

- `lib/application/taskflow-service.ts`
  - `TaskflowService`
  - `createTaskflowRepository()`
  - `createApplicationServices(repository)`
- Servicios internos coordinados:
  - `ProjectCommandService`
  - `BoardCommandService`
  - `TaskCommandService`
  - `TaskUpdateService`
  - `TaskMoveService`
  - `TaskCloneService`
  - `InvitationCommandService`
  - `NotificationCommandService`
  - `WorkspaceQueryService`
  - `SettingsCommandService`

### Flujo real

1. Una pagina o ruta instancia `new TaskflowService()`.
2. La fachada selecciona el repositorio activo mediante `createTaskflowRepository()`.
3. La fachada crea los servicios de aplicacion con `createApplicationServices(...)`.
4. La ruta llama un metodo simple, por ejemplo `createTask(...)`, `updateProject(...)`, `getBoardPageData(...)` o `acceptInvitation(...)`.
5. El servicio interno correspondiente ejecuta validaciones, persistencia, eventos y mapeos.

### Beneficio

El codigo de presentacion queda delgado y estable. Si cambia la forma de persistir, notificar o consultar datos, las rutas no tienen que conocer esos detalles. Esto reduce acoplamiento entre Next.js y la capa de aplicacion.

### Limitacion

La fachada no debe crecer hasta convertirse en una clase con logica de negocio. En Taskflow se usa solo como coordinador; las reglas permanecen en servicios especializados.

## 8. Composite

### Objetivo en la app

Una tarea puede contener subtareas. Para la interfaz y los calculos de avance, la tarea completa se trata como una estructura compuesta: el estado de sus hijos afecta el progreso mostrado para el elemento padre.

### Implementacion

- `lib/domain/models.ts`
  - `Task`
  - `Subtask`
  - `TaskSubtaskInput`
  - `BoardTaskView`
- `lib/application/shared/workspace-mappers.ts`
  - `subtaskProgress(task)`
  - `mapTaskToBoardView(...)`
- `components/taskflow/task-card.tsx`
  - muestra cantidad de subtareas y porcentaje de avance.

### Flujo real

1. La tarea se carga con su arreglo `subtasks`.
2. El mapper calcula cuantas subtareas estan completas.
3. El resultado se expone como `subtaskProgress`.
4. `TaskCard` renderiza el avance junto a los datos principales de la tarea.

### Beneficio

La UI no necesita recalcular ni entender la estructura interna de las subtareas. Puede tratar la tarea enriquecida como una unidad de trabajo con progreso unificado.

### Limitacion

El Composite actual es liviano: solo hay dos niveles, tarea y subtareas. Si luego se permiten subtareas anidadas, conviene formalizar una interfaz comun para nodos de trabajo.

## 9. Decorator

### Objetivo en la app

Una tarea conserva su identidad aunque se le agreguen elementos visuales o funcionales como etiquetas, responsables, estado vencido, horas, adjuntos o progreso. Esa informacion decora la tarea para mejorar su lectura en tablero sin cambiar el modelo base.

### Implementacion

- `lib/domain/models.ts`
  - `Task`
  - `Label`
  - `TaskAttachment`
  - `BoardTaskView`
- `lib/application/shared/workspace-mappers.ts`
  - agrega `assignees`, `isOverdue` y `subtaskProgress`.
- `components/taskflow/task-card.tsx`
  - representa etiquetas, vencimiento, responsables, horas y progreso.

### Flujo real

1. El repositorio entrega la tarea base con etiquetas, subtareas, adjuntos e historial.
2. La capa de aplicacion transforma `Task` en `BoardTaskView`.
3. `BoardTaskView` agrega datos calculados y relaciones listas para pintar.
4. `TaskCard` usa esos decoradores para mostrar una tarjeta mas expresiva.

### Beneficio

La tarea no necesita mezclar datos persistidos con datos visuales. La decoracion ocurre en la capa de aplicacion y presentacion, manteniendo separado el dominio del detalle grafico del tablero.

### Limitacion

La implementacion usa composicion de datos y componentes React, no clases decoradoras tradicionales. Es una aplicacion pragmatica del patron al estilo de una interfaz moderna.

## 10. Proxy

### Objetivo en la app

Antes de ejecutar operaciones sensibles, el sistema debe comprobar sesion, rol y pertenencia al proyecto. Las funciones de autorizacion actuan como proxy de acceso: se interponen entre la ruta y el caso de uso real.

### Implementacion

- `lib/auth/current-user.ts`
  - `requireAuthenticatedUser()`
- `lib/api/require-route-user.ts`
  - protege rutas API sin usuario valido.
- `lib/api/route-authorization.ts`
  - `requireProjectMemberRouteUser(...)`
  - `requireProjectCoordinatorRouteUser(...)`
  - `requireProjectManagerRouteUser(...)`
- Rutas protegidas:
  - `app/api/projects/[projectId]/...`
  - `app/api/projects/[projectId]/boards/...`
  - `app/api/projects/[projectId]/invitations/route.ts`

### Flujo real

1. La ruta recibe una peticion.
2. Antes de llamar a `TaskflowService`, invoca una funcion `require...`.
3. El proxy valida usuario, rol y relacion con el proyecto.
4. Si falla, lanza un error HTTP controlado.
5. Si pasa, la ruta ejecuta el caso de uso con un usuario autorizado.

### Beneficio

La autorizacion queda centralizada y consistente. Los servicios no dependen de detalles HTTP y las rutas no duplican validaciones complejas.

### Limitacion

El proxy protege la entrada de las rutas. Para seguridad completa en produccion, tambien debe mantenerse alineado con politicas RLS de Supabase y restricciones de base de datos.

## 11. Adapter

### Objetivo en la app

El dominio trabaja contra el contrato `IRepositroyFlow`, pero la aplicacion puede usar Supabase o un mock en memoria. El adaptador traduce ese contrato de dominio hacia las APIs concretas de infraestructura.

### Implementacion

- Puerto de dominio:
  - `lib/domain/repositories.ts`
  - `IRepositroyFlow`
- Adaptadores:
  - `lib/infrastructure/supabase/supabase-repository.ts`
  - `lib/infrastructure/mock/mock-repository.ts`
- Subadaptadores de Supabase:
  - `SupabaseSnapshotQuery`
  - `SupabaseAuthCommand`
  - `SupabaseProjectCommand`
  - `SupabaseBoardCommand`
  - `SupabaseTaskCommand`
  - `SupabaseInvitationCommand`
  - `SupabaseNotificationCommand`
  - `SupabaseSettingsCommand`
- Notificaciones:
  - `ProjectNotificationSubscriber` adapta eventos de dominio a registros persistibles de notificacion.

### Flujo real

1. La aplicacion solicita un `IRepositroyFlow`.
2. `createTaskflowRepository()` decide si usar Supabase o mock.
3. `SupabaseTaskflowRepository` implementa el contrato esperado por la aplicacion.
4. Internamente, delega en comandos y queries especificos de Supabase.
5. Los normalizadores traducen filas SQL a modelos de dominio.

### Beneficio

La aplicacion no queda acoplada al SDK de Supabase. Esto facilita pruebas, fallback mock, cambios de proveedor y evolucion del esquema.

### Limitacion

Cada cambio en el modelo de dominio debe reflejarse en el adaptador y en los normalizadores. El patron reduce acoplamiento, pero exige mantener bien sincronizado el contrato.

## 12. Bridge

### Objetivo en la app

El modulo de reportes necesita calcular informacion ejecutiva una sola vez y entregarla en distintos formatos. `Bridge` separa la abstraccion del reporte de sus implementadores de salida, evitando que el caso de uso conozca detalles de HTML, CSV o JSON.

### Implementacion

- Abstraccion:
  - `lib/application/reports/report-query-service.ts`
  - `ReportQueryService`
  - `WorkspaceReportView`
  - `ReportDocument`
- Implementadores:
  - `lib/patterns/structural/bridge/report-renderer.ts`
  - `HtmlReportRenderer`
  - `CsvReportRenderer`
  - `JsonReportRenderer`
- Entradas:
  - `app/(workspace)/reports/page.tsx`
  - `app/api/reports/route.ts`

### Flujo real

1. El usuario solicita un reporte de proyecto o tablero.
2. `TaskflowService.getWorkspaceReport(...)` carga los datos visibles para el usuario.
3. `ReportQueryService` arma un `ReportDocument` independiente del formato.
4. `createReportRenderer(format)` selecciona el implementador concreto.
5. El renderer produce HTML, CSV o JSON sin cambiar el caso de uso.

### Beneficio

Permite cumplir el requisito de reportes sin mezclar reglas de negocio con exportacion. Agregar PDF seria una extension de `ReportRenderer`, no una reescritura del servicio de reportes.

### Limitacion

El reporte actual cubre metricas ejecutivas generales. Si se requieren reportes historicos o auditoria detallada, conviene crear nuevas abstracciones de reporte y reutilizar los renderers existentes.

## Como se combinan entre si

Los patrones no viven aislados. En esta app se encadenan:

### Crear tarea

1. `Factory Method`: elige fabrica concreta por tipo.
2. `Builder`: completa responsables, subtareas e historial.
3. `Facade`: la ruta llama `TaskflowService.createTask(...)`.
4. `Proxy`: la ruta valida usuario y pertenencia antes del comando.
5. `Observer`: publica evento de tarea creada.
6. `Factory Method` de notificaciones: elige compositor del evento.
7. `Builder` de notificaciones: construye cada registro final.
8. `Adapter`: persiste la tarea y la notificacion en Supabase o mock.
9. `Composite` y `Decorator`: muestran subtareas, avance, etiquetas y estado visual en el tablero.

### Cambiar tema

1. `Abstract Factory`: crea la familia de artefactos del tema efectivo.
2. `Singleton`: mantiene una sola fuente global del tema y la aplica a toda la app.

### Registrar usuario

1. `Builder`: valida y normaliza la entrada.
2. `Factory Method`: crea el perfil inicial concreto.

### Clonar tarea

1. `Prototype`: copia la tarea fuente y sus subtareas.
2. `Builder`: termina de armar la nueva instancia si hace falta.

### Consultar tablero

1. `Proxy`: valida la sesion del usuario.
2. `Facade`: `TaskflowService.getBoardPageData(...)` concentra la entrada.
3. `Adapter`: el repositorio carga datos desde Supabase o mock.
4. `Composite`: calcula el avance de subtareas.
5. `Decorator`: enriquece la tarjeta con responsables, vencimiento, etiquetas y horas.

### Generar reporte

1. `Facade`: expone un metodo de reporte.
2. `Bridge`: separa el reporte del renderer.
3. `Adapter`: obtiene datos desde el repositorio activo.
4. El renderer produce HTML, CSV o JSON sin cambiar el caso de uso.

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

- Mapa formal de patrones: `docs/pattern-map.md`
- Resumen corto: `docs/pattern-traceability.md`
- Referencia de clases: `docs/pattern-class-reference.md`
- Diagrama completo enfocado en patrones: `docs/taskflow-patterns-complete-diagram.puml`
- Arquitectura general: `docs/taskflow-architecture.md`
- Diagrama de clases: `docs/taskflow-class-diagram.puml`
