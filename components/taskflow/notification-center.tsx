"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "@/components/taskflow/icons";
import type { NotificationCenterView, ProjectNotificationView } from "@/lib/domain/models";
import { formatDateTime } from "@/lib/utils/format";

type NotificationCenterProps = {
  initialCenter: NotificationCenterView;
};

function sortNotifications(notifications: ProjectNotificationView[]) {
  return [...notifications].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

function groupByProject(notifications: ProjectNotificationView[]) {
  return notifications.reduce<Record<string, ProjectNotificationView[]>>(
    (accumulator, notification) => {
      const key = notification.project?.id ?? "system";
      accumulator[key] ??= [];
      accumulator[key].push(notification);
      return accumulator;
    },
    {},
  );
}

export function NotificationCenter({ initialCenter }: NotificationCenterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(() =>
    sortNotifications(initialCenter.notifications),
  );
  const [unreadCount, setUnreadCount] = useState(initialCenter.unreadCount);

  async function markAsRead(notificationId: string) {
    const target = notifications.find((item) => item.id === notificationId);

    if (!target || target.isRead) {
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: true,
              readAt: notification.readAt ?? new Date().toISOString(),
            }
          : notification,
      ),
    );
    setUnreadCount((current) => Math.max(current - 1, 0));

    await fetch(`/api/notifications/${notificationId}/read`, {
      method: "PATCH",
    }).catch(() => {
      startTransition(() => router.refresh());
    });
  }

  async function markAllAsRead() {
    if (!unreadCount) {
      return;
    }

    setLoading(true);
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);

    const response = await fetch("/api/notifications/read-all", {
      method: "POST",
    }).catch(() => null);

    setLoading(false);

    if (!response?.ok) {
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
        aria-label="Notificaciones"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--color-danger)] px-1 text-[11px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-40 w-[22rem] rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[0_24px_70px_rgba(14,22,35,0.14)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[color:var(--color-text-primary)]">
                Notificaciones
              </h2>
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                {unreadCount} pendientes
              </p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={loading || unreadCount === 0}
              className="text-xs font-medium text-[color:var(--color-text-secondary)] disabled:opacity-50"
            >
              Marcar todo
            </button>
          </div>

          <div className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto pr-1">
            {notifications.length ? (
              Object.entries(groupByProject(notifications)).map(
                ([projectId, projectNotifications]) => (
                  <section key={projectId} className="space-y-2">
                    <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-secondary)]">
                      {projectNotifications[0]?.project?.name ?? "Sistema"}
                    </p>
                    {projectNotifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.linkHref}
                        onClick={() => {
                          void markAsRead(notification.id);
                          setOpen(false);
                        }}
                        className={`block rounded-2xl border px-4 py-3 transition-colors ${
                          notification.isRead
                            ? "border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]"
                            : "border-[color:rgba(42,67,101,0.28)] bg-[color:rgba(42,67,101,0.08)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                            {notification.title}
                          </p>
                          {!notification.isRead ? (
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[color:var(--color-danger)]" />
                          ) : null}
                        </div>

                        <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-secondary)]">
                          {notification.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[color:var(--color-text-secondary)]">
                          <span>{notification.actor?.name ?? "Sistema"}</span>
                          <span>{formatDateTime(notification.createdAt)}</span>
                        </div>
                      </Link>
                    ))}
                  </section>
                ),
              )
            ) : (
              <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-6 text-sm leading-7 text-[color:var(--color-text-secondary)]">
                No tienes notificaciones recientes en tus proyectos.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
