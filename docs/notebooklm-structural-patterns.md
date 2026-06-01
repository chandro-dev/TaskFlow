# Taskflow - Fuente para NotebookLM sobre Patrones Estructurales

Este documento esta preparado para alimentar NotebookLM con informacion clara y organizada sobre los patrones estructurales usados en Taskflow. La intencion es que pueda generar diapositivas, resumenes, guiones de exposicion o preguntas de estudio sin tener que inferir demasiado desde el codigo.

## 1. Contexto general

Taskflow es una plataforma web de gestion de proyectos y tareas construida con `Next.js`, `TypeScript` y `Supabase`. La aplicacion permite administrar proyectos, tableros Kanban, tareas, subtareas, miembros, invitaciones, notificaciones, filtros, configuracion, reportes y dashboards ejecutivos.

La arquitectura esta separada por capas:

- `domain`: entidades, contratos, politicas y modelos del negocio.
- `application`: casos de uso y servicios de aplicacion.
- `infrastructure`: adaptadores concretos para Supabase y mock.
- `patterns`: implementaciones explicitas de patrones.
- `app` y `components`: rutas, paginas, handlers API y presentacion.

Los patrones estructurales se usan para organizar relaciones entre objetos y capas. No se aplican como teoria aislada: aparecen en flujos reales como crear tareas, consultar tableros, proteger rutas, adaptar Supabase, enriquecer tarjetas Kanban, generar reportes y presentar dashboards de seguimiento.

## 2. Patrones estructurales incluidos

| Patron | Proposito en Taskflow | Implementacion principal |
| --- | --- | --- |
| `Facade` | Dar una entrada simple a los casos de uso | `TaskflowService` |
| `Composite` | Tratar tarea y subtareas como unidad de trabajo | `WorkItemComponent`, `TaskComposite`, `SubtaskLeaf` |
| `Decorator` | Enriquecer tareas para la vista Kanban sin modificar la entidad base | `BoardTaskDecorator`, `BoardTaskView` |
| `Proxy` | Validar acceso antes de ejecutar operaciones sensibles | `RouteAuthorizationProxy` |
| `Adapter` | Traducir contratos del dominio hacia Supabase, mock y notificaciones | `SupabaseTaskflowRepository`, `MockTaskflowRepository`, `NotificationEventAdapter` |
| `Bridge` | Separar el dashboard/reporte base de sus formatos de salida | `ReportQueryService`, `ReportRenderer` |

## 3. Facade

### Que problema resuelve

Las paginas y rutas API no deberian conocer todos los servicios internos de la aplicacion. Crear proyectos, crear tareas, mover tareas, aceptar invitaciones, consultar reportes o iniciar sesion implica coordinar repositorios, servicios, eventos y mapeos.

Sin una fachada, cada ruta tendria que instanciar y conectar varios servicios manualmente. Eso aumentaria el acoplamiento con la estructura interna de la aplicacion.

### Por que se uso

Se uso `Facade` para que la capa de entrada trabaje con una interfaz simple: `TaskflowService`. Esta clase oculta la creacion del repositorio activo y el ensamble de servicios de aplicacion.

### Implementacion

Archivo principal:

- `lib/application/taskflow-service.ts`

Clases y funciones relacionadas:

- `TaskflowService`
- `createTaskflowRepository()`
- `createApplicationServices(repository)`
- `ProjectCommandService`
- `BoardCommandService`
- `TaskCommandService`
- `TaskUpdateService`
- `TaskCloneService`
- `InvitationCommandService`
- `NotificationCommandService`
- `ReportQueryService`
- `AuthCommandService`
- `SessionCommandService`

### Flujo real

1. Una pagina o ruta API recibe una solicitud.
2. La ruta crea o usa `TaskflowService`.
3. `TaskflowService` obtiene el repositorio activo.
4. `TaskflowService` coordina los servicios internos.
5. La ruta llama un metodo de alto nivel como `createTask`, `getBoardPageData`, `getWorkspaceReport` o `renderWorkspaceReport`.
6. La logica real permanece en servicios especializados.

