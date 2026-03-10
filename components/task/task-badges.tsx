import { Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskStatus, TaskPriority, TaskSource } from './task-types'
import { STATUS_CONFIG, PRIORITY_CONFIG, SOURCE_CONFIG } from './task-types'
import { getRequesterLabel } from '@/lib/role-labels'

/* ── Status ── */

export function StatusBadge({ status, size = 'sm', fixedWidth = false }: { status: TaskStatus; size?: 'sm' | 'xs'; fixedWidth?: boolean }) {
  const c = STATUS_CONFIG[status]
  return (
    <span className={cn(
      'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full font-medium leading-none',
      size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-1.5 py-[3px] text-[10px]',
      fixedWidth && 'min-w-[54px]',
      c.cls,
    )}>
      <span className={cn('inline-block shrink-0 rounded-full', size === 'sm' ? 'h-1.5 w-1.5' : 'h-1 w-1', c.dotCls)} />
      {c.label}
    </span>
  )
}

export function StatusDot({ status }: { status: TaskStatus }) {
  const c = STATUS_CONFIG[status]
  return <span className={cn('inline-block h-2 w-2 rounded-full', c.dotCls)} title={c.label} />
}

/** Compact-only: dot + colored text, no pill background */
export function StatusLabel({ status, fixedWidth = false }: { status: TaskStatus; fixedWidth?: boolean }) {
  const c = STATUS_CONFIG[status]
  const textColor =
    status === 'overdue' ? 'text-destructive' :
    status === 'pending_review' ? 'text-amber-600' :
    status === 'in_progress' ? 'text-blue-600' :
    status === 'unassigned' ? 'text-foreground/40' :
    'text-foreground/30'

  return (
    <span className={cn(
      'inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium',
      fixedWidth && 'min-w-[50px] justify-end',
      textColor,
    )}>
      <span className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', c.dotCls)} />
      {c.label}
    </span>
  )
}

/* ── Priority ── */

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === 'normal') return null
  const c = PRIORITY_CONFIG[priority]
  const Icon = priority === 'urgent' ? Zap : Star
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold',
      priority === 'urgent'
        ? 'border-destructive/20 bg-destructive/10 text-destructive'
        : 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    )}>
      <Icon className="h-2.5 w-2.5" />
      {c.label}
    </span>
  )
}

export function PriorityIndicator({ priority }: { priority: TaskPriority }) {
  if (priority === 'normal') return null
  if (priority === 'urgent') return <Zap className="h-3.5 w-3.5 text-destructive" />
  return <Star className="h-3.5 w-3.5 text-amber-500" />
}

/* ── Source (legacy) ── */

export function SourceBadge({ source }: { source: TaskSource }) {
  const c = SOURCE_CONFIG[source]
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium', c.cls)}>
      {c.label}
    </span>
  )
}

/* ── Requester (역할 기반) ── */

const REQUESTER_STYLE: Record<string, string> = {
  '총괄': 'bg-foreground/[0.06] text-foreground/60',
  '운영': 'bg-foreground/[0.06] text-foreground/50',
  '학관': 'bg-foreground/[0.04] text-foreground/40',
  '시스템': 'bg-foreground/[0.03] text-foreground/30',
}

export function RequesterBadge({ source, creatorId }: { source: TaskSource; creatorId?: string }) {
  const label = getRequesterLabel(source, creatorId)
  const cls = REQUESTER_STYLE[label] ?? REQUESTER_STYLE['시스템']
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium', cls)}>
      {label}
    </span>
  )
}

/* ── Track & Category ── */

export function TrackTag({ name, color }: { name: string; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-foreground/50">
      <span className="inline-block h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: color ?? '#94a3b8' }} />
      {name}
    </span>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-foreground/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-foreground/40">
      {category}
    </span>
  )
}
