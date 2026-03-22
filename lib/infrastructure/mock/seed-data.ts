import type {
  Board,
  Label,
  MemberInvitation,
  Project,
  SystemSettings,
  TaskflowSnapshot,
  UserProfile,
} from "@/lib/domain/models";
import { TaskBuilder } from "@/lib/patterns/builder/task-builder";
import { MemberInvitationBuilder } from "@/lib/patterns/builder/member-invitation-builder";
import { createInvitationFactory } from "@/lib/patterns/factory/invitation-factory";
import { createTaskFactory } from "@/lib/patterns/factory/task-factory";
import { InvitationPrototype } from "@/lib/patterns/prototype/invitation-prototype";
import { ProjectPrototype, TaskPrototype } from "@/lib/patterns/prototype/clone";

const labels: Record<string, Label> = {
  diseno: { id: "label-diseno", name: "Diseño", color: "#d7e7ff" },
  frontend: { id: "label-frontend", name: "Frontend", color: "#d4f5f1" },
  bug: { id: "label-bug", name: "Bug", color: "#ffe0e6" },
  ux: { id: "label-ux", name: "UX", color: "#f7ecce" },
  backend: { id: "label-backend", name: "Backend", color: "#e0dcff" },
};

const users: UserProfile[] = [
  {
    id: "user-admin",
    name: "Laura Torres",
    email: "laura@taskflow.dev",
    role: "ADMIN",
    avatar: "LT",
    bio: "Administra la configuración global y los accesos.",
    lastAccess: "2026-03-22T09:05:00.000Z",
    themePreference: "light",
    isActive: true,
  },
  {
    id: "user-pm",
    name: "Juan Pérez",
    email: "juan@taskflow.dev",
    role: "PROJECT_MANAGER",
    avatar: "JP",
    bio: "Coordina proyectos y da seguimiento al tablero principal.",
    lastAccess: "2026-03-22T08:40:00.000Z",
    themePreference: "light",
    isActive: true,
  },
  {
    id: "user-dev-1",
    name: "María Gómez",
    email: "maria@taskflow.dev",
    role: "DEVELOPER",
    avatar: "MG",
    bio: "Frontend engineer enfocada en experiencia de usuario.",
    lastAccess: "2026-03-21T18:10:00.000Z",
    themePreference: "dark",
    isActive: true,
  },
  {
    id: "user-dev-2",
    name: "Diego Ruiz",
    email: "diego@taskflow.dev",
    role: "DEVELOPER",
    avatar: "DR",
    bio: "Backend engineer responsable de integraciones.",
    lastAccess: "2026-03-21T17:45:00.000Z",
    themePreference: "light",
    isActive: true,
  },
  {
    id: "user-disabled",
    name: "Ana Ramírez",
    email: "ana@taskflow.dev",
    role: "DEVELOPER",
    avatar: "AR",
    bio: "Cuenta desactivada para pruebas de administración.",
    lastAccess: "2026-03-10T12:30:00.000Z",
    themePreference: "light",
    isActive: false,
  },
];

const settings: SystemSettings = {
  platformName: "Taskflow",
  maxAttachmentMb: 10,
  passwordPolicy: "Mínimo 10 caracteres, mayúscula, número y símbolo.",
  defaultTheme: "light",
};

const boards: Board[] = [
  {
    id: "board-web-main",
    projectId: "project-web",
    name: "Tablero Kanban",
    columns: [
      {
        id: "column-todo",
        boardId: "board-web-main",
        name: "Por hacer",
        order: 1,
        color: "#b8c2d4",
        wipLimit: 4,
      },
      {
        id: "column-progress",
        boardId: "board-web-main",
        name: "En progreso",
        order: 2,
        color: "#d7ca1c",
        wipLimit: 3,
      },
      {
        id: "column-review",
        boardId: "board-web-main",
        name: "En revisión",
        order: 3,
        color: "#4786ff",
        wipLimit: 2,
      },
      {
        id: "column-done",
        boardId: "board-web-main",
        name: "Completadas",
        order: 4,
        color: "#35d446",
        wipLimit: 999,
      },
    ],
  },
  {
    id: "board-mobile-main",
    projectId: "project-mobile",
    name: "Roadmap móvil",
    columns: [
      {
        id: "column-mobile-todo",
        boardId: "board-mobile-main",
        name: "Por hacer",
        order: 1,
        color: "#b8c2d4",
      },
      {
        id: "column-mobile-progress",
        boardId: "board-mobile-main",
        name: "En progreso",
        order: 2,
        color: "#d7ca1c",
      },
      {
        id: "column-mobile-done",
        boardId: "board-mobile-main",
        name: "Completadas",
        order: 3,
        color: "#35d446",
      },
    ],
  },
  {
    id: "board-archive-main",
    projectId: "project-archive",
    name: "Documentación cerrada",
    columns: [
      {
        id: "column-archive-done",
        boardId: "board-archive-main",
        name: "Completadas",
        order: 1,
        color: "#35d446",
      },
    ],
  },
];