### Evidencia

- `app/(workspace)/projects/page.tsx`
- `app/(workspace)/reports/page.tsx`
- `app/api/projects/route.ts`
- `app/api/reports/route.ts`
- `lib/application/taskflow-service.ts`

### Beneficio

La capa de presentacion y las rutas quedan mas limpias. Si cambia la forma de consultar datos, persistir o notificar, se ajusta la capa de aplicacion sin reescribir todas las rutas.

### Limite

La fachada no debe contener reglas de negocio detalladas. En Taskflow se mantiene como coordinador; las reglas viven en servicios concretos.

### Mensaje para diapositiva

`Facade` convierte varios servicios internos en una entrada unica y estable para paginas y rutas API.

## 4. Composite

### Que problema resuelve

Una tarea puede contener subtareas. Para calcular avance, la interfaz necesita tratar la tarea principal y sus subtareas como una misma unidad de trabajo.

Sin `Composite`, el calculo del progreso podria quedar repetido en componentes, mappers o servicios.

### Por que se uso

Se uso `Composite` porque el avance de una tarea depende del estado de sus subtareas. La tarea compuesta calcula progreso a partir de hojas individuales.

### Implementacion

Archivo principal:

- `lib/patterns/structural/composite/task-work-item.ts`

Participantes:

- `WorkItemComponent`: contrato comun para elementos de trabajo.
- `TaskComposite`: nodo compuesto que representa la tarea.
- `SubtaskLeaf`: nodo hoja que representa una subtarea.
- `createTaskWorkComposite`: funcion que arma la estructura.

Entidades relacionadas:

- `Task`
- `Subtask`
- `BoardTaskView`

### Flujo real

1. El repositorio carga una tarea con su arreglo de subtareas.
2. `createTaskWorkComposite(task)` crea un `TaskComposite`.
3. Cada subtarea se representa como `SubtaskLeaf`.
4. `TaskComposite.progress()` calcula el porcentaje de avance.
5. El resultado llega a `BoardTaskView`.
6. `TaskCard` muestra el avance sin conocer el detalle del calculo.

### Evidencia

- `lib/patterns/structural/composite/task-work-item.ts`
- `lib/application/shared/workspace-mappers.ts`
- `components/taskflow/task-card.tsx`
- `lib/domain/models.ts`

### Beneficio

El calculo de avance queda reutilizable y aislado. La UI consume un porcentaje ya preparado.

### Limite

Actualmente el arbol tiene dos niveles: tarea y subtareas. Si se agregan subtareas anidadas, el mismo contrato puede extenderse.

### Mensaje para diapositiva

`Composite` permite tratar una tarea con subtareas como una estructura unica para calcular progreso.

## 5. Decorator

### Que problema resuelve

La entidad `Task` representa la tarea del dominio. Sin embargo, para pintar una tarjeta Kanban se necesitan datos adicionales: responsables hidratados, vencimiento, progreso, etiquetas y estado visual.

No conviene contaminar la entidad base con todos los datos calculados o visuales de la interfaz.

### Por que se uso

Se uso `Decorator` para enriquecer la tarea sin cambiar su identidad. La tarea sigue siendo la misma, pero se transforma en una vista lista para tablero.

### Implementacion

Archivo principal:

- `lib/patterns/structural/decorator/board-task-decorator.ts`

Participantes:

- `BoardTaskDecorator`: recibe una `Task` y un `TaskflowSnapshot`.
- `decorateBoardTask`: helper de aplicacion.
- `BoardTaskView`: modelo enriquecido para la UI.

Datos agregados:

- `assignees`
- `isOverdue`
- `subtaskProgress`

### Flujo real

1. El repositorio entrega tareas normalizadas.
2. La capa de aplicacion llama `decorateBoardTask`.
3. `BoardTaskDecorator` agrega datos calculados.
4. `BoardTaskView` queda listo para renderizar.
5. `TaskCard` muestra la tarjeta enriquecida.

