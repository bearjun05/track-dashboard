'use client'

import type { TrackTask, TrackTaskStatus } from '@/lib/admin-mock-data'
import { UserX } from 'lucide-react'
import { TODAY_STR, STATUS_CONFIG, TYPE_CONFIG } from './track-utils'

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const color = value >= 80 ? 'bg-foreground/70' : value >= 60 ? 'bg-foreground/50' : 'bg-foreground/30'
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-foreground/10 ${className ?? ''}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

export function StatusBadge({ status }: { status: TrackTaskStatus }) {
  const c = STATUS_CONFIG[status]
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${c.cls}`}>{c.label}</span>
}

export function TypeBadge({ type }: { type: TrackTask['type'] }) {
  const c = TYPE_CONFIG[type]
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${c.cls}`}>{c.label}</span>
}

export function TaskCard({ task, staffColor, onAssignToday, onDefer, onClick, compact, selected, onToggleSelect }: {
  task: TrackTask
  staffColor: string | null
  onAssignToday?: (taskId: string) => void
  onDefer?: (task: TrackTask) => void
  onClick?: (task: TrackTask) => void
  compact?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const isUnassigned = task.status === 'unassigned'
  const isToday = task.scheduledDate === TODAY_STR
  const isPast = task.scheduledDate < TODAY_STR
  const isCompleted = task.status === 'completed'
  const isOverdue = task.status === 'overdue'

  return (
    <div
      onClick={() => onClick?.(task)}
      className={`group rounded-lg transition-shadow hover:shadow-sm ${onClick ? 'cursor-pointer' : ''} ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5'} ${
        isUnassigned
          ? `border border-dashed bg-foreground/[0.02] ${isPast ? 'border-destructive/30' : 'border-foreground/20'}`
          : 'border border-border bg-card'
      } ${selected ? 'ring-1 ring-foreground/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {isUnassigned && onToggleSelect && (
            <input type="checkbox" checked={!!selected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(task.id)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-border accent-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {isUnassigned && !onToggleSelect && <UserX className="h-3 w-3 shrink-0 text-foreground/40" />}
              <span className={`truncate text-[12px] font-medium ${
                isCompleted ? 'text-muted-foreground line-through' :
                isOverdue ? 'text-destructive' :
                isUnassigned && isPast ? 'text-destructive/80' :
                isUnassigned ? 'text-foreground/60' : 'text-foreground'
              }`}>{task.title}</span>
              <TypeBadge type={task.type} />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="tabular-nums">{task.scheduledTime}{task.dueTime ? ` ~ ${task.dueTime}` : ''}</span>
              {task.endDate && task.endDate !== task.scheduledDate && (
                <span className="tabular-nums">({task.scheduledDate.slice(5)} ~ {task.endDate.slice(5)})</span>
              )}
              {!isUnassigned && task.assigneeName && (
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: staffColor ?? '#94a3b8' }} />
                  {task.assigneeName}
                </span>
              )}
            </div>
            {isUnassigned && task.unassignedReason && <p className="mt-0.5 text-[10px] text-foreground/40">{task.unassignedReason}</p>}
          </div>
        </div>
        {isUnassigned && onAssignToday && onDefer && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {isToday ? (
              <button type="button" onClick={(e) => { e.stopPropagation(); onDefer(task) }}
                className="rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-secondary">
                미루기
              </button>
            ) : (
              <button type="button" onClick={(e) => { e.stopPropagation(); onAssignToday(task.id) }}
                className="rounded-md bg-foreground px-2 py-1 text-[10px] text-background transition-colors hover:bg-foreground/80">
                오늘 배정
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
