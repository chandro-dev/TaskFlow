import type { ReactNode } from "react";
import type { BoardTaskView } from "@/lib/domain/models";
import { CalendarIcon, FilterIcon } from "@/components/taskflow/icons";
import {
  formatDate,
  percentage,
  priorityLabel,
  taskTypeLabel,
} from "@/lib/utils/format";

export function TaskCard({
  task,
  actions,
}: {
  task: BoardTaskView;
  actions?: ReactNode;
}) {
  return (
    <article className="taskflow-panel min-h-[16rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
            {priorityLabel(task.priority)}
          </p>
          <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
            {task.title}
          </h3>
        </div>
        {task.isOverdue ? (
          <span className="rounded-full bg-[color:rgba(217,83,111,0.16)] px-3 py-1 text-xs font-semibold text-[color:var(--color-danger)]">
            Vencida
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-secondary)]">
        {taskTypeLabel(task.type)}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {task.labels.map((label) => (
          <span
            key={label.id}
            className="rounded-full px-3 py-1 text-xs font-medium text-[color:var(--color-text-secondary)]"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3 text-sm text-[color:var(--color-text-secondary)]">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4" />
          {task.subtasks.length} subtareas - {percentage(task.subtaskProgress)}
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {formatDate(task.dueDate, { day: "2-digit", month: "short" })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex -space-x-2">
          {task.assignees.map((assignee) => (
            <div
              key={assignee.id}
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[color:var(--color-surface)] bg-[color:var(--color-surface-muted)] text-xs font-semibold text-[color:var(--color-text-primary)]"
              title={assignee.name}
            >
              {assignee.avatar}
            </div>
          ))}
        </div>
        <div className="text-sm text-[color:var(--color-text-secondary)]">
          {task.spentHours}/{task.estimateHours}h
        </div>
      </div>

      {actions ? (
        <div className="mt-4 border-t border-[color:var(--color-border)] pt-4">
          {actions}
        </div>
      ) : null}
    </article>
  );
}