### Evidencia

- `lib/patterns/structural/decorator/board-task-decorator.ts`
- `lib/application/shared/workspace-mappers.ts`
- `components/taskflow/task-card.tsx`
- `lib/domain/models.ts`

### Beneficio

Separa dominio y presentacion. La tarea base no cambia por necesidades visuales del tablero.

### Limite

La implementacion usa composicion de datos, no decoradores por herencia clasica. Es una aplicacion pragmatica del patron para React y TypeScript.

### Mensaje para diapositiva

`Decorator` agrega informacion visual a la tarea sin alterar su modelo de dominio.

## 6. Proxy

### Que problema resuelve

Las operaciones sobre proyectos, tableros, tareas e invitaciones no pueden ejecutarse para cualquier usuario. Antes de llegar al caso de uso, el sistema debe validar sesion, rol y pertenencia al proyecto.

Sin un proxy, cada ruta duplicaria validaciones o correria el riesgo de omitir controles.

### Por que se uso

Se uso `Proxy` como barrera de acceso antes de ejecutar operaciones sensibles. El proxy valida si el usuario puede continuar.

### Implementacion

Archivos principales:

- `lib/patterns/structural/proxy/route-authorization-proxy.ts`
- `lib/api/route-authorization.ts`
- `lib/api/require-route-user.ts`
- `lib/auth/current-user.ts`

Participantes:

- `RouteAuthorizationProxy`
- `ProjectAccessPolicy`
- `UserProfile`
- `Project`
- funciones `requireProjectMemberRouteUser`, `requireProjectCoordinatorRouteUser`, `requireProjectManagerRouteUser`

### Flujo real

1. Una ruta API recibe una solicitud.
2. La ruta obtiene el usuario autenticado.
3. Antes de llamar a `TaskflowService`, invoca una funcion `require...`.
4. `RouteAuthorizationProxy` valida rol y acceso al proyecto.
5. Si falla, se devuelve error controlado.
6. Si pasa, se ejecuta el caso de uso.

### Evidencia

- `app/api/projects/[projectId]/boards/[boardId]/tasks/route.ts`
- `app/api/projects/[projectId]/invitations/route.ts`
- `app/api/projects/[projectId]/boards/route.ts`
- `lib/patterns/structural/proxy/route-authorization-proxy.ts`

### Beneficio

La autorizacion queda centralizada. Las rutas no repiten reglas de acceso y los servicios de aplicacion no dependen del protocolo HTTP.

### Limite

El proxy protege la entrada de la aplicacion. En produccion debe complementarse con RLS, constraints y politicas de Supabase.

### Mensaje para diapositiva

`Proxy` se interpone antes del caso de uso para validar identidad, rol y acceso al proyecto.

## 7. Adapter

### Que problema resuelve

La aplicacion no deberia depender directamente del SDK de Supabase ni de la estructura exacta de tablas SQL. Tambien debe poder funcionar con un mock en memoria para desarrollo o demostracion.

Sin adaptadores, la capa de aplicacion quedaria acoplada a detalles de infraestructura.

### Por que se uso

Se uso `Adapter` para traducir el contrato del dominio hacia implementaciones concretas: Supabase, mock y eventos convertidos en notificaciones persistibles.

### Implementacion

Puerto principal:

- `lib/domain/repositories.ts`
- `IRepositroyFlow`

Adaptadores principales:

- `lib/infrastructure/supabase/supabase-repository.ts`
- `lib/infrastructure/mock/mock-repository.ts`
- `lib/patterns/structural/adapter/notification-event-adapter.ts`

Participantes:

- `SupabaseTaskflowRepository`
- `MockTaskflowRepository`
- `NotificationEventAdapter`
- `ProjectNotificationEvent`
- `CreateProjectNotificationInput`
- `ProjectNotificationSubscriber`

Subadaptadores Supabase:

