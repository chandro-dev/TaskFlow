import type {
  ProjectState,
  TaskPriority,
  TaskType,
  UserRole,
} from "@/lib/domain/models";

const LOCALE = "es-CO";

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function percentage(value: number) {
  return `${Math.round(value)}%`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    ADMIN: "Administrador",
    PROJECT_MANAGER: "Project Manager",
    DEVELOPER: "Developer",
  };

  return labels[role];
}

export function projectStateLabel(state: ProjectState) {
  const labels: Record<ProjectState, string> = {
    PLANIFICADO: "Planificado",
    EN_PROGRESO: "En progreso",
    PAUSADO: "Pausado",
    COMPLETADO: "Completado",
    ARCHIVADO: "Archivado",
  };

  return labels[state];
}

export function priorityLabel(priority: TaskPriority) {
  const labels: Record<TaskPriority, string> = {
    BAJA: "Baja",
    MEDIA: "Media",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return labels[priority];
}

export function taskTypeLabel(type: TaskType) {
  const labels: Record<TaskType, string> = {
    BUG: "Bug",
    FEATURE: "Feature",
    TASK: "Task",
    IMPROVEMENT: "Improvement",
  };

  return labels[type];
}