const projects: Project[] = [
  {
    id: "project-web",
    name: "Diseño de app web",
    description:
      "Rediseño de la plataforma principal con foco en autenticación, tableros y tareas.",
    startDate: "2026-03-01",
    endDate: "2026-04-18",
    state: "EN_PROGRESO",
    archived: false,
    memberIds: ["user-admin", "user-pm", "user-dev-1", "user-dev-2"],
    ownerId: "user-pm",
    boardIds: ["board-web-main"],
  },
  {
    id: "project-mobile",
    name: "Portal móvil cliente",
    description:
      "Versión ligera del flujo Kanban para ejecución rápida de tareas de soporte.",
    startDate: "2026-02-05",
    endDate: "2026-04-01",
    state: "PAUSADO",
    archived: false,
    memberIds: ["user-admin", "user-pm", "user-dev-1"],
    ownerId: "user-admin",
    boardIds: ["board-mobile-main"],
  },
  {
    id: "project-archive",
    name: "Migración documental",
    description: "Proyecto ya completado y archivado como solo lectura.",
    startDate: "2025-11-05",
    endDate: "2026-01-18",
    state: "ARCHIVADO",
    archived: true,
    memberIds: ["user-admin", "user-dev-2"],
    ownerId: "user-admin",
    boardIds: ["board-archive-main"],
  },
];

function buildWebTasks() {
  const task01 = new TaskBuilder(
    createTaskFactory("FEATURE").create({
      id: "task-auth",
      projectId: "project-web",
      boardId: "board-web-main",
      columnId: "column-progress",
      title: "Implementar login",
      description:
        "Formulario de acceso con correo, contraseña y sesion persistente.",
      dueDate: "2026-03-24",
      estimateHours: 14,
      spentHours: 8,
      priority: "ALTA",
    }),
  )
    .withLabel(labels.frontend)
    .withLabel(labels.ux)
    .withAssignee("user-dev-1")
    .withSubtask("Validar reglas de contraseña", true)
    .withSubtask("Integrar sesión persistente", false)
    .withComment({
      authorId: "user-pm",
      content: "Alinear la pantalla con el mockup de inicio de sesión.",
      createdAt: "2026-03-20T15:20:00.000Z",
    })
    .withHistory({
      actorId: "user-pm",
      action: "Creó la tarea",
      occurredAt: "2026-03-18T10:32:00.000Z",
      toColumnId: "column-progress",
    })
    .withHistory({
      actorId: "user-dev-1",
      action: 'Cambió estado a "En progreso"',
      occurredAt: "2026-03-19T11:05:00.000Z",
      fromColumnId: "column-todo",
      toColumnId: "column-progress",
    })
    .build();

  const task02 = new TaskBuilder(
    createTaskFactory("BUG").create({
      id: "task-portal",
      projectId: "project-web",
      boardId: "board-web-main",
      columnId: "column-todo",
      title: "Rediseño portal web",
      description:
        "Ajustes visuales del home, card de proyecto y adaptación móvil.",
      dueDate: "2026-03-28",
      estimateHours: 10,
      priority: "MEDIA",
    }),
  )
    .withLabel(labels.diseno)
    .withLabel(labels.bug)
    .withAssignee("user-dev-1")
    .withSubtask("Alinear tipografía", true)
    .withSubtask("Actualizar estados hover", false)
    .withHistory({
      actorId: "user-pm",
      action: "Registró la tarea",
      occurredAt: "2026-03-21T08:12:00.000Z",
      toColumnId: "column-todo",
    })
    .build();

  const reviewTaskBase = new TaskBuilder(
    createTaskFactory("IMPROVEMENT").create({
      id: "task-search",
      projectId: "project-web",
      boardId: "board-web-main",
      columnId: "column-review",
      title: "Búsqueda avanzada",
      description:
        "Motor de filtros por responsable, etiqueta, prioridad, tipo y rango de fechas.",
      dueDate: "2026-03-26",
      estimateHours: 12,
      spentHours: 6,
      priority: "URGENTE",
    }),
  )
    .withLabel(labels.frontend)
    .withLabel(labels.backend)
    .withAssignee("user-dev-2")
    .withAssignee("user-dev-1")
    .withSubtask("Persistir filtros guardados", false)
    .withSubtask("Optimizar consulta de texto libre", true)
    .withAttachment({
      name: "spec-filtros.pdf",
      sizeMb: 1.2,
      url: "#",
    })
    .withHistory({
      actorId: "user-admin",
      action: 'Movió tarea a "En revisión"',
      occurredAt: "2026-03-22T09:15:00.000Z",
      fromColumnId: "column-progress",
      toColumnId: "column-review",
    })
    .build();

  const clonedReviewTask = new TaskPrototype(reviewTaskBase).clone({
    id: "task-search-template",
    title: "Búsqueda avanzada mobile",
    projectId: "project-mobile",
    boardId: "board-mobile-main",
    columnId: "column-mobile-progress",
    dueDate: "2026-03-29",
  });

  const task03 = new TaskBuilder(reviewTaskBase)
    .withComment({
      authorId: "user-admin",
      content: "Validar el filtro por rango de fechas antes de aprobar.",
      createdAt: "2026-03-22T10:20:00.000Z",
    })
    .build();

  const task04 = new TaskBuilder(
    createTaskFactory("TASK").create({
      id: "task-settings",
      projectId: "project-web",
      boardId: "board-web-main",
      columnId: "column-done",
      title: "Configuración del sistema",
      description:
        "Pantalla para parámetros globales, políticas y gestión de usuarios.",
      dueDate: "2026-03-18",
      estimateHours: 9,
      spentHours: 9,
      priority: "MEDIA",
    }),
  )
    .withLabel(labels.backend)
    .withAssignee("user-admin")
    .withSubtask("Definir límite de adjuntos", true)
    .withSubtask("Configurar política de contraseñas", true)
    .withHistory({
      actorId: "user-admin",
      action: 'Marcó tarea como "Completada"',
      occurredAt: "2026-03-18T17:30:00.000Z",
      fromColumnId: "column-review",
      toColumnId: "column-done",
    })
    .build();

  const task05 = new TaskBuilder(
    createTaskFactory("FEATURE").create({
      id: "task-members",
      projectId: "project-web",
      boardId: "board-web-main",
      columnId: "column-done",
      title: "Invitar miembros por correo",
      description:
        "Incorporar miembros al proyecto con rol y permisos diferenciados.",
      dueDate: "2026-03-16",
      estimateHours: 8,
      spentHours: 7,
      priority: "MEDIA",
    }),
  )
    .withLabel(labels.backend)
    .withAssignee("user-dev-2")
    .withSubtask("Validar usuario repetido", true)
    .withSubtask("Enviar invitación de prueba", true)
    .build();

  return [task01, task02, task03, task04, task05, clonedReviewTask];
}