- `SupabaseSnapshotQuery`
- `SupabaseAuthCommand`
- `SupabaseProjectCommand`
- `SupabaseBoardCommand`
- `SupabaseTaskCommand`
- `SupabaseInvitationCommand`
- `SupabaseNotificationCommand`
- `SupabaseSettingsCommand`

### Flujo de persistencia

1. La aplicacion solicita un `IRepositroyFlow`.
2. `createTaskflowRepository()` decide si usar Supabase o mock.
3. `SupabaseTaskflowRepository` implementa el contrato esperado.
4. Internamente traduce operaciones hacia queries, RPCs y comandos de Supabase.
5. Los normalizadores convierten filas SQL en modelos del dominio.

### Flujo de notificaciones

1. Se publica un `ProjectNotificationEvent`.
2. `ProjectNotificationSubscriber` recibe el evento.
3. `NotificationEventAdapter` lo convierte en `CreateProjectNotificationInput`.
4. El repositorio persiste las notificaciones.

### Evidencia

- `lib/domain/repositories.ts`
- `lib/infrastructure/repository-factory.ts`
- `lib/infrastructure/supabase/supabase-repository.ts`
- `lib/infrastructure/mock/mock-repository.ts`
- `lib/patterns/structural/adapter/notification-event-adapter.ts`
- `lib/application/notifications/project-notification-subscriber.ts`

### Beneficio

La aplicacion depende de contratos, no de proveedores concretos. Esto facilita pruebas, fallback mock, migracion de infraestructura y mantenimiento.

### Limite

Cada cambio en el dominio debe reflejarse en normalizadores, comandos y queries de infraestructura.

### Mensaje para diapositiva

`Adapter` permite que el dominio hable con un contrato propio mientras Supabase y mock traducen los detalles tecnicos.

## 8. Bridge

### Que problema resuelve

El modulo de reportes debe calcular informacion ejecutiva una sola vez y usarla tanto para el dashboard visual de la pantalla `/reports` como para exportarla en distintos formatos: HTML, CSV y JSON.

Sin `Bridge`, el servicio de reportes podria llenarse de condicionales por formato, mezclar calculo de negocio con serializacion o duplicar la logica entre dashboard y exportaciones.

### Por que se uso

Se uso `Bridge` para separar la abstraccion del dashboard/reporte de sus implementadores de salida. `ReportQueryService` calcula el modelo ejecutivo base y los renderers deciden como presentarlo o exportarlo.

### Implementacion

Abstraccion:

- `lib/application/reports/report-query-service.ts`
- `ReportQueryService`

Implementadores:

- `lib/patterns/structural/bridge/report-renderer.ts`
- `ReportRenderer`
- `HtmlReportRenderer`
- `CsvReportRenderer`
- `JsonReportRenderer`
- `createReportRenderer`

Entradas:

- `app/(workspace)/reports/page.tsx`
- `app/api/reports/route.ts`

Modelos:

- `WorkspaceReportView`
- `ReportDocument`
- `RenderedReport`

### Dashboard ejecutivo

La pantalla `/reports` usa el mismo `WorkspaceReportView` generado por `ReportQueryService` para mostrar un dashboard de seguimiento. Este dashboard no es un renderer aparte, sino la vista principal del reporte dentro de la aplicacion.

Elementos del dashboard:

- Tarjetas KPI con proyectos visibles, tareas totales, avance general y tareas vencidas.
- Fecha y hora de generacion del reporte.
- Tabla de detalle por proyecto.
- Estado de cada proyecto.
- Cantidad de tableros por proyecto.
- Total de tareas.
- Tareas completadas.
- Tareas vencidas.
- Porcentaje de avance.
- Relacion entre horas ejecutadas y horas estimadas.

El dashboard usa los mismos datos que luego pueden exportarse. Esto evita inconsistencias entre lo que ve el usuario en pantalla y lo que descarga en HTML, CSV o JSON.

### Flujo real

