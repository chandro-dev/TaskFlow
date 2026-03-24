import type {
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
  TaskflowSnapshot,
  UpdateInvitationStatusInput,
  UpdateProjectInput,
  UpdateSystemSettingsInput,
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

export class MockTaskflowStore {
  private static instance: MockTaskflowStore | null = null;
  private snapshot: TaskflowSnapshot;

  private constructor() {
    this.snapshot = buildMockSnapshot();
  }

  static getInstance() {
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
    const project = new ProjectBuilder(input).normalize().validate().buildProject(projectId);
    const { board } = createBoardFactory().create(projectId);

    project.boardIds = [board.id];
    project.memberIds = [input.ownerId];

    this.snapshot.projects.unshift(project);
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

    const task = builder.build();
    this.snapshot.tasks.unshift(task);
    return structuredClone(task);
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

  updateSettings(input: UpdateSystemSettingsInput): SystemSettings {
    this.snapshot.settings = {
      platformName: input.platformName.trim(),
      maxAttachmentMb: input.maxAttachmentMb,
      passwordPolicy: input.passwordPolicy.trim(),
      defaultTheme: input.defaultTheme,
    };

    return structuredClone(this.snapshot.settings);
  }

  createInvitation(input: CreateInvitationInput) {
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
}
