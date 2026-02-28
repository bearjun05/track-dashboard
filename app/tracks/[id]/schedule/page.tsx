'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import { SharedCalendar } from '@/components/calendar'
import type { CalendarView } from '@/components/calendar/calendar-types'
import { TrackScheduleCreateModal } from '@/components/track/track-schedule-create-modal'
import { Plus } from 'lucide-react'
import { TODAY } from '@/lib/date-constants'
import { timeToSlot } from '@/components/calendar/calendar-utils'
import { computeOverlapColumns } from '@/lib/grid-utils'

interface Props {
  params: Promise<{ id: string }>
}

export default function TrackSchedulePage({ params }: Props) {
  const { id: trackId } = React.use(params)
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [highlightScheduleId, setHighlightScheduleId] = useState<string | null>(null)

  const { operatorTrackDetails } = useAdminStore()

  const staffList = useMemo(() => {
    const allDetails = Object.values(operatorTrackDetails).flat()
    return allDetails.find((d) => d.trackId === trackId)?.staff ?? []
  }, [operatorTrackDetails, trackId])

  const handleCreated = useCallback((type: 'schedule' | 'task', id: string) => {
    if (type === 'schedule') {
      setHighlightScheduleId(id)
      setTimeout(() => setHighlightScheduleId(null), 2500)
    }
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-2 px-2 py-2">
        {calendarView === 'month' ? (
          <>
            <div className="w-[65%] shrink-0">
              <SharedCalendar
                trackId={trackId}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                view={calendarView}
                onViewChange={setCalendarView}
                highlightScheduleId={highlightScheduleId}
              />
            </div>
            <div className="flex w-[35%] flex-col">
              <TrackScheduleRightPanel trackId={trackId} selectedDate={selectedDate} staffList={staffList} onCreateClick={() => setShowCreateModal(true)} />
            </div>
          </>
        ) : (
          <div className="w-full">
            <SharedCalendar
              trackId={trackId}
              view={calendarView}
              onViewChange={setCalendarView}
              highlightScheduleId={highlightScheduleId}
            />
          </div>
        )}
      </div>

      {showCreateModal && (
        <TrackScheduleCreateModal
          trackId={trackId}
          staffList={staffList}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

function TrackScheduleRightPanel({ trackId, selectedDate, staffList, onCreateClick }: {
  trackId: string; selectedDate: Date | null; staffList: { id: string; name: string }[]; onCreateClick?: () => void
}) {
  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

  const dateObj = selectedDate ?? TODAY
  const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
  const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 (${DAY_NAMES[dateObj.getDay()]})`

  const { schedules, trackTasks } = useAdminStore()

  const daySchedules = useMemo(() => {
    return schedules.filter(s =>
      s.trackId === trackId && dateStr >= s.startDate && dateStr <= s.endDate
    )
  }, [schedules, trackId, dateStr])

  const dayTasks = useMemo(() => {
    return trackTasks.filter(t => {
      if (t.trackId !== trackId) return false
      if (t.endDate && t.endDate !== t.scheduledDate) {
        return dateStr >= t.scheduledDate && dateStr <= t.endDate
      }
      return t.scheduledDate === dateStr
    })
  }, [trackTasks, trackId, dateStr])

  const opSchedules = daySchedules.filter(s => s.type === 'operation_period')
  const otherSchedules = daySchedules.filter(s => s.type !== 'operation_period' && s.type !== 'personal')
  const periodTasks = dayTasks.filter(t => t.endDate && t.endDate !== t.scheduledDate)
  const pointTasks = dayTasks.filter(t => !t.endDate || t.endDate === t.scheduledDate)

  const timedPoint = pointTasks.filter(t => t.scheduledTime)
  const untimedPoint = pointTasks.filter(t => !t.scheduledTime)

  const timedStaffColumns = useMemo(() => {
    const groups = new Map<string, typeof timedPoint>()
    const unassigned: typeof timedPoint = []

    for (const t of timedPoint) {
      if (!t.assigneeId) { unassigned.push(t); continue }
      const list = groups.get(t.assigneeId) ?? []
      list.push(t)
      groups.set(t.assigneeId, list)
    }

    const result: { staffId: string | null; staffName: string; tasks: typeof timedPoint }[] = []
    for (const staff of staffList) {
      result.push({
        staffId: staff.id,
        staffName: staff.name,
        tasks: groups.get(staff.id) ?? [],
      })
    }
    if (unassigned.length > 0) {
      result.push({ staffId: null, staffName: '미배정', tasks: unassigned })
    }
    return result
  }, [timedPoint, staffList])

  const hasContent = opSchedules.length > 0 || otherSchedules.length > 0 || periodTasks.length > 0 || timedPoint.length > 0 || untimedPoint.length > 0

  return (
    <div className="flex h-full flex-col rounded-xl border border-foreground/[0.08] bg-background shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-foreground/[0.06] px-4">
        <h3 className="text-[13px] font-semibold text-foreground">{dateLabel}</h3>
        {onCreateClick && (
          <button type="button" onClick={onCreateClick}
            className="flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-colors hover:bg-foreground/90">
            <Plus className="h-3 w-3" />생성
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Operation schedules */}
        {opSchedules.length > 0 && (
          <div className="border-b border-foreground/[0.06] px-4 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-500/60">운영일정</p>
            <div className="space-y-1">
              {opSchedules.map(s => (
                <div key={s.id} className="rounded-md bg-violet-500/[0.06] px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-violet-500/60" />
                    <span className="truncate text-[11px] font-medium text-violet-800">{s.title}</span>
                  </div>
                  <p className="mt-0.5 pl-3 text-[9px] tabular-nums text-foreground/25">
                    {s.startDate.slice(5)} ~ {s.endDate.slice(5)}
                    {s.category && <span className="ml-1.5 text-violet-400">· {s.category}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other schedules (curriculum, chapter, etc.) */}
        {otherSchedules.length > 0 && (
          <div className="border-b border-foreground/[0.06] px-4 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/25">일정</p>
            <div className="space-y-1">
              {otherSchedules.map(s => (
                <div key={s.id} className="rounded-md bg-blue-500/[0.06] px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-blue-500/60" />
                    <span className="truncate text-[11px] font-medium text-blue-800">{s.title}</span>
                  </div>
                  <p className="mt-0.5 pl-3 text-[9px] tabular-nums text-foreground/25">
                    {s.startDate.slice(5)} ~ {s.endDate.slice(5)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Period tasks */}
        {periodTasks.length > 0 && (
          <div className="border-b border-foreground/[0.06] px-4 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/25">기간 Task</p>
            <div className="space-y-1">
              {periodTasks.map(t => (
                <div key={t.id} className="rounded-[4px] border border-foreground/[0.08] bg-background px-2 py-1.5 shadow-[0_0.5px_2px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-[1px] bg-foreground/45" />
                    <span className="min-w-0 truncate text-[11px] font-medium text-foreground/70">{t.title}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 pl-3">
                    <span className="text-[9px] tabular-nums text-foreground/25">{t.scheduledDate.slice(5)} ~ {t.endDate?.slice(5)}</span>
                    <span className="text-foreground/10">·</span>
                    <span className="text-[9px] font-medium text-foreground/40">{t.assigneeName ?? '미배정'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Point tasks - timed, time-grid per staff */}
        {timedPoint.length > 0 && (
          <StaffTimeGrid columns={timedStaffColumns} />
        )}

        {/* Untimed tasks */}
        {untimedPoint.length > 0 && (
          <div className="border-b border-foreground/[0.06] px-4 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/25">시간 미지정</p>
            <div className="space-y-1">
              {untimedPoint.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 rounded-[4px] border border-foreground/[0.08] bg-background px-2 py-1.5 shadow-[0_0.5px_2px_rgba(0,0,0,0.04)]">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-[1px] bg-foreground/45" />
                  <span className="min-w-0 truncate text-[11px] font-medium text-foreground/70">{t.title}</span>
                  <span className="ml-auto shrink-0 text-[9px] font-medium text-foreground/35">{t.assigneeName ?? '미배정'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasContent && (
          <p className="py-8 text-center text-[12px] text-foreground/20">이 날의 일정/업무가 없습니다</p>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   Mini time-grid: staff columns x hour rows
   ================================================================ */
const GRID_HOUR_START = 9
const GRID_HOUR_END = 18
const GRID_SLOT_H = 18
const GRID_TOTAL_SLOTS = (GRID_HOUR_END - GRID_HOUR_START) * 2

interface StaffColumn {
  staffId: string | null
  staffName: string
  tasks: { id: string; title: string; scheduledTime?: string; dueTime?: string }[]
}

function StaffTimeGrid({ columns }: { columns: StaffColumn[] }) {
  const gridHeight = GRID_TOTAL_SLOTS * GRID_SLOT_H
  const hasAnyTask = columns.some(c => c.tasks.length > 0)
  const visibleCols = columns.filter(c => c.tasks.length > 0)
  if (!hasAnyTask) return null

  return (
    <div className="border-b border-foreground/[0.06] px-3 py-2.5">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/25">시간 지정 업무</p>

      <div className="overflow-hidden rounded-lg border border-foreground/[0.06]">
        {/* Staff name header */}
        <div className="grid border-b border-foreground/[0.06] bg-foreground/[0.02]"
          style={{ gridTemplateColumns: `32px repeat(${visibleCols.length}, 1fr)` }}>
          <div />
          {visibleCols.map(col => (
            <div key={col.staffId ?? '_un'} className="flex items-center justify-center py-1.5"
              style={{ borderLeft: '1px solid rgba(0,0,0,0.03)' }}>
              <span className="truncate text-[10px] font-semibold text-foreground/50">
                {col.staffName}
              </span>
            </div>
          ))}
        </div>

        {/* Time grid body */}
        <div className="relative grid"
          style={{
            gridTemplateColumns: `32px repeat(${visibleCols.length}, 1fr)`,
            height: `${gridHeight}px`,
          }}>

          {/* Time labels column */}
          <div className="relative">
            {Array.from({ length: GRID_HOUR_END - GRID_HOUR_START + 1 }).map((_, i) => (
              <div key={i} className="absolute right-0 flex w-full justify-end pr-1" style={{ top: `${i * GRID_SLOT_H * 2 - 5}px` }}>
                <span className="text-[8px] tabular-nums text-foreground/20">
                  {String(GRID_HOUR_START + i).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>

          {/* Staff columns */}
          {visibleCols.map((col) => (
            <div key={col.staffId ?? '_un'} className="relative" style={{ borderLeft: '1px solid rgba(0,0,0,0.03)' }}>
              {/* Hour lines */}
              {Array.from({ length: GRID_HOUR_END - GRID_HOUR_START + 1 }).map((_, i) => (
                <div key={i} className="absolute inset-x-0 border-t border-foreground/[0.05]"
                  style={{ top: `${i * GRID_SLOT_H * 2}px` }} />
              ))}
              {/* Half-hour dashed */}
              {Array.from({ length: GRID_HOUR_END - GRID_HOUR_START }).map((_, i) => (
                <div key={`h-${i}`} className="absolute inset-x-0 border-t border-dashed border-foreground/[0.03]"
                  style={{ top: `${i * GRID_SLOT_H * 2 + GRID_SLOT_H}px` }} />
              ))}

              {/* Task cards — overlap-aware column split */}
              {(() => {
                const items = col.tasks
                  .filter(t => t.scheduledTime)
                  .map(t => {
                    const slot = timeToSlot(t.scheduledTime!)
                    const endSlot = t.dueTime ? timeToSlot(t.dueTime) : slot + 1
                    return { ...t, slot, endSlot: Math.max(slot + 1, endSlot) }
                  })
                  .sort((a, b) => a.slot - b.slot || (b.endSlot - b.slot) - (a.endSlot - a.slot))

                const placed = computeOverlapColumns(items)

                return items.map((item, idx) => {
                  const { col: c, groupSize } = placed[idx]
                  const span = item.endSlot - item.slot
                  const h = span * GRID_SLOT_H - 2
                  const top = item.slot * GRID_SLOT_H + 1
                  const isCompact = span <= 1
                  const leftPct = (c / groupSize) * 100
                  const widthPct = (1 / groupSize) * 100

                  return (
                    <div key={item.id}
                      className="absolute z-10 overflow-hidden rounded-[4px] border border-foreground/[0.08] bg-background shadow-[0_0.5px_2px_rgba(0,0,0,0.04)]"
                      style={{
                        top: `${top}px`,
                        height: `${h}px`,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 3px)`,
                      }}>
                      {isCompact ? (
                        <div className="flex h-full items-center gap-1 overflow-hidden px-1">
                          <div className="h-1.5 w-1.5 shrink-0 rounded-[1px] bg-foreground/45" />
                          <span className="min-w-0 truncate text-[9px] font-medium leading-snug text-foreground/70">{item.title}</span>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col overflow-hidden px-1 pt-0.5">
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 w-1.5 shrink-0 rounded-[1px] bg-foreground/45" />
                            <span className="truncate text-[9px] font-medium leading-snug text-foreground/70">{item.title}</span>
                          </div>
                          <span className="mt-auto pb-0.5 text-[8px] tabular-nums text-foreground/25">
                            {item.scheduledTime}{item.dueTime ? `–${item.dueTime}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