1. El usuario entra a `/reports` o solicita exportacion por API.
2. `TaskflowService.getWorkspaceReport` o `renderWorkspaceReport` actua como entrada.
3. `ReportQueryService` carga datos desde `IRepositroyFlow`.
4. El servicio calcula `WorkspaceReportView` con filas por proyecto y totales globales.
5. La pagina `/reports` usa `WorkspaceReportView` para pintar el dashboard ejecutivo.
6. Si se solicita exportacion, el servicio convierte el resultado en `ReportDocument`.
7. `createReportRenderer(format)` selecciona HTML, CSV o JSON.
8. El renderer produce la salida final.

### Evidencia

- `lib/application/reports/report-query-service.ts`
- `lib/patterns/structural/bridge/report-renderer.ts`
- `app/(workspace)/reports/page.tsx`
- `app/api/reports/route.ts`
- `lib/application/taskflow-service.ts`

### Beneficio

Agregar un nuevo formato no exige reescribir el caso de uso. Por ejemplo, un PDF podria implementarse como nuevo `ReportRenderer`. Ademas, el dashboard y las exportaciones comparten la misma fuente de datos, por lo que las metricas se mantienen consistentes.

### Limite

El reporte actual cubre metricas ejecutivas. Reportes historicos o auditorias detalladas pueden requerir nuevas abstracciones de documento.

### Mensaje para diapositiva

`Bridge` separa el calculo del dashboard/reporte de la forma en que se presenta o exporta.

## 9. Flujo integrado: crear tarea

Este flujo muestra como los patrones estructurales se conectan con el caso de uso mas importante del tablero.

1. `Proxy`: la ruta valida que el usuario tenga permiso en el proyecto.
2. `Facade`: la ruta llama `TaskflowService.createTask(...)`.
3. `Adapter`: el repositorio activo persiste la tarea en Supabase o mock.
4. `Observer`: el comando publica el evento de tarea creada.
5. `Adapter`: `NotificationEventAdapter` convierte el evento en notificaciones.
6. `Composite`: el tablero calcula progreso de subtareas.
7. `Decorator`: la tarea se convierte en `BoardTaskView`.
8. La UI renderiza la tarjeta Kanban enriquecida.

Mensaje para diapositiva:

La creacion de una tarea no es solo un insert; pasa por autorizacion, fachada, adaptador, evento, notificacion, composicion y decoracion visual.

## 10. Flujo integrado: consultar tablero Kanban

1. `Proxy`: protege el acceso al proyecto.
2. `Facade`: `TaskflowService.getBoardPageData(...)` ofrece una entrada simple.
3. `Adapter`: el repositorio carga snapshot, tableros, columnas y tareas.
4. `Composite`: calcula avance de subtareas.
5. `Decorator`: agrega responsables, vencimiento y progreso.
6. La pagina renderiza columnas y tarjetas.

Mensaje para diapositiva:

El tablero muestra datos del dominio enriquecidos por patrones estructurales antes de llegar a React.

## 11. Flujo integrado: generar dashboard y reporte

1. `Facade`: la pagina o API llama `TaskflowService`.
2. `Adapter`: el reporte usa el repositorio activo para obtener datos.
3. `Bridge`: `ReportQueryService` crea el modelo base del dashboard.
4. La pantalla `/reports` muestra KPIs y tabla ejecutiva.
5. `ReportRenderer` exporta HTML, CSV o JSON cuando el usuario descarga el reporte.

Mensaje para diapositiva:

El dashboard y el reporte se calculan una vez; `Bridge` permite mostrar KPIs en pantalla y exportar la misma informacion en diferentes formatos.

## 12. Tabla de defensa rapida

| Patron | Frase de defensa | Riesgo que evita |
| --- | --- | --- |
| `Facade` | Centraliza la entrada a casos de uso sin exponer servicios internos | Rutas acopladas a la arquitectura interna |
| `Composite` | Modela tarea y subtareas como una unidad con progreso comun | Calculos duplicados en la UI |
| `Decorator` | Enriquece la tarea para tablero sin modificar la entidad base | Mezclar dominio con datos visuales |
| `Proxy` | Bloquea operaciones antes de llegar al caso de uso | Validaciones de seguridad dispersas |
| `Adapter` | Aisla la aplicacion del proveedor de infraestructura | Dependencia directa de Supabase en la capa de aplicacion |
| `Bridge` | Separa dashboard/reporte y formato de salida | Condicionales por formato dentro del servicio |

