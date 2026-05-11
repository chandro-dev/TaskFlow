# Tabla de Control de Cambios de Artefactos

## Alcance

Esta tabla documenta los cambios realizados sobre los artefactos construidos en la version anterior del proyecto Taskflow, antes de presentar la implementacion formal de patrones estructurales.

El objetivo es sustentar por que se modifico cada artefacto, que problema resolvia el cambio y como mejora la claridad, mantenibilidad, extensibilidad o trazabilidad de la solucion.

## Criterio de comparacion

- `Version anterior`: primera version de analisis/diseno usada como base del proyecto.
- `Version actual base`: version consolidada de Taskflow con arquitectura por capas, funcionalidades principales, persistencia, documentacion tecnica y patrones creacionales.
- `Alcance de esta tabla`: artefactos documentales y de diseno solicitados para la entrega academica.
- `Exclusion`: la implementacion detallada de patrones estructurales se documenta aparte en `docs/pattern-map.md` y `docs/design-patterns-guide.md`.

## Tabla principal

| No. | Artefacto | Estado en la version anterior | Cambio realizado | Proposito del cambio | Impacto en la solucion | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Descripcion de la aplicacion | La descripcion inicial presentaba Taskflow como una plataforma general de gestion de tareas y proyectos. | Se preciso el alcance como plataforma web para proyectos, tableros Kanban, tareas, subtareas, miembros, invitaciones, notificaciones, filtros y configuracion. | Evitar una definicion demasiado amplia y alinear la descripcion con las funcionalidades reales implementadas. | Mayor claridad para evaluadores y mejor correspondencia entre problema, requisitos y aplicacion. | `docs/taskflow-architecture.md`, `README.md`, pantallas `/projects`, `/boards`, `/settings`. |
| 2 | Requisitos funcionales | Los requisitos estaban definidos de forma general por modulo. | Se reorganizaron alrededor de los bloques solicitados por la guia: usuarios, proyectos/tableros, tareas, notificaciones, historial/busqueda/filtros, reportes/configuracion. | Alinear la solucion con el caso de estudio TaskFlow y facilitar la validacion por rubrica. | Permite rastrear cada funcionalidad requerida hacia rutas, servicios y componentes concretos. | `docs/taskflow-architecture.md`, `app/(workspace)/*`, `app/api/*`. |
| 3 | Gestion de usuarios | El analisis inicial contemplaba usuarios y roles, pero sin separar claramente autenticacion, sesion y perfil. | Se diferencio autenticacion, registro, sesion, perfil, roles y preferencia de tema. | Separar responsabilidades de seguridad, experiencia de usuario y administracion. | Mejora mantenibilidad y permite controlar acceso por rol y pertenencia al proyecto. | `app/(auth)`, `app/api/auth/*`, `lib/auth/*`, `lib/application/auth/*`. |
| 4 | Gestion de proyectos | La version inicial consideraba proyectos como contenedores de tareas. | Se agregaron estados, propietario, miembros, fechas, tablero inicial y capacidad de clonado. | Convertir el proyecto en agregado principal del dominio, no solo en una agrupacion simple. | El dominio soporta administracion real de proyectos, avance, miembros e historial operativo. | `lib/domain/models.ts`, `lib/application/projects/*`, `components/taskflow/project-*`. |
| 5 | Gestion de tableros Kanban | El tablero inicial era una vista basica de columnas. | Se agregaron multiples tableros por proyecto, columnas configurables, limites WIP, colores y reordenamiento. | Hacer el tablero extensible y mas cercano a un flujo Kanban real. | Permite adaptar el flujo de trabajo por proyecto sin cambiar codigo de negocio. | `app/(workspace)/boards/page.tsx`, `components/taskflow/board-*`, `lib/application/boards/*`. |
| 6 | Gestion de tareas | Las tareas estaban planteadas como items simples con estado. | Se ampliaron con tipo, prioridad, responsables, subtareas, fechas, horas estimadas, horas ejecutadas, clonado, movimiento e historial. | Aumentar la expresividad del dominio y soportar seguimiento real del trabajo. | Mejora el control operativo, filtros, reportes y trazabilidad de cambios. | `lib/domain/models.ts`, `components/taskflow/task-*`, `lib/application/tasks/*`. |
| 7 | Sistema de notificaciones | En la version anterior no estaba completamente separado de los casos de uso. | Se agrego un modulo de notificaciones con eventos, centro de notificaciones y persistencia. | Desacoplar acciones del dominio de los mensajes mostrados a usuarios. | Reduce acoplamiento y permite extender nuevos eventos sin reescribir comandos principales. | `components/taskflow/notification-center.tsx`, `lib/application/notifications/*`, `lib/patterns/observer/*`. |
| 8 | Historial y auditoria | El historial estaba contemplado como necesidad funcional, pero sin estructura consistente. | Se agregaron entidades y tablas de historial de tareas, registros de acciones y carga desde Supabase/mock. | Trazar creacion, edicion, movimiento y clonado de tareas. | Mejora la auditabilidad tecnica y habilita futuras vistas detalladas de auditoria. | `TaskHistoryEntry` en `lib/domain/models.ts`, `task_history` en Prisma/Supabase, `lib/infrastructure/supabase/supabase-task-command.ts`. |
| 9 | Busqueda y filtros | La busqueda inicial era general. | Se incorporaron filtros por texto, responsable, etiqueta, prioridad, tipo y rango de fechas. | Facilitar navegacion y analisis de tareas en tableros con mayor volumen de informacion. | Mejora usabilidad y soporta escenarios de seguimiento por equipo. | `app/(workspace)/projects/[projectId]/boards/[boardId]/page.tsx`, `lib/application/shared/workspace-mappers.ts`. |
| 10 | Reportes y configuracion | La configuracion existia como idea general y los reportes no estaban formalizados. | Se consolidaron parametros globales, tema y base para reportes ejecutivos. | Cubrir el bloque funcional de reportes/configuracion solicitado por la guia. | Permite visualizar estado del trabajo y administrar preferencias del sistema. | `app/(workspace)/settings/page.tsx`, `app/(workspace)/reports/page.tsx`, `lib/application/reports/*`. |
| 11 | Diagrama de casos de uso | Los actores y casos estaban planteados de forma general. | Se actualizaron los casos alrededor de administrador, project manager/desarrollador, autenticacion, gestion de proyectos, tareas, invitaciones, notificaciones y reportes. | Reflejar actores reales y permisos implementados. | Mejora la consistencia entre analisis, rutas protegidas y roles del sistema. | Documentacion tecnica existente y rutas `app/api/projects/*`, `lib/api/route-authorization.ts`. |
| 12 | Diseno conceptual / mockups | La version previa tenia pantallas conceptuales mas generales. | Se consolidaron pantallas funcionales reales: login, registro, proyectos, tableros, modal de tareas, invitaciones, configuracion y reportes. | Sustituir mockups abstractos por vistas funcionales del sistema. | Reduce ambiguedad de diseno y facilita la sustentacion mostrando la aplicacion en ejecucion. | `components/taskflow/*`, `app/(auth)/*`, `app/(workspace)/*`. |
| 13 | Diagrama de arquitectura / componentes C4 | La arquitectura inicial no separaba con suficiente detalle dominio, aplicacion e infraestructura. | Se documento arquitectura por capas: `domain`, `application`, `infrastructure`, `components` y `app`. | Aplicar separacion de responsabilidades y bajo acoplamiento. | Facilita pruebas, sustitucion de repositorios y explicacion de patrones. | `docs/taskflow-architecture.md`, `lib/domain`, `lib/application`, `lib/infrastructure`. |
| 14 | Diagrama de clases UML | El modelo inicial cubria entidades principales, pero no todos los servicios ni patrones. | Se agregaron diagramas PlantUML con entidades, contratos, servicios, repositorios y participantes de patrones. | Mejorar trazabilidad entre codigo, dominio y patrones de diseno. | Permite sustentar UML con clases reales del proyecto. | `docs/taskflow-class-diagram.puml`, `docs/taskflow-patterns-complete-diagram.puml`, `docs/patterns-full-participants-diagram.puml`. |
| 15 | Modelo de dominio | El dominio estaba centrado en usuario, proyecto, tablero y tarea. | Se agregaron invitaciones, notificaciones, configuracion, historial, miembros, etiquetas y filtros. | Representar mejor las reglas reales de colaboracion y seguimiento. | El modelo queda preparado para persistencia, reportes y autorizacion. | `lib/domain/models.ts`, `prisma/schema.prisma`, `supabase/schema.sql`. |
| 16 | Modelo de base de datos | La primera version requeria una estructura persistente mas completa. | Se agregaron migraciones para miembros, invitaciones, notificaciones, historial, clonado, temas y horas trabajadas. | Alinear persistencia con requisitos funcionales y flujos reales. | La aplicacion puede operar con Supabase y mantener fallback mock. | `prisma/migrations/*`, `supabase/migrations/*`, `supabase/schema.sql`. |
| 17 | Patrones creacionales | La version anterior identificaba patrones sugeridos, pero necesitaba evidencia de implementacion. | Se implementaron y documentaron `Singleton`, `Factory Method`, `Abstract Factory`, `Prototype` y `Builder`. | Demostrar uso de patrones para resolver problemas concretos de creacion, configuracion y clonado. | Mejora extensibilidad y reduce condicionales o construcciones dispersas. | `lib/patterns/*`, `docs/design-patterns-guide.md`, `docs/pattern-traceability.md`. |
| 18 | Documentacion tecnica | La documentacion inicial no estaba centralizada para sustentacion. | Se agregaron guias de arquitectura, trazabilidad de patrones, mapa formal de patrones y diagramas PlantUML. | Facilitar defensa academica y revision del codigo. | El evaluador puede rastrear cada patron y requisito hacia archivos concretos. | `docs/taskflow-architecture.md`, `docs/pattern-map.md`, `docs/pattern-class-reference.md`, `docs/taskflow-patterns-complete-diagram.puml`. |
| 19 | Frontend | La version previa tenia vistas mas basicas. | Se consolidaron componentes reutilizables para proyectos, tableros, tareas, modales, invitaciones, notificaciones, tema y configuracion. | Mejorar consistencia visual, reutilizacion y experiencia de usuario. | Interfaz mas completa y alineada con flujos reales de trabajo. | `components/taskflow/*`, `app/(workspace)/*`. |
| 20 | Backend / API | El backend inicial requeria mayor cobertura de operaciones. | Se agregaron rutas API para autenticacion, proyectos, tableros, columnas, tareas, clonado, invitaciones, notificaciones, reportes y configuracion. | Exponer casos de uso completos desde Next.js App Router. | La aplicacion queda funcional end-to-end y no solo como prototipo visual. | `app/api/*`, `lib/application/*`. |
| 21 | Seguridad y autorizacion | La version previa dependia de validaciones basicas. | Se agregaron validaciones por sesion, rol, propietario, miembro y project manager. | Proteger operaciones sensibles de proyectos, tableros, miembros e invitaciones. | Mejora seguridad y consistencia de permisos en rutas. | `lib/auth/current-user.ts`, `lib/api/require-route-user.ts`, `lib/api/route-authorization.ts`, `lib/domain/policies/project-access-policy.ts`. |
| 22 | Variables de entorno y despliegue | La version anterior dependia de configuracion local. | Se mantuvo configuracion por `.env`, `.env.local`, `.env.example` y fallback mock si no hay Supabase. | Permitir ejecucion local y demo sin credenciales reales. | Reduce friccion de instalacion y permite validar la app en diferentes entornos. | `.env.example`, `lib/infrastructure/repository-factory.ts`, `lib/infrastructure/mock/*`. |

