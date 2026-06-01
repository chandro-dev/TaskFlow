# Taskflow Architecture

## Alcance implementado

- `RF-01`: Gestión de usuarios y autenticación.
- `RF-02`: Gestión de proyectos.
- `RF-03`: Gestión de tableros Kanban.
- `RF-04`: Gestión de tareas.
- `RF-07`: Búsqueda y filtros.
- `RF-09`: Configuración del sistema.

## Decisiones de arquitectura

- `Next.js 16 App Router`: rutas por segmentos y layouts compartidos.
- `TypeScript estricto`: contratos de dominio y vistas tipadas.
- `Arquitectura por capas`: `domain`, `application`, `infrastructure`, `components`, `app`.
- `Supabase` como base de datos principal, con `MockTaskflowRepository` como fallback para desarrollo sin credenciales.

## Patrones de diseño aplicados

### 1. Singleton

Archivo: `lib/patterns/singleton/supabase-singleton.ts`

- Se centraliza la creación del cliente Supabase.
- Evita múltiples instancias del cliente y concentra la configuración.
- Se alinea con la sugerencia de la guía para conectividad a base de datos.

### 2. Factory Method

Archivo: `lib/patterns/factory/task-factory.ts`

- Cada tipo de tarea (`BUG`, `FEATURE`, `TASK`, `IMPROVEMENT`) usa una fábrica concreta.
- La lógica de prioridad por defecto y construcción base queda encapsulada.
- Se usa en la generación de tareas del seed y puede extenderse para creación real desde formularios.

### 3. Builder

Archivo: `lib/patterns/builder/task-builder.ts`

- Permite crear tareas complejas paso a paso.
- Encapsula etiquetas, responsables, subtareas, comentarios, adjuntos e historial.
- Resuelve el RF-04 con una forma clara de construir tareas avanzadas.

### 4. Prototype

Archivo: `lib/patterns/prototype/clone.ts`

- Se clonan proyectos y tareas como plantillas.
- Refuerza `RF-02.5` y `RF-04.8`.
- En el seed se usa para derivar un proyecto plantilla y una tarea clonada para móvil.

### 5. Abstract Factory

Archivo: `lib/patterns/abstract-factory/theme-factory.ts`

- Crea familias de tokens visuales para modo claro y oscuro.
- Mantiene consistente la configuración de color entre layouts, paneles y controles.
- Da soporte directo a `RF-09.2`.

## Flujo por capas

### Domain

- Modelos del negocio en `lib/domain/models.ts`.
- Contrato del repositorio en `lib/domain/repositories.ts`.

### Application

- `TaskflowService` concentra casos de uso, filtros y composición de vistas.
- La UI no accede directamente al origen de datos.

### Infrastructure

- `MockTaskflowRepository` devuelve un snapshot semilla útil para demo.
- `SupabaseTaskflowRepository` mapea tablas reales a modelos del dominio.
- `repository-factory.ts` selecciona el adaptador activo.

### Presentation

- `app/(auth)` maneja inicio de sesión.
- `app/(workspace)` contiene el shell autenticado.
- `components/taskflow/*` agrupa piezas reutilizables de la interfaz.

## Cobertura funcional por pantalla

### `/`

- Login visual.
- Preparada para integrar autenticación real de Supabase Auth.

### `/projects`

- Listado de proyectos.
- Indicadores de progreso.
- Estado general del proyecto.
- Acceso al tablero por proyecto.
- Búsqueda general.

### `/projects/[projectId]/boards/[boardId]`

- Columnas configurables del tablero.
- Visualización tipo Kanban.
- WIP por columna.
- Filtros por texto, responsable, etiqueta, prioridad, tipo y rango de fechas.
- Indicadores de tarea vencida y progreso de subtareas.

### `/settings`

- Gestión de usuarios del sistema.
- Parámetros globales.
- Tema claro/oscuro y política de contraseñas.

## Notas sobre Supabase

- El repositorio actual usa fallback mock si faltan `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- El esquema SQL propuesto está en `supabase/schema.sql`.
- Para autenticación real, conviene enlazar `profiles.id` con `auth.users.id` y activar RLS por organización/proyecto.
