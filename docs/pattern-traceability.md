# Pattern Traceability

Este mapa resume donde vive cada patron y en que flujo principal se activa.

Si necesitas la explicacion completa, revisa tambien `docs/design-patterns-guide.md`.
Para la tabla formal de entrega, revisa `docs/pattern-map.md`.

## Singleton

- Implementacion: [theme-singleton.ts](/e:/proyectos/taskflow/lib/patterns/singleton/theme-singleton.ts)
- Uso principal: [theme-toggle.tsx](/e:/proyectos/taskflow/components/taskflow/theme-toggle.tsx)
- Uso principal: [settings-form.tsx](/e:/proyectos/taskflow/components/taskflow/settings-form.tsx)
- Uso mock: [mock-store.ts](/e:/proyectos/taskflow/lib/infrastructure/mock/mock-store.ts)

## Abstract Factory

- Implementacion: [theme-factory.ts](/e:/proyectos/taskflow/lib/patterns/abstract-factory/theme-factory.ts)
- Entrada principal: `createThemeArtifacts(mode)`
- Uso en shell inicial: [layout.tsx](/e:/proyectos/taskflow/app/layout.tsx)
- Consumido por: [theme-singleton.ts](/e:/proyectos/taskflow/lib/patterns/singleton/theme-singleton.ts)

## Builder

- Registro: [user-registration-builder.ts](/e:/proyectos/taskflow/lib/patterns/builder/user-registration-builder.ts)
- Proyecto: [project-builder.ts](/e:/proyectos/taskflow/lib/patterns/builder/project-builder.ts)
- Tarea: [task-builder.ts](/e:/proyectos/taskflow/lib/patterns/builder/task-builder.ts)
- Edicion de tarea: [task-update-builder.ts](/e:/proyectos/taskflow/lib/patterns/builder/task-update-builder.ts)
- Invitacion: [member-invitation-builder.ts](/e:/proyectos/taskflow/lib/patterns/builder/member-invitation-builder.ts)
- Notificacion: [project-notification-builder.ts](/e:/proyectos/taskflow/lib/patterns/builder/project-notification-builder.ts)

## Factory Method

- Tareas por tipo: [task-factory.ts](/e:/proyectos/taskflow/lib/patterns/factory/task-factory.ts)
- Tableros por defecto: [board-factory.ts](/e:/proyectos/taskflow/lib/patterns/factory/board-factory.ts)
- Perfil inicial de usuario: [user-profile-factory.ts](/e:/proyectos/taskflow/lib/patterns/factory/user-profile-factory.ts)
- Invitaciones por canal: [invitation-factory.ts](/e:/proyectos/taskflow/lib/patterns/factory/invitation-factory.ts)
- Composicion de notificaciones por evento: [notification-composer-factory.ts](/e:/proyectos/taskflow/lib/patterns/factory/notification-composer-factory.ts)

## Prototype

- Clonado de tareas y subtareas: [clone.ts](/e:/proyectos/taskflow/lib/patterns/prototype/clone.ts)
- Reenvio de invitaciones: [invitation-prototype.ts](/e:/proyectos/taskflow/lib/patterns/prototype/invitation-prototype.ts)
- Caso de uso principal: [task-clone-service.ts](/e:/proyectos/taskflow/lib/application/tasks/task-clone-service.ts)
- Caso de uso de proyecto: [project-clone-service.ts](/e:/proyectos/taskflow/lib/application/projects/project-clone-service.ts)

## Observer

- Publicador: [project-event-publisher.ts](/e:/proyectos/taskflow/lib/patterns/observer/project-event-publisher.ts)
- Suscriptor de notificaciones: [project-notification-subscriber.ts](/e:/proyectos/taskflow/lib/application/notifications/project-notification-subscriber.ts)
- Publicacion desde comandos: [project-command-service.ts](/e:/proyectos/taskflow/lib/application/projects/project-command-service.ts)

## Facade

