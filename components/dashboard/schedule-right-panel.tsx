'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useStaffDashboard } from '@/lib/hooks/use-staff-dashboard'
import { trackTaskToUnified } from '@/components/task/task-adapter'
import type { UnifiedTask } from '@/components/task/task-types'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { TaskDetailModal } from '@/components/task/task-detail-modal'
import { TODAY } from '@/lib/date-constants'
import { timeToSlot } from '@/components/calendar/calendar-utils'
import { computeOverlapColumns } from '@/lib/grid-utils'
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const HOUR_START = 9
const HOUR_END = 18
const MINI_SLOT = 20

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function isInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end
}

export function ScheduleRightPanel({ staffId, selectedDate }: { staffId?: string; selectedDate?: Date | null }) {
  const { calendarTasks, periodTasks, personalSchedules, addPersonalSchedule, removePersonalSchedule,
    toggleTaskStatus, requestReview, cancelReview, changeStatus, addTaskMessage, markInProgress,
  } = useStaffDashboard(staffId ?? '')
  const [showAdd, setShowAdd] = useState(false)
  const [taskModal, setTaskModal] = useState<UnifiedTask | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newTime, setNewTime] = useState('')

  const dateStr = selectedDate ? toDateStr(selectedDate) : toDateStr(TODAY)
  const dateObj = selectedDate ?? TODAY
  const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 (${DAY_NAMES[dateObj.getDay()]})`

  const unifiedPeriodTasks = useMemo(() => periodTasks.map(trackTaskToUnified), [periodTasks])
  const unifiedPointTasks = useMemo(
    () => calendarTasks.filter(t => !t.endDate || t.endDate === t.scheduledDate).map(trackTaskToUnified),
    [calendarTasks],
  )

  const dayPeriodTasks = useMemo(
    () => unifiedPeriodTasks.filter(t => isInRange(dateStr, t.startDate, t.endDate ?? t.startDate)),
    [unifiedPeriodTasks, dateStr],
  )
  const dayPointTasks = useMemo(() => unifiedPointTasks.filter(t => t.startDate === dateStr), [unifiedPointTasks, dateStr])
  const dayPersonal = useMemo(() => personalSchedules.filter(ps => ps.startDate === dateStr), [personalSchedules, dateStr])

  const timedItems = useMemo(() => {
    type Item = { id: string; title: string; slot: number; endSlot: number; isSelf: boolean; time: string; task?: UnifiedTask }
    const items: Item[] = []
    dayPointTasks.filter(t => t.startTime).forEach(t => {
      const s = timeToSlot(t.startTime!), e = t.endTime ? timeToSlot(t.endTime) : s + 1
      items.push({ id: t.id, title: t.title, slot: s, endSlot: Math.max(s + 1, e), isSelf: t.source === 'self' || t.source === 'request_sent', time: t.startTime! + (t.endTime ? `–${t.endTime}` : ''), task: t })
    })
    dayPersonal.filter(ps => ps.startTime).forEach(ps => {
      const s = timeToSlot(ps.startTime!), e = ps.endTime ? timeToSlot(ps.endTime) : s + 1
      items.push({ id: ps.id, title: ps.title, slot: s, endSlot: Math.max(s + 1, e), isSelf: true, time: ps.startTime! + (ps.endTime ? `–${ps.endTime}` : '') })
    })
    items.sort((a, b) => a.slot - b.slot)
    return items
  }, [dayPointTasks, dayPersonal])

  const untimedItems = useMemo(() => {
    const items: { id: string; title: string; isSelf: boolean; isPersonal: boolean; psId?: string; task?: UnifiedTask }[] = []
    dayPointTasks.filter(t => !t.startTime).forEach(t => items.push({ id: t.id, title: t.title, isSelf: t.source === 'self' || t.source === 'request_sent', isPersonal: false, task: t }))
    dayPersonal.filter(ps => !ps.startTime).forEach(ps => items.push({ id: ps.id, title: ps.title, isSelf: true, isPersonal: true, psId: ps.id }))
    return items
  }, [dayPointTasks, dayPersonal])

  const hasPeriod = dayPeriodTasks.length > 0
  const hasContent = timedItems.length > 0 || untimedItems.length > 0
  const totalSlots = (HOUR_END - HOUR_START) * 2
  const gridHeight = totalSlots * MINI_SLOT

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addPersonalSchedule(newTitle.trim(), dateStr, newTime || undefined)
    setNewTitle(''); setNewTime(''); setShowAdd(false)
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-foreground/[0.08] bg-background shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-foreground/[0.06] px-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-foreground/30" />
          <h3 className="text-[13px] font-semibold text-foreground">{dateLabel}</h3>
        </div>
        <button type="button" onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-0.5 text-[10px] font-medium text-teal-600 hover:text-teal-700">
          <Plus className="h-3 w-3" />추가
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Period tasks */}
        {hasPeriod && (
          <div className="border-b border-foreground/[0.06] px-4 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/25">기간 할 일</p>
            <div className="space-y-1">
              {dayPeriodTasks.map(t => {
                const isSelf = t.source === 'self' || t.source === 'request_sent'
                const end = t.endDate ?? t.startDate
                const daysLeft = Math.ceil((new Date(end + 'T00:00:00').getTime() - new Date(dateStr + 'T00:00:00').getTime()) / 86400000)
                const dLabel = daysLeft <= 0 ? 'D-Day' : `D-${daysLeft}`
                const isUrgent = daysLeft <= 2
                return (
                  <div key={t.id} onClick={() => setTaskModal(t)}
                    className={cn('cursor-pointer rounded-md px-2.5 py-1.5 transition-colors hover:opacity-80', isSelf ? 'bg-teal-500/[0.06]' : 'bg-foreground/[0.04]')}>
                    <div className="flex items-center gap-1.5">
                      <div className={cn('h-1.5 w-1.5 shrink-0', isSelf ? 'rounded-full bg-teal-500' : 'rounded-[1px] bg-foreground/45')} />
                      <span className={cn('min-w-0 truncate text-[11px] font-medium', isSelf ? 'text-teal-800' : 'text-foreground/70')}>{t.title}</span>
                      <span className={cn('ml-auto shrink-0 rounded px-1 py-px text-[9px] font-semibold tabular-nums',
                        isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-foreground/[0.04] text-foreground/35',
                      )}>{dLabel}</span>
                    </div>
                    <p className="mt-0.5 pl-3 text-[9px] tabular-nums text-foreground/25">
                      {t.startDate.slice(5)} ~ {end.slice(5)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Mini time grid */}
        {hasContent && (
          <div className="px-2 py-2">
            <div className="relative" style={{ height: `${gridHeight}px` }}>
              {/* Hour lines + labels */}
              {Array.from({ length: HOUR_END - HOUR_START + 1 }).map((_, i) => (
                <div key={i} className="absolute inset-x-0 flex items-start" style={{ top: `${i * MINI_SLOT * 2}px` }}>
                  <span className="w-[32px] shrink-0 pr-1.5 text-right text-[9px] tabular-nums text-foreground/20">
                    {String(HOUR_START + i).padStart(2, '0')}
                  </span>
                  <div className="flex-1 border-t border-foreground/[0.05]" />
                </div>
              ))}
              {/* Half-hour dashed lines */}
              {Array.from({ length: HOUR_END - HOUR_START }).map((_, i) => (
                <div key={`h-${i}`} className="absolute right-0" style={{ top: `${i * MINI_SLOT * 2 + MINI_SLOT}px`, left: '32px' }}>
                  <div className="border-t border-dashed border-foreground/[0.03]" />
                </div>
              ))}

              {/* Timed items — overlap-aware */}
              {(() => {
                const sorted = [...timedItems].sort((a, b) => a.slot - b.slot || (b.endSlot - b.slot) - (a.endSlot - a.slot))
                const placed = computeOverlapColumns(sorted)

                return sorted.map((item, idx) => {
                  const { col, groupSize } = placed[idx]
                  const spans = item.endSlot - item.slot
                  const h = spans * MINI_SLOT - 2
                  const isCompact = spans <= 1
                  const contentLeft = 36
                  const contentRight = 4
                  const leftPx = contentLeft + col * ((100 - contentLeft - contentRight) / groupSize) * 0.01

                  return (
                    <div key={item.id}
                      onClick={() => { if (item.task) setTaskModal(item.task) }}
                      className={cn('absolute overflow-hidden rounded-[4px] border border-foreground/[0.08] bg-background shadow-[0_0.5px_2px_rgba(0,0,0,0.04)] transition-shadow',
                        item.task && 'cursor-pointer hover:shadow-md',
                      )}
                      style={{
                        top: `${item.slot * MINI_SLOT + 1}px`,
                        height: `${h}px`,
                        left: `calc(36px + ${(col / groupSize) * 100}% - ${(col / groupSize) * 40}px)`,
                        width: `calc(${(1 / groupSize) * 100}% - ${40 / groupSize}px)`,
                      }}>
                      {isCompact ? (
                        <div className="flex h-full items-center gap-1 overflow-hidden px-1.5">
                          <div className={cn('h-1.5 w-1.5 shrink-0', item.isSelf ? 'rounded-full bg-teal-500' : 'rounded-[1px] bg-foreground/45')} />
                          <span className="min-w-0 truncate text-[10px] font-medium text-foreground/70">{item.title}</span>
                          <span className="shrink-0 text-[8px] tabular-nums text-foreground/25">{item.time.split('–')[0]}</span>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col overflow-hidden px-1.5 pt-0.5">
                          <div className="flex items-center gap-1">
                            <div className={cn('h-1.5 w-1.5 shrink-0', item.isSelf ? 'rounded-full bg-teal-500' : 'rounded-[1px] bg-foreground/45')} />
                            <span className="truncate text-[10px] font-medium text-foreground/70">{item.title}</span>
                          </div>
                          <span className="mt-auto pb-0.5 text-[8px] tabular-nums text-foreground/25">{item.time}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {/* Untimed items */}
        {untimedItems.length > 0 && (
          <div className="border-t border-foreground/[0.06] px-4 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/25">시간 미지정</p>
            <div className="space-y-1">
              {untimedItems.map(item => (
                <div key={item.id} onClick={() => { if (item.task) setTaskModal(item.task) }}
                  className={cn('group flex items-center justify-between rounded-md bg-foreground/[0.03] px-2.5 py-1.5', item.task && 'cursor-pointer hover:bg-foreground/[0.05]')}>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className={cn('h-1.5 w-1.5 shrink-0', item.isSelf ? 'rounded-full bg-teal-500' : 'rounded-[1px] bg-foreground/45')} />
                    <span className="truncate text-[11px] font-medium text-foreground/70">{item.title}</span>
                  </div>
                  {item.isPersonal && item.psId && (
                    <button type="button" onClick={() => removePersonalSchedule(item.psId!)}
                      className="rounded p-0.5 text-foreground/15 opacity-0 hover:text-red-500 group-hover:opacity-100">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {!hasPeriod && !hasContent && untimedItems.length === 0 && !showAdd && (
          <p className="py-8 text-center text-[12px] text-foreground/20">이 날의 업무가 없습니다</p>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="mx-4 mb-3 mt-2 space-y-1.5 rounded-lg border border-teal-500/20 bg-teal-500/[0.03] p-2.5">
            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="일정 제목"
              className="w-full rounded-md border border-foreground/[0.08] bg-background px-2.5 py-1.5 text-[12px] placeholder:text-foreground/25 focus:border-teal-500/40 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <div className="flex gap-1.5">
              <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                className="flex-1 rounded-md border border-foreground/[0.08] bg-background px-2.5 py-1.5 text-[12px] focus:border-teal-500/40 focus:outline-none" />
              <button type="button" onClick={handleAdd} disabled={!newTitle.trim()}
                className="rounded-md bg-teal-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-teal-600 disabled:opacity-30">추가</button>
              <button type="button" onClick={() => { setShowAdd(false); setNewTitle(''); setNewTime('') }}
                className="rounded-md px-2 py-1.5 text-[11px] text-foreground/40 hover:bg-foreground/[0.04]">취소</button>
            </div>
          </div>
        )}
      </div>

      {taskModal && (
        <TaskDetailModal
          task={taskModal}
          onClose={() => setTaskModal(null)}
          onComplete={() => { toggleTaskStatus(taskModal.id); setTaskModal(null) }}
          onRequestReview={() => { requestReview(taskModal.id); setTaskModal(null) }}
          onCancelReview={() => { cancelReview(taskModal.id); setTaskModal(null) }}
          onChangeStatus={(_, status: string) => {
            const m: Record<string, string> = { pending: 'pending', in_progress: 'in_progress', pending_review: 'pending_review', completed: 'completed', overdue: 'overdue', unassigned: 'unassigned' }
            changeStatus(taskModal.id, m[status] as any)
          }}
          onSendMessage={(_, content) => addTaskMessage(taskModal.id, content)}
        />
      )}
    </div>
  )
}
