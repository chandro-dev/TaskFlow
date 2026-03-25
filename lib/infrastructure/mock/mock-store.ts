import type {
  CloneTaskInput,
  CreateProjectNotificationInput,
  CreateBoardInput,
  CreateProjectInput,
  CreateProjectResult,
  CreateInvitationInput,
  CreateTaskInput,
  MemberInvitation,
  MoveTaskInput,
  ProjectNotification,
  RegisterUserInput,
  RegisterUserResult,
  SystemSettings,
  Task,
  TaskSubtaskInput,
  TaskflowSnapshot,
  ThemeMode,
  UpdateTaskInput,
  UpdateInvitationStatusInput,
  UpdateProjectInput,
  UpdateSystemSettingsInput,
  UserRole,
} from "@/lib/domain/models";
import { buildMockSnapshot } from "@/lib/infrastructure/mock/seed-data";
import { MemberInvitationBuilder } from "@/lib/patterns/builder/member-invitation-builder";
import { ProjectNotificationBuilder } from "@/lib/patterns/builder/project-notification-builder";
import { ProjectBuilder } from "@/lib/patterns/builder/project-builder";
import { TaskBuilder } from "@/lib/patterns/builder/task-builder";
import { UserRegistrationBuilder } from "@/lib/patterns/builder/user-registration-builder";
import { createBoardFactory } from "@/lib/patterns/factory/board-factory";
import { createInvitationFactory } from "@/lib/patterns/factory/invitation-factory";
import { createTaskFactory } from "@/lib/patterns/factory/task-factory";
import { createUserProfileFactory } from "@/lib/patterns/factory/user-profile-factory";
import { InvitationPrototype } from "@/lib/patterns/prototype/invitation-prototype";
import { SubtaskPrototype, TaskPrototype } from "@/lib/patterns/prototype/clone";

export class MockTaskflowStore {
  private static instance: MockTaskflowStore | null = null;
  private snapshot: TaskflowSnapshot;

  private constructor() {
    this.snapshot = buildMockSnapshot();
  }

  static getInstance() {
    // Pattern traceability: Singleton.
    // The mock store behaves like one shared in-memory database during local
    // execution so all requests observe the same evolving snapshot.
    if (!this.instance) {
      this.instance = new MockTaskflowStore();
    }

    return this.instance;
  }

  loadSnapshot() {
    return structuredClone(this.snapshot);
  }

  findUserById(userId: string) {
    const user = this.snapshot.users.find((item) => item.id === userId) ?? null;
    return user ? structuredClone(user) : null;
  }

  findUserByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user =
      this.snapshot.users.find(
        (item) => item.email.toLowerCase() === normalizedEmail,
      ) ?? null;