- Fachada principal: [taskflow-service.ts](/e:/proyectos/taskflow/lib/application/taskflow-service.ts)
- Ensamble de servicios: [application-service-factory.ts](/e:/proyectos/taskflow/lib/application/application-service-factory.ts)
- Uso en paginas: [projects/page.tsx](/e:/proyectos/taskflow/app/(workspace)/projects/page.tsx)
- Uso en API: [route.ts](/e:/proyectos/taskflow/app/api/projects/route.ts)
- Proposito: ocultar la coordinacion de servicios de aplicacion detras de metodos como `createProject`, `createTask`, `getBoardPageData`, `login` y `acceptInvitation`.

## Composite

- Modelo padre: [models.ts](/e:/proyectos/taskflow/lib/domain/models.ts)
- Subtareas: `Task.subtasks`
- Calculo de avance: [workspace-mappers.ts](/e:/proyectos/taskflow/lib/application/shared/workspace-mappers.ts)
- Uso visual: [task-card.tsx](/e:/proyectos/taskflow/components/taskflow/task-card.tsx)
- Proposito: tratar tarea y subtareas como una unidad para calcular y mostrar progreso.

## Decorator

- Modelo decorado: [models.ts](/e:/proyectos/taskflow/lib/domain/models.ts)
- Vista enriquecida: `BoardTaskView`
- Enriquecimiento: [workspace-mappers.ts](/e:/proyectos/taskflow/lib/application/shared/workspace-mappers.ts)
- Presentacion: [task-card.tsx](/e:/proyectos/taskflow/components/taskflow/task-card.tsx)
- Proposito: agregar etiquetas, responsables, vencimiento, horas y progreso a la tarjeta sin cambiar la identidad de la tarea.

## Proxy

- Sesion requerida: [current-user.ts](/e:/proyectos/taskflow/lib/auth/current-user.ts)
- Usuario requerido en API: [require-route-user.ts](/e:/proyectos/taskflow/lib/api/require-route-user.ts)
- Autorizacion por proyecto: [route-authorization.ts](/e:/proyectos/taskflow/lib/api/route-authorization.ts)
- Uso en tareas: [route.ts](/e:/proyectos/taskflow/app/api/projects/[projectId]/boards/[boardId]/tasks/route.ts)
- Proposito: validar identidad, rol y pertenencia antes de permitir operaciones sensibles.

## Adapter

- Puerto de dominio: [repositories.ts](/e:/proyectos/taskflow/lib/domain/repositories.ts)
- Adaptador Supabase: [supabase-repository.ts](/e:/proyectos/taskflow/lib/infrastructure/supabase/supabase-repository.ts)
- Adaptador mock: [mock-repository.ts](/e:/proyectos/taskflow/lib/infrastructure/mock/mock-repository.ts)
- Selector de adaptador: [repository-factory.ts](/e:/proyectos/taskflow/lib/infrastructure/repository-factory.ts)
- Adaptador de notificaciones: [project-notification-subscriber.ts](/e:/proyectos/taskflow/lib/application/notifications/project-notification-subscriber.ts)
- Proposito: traducir el contrato del dominio hacia Supabase, mock y registros de notificacion.

## Bridge

- Abstraccion de reportes: [report-query-service.ts](/e:/proyectos/taskflow/lib/application/reports/report-query-service.ts)
- Implementadores: [report-renderer.ts](/e:/proyectos/taskflow/lib/patterns/structural/bridge/report-renderer.ts)
- Vista de reportes: [page.tsx](/e:/proyectos/taskflow/app/(workspace)/reports/page.tsx)
- Exportacion: [route.ts](/e:/proyectos/taskflow/app/api/reports/route.ts)
- Datos fuente: [taskflow-service.ts](/e:/proyectos/taskflow/lib/application/taskflow-service.ts)
- Proposito: separar el calculo del reporte del formato de salida para entregar HTML, CSV o JSON sin cambiar el caso de uso.
