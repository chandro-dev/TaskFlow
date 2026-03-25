# Pattern Traceability

Este mapa resume donde vive cada patron y en que flujo principal se activa.

Si necesitas la explicacion completa, revisa tambien `docs/design-patterns-guide.md`.

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

## Observer

- Publicador: [project-event-publisher.ts](/e:/proyectos/taskflow/lib/patterns/observer/project-event-publisher.ts)
- Suscriptor de notificaciones: [project-notification-subscriber.ts](/e:/proyectos/taskflow/lib/application/notifications/project-notification-subscriber.ts)
- Publicacion desde comandos: [project-command-service.ts](/e:/proyectos/taskflow/lib/application/projects/project-command-service.ts)