## 13. Diferencia entre los patrones estructurales

`Facade` simplifica el acceso a un subsistema. En Taskflow, simplifica el acceso desde rutas y paginas hacia servicios.

`Composite` organiza una jerarquia. En Taskflow, organiza tarea y subtareas para calcular progreso.

`Decorator` agrega informacion a un objeto sin cambiar su identidad. En Taskflow, agrega datos calculados a la tarea para la tarjeta Kanban.

`Proxy` controla el acceso a otro objeto o caso de uso. En Taskflow, valida autorizacion antes de ejecutar operaciones.

`Adapter` traduce una interfaz a otra. En Taskflow, traduce contratos de dominio hacia Supabase, mock y notificaciones persistibles.

`Bridge` separa una abstraccion de sus implementadores. En Taskflow, separa el dashboard/reporte base de sus formatos HTML, CSV y JSON.

## 14. Archivos clave para NotebookLM

Usar estos archivos como fuentes complementarias:

- `docs/pattern-map.md`
- `docs/design-patterns-guide.md`
- `docs/pattern-class-reference.md`
- `docs/pattern-traceability.md`
- `docs/taskflow-structural-patterns-diagram.puml`
- `docs/taskflow-patterns-complete-diagram.puml`

Archivos de codigo mas importantes:

- `lib/application/taskflow-service.ts`
- `lib/patterns/structural/composite/task-work-item.ts`
- `lib/patterns/structural/decorator/board-task-decorator.ts`
- `lib/patterns/structural/proxy/route-authorization-proxy.ts`
- `lib/patterns/structural/adapter/notification-event-adapter.ts`
- `lib/patterns/structural/bridge/report-renderer.ts`
- `lib/application/reports/report-query-service.ts`
- `lib/infrastructure/supabase/supabase-repository.ts`
- `lib/infrastructure/mock/mock-repository.ts`
- `lib/api/route-authorization.ts`

## 15. Guion sugerido para exposicion

1. Taskflow tiene una arquitectura por capas para separar dominio, aplicacion, infraestructura y presentacion.
2. Los patrones estructurales se usaron para ordenar relaciones entre objetos y evitar acoplamiento.
3. `Facade` simplifica la entrada desde rutas y paginas.
4. `Proxy` valida que el usuario pueda ejecutar operaciones sensibles.
5. `Adapter` permite cambiar entre Supabase y mock sin afectar la aplicacion.
6. `Composite` calcula el progreso de tareas con subtareas.
7. `Decorator` enriquece las tareas para mostrar tarjetas Kanban mas completas.
8. `Bridge` permite alimentar dashboards ejecutivos y generar reportes en varios formatos desde un mismo modelo base.
9. Los patrones trabajan juntos en flujos reales como crear tareas, consultar tableros, visualizar dashboards y exportar reportes.
10. El resultado es una aplicacion mas mantenible, extensible y facil de sustentar tecnicamente.

## 16. Conclusiones

Los patrones estructurales en Taskflow no se implementaron para cumplir una lista teorica, sino para resolver problemas concretos de arquitectura:

- reducir acoplamiento entre Next.js y la capa de aplicacion,
- proteger operaciones sensibles,
- aislar proveedores de infraestructura,
- enriquecer datos para la interfaz sin dañar el dominio,
- calcular progreso de estructuras compuestas,
- visualizar dashboards y exportar reportes sin duplicar logica.

La evidencia principal esta en la relacion entre `TaskflowService`, los adaptadores de infraestructura, las clases de autorizacion, los decoradores de tareas, el composite de subtareas y el bridge de dashboards/reportes.