function buildProjects() {
  const snapshotProjects = structuredClone(projects);
  const projectTemplate = new ProjectPrototype(snapshotProjects[0]).clone({
    id: "project-web-template",
    name: "Plantilla sprint UI",
    description:
      "Clon de estructura usado como plantilla para proyectos rápidos de interfaz.",
    state: "PLANIFICADO",
    archived: false,
    boardIds: ["board-mobile-main"],
  });

  snapshotProjects.splice(2, 0, projectTemplate);
  return snapshotProjects;
}

function buildInvitations(): MemberInvitation[] {
  const baseInvitation = new MemberInvitationBuilder(
    createInvitationFactory("EMAIL").create({
      id: "invite-frontend",
      projectId: "project-web",
      email: "sofia@taskflow.dev",
      role: "DEVELOPER",
      invitedBy: "user-pm",
      message: "Necesitamos apoyo en la implementacion de tableros y filtros.",
    }),
  )
    .withExpiry(5)
    .build();

  const resentInvitation = new InvitationPrototype(baseInvitation).clone({
    id: "invite-ux",
    email: "carolina@taskflow.dev",
    message: "Invitacion para colaborar en el sprint de experiencia de usuario.",
  });

  const acceptedInvitation = new MemberInvitationBuilder(
    createInvitationFactory("EMAIL").create({
      id: "invite-backend",
      projectId: "project-mobile",
      email: "diego@taskflow.dev",
      role: "DEVELOPER",
      invitedBy: "user-admin",
      message: "Apoyo puntual para integracion de soporte movil.",
    }),
  )
    .asAccepted()
    .build();

  return [baseInvitation, resentInvitation, acceptedInvitation];
}

export function buildMockSnapshot(): TaskflowSnapshot {
  const mainTasks = buildWebTasks();

  const archiveTask = new TaskBuilder(
    createTaskFactory("TASK").create({
      id: "task-archive",
      projectId: "project-archive",
      boardId: "board-archive-main",
      columnId: "column-archive-done",
      title: "Migración completada",
      description: "Cierre documental del proyecto legado.",
      dueDate: "2026-01-18",
      estimateHours: 5,
      spentHours: 5,
    }),
  )
    .withAssignee("user-dev-2")
    .build();

  return {
    currentUser: users[0],
    users,
    settings,
    projects: buildProjects(),
    boards,
    tasks: [...mainTasks, archiveTask],
    invitations: buildInvitations(),
  };
}
