'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Paperclip, UserX, CheckCircle2, ChevronDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useNameLookup } from '@/lib/hooks/use-name-lookup'
import type { UnifiedTask } from './task-types'
import { StatusBadge, StatusLabel, PriorityIndicator, SourceBadge, RequesterBadge, TrackTag, CategoryBadge } from './task-badges'

// re-export for external use
export { StatusBadge, StatusLabel, SourceBadge, RequesterBadge }

interface TaskCardBaseProps {
  task: UnifiedTask
  onClick?: (task: UnifiedTask) => void
  trackName?: string
  trackColor?: string
  staffColor?: string | null
}

interface CompactCardProps extends TaskCardBaseProps {
  variant: 'compact'
  showCheckbox?: boolean
  onCheck?: (taskId: string) => void
  showTrack?: boolean
  showAssignee?: boolean
  showDate?: boolean
  showSource?: boolean
  showMeta?: boolean
  showApprove?: boolean
  onApprove?: (taskId: string) => void
  assignableStaff?: { id: string; name: string; color: string }[]
  onAssign?: (taskId: string, staffId: string, staffName: string) => void
}

interface CardProps extends TaskCardBaseProps {
  variant: 'card'
  selected?: boolean
  onToggleSelect?: (id: string) => void
  showCheckbox?: boolean
  onCheck?: (taskId: string) => void
  showTrack?: boolean
  hideAssignee?: boolean
}

interface ExpandedCardProps extends TaskCardBaseProps {
  variant: 'expanded'
  onComplete?: (taskId: string) => void
  onDefer?: (task: UnifiedTask) => void
}

export type TaskCardProps = CompactCardProps | CardProps | ExpandedCardProps

const TODAY_STR = new Date().toISOString().split('T')[0]

function fmtTime(start?: string, end?: string) {
  if (!start && !end) return null
  if (start && end) return `${start} ~ ${end}`
  return start || end
}

function fmtDateRange(start: string, end?: string) {
  if (!end || end === start) return null
  return `${start.slice(5)} ~ ${end.slice(5)}`
}

/* ================================================================
   Compact — one-line item
   ================================================================ */