    return user ? structuredClone(user) : null;
  }

  registerUser(input: RegisterUserInput): RegisterUserResult {
    const registration = new UserRegistrationBuilder(input)
      .normalize()
      .validate()
      .build();

    const emailExists = this.snapshot.users.some(
      (user) => user.email.toLowerCase() === registration.email,
    );

    if (emailExists) {
      throw new Error("Ya existe un usuario registrado con ese correo.");
    }

    const user = createUserProfileFactory().create(registration);
    this.snapshot.users.unshift(user);
    this.snapshot.currentUser = user;

    return {
      user: structuredClone(user),
      requiresEmailConfirmation: false,
    };
  }

  createProject(input: CreateProjectInput): CreateProjectResult {
    const projectId = crypto.randomUUID();
    // Builder validates project input. Board factory injects the default Kanban
    // structure without duplicating setup logic in the store.
    const project = new ProjectBuilder(input).normalize().validate().buildProject(projectId);
    const { board } = createBoardFactory().create(projectId);

    project.boardIds = [board.id];
    project.memberIds = [input.ownerId];

    this.snapshot.projects.unshift(project);
    this.snapshot.projectMembers.unshift({
      projectId: project.id,
      userId: input.ownerId,
      memberRole: "PROJECT_MANAGER",
      invitedBy: input.ownerId,
    });
    this.snapshot.boards.unshift(board);

    return {
      project: structuredClone(project),
      board: structuredClone(board),
    };
  }

  updateProject(input: UpdateProjectInput) {
    const project = this.snapshot.projects.find((item) => item.id === input.projectId);

    if (!project) {
      throw new Error("Proyecto no encontrado.");
    }

    const validated = new ProjectBuilder({
      name: input.name,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      ownerId: project.ownerId,
      state: input.state,
    })
      .normalize()
      .validate()
      .buildProject(project.id);

    project.name = validated.name;
    project.description = validated.description;
    project.startDate = validated.startDate;
    project.endDate = validated.endDate;
    project.state = validated.state;
    project.archived = input.archived;

    return structuredClone(project);
  }

  deleteProject(projectId: string) {
    const project = this.snapshot.projects.find((item) => item.id === projectId);

    if (!project) {
      throw new Error("Proyecto no encontrado.");
    }

    const boardIds = new Set(project.boardIds);
    const taskIds = new Set(
      this.snapshot.tasks
        .filter((item) => item.projectId === projectId)
        .map((item) => item.id),
    );

    this.snapshot.projects = this.snapshot.projects.filter((item) => item.id !== projectId);
    this.snapshot.boards = this.snapshot.boards.filter((item) => item.projectId !== projectId);
    this.snapshot.tasks = this.snapshot.tasks.filter((item) => item.projectId !== projectId);
    this.snapshot.invitations = this.snapshot.invitations.filter(
      (item) => item.projectId !== projectId,
    );
    this.snapshot.notifications = this.snapshot.notifications.filter(
      (item) => item.projectId !== projectId,
    );

    // Keep the in-memory snapshot coherent after cascading project removal.
    this.snapshot.tasks = this.snapshot.tasks.filter((item) => !taskIds.has(item.id));
    this.snapshot.boards = this.snapshot.boards.filter((item) => !boardIds.has(item.id));
  }

  removeProjectMember(projectId: string, memberId: string) {
    const project = this.snapshot.projects.find((item) => item.id === projectId);

    if (!project) {
      throw new Error("Proyecto no encontrado.");
    }

    if (project.ownerId === memberId) {
      throw new Error("No puedes revocar al propietario del proyecto.");
    }

    const user = this.snapshot.users.find((item) => item.id === memberId);

    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    if (user.role === "ADMIN") {
      throw new Error(
        "Los administradores globales mantienen acceso. Ajusta su rol si necesitas restringirlo.",
      );
    }

    if (!project.memberIds.includes(memberId)) {
      throw new Error("El usuario ya no pertenece a este proyecto.");
    }

    project.memberIds = project.memberIds.filter((id) => id !== memberId);
    this.snapshot.projectMembers = this.snapshot.projectMembers.filter(
      (item) => !(item.projectId === projectId && item.userId === memberId),
    );
    this.snapshot.tasks = this.snapshot.tasks.map((task) =>
      task.projectId === projectId
        ? {
            ...task,
            assigneeIds: task.assigneeIds.filter((id) => id !== memberId),
          }
        : task,
    );

    return structuredClone(project);
  }

  updateProjectMemberRole(projectId: string, memberId: string, memberRole: UserRole) {
    const project = this.snapshot.projects.find((item) => item.id === projectId);

    if (!project) {
      throw new Error("Proyecto no encontrado.");
    }

    if (project.ownerId === memberId) {
      throw new Error("El propietario conserva su privilegio principal.");
    }

    const user = this.snapshot.users.find((item) => item.id === memberId);

    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    if (user.role === "ADMIN") {
      throw new Error(
        "Los administradores globales mantienen acceso. Ajusta su rol global si necesitas restringirlo.",
      );
    }

    const membership = this.snapshot.projectMembers.find(
      (item) => item.projectId === projectId && item.userId === memberId,
    );

    if (!membership) {
      throw new Error("El usuario no pertenece actualmente a este proyecto.");
    }

    membership.memberRole = memberRole === "PROJECT_MANAGER" ? "PROJECT_MANAGER" : "DEVELOPER";
    return structuredClone(project);
  }

  createBoard(input: CreateBoardInput) {
    const project = this.snapshot.projects.find((item) => item.id === input.projectId);

    if (!project) {
      throw new Error("Proyecto no encontrado.");
    }

    const { board } = createBoardFactory().create(input.projectId, input.name);
    project.boardIds.push(board.id);
    this.snapshot.boards.unshift(board);

    return structuredClone(board);
  }

  createTask(input: CreateTaskInput): Task {
    const board = this.snapshot.boards.find((item) => item.id === input.boardId);

    if (!board || board.projectId !== input.projectId) {
      throw new Error("Tablero no encontrado.");
    }

    const targetColumnId = input.columnId ?? board.columns[0]?.id;

    if (!targetColumnId) {
      throw new Error("El tablero no tiene columnas disponibles.");
    }

    // Factory Method chooses the base task flavor. Builder then enriches the
    // task with history, assignees and subtasks.
    const baseTask = createTaskFactory(input.type).create({
      id: crypto.randomUUID(),
      projectId: input.projectId,
      boardId: input.boardId,
      columnId: targetColumnId,
      title: input.title.trim(),
      description: input.description.trim(),
      dueDate: input.dueDate,
      estimateHours: input.estimateHours,
      priority: input.priority,
    });

    const builder = new TaskBuilder(baseTask).withHistory({
      actorId: input.actorId,
      action: "Tarea creada",
      occurredAt: new Date().toISOString(),
      toColumnId: targetColumnId,
    });

    for (const assigneeId of input.assigneeIds ?? []) {
      builder.withAssignee(assigneeId);
    }

    for (const subtask of input.subtasks ?? []) {
      builder.withSubtask(subtask.title, subtask.isCompleted);
    }

    const task = builder.build();
    this.snapshot.tasks.unshift(task);
    return structuredClone(task);
  }

  updateTask(input: UpdateTaskInput): Task {
    const task = this.snapshot.tasks.find((item) => item.id === input.taskId);
    const board = this.snapshot.boards.find((item) => item.id === input.boardId);

    if (!task || task.projectId !== input.projectId || task.boardId !== input.boardId) {
      throw new Error("La tarea no existe dentro del tablero actual.");
    }

    if (!board || board.projectId !== input.projectId) {
      throw new Error("El tablero no existe dentro del proyecto.");
    }

    const destinationColumn = board.columns.find((column) => column.id === input.columnId);

    if (!destinationColumn) {
      throw new Error("La columna seleccionada no existe dentro del tablero.");
    }

    const nextSubtasks = input.subtasks.map((subtask) =>
      this.buildEditableSubtask(task.subtasks, subtask),
    );

    const updatedTask = new TaskBuilder({
      ...task,
      columnId: input.columnId,
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      type: input.type,
      dueDate: input.dueDate,
      estimateHours: input.estimateHours,
      assigneeIds: [...new Set(input.assigneeIds)],
      subtasks: nextSubtasks,
      updatedAt: new Date().toISOString(),
    })
      .withHistory({
        actorId: input.actorId,
        action: "Tarea actualizada",
        occurredAt: new Date().toISOString(),
        toColumnId: input.columnId,
      })
      .build();

    this.snapshot.tasks = this.snapshot.tasks.map((item) =>
      item.id === updatedTask.id ? updatedTask : item,
    );

    return structuredClone(updatedTask);
  }

  cloneTask(input: CloneTaskInput): Task {
    const sourceTask = this.snapshot.tasks.find((item) => item.id === input.sourceTaskId);
    const board = this.snapshot.boards.find((item) => item.id === input.boardId);

    if (!sourceTask || sourceTask.projectId !== input.projectId) {
      throw new Error("La tarea origen no existe dentro del proyecto.");
    }

    if (!board || board.projectId !== input.projectId) {
      throw new Error("El tablero de destino no existe dentro del proyecto.");
    }

    const targetColumnId = input.columnId ?? board.columns[0]?.id;

    if (!targetColumnId) {
      throw new Error("El tablero de destino no tiene columnas disponibles.");
    }

    // The prototype gives us a clean copy of the source task before applying
    // the technical overrides of the new assignment.
    const baseClone = new TaskPrototype(sourceTask).clone({
      id: crypto.randomUUID(),
      projectId: input.projectId,
      boardId: input.boardId,
      columnId: targetColumnId,
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      type: input.type,
      dueDate: input.dueDate,
      estimateHours: input.estimateHours,
      assigneeIds: [...new Set(input.assigneeIds)],
      subtasks: input.subtasks.map((subtask) => {
        const sourceSubtask = sourceTask.subtasks.find(
          (candidate) => candidate.id === subtask.sourceSubtaskId,
        );

        if (!sourceSubtask) {
          return {
            id: crypto.randomUUID(),
            title: subtask.title,
            isCompleted: subtask.isCompleted,
          };
        }

        return new SubtaskPrototype(sourceSubtask).clone({
          title: subtask.title,
          isCompleted: subtask.isCompleted,
        });
      }),
      clonedFromTaskId: input.clonedFromTaskId,
    });

    const clonedTask = new TaskBuilder(baseClone).withHistory({
      actorId: input.actorId,
      action: "Tarea clonada",
      occurredAt: new Date().toISOString(),
      toColumnId: targetColumnId,
    }).build();

    this.snapshot.tasks.unshift(clonedTask);
    return structuredClone(clonedTask);
  }

  moveTask(input: MoveTaskInput): Task {
    const task = this.snapshot.tasks.find((item) => item.id === input.taskId);

    if (!task || task.projectId !== input.projectId || task.boardId !== input.boardId) {
      throw new Error("Tarea no encontrada en el tablero actual.");
    }

    const board = this.snapshot.boards.find((item) => item.id === input.boardId);
    const destinationColumn = board?.columns.find((column) => column.id === input.toColumnId);

    if (!board || !destinationColumn) {
      throw new Error("La columna de destino no existe dentro del tablero.");
    }

    const previousColumnId = task.columnId;
    task.columnId = input.toColumnId;
    task.updatedAt = new Date().toISOString();
    task.history.unshift({
      id: crypto.randomUUID(),
      actorId: input.actorId,
      action: `Movio la tarea a ${destinationColumn.name}`,
      occurredAt: task.updatedAt,
      fromColumnId: previousColumnId,
      toColumnId: input.toColumnId,
    });

    return structuredClone(task);
  }

  createNotifications(input: CreateProjectNotificationInput[]): ProjectNotification[] {
    const notifications = input.map((item) =>
      new ProjectNotificationBuilder(item)
        .normalize()
        .build(crypto.randomUUID()),
    );

    this.snapshot.notifications.unshift(...notifications);
    this.snapshot.notifications.sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );

    return structuredClone(notifications);
  }

  markNotificationRead(notificationId: string, recipientId: string) {
    const notification = this.snapshot.notifications.find(
      (item) => item.id === notificationId && item.recipientId === recipientId,
    );

    if (!notification) {
      throw new Error("Notificacion no encontrada.");
    }

    notification.isRead = true;
    notification.readAt = notification.readAt ?? new Date().toISOString();

    return structuredClone(notification);
  }

  markAllNotificationsRead(recipientId: string) {
    const readAt = new Date().toISOString();

    this.snapshot.notifications = this.snapshot.notifications.map((notification) =>
      notification.recipientId === recipientId
        ? {
            ...notification,
            isRead: true,
            readAt: notification.readAt ?? readAt,
          }
        : notification,
    );
  }

  clearNotifications(recipientId: string) {
    this.snapshot.notifications = this.snapshot.notifications.filter(
      (notification) => notification.recipientId !== recipientId,
    );
  }

  updateSettings(input: UpdateSystemSettingsInput): SystemSettings {
    this.snapshot.settings = {
      platformName: input.platformName.trim(),
      maxAttachmentMb: input.maxAttachmentMb,
      passwordPolicy: input.passwordPolicy.trim(),
      defaultTheme: input.defaultTheme,
    };

    return structuredClone(this.snapshot.settings);
  }

  updateUserThemePreference(userId: string, mode: ThemeMode) {
    const user = this.snapshot.users.find((item) => item.id === userId);

    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    user.themePreference = mode;

    if (this.snapshot.currentUser.id === userId) {
      this.snapshot.currentUser.themePreference = mode;
    }

    return structuredClone(user);
  }

  createInvitation(input: CreateInvitationInput) {
    // Invitation factory creates the base invitation by channel and the builder
    // moves it into the pending lifecycle state with message and expiry.
    const invitation = new MemberInvitationBuilder(
      createInvitationFactory("IN_APP").create(input),
    )
      .withMessage(input.message)
      .withExpiry(7)
      .asPending()
      .build();

    this.snapshot.invitations.unshift(invitation);
    return structuredClone(invitation);
  }

  updateInvitationStatus(input: UpdateInvitationStatusInput) {
    const invitation = this.snapshot.invitations.find(
      (item) => item.id === input.invitationId,
    );

    if (!invitation) {
      throw new Error("Invitacion no encontrada.");
    }

    const builder = new MemberInvitationBuilder(invitation);
    const updated = (() => {
      if (input.status === "ACCEPTED") {
        return builder.asAccepted().build();
      }

      if (input.status === "REVOKED") {
        return builder.asRevoked().build();
      }

      return {
        ...builder.asPending().build(),
        status: "EXPIRED" as const,
      };
    })();

    this.replaceInvitation(updated);

    if (input.status === "ACCEPTED") {
      const project = this.snapshot.projects.find(
        (item) => item.id === updated.projectId,
      );
      const user = this.snapshot.users.find(
        (item) => item.id === updated.invitedUserId,
      );

      if (project && user && !project.memberIds.includes(user.id)) {
        project.memberIds.push(user.id);
        this.snapshot.projectMembers.push({
          projectId: project.id,
          userId: user.id,
          memberRole: updated.role,
          invitedBy: updated.invitedBy,
        });
      }
    }

    return structuredClone(updated);
  }

  resendInvitation(invitationId: string) {
    const invitation = this.snapshot.invitations.find(
      (item) => item.id === invitationId,
    );

    if (!invitation) {
      throw new Error("Invitacion no encontrada.");
    }

    const resent = new MemberInvitationBuilder(
      new InvitationPrototype(invitation).clone({
        id: invitation.id,
        status: "PENDING",
      }),
    )
      .refreshToken()
      .withExpiry(7)
      .asPending()
      .build();

    this.replaceInvitation(resent);
    return structuredClone(resent);
  }

  findInvitationByToken(token: string): MemberInvitation | null {
    const invitation =
      this.snapshot.invitations.find((item) => item.token === token) ?? null;
    return invitation ? structuredClone(invitation) : null;
  }

  private replaceInvitation(next: MemberInvitation) {
    this.snapshot.invitations = this.snapshot.invitations.map((item) =>
      item.id === next.id ? next : item,
    );
  }

  private buildEditableSubtask(
    currentSubtasks: Task["subtasks"],
    subtask: TaskSubtaskInput,
  ) {
    const sourceSubtask =
      currentSubtasks.find((candidate) => candidate.id === subtask.id) ?? null;

    if (!sourceSubtask) {
      return {
        id: crypto.randomUUID(),
        title: subtask.title.trim(),
        isCompleted: subtask.isCompleted,
      };
    }

    return new SubtaskPrototype(sourceSubtask).clone({
      title: subtask.title.trim(),
      isCompleted: subtask.isCompleted,
    });
  }
}
