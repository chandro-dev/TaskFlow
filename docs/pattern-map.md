# Mapa Formal de Patrones de Diseno

Este documento resume los patrones implementados en Taskflow con el formato esperado para una entrega academica: patron, tipo, funcionalidad, problema de diseno, implementacion, justificacion, beneficios, limitaciones y evidencia.

## Criterio de clasificacion

- `Creacional`: controla como se crean objetos o familias de objetos.
- `Estructural`: organiza relaciones entre objetos, capas o representaciones.
- `Comportamiento`: organiza la comunicacion entre objetos y eventos.

## Tabla principal

| Patron | Tipo | Funcionalidad | Problema de diseno | Implementacion | Justificacion | Beneficios | Limitaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Singleton` | Creacional | Tema global y store mock | Evitar multiples fuentes de verdad para estado compartido | `ThemeSingleton`, `MockTaskflowStore` | El tema y el snapshot mock deben ser unicos en runtime | Consistencia visual, estado mock estable, menor duplicacion | Debe usarse solo para estado realmente global |
| `Abstract Factory` | Creacional | Temas visuales | Crear familias completas de tokens visuales sin condicionales dispersos | `ThemeFactory`, `LightThemeFactory`, `DarkThemeFactory` | Cada tema produce paleta, superficies, bordes, texto y acentos coherentes | Extender temas sin romper UI existente | Si solo cambia un color, seria excesivo |
| `Factory Method` | Creacional | Tareas, tableros, perfiles, invitaciones y notificaciones | Seleccionar la creacion concreta segun tipo o evento | `TaskFactory`, `BoardFactory`, `UserProfileFactory`, `InvitationFactory`, `NotificationComposer` | El llamador no debe conocer clases concretas | Menos condicionales, mejor extension por tipo | Requiere mantener clara la frontera entre fabrica y builder |
| `Builder` | Creacional | Registro, proyectos, tareas, invitaciones y notificaciones | Construir objetos con reglas de normalizacion y validacion | `UserRegistrationBuilder`, `ProjectBuilder`, `TaskBuilder`, `TaskUpdateBuilder`, `MemberInvitationBuilder`, `ProjectNotificationBuilder` | Los agregados se arman por pasos y con reglas distintas | Objetos consistentes, validaciones centralizadas, codigo mas legible | No debe reemplazar validaciones de negocio de servicios |
| `Prototype` | Creacional | Clonado de tareas, subtareas, proyectos, tableros e invitaciones | Crear variantes desde objetos existentes sin reconstruir manualmente | `TaskPrototype`, `SubtaskPrototype`, `ProjectPrototype`, `BoardPrototype`, `BoardColumnPrototype`, `InvitationPrototype` | El clonado conserva estructura y reinicia datos operativos cuando aplica | Reutilizacion de plantillas, menor duplicacion, clonado controlado | Hay que decidir que campos se heredan y cuales se limpian |
| `Facade` | Estructural | Entrada unica a casos de uso | Evitar que rutas y paginas conozcan todos los servicios internos | `TaskflowService` | Presentacion y API llaman metodos simples mientras la logica queda en servicios | Menor acoplamiento con Next.js, rutas mas delgadas | La fachada no debe contener reglas de negocio |
| `Composite` | Estructural | Progreso de tarea/subtareas | Tratar una tarea con subtareas como una unidad jerarquica | `TaskComposite`, `SubtaskLeaf`, `createTaskWorkComposite` | El avance del padre depende del estado de sus hijos | Progreso unificado, calculo reutilizable, UI mas simple | Actualmente solo hay dos niveles de profundidad |
| `Decorator` | Estructural | Tarjetas Kanban enriquecidas | Agregar datos visuales sin cambiar la identidad de la tarea | `BoardTaskDecorator`, `decorateBoardTask`, `BoardTaskView` | La tarea base se decora con responsables, vencimiento y progreso | Separacion entre dominio y presentacion, tarjetas mas informativas | Se implementa con composicion funcional, no con herencia clasica |
| `Proxy` | Estructural | Autorizacion de rutas | Validar identidad, rol y pertenencia antes de ejecutar casos de uso | `RouteAuthorizationProxy`, `requireProjectMemberRouteUser`, `requireProjectCoordinatorRouteUser` | El acceso debe controlarse antes de tocar servicios de aplicacion | Seguridad consistente, menos duplicacion en rutas | Debe complementarse con RLS y restricciones de base de datos |
| `Adapter` | Estructural | Persistencia y notificaciones | Traducir contratos de dominio a infraestructura concreta | `SupabaseTaskflowRepository`, `MockTaskflowRepository`, `NotificationEventAdapter` | La aplicacion depende de puertos, no del SDK de Supabase | Cambio de proveedor mas simple, fallback mock, eventos traducidos | Los normalizadores deben mantenerse sincronizados |
| `Bridge` | Estructural | Reportes exportables | Separar el calculo del reporte del formato de salida | `ReportQueryService`, `ReportRenderer`, `HtmlReportRenderer`, `CsvReportRenderer`, `JsonReportRenderer` | Agregar formatos no debe cambiar el caso de uso | HTML, CSV y JSON reutilizan el mismo reporte base | PDF requiere un renderer adicional |
| `Observer` | Comportamiento | Notificaciones de proyecto, tablero, tarea e invitaciones | Desacoplar acciones de dominio de efectos secundarios | `ProjectEventPublisher`, `ProjectNotificationSubscriber` | Los comandos publican eventos; los suscriptores reaccionan | Menor acoplamiento, notificaciones extensibles | Requiere controlar duplicados y errores de suscriptores |

## Evidencia por flujo

### Crear tarea

1. `Proxy`: la ruta valida que el usuario pertenezca al proyecto.
2. `Facade`: la ruta llama `TaskflowService.createTask(...)`.
3. `Factory Method`: la infraestructura crea la tarea base segun `TaskType`.
4. `Builder`: completa subtareas, responsables, horas e historial.
5. `Observer`: `TaskCommandService` publica `TASK_CREATED`.
6. `Adapter`: `NotificationEventAdapter` convierte el evento en notificaciones.
7. `Decorator` y `Composite`: el tablero muestra la tarea con avance, responsables y estado visual.

### Consultar tablero Kanban

1. `Facade`: `TaskflowService.getBoardPageData(...)` expone una entrada simple.
2. `Adapter`: el repositorio activo carga datos desde Supabase o mock.
3. `Composite`: calcula progreso de subtareas.
4. `Decorator`: produce `BoardTaskView`.
5. La UI renderiza columnas, tarjetas, filtros y acciones.

### Generar reporte

1. `Facade`: `TaskflowService.getWorkspaceReport(...)` y `renderWorkspaceReport(...)`.
2. `Bridge`: `ReportQueryService` construye el documento y un renderer define el formato.
3. `HtmlReportRenderer`, `CsvReportRenderer` o `JsonReportRenderer` exportan el mismo reporte.
4. La pantalla `/reports` y la API `/api/reports` comparten la misma abstraccion.

## Archivos clave para defensa

| Patron | Archivos principales |
| --- | --- |
| `Facade` | `lib/application/taskflow-service.ts` |
| `Composite` | `lib/patterns/structural/composite/task-work-item.ts` |
| `Decorator` | `lib/patterns/structural/decorator/board-task-decorator.ts` |
| `Proxy` | `lib/patterns/structural/proxy/route-authorization-proxy.ts`, `lib/api/route-authorization.ts` |
| `Adapter` | `lib/patterns/structural/adapter/notification-event-adapter.ts`, `lib/infrastructure/supabase/supabase-repository.ts` |
| `Bridge` | `lib/application/reports/report-query-service.ts`, `lib/patterns/structural/bridge/report-renderer.ts` |
| `Observer` | `lib/patterns/observer/project-event-publisher.ts`, `lib/application/notifications/project-notification-subscriber.ts` |

## Diagrama PlantUML recomendado

El diagrama mas completo para sustentar relaciones entre entidades, capas y patrones es:

- `docs/taskflow-patterns-complete-diagram.puml`

Para exponer unicamente los patrones estructurales, usa:

- `docs/taskflow-structural-patterns-diagram.puml`

Este archivo muestra:

- entidades principales del dominio,
- contratos y puertos,
- servicios de aplicacion,
- adaptadores Supabase y mock,
- clases concretas donde se implementan los patrones,
- flujos de notificacion, autorizacion, decoracion de tareas y reportes,
- notas de defensa para `Facade`, `Composite`, `Decorator`, `Proxy`, `Adapter`, `Bridge` y `Observer`.

## Artefactos complementarios de entrega

- Tabla de control de cambios de artefactos: `docs/change-control.md`
- Tabla de control de cambios en codigo: `docs/code-change-control.md`
- Guia tecnica de patrones: `docs/design-patterns-guide.md`
- Referencia de clases por patron: `docs/pattern-class-reference.md`

## Reglas de sustentacion

- No presentar `Bridge` como propuesta: ya existe una pantalla y una API de reportes con tres renderers.
- Explicar `Decorator` como composicion de datos para React, no como herencia clasica.
- Explicar `Composite` como estructura actual de dos niveles; si se agregan subtareas anidadas, el mismo contrato puede crecer.
- Explicar `Proxy` junto con seguridad de base de datos: protege la entrada de la aplicacion y debe convivir con RLS.
- Explicar `Adapter` como puerto de dominio mas adaptadores concretos: Supabase y mock.