function CompactCard({ task, onClick, showCheckbox, onCheck, showTrack, trackName, trackColor, staffColor, showAssignee, showDate, showSource, showMeta, showApprove, onApprove, assignableStaff, onAssign }: CompactCardProps) {
  const getName = useNameLookup()
  const done = task.status === 'completed'
  const overdue = task.status === 'overdue'
  const unassigned = task.status === 'unassigned'
  const reviewing = task.status === 'pending_review'
  const time = fmtTime(task.startTime, task.endTime)
  const dateStr = showDate ? task.startDate.slice(5) : null
  const dateRange = fmtDateRange(task.startDate, task.endDate)
  const hasExtendedCols = showAssignee || showSource || showMeta
  const [assignDropdown, setAssignDropdown] = useState(false)

  const leftBorder = unassigned
    ? 'border-l-2 border-dashed border-foreground/20'
    : overdue
      ? 'border-l-2 border-red-500'
      : reviewing
        ? 'border-l-2 border-amber-500'
        : 'border-l-2 border-transparent'

  if (!hasExtendedCols) {
    return (
      <div
        onClick={() => onClick?.(task)}
        className={cn(
          'flex items-center px-3 py-2 transition-colors',
          onClick && 'cursor-pointer hover:bg-foreground/[0.02]',
          done && 'opacity-40',
        )}
      >
        {showCheckbox && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onCheck?.(task.id) }} className="mr-2.5 shrink-0">
            <CheckCircle2 className={cn('h-4 w-4', done ? 'text-foreground/30' : 'text-foreground/15 hover:text-foreground/30')} />
          </button>
        )}
        <span className="mr-1.5 flex w-4 shrink-0 items-center justify-center">
          <PriorityIndicator priority={task.priority} />
        </span>
        <span className={cn(
          'min-w-0 flex-1 truncate text-[13px]',
          done ? 'text-foreground/30 line-through' : overdue ? 'text-destructive' : 'text-foreground/80',
        )}>
          {task.title}
        </span>
        <div className="ml-3 flex shrink-0 items-center">
          <span className="w-[80px] text-right text-[11px] tabular-nums text-foreground/25">{time ?? ''}</span>
          {showTrack && trackName && <span className="ml-3 w-[90px]"><TrackTag name={trackName} color={trackColor} /></span>}
          <span className="ml-3"><StatusLabel status={task.status} fixedWidth /></span>
        </div>
      </div>
    )
  }

  const canApprove = showApprove && !!task.reviewerId && reviewing
  const canReassign = assignableStaff && onAssign && !done

  return (
    <div
      onClick={() => onClick?.(task)}
      className={cn(
        'flex items-center px-3 py-2 transition-colors',
        leftBorder,
        onClick && 'cursor-pointer hover:bg-foreground/[0.02]',
        done && 'opacity-40',
        unassigned && 'bg-foreground/[0.015]',
      )}
    >
      {/* Col 1: approve button — w-[48px], center */}
      {showApprove && (
        <div className="flex w-[48px] shrink-0 items-center justify-center pr-2">
          {canApprove ? (
            <button type="button"
              onClick={(e) => { e.stopPropagation(); onApprove?.(task.id) }}
              className="rounded-md border border-foreground/15 bg-background px-2 py-0.5 text-[10px] font-medium text-foreground/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-foreground/25 hover:bg-foreground/[0.03] active:scale-95">
              완료
            </button>
          ) : null}
        </div>
      )}

      {/* Col 2: status — w-[56px], center */}
      <div className="flex w-[56px] shrink-0 items-center justify-center">
        <StatusLabel status={task.status} />
      </div>

      {/* Col 3: priority — w-5, center */}
      <div className="flex w-5 shrink-0 items-center justify-center">
        <PriorityIndicator priority={task.priority} />
      </div>

      {/* Col 4: 제목 + [💬n] + [기간태그] — flex-1, left */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-1">
        <span className={cn(
          'truncate text-[13px]',
          done ? 'text-foreground/30 line-through' : overdue ? 'text-destructive' : unassigned ? 'text-foreground/50' : 'text-foreground/80',
        )}>
          {task.title}
        </span>
        {showMeta && task.messages.length > 0 && (
          <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-foreground/20">
            <MessageCircle className="h-3 w-3" />{task.messages.length}
          </span>
        )}
        {dateRange && (
          <span className="shrink-0 rounded bg-foreground/[0.06] px-1 py-px text-[10px] tabular-nums text-foreground/35">
            {dateRange}
          </span>
        )}
      </div>

      {/* Col 5: assignee — w-[72px], left */}
      {showAssignee && (
        <div className="relative ml-2 flex w-[72px] shrink-0 items-center">
          {canReassign ? (
            <>
              <button type="button"
                onClick={(e) => { e.stopPropagation(); setAssignDropdown(!assignDropdown) }}
                className={cn('flex w-full items-center gap-1 rounded-md border px-1 py-0.5 text-[10px] transition-colors',
                  unassigned
                    ? 'border-dashed border-foreground/15 text-foreground/35 hover:border-foreground/25 hover:text-foreground/50'
                    : 'border-transparent text-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground/70',
                )}>
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: unassigned ? 'transparent' : (staffColor ?? '#94a3b8') }} />
                <span className="min-w-0 flex-1 truncate">{unassigned ? '배정' : getName(task.assigneeId)}</span>
                <ChevronDown className={cn('h-2.5 w-2.5 shrink-0 transition-transform', assignDropdown && 'rotate-180')} />
              </button>
              {assignDropdown && (
                <div className="absolute left-0 top-full z-30 mt-1 w-28 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  {assignableStaff.map(s => (
                    <button key={s.id} type="button"
                      onClick={(e) => { e.stopPropagation(); onAssign(task.id, s.id, s.name); setAssignDropdown(false) }}
                      className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors hover:bg-secondary',
                        task.assigneeId === s.id ? 'bg-foreground/[0.04] font-medium text-foreground' : 'text-foreground')}>
                      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : task.assigneeId ? (
            <button type="button" disabled
              className="flex w-full cursor-default items-center gap-1 rounded-md border border-transparent px-1 py-0.5 text-[10px] text-foreground/50">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: staffColor ?? '#94a3b8' }} />
              <span className="min-w-0 flex-1 truncate">{getName(task.assigneeId)}</span>
              <span className="h-2.5 w-2.5 shrink-0" />
            </button>
          ) : (
            <button type="button" disabled
              className="flex w-full cursor-default items-center gap-1 rounded-md border border-dashed border-foreground/15 px-1 py-0.5 text-[10px] text-foreground/25">
              <span className="min-w-0 flex-1 truncate">미배정</span>
              <span className="h-2.5 w-2.5 shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* Col 6: time — w-[84px], right */}
      <div className="ml-2 flex w-[84px] shrink-0 items-center justify-end whitespace-nowrap text-[11px] tabular-nums text-foreground/25">
        {time ?? ''}
      </div>

      {/* Col 7: requester — w-[56px], center */}
      {showSource && (
        <div className="ml-2 flex w-[56px] shrink-0 items-center justify-center">
          <RequesterBadge source={task.source} creatorId={task.creatorId} />
        </div>
      )}

      {/* Col: track tag */}
      {showTrack && trackName && (
        <div className="ml-2 w-[90px] shrink-0"><TrackTag name={trackName} color={trackColor} /></div>
      )}
    </div>
  )
}

/* ================================================================
   Card — medium detail
   ================================================================ */
function StandardCard({ task, onClick, selected, onToggleSelect, showCheckbox, onCheck, showTrack, hideAssignee, trackName, trackColor, staffColor }: CardProps) {
  const getName = useNameLookup()
  const unassigned = task.status === 'unassigned'
  const done = task.status === 'completed'
  const overdue = task.status === 'overdue'
  const reviewing = task.status === 'pending_review'
  const isPast = task.startDate < TODAY_STR
  const time = fmtTime(task.startTime, task.endTime)
  const dateRange = fmtDateRange(task.startDate, task.endDate)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(false), 3000); return () => clearTimeout(t) }
  }, [toast])

  const handleCheck = () => {
    const isChecked = task.status === 'completed' || task.status === 'pending_review'
    if (!isChecked && task.reviewerId) {
      onCheck?.(task.id)
      setToast(true)
      return
    }
    onCheck?.(task.id)
  }

  return (
    <div
      onClick={() => onClick?.(task)}
      className={cn(
        'group relative rounded-lg border transition-all',
        onClick && 'cursor-pointer',
        unassigned
          ? cn('border-dashed bg-foreground/[0.01]', isPast ? 'border-destructive/20' : 'border-foreground/10')
          : overdue
            ? 'border-destructive/15 bg-destructive/[0.02]'
            : 'border-border bg-card hover:shadow-sm',
        selected && 'ring-1 ring-foreground/20',
      )}
    >
      {/* Toast */}
      {toast && (
        <div className="absolute -top-8 left-0 right-0 z-10 flex justify-center">
          <span className="rounded-md bg-amber-500 px-3 py-1 text-[11px] font-medium text-white shadow-sm">
            {task.reviewerId ? `${getName(task.reviewerId)}님이 확인하면 완료 처리됩니다` : '확인 후 완료 처리됩니다'}
          </span>
        </div>
      )}
      <div className="px-3 py-2.5">
        {/* Row 1: [checkbox] [urgent] title | status */}
        <div className="flex items-center gap-1.5">
          {showCheckbox && (
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation" className="flex shrink-0 items-center">
              <Checkbox
                checked={done}
                onCheckedChange={handleCheck}
                className="h-4 w-4 shrink-0"
                aria-label={`${task.title} 완료 표시`}
              />
            </div>
          )}
          {unassigned && onToggleSelect && (
            <input
              type="checkbox" checked={!!selected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(task.id)}
              className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-foreground/20 accent-foreground"
            />
          )}
          <PriorityIndicator priority={task.priority} />
          {unassigned && <UserX className="h-3 w-3 shrink-0 text-foreground/25" />}
          <span className={cn(
            'min-w-0 flex-1 truncate text-[13px] font-medium',
            done ? 'line-through text-foreground/50' :
            overdue ? 'text-destructive' :
            unassigned ? 'text-foreground/40' : 'text-foreground',
          )}>
            {task.title}
          </span>
          <StatusBadge status={task.status} size="xs" />
        </div>

        {/* Row 2: time · track · assignee · reviewer (only if any content) */}
        {(time || dateRange || (showTrack && trackName) || (!hideAssignee && ((!unassigned && task.assigneeId) || unassigned)) || task.reviewerId) && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-foreground/35">
            {(time || dateRange) && (
              <span className="shrink-0 tabular-nums text-foreground/25">
                {time}{dateRange ? ` (${dateRange})` : ''}
              </span>
            )}
            {showTrack && trackName && (
              <>
                {(time || dateRange) && <span className="text-foreground/15">·</span>}
                <TrackTag name={trackName} color={trackColor} />
              </>
            )}
            {!hideAssignee && !unassigned && task.assigneeId && (
              <>
                {(time || dateRange || (showTrack && trackName)) && <span className="text-foreground/15">·</span>}
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: staffColor ?? '#94a3b8' }} />
                  {getName(task.assigneeId)}
                </span>
              </>
            )}
            {!hideAssignee && unassigned && <span className="text-foreground/25">담당자 없음</span>}
            {task.reviewerId && (
              <span className="text-amber-600">확인필요 {getName(task.reviewerId)}</span>
            )}
          </div>
        )}

        {/* Row 3: requester + attachment/message indicators */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <RequesterBadge source={task.source} creatorId={task.creatorId} />
          {((task.attachments && task.attachments.length > 0) || task.messages.length > 0) && (
            <span className="ml-auto flex items-center gap-2 text-[11px] text-foreground/20">
              {task.attachments && task.attachments.length > 0 && (
                <span className="flex items-center gap-0.5"><Paperclip className="h-3 w-3" />{task.attachments.length}</span>
              )}
              {task.messages.length > 0 && (
                <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{task.messages.length}</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   Expanded — full info inline
   ================================================================ */
function ExpandedCard({ task, onClick, onComplete, onDefer, staffColor }: ExpandedCardProps) {
  const getName = useNameLookup()
  const done = task.status === 'completed'
  const overdue = task.status === 'overdue'
  const time = fmtTime(task.startTime, task.endTime)

  return (
    <div className={cn('rounded-lg border bg-card', overdue ? 'border-destructive/15' : 'border-border')}>
      {/* Header */}
      <div className="border-b border-foreground/[0.05] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <PriorityIndicator priority={task.priority} />
              <h4 className={cn('text-sm font-semibold', done ? 'text-foreground/30 line-through' : 'text-foreground')}>{task.title}</h4>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={task.status} />
              <RequesterBadge source={task.source} creatorId={task.creatorId} />
              <CategoryBadge category={task.category} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!done && onDefer && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onDefer(task) }}
                className="rounded-md border border-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground/40 transition-colors hover:bg-foreground/[0.03] hover:text-foreground/60">
                미루기
              </button>
            )}
            {!done && onComplete && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onComplete(task.id) }}
                className="rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-colors hover:bg-foreground/80">
                완료
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3 text-[12px]">
        <InfoItem label="담당자">
          {task.assigneeId ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: staffColor ?? '#94a3b8' }} />
              {getName(task.assigneeId)}
            </span>
          ) : (
            <span className="text-foreground/25">미배정</span>
          )}
        </InfoItem>
        {task.reviewerId && <InfoItem label="검토자">{getName(task.reviewerId)}</InfoItem>}
        <InfoItem label="일정">
          <span className="tabular-nums">
            {task.startDate.slice(5)}{task.endDate && task.endDate !== task.startDate && ` ~ ${task.endDate.slice(5)}`}
            {time && <span className="ml-1 text-foreground/30">{time}</span>}
          </span>
        </InfoItem>
        {task.creatorId && <InfoItem label="생성자">{getName(task.creatorId)}</InfoItem>}
        {task.completedAt && <InfoItem label="완료 시각"><span className="tabular-nums">{task.completedAt}</span></InfoItem>}
      </div>

      {task.description && (
        <div className="border-t border-foreground/[0.05] px-4 py-3">
          <p className="text-[12px] leading-relaxed text-foreground/50">{task.description}</p>
        </div>
      )}

      {task.attachments && task.attachments.length > 0 && (
        <div className="border-t border-foreground/[0.05] px-4 py-3 space-y-1.5">
          {task.attachments.map((att) => (
            <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-foreground/[0.06] px-3 py-1.5 text-[12px] text-foreground/50 transition-colors hover:bg-foreground/[0.02]">
              <Paperclip className="h-3 w-3 shrink-0" />
              <span className="truncate">{att.name}</span>
              <span className="ml-auto text-[10px] text-foreground/25">{att.type}</span>
            </a>
          ))}
        </div>
      )}

      {task.output && (
        <div className="border-t border-foreground/[0.05] px-4 py-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/25">산출물</span>
          <p className="mt-0.5 text-[12px] text-foreground/60">{task.output}</p>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] text-foreground/25">{label}</span>
      <div className="mt-0.5 text-foreground/70">{children}</div>
    </div>
  )
}

/* ================================================================
   Main export
   ================================================================ */
export function TaskCard(props: TaskCardProps) {
  switch (props.variant) {
    case 'compact':  return <CompactCard {...props} />
    case 'card':     return <StandardCard {...props} />
    case 'expanded': return <ExpandedCard {...props} />
  }
}