## Resumen ejecutivo de cambios

La version actual base mejora la version anterior en cinco frentes:

1. Mayor cobertura funcional del caso TaskFlow.
2. Separacion clara por capas y contratos.
3. Modelo de dominio mas completo y persistible.
4. Evidencia documental de patrones creacionales y arquitectura.
5. Base solida para incorporar y sustentar patrones estructurales.

## Riesgos o puntos pendientes identificados

| Punto | Estado | Recomendacion |
| --- | --- | --- |
| README tecnico | Parcial | Reemplazar el README generico de Next.js por instrucciones propias del proyecto. |
| Dockerizacion | Pendiente | Agregar `Dockerfile` y/o `docker-compose.yml` si se quiere cubrir completamente la recomendacion de despliegue. |
| Historial visible en UI | Parcial | Mostrar historial de tarea en modal o vista de auditoria para fortalecer la evidencia funcional. |
| Diagramas renderizados | Parcial | Exportar los `.puml` a PNG/SVG para anexarlos al PDF final. |
| Control de cambios en codigo | Documentado | Ver `docs/code-change-control.md` para la tabla especifica de problemas de codigo, efectos y mejoras aplicadas. |

## Nota para el documento final

Esta tabla puede anexarse en la seccion "Tabla de control de cambios" del PDF final. Para evitar duplicidad, la tabla de patrones debe referenciar `docs/pattern-map.md` y la tabla de control de cambios en codigo debe tomarse de `docs/code-change-control.md`.
