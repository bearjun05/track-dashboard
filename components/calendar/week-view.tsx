'use client'

import { useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { UnifiedSchedule } from '@/components/schedule/schedule-types'
import type { UnifiedTask } from '@/components/task/task-types'
import type { AllDayInputs, FilterKey } from './calendar-types'
import { TODAY, HOUR_START, HOUR_END, SLOT_HEIGHT, SLOTS, LAYER_STYLES } from './calendar-types'
import { addDays, toDateStr, isSameDay, isInRange, getWeekStart, timeToSlot, computeAllDayBars, getMaxRow } from './calendar-utils'
import { AllDayBarRenderer } from './all-day-bar'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export function WeekView({ schedules, chapters, operationPeriods, tasks, periodTasks, personalSchedules, weekOffset, onDateClick, allDayInputs, filters, onTaskClick, highlightIds }: {
  schedules: UnifiedSchedule[]; chapters: UnifiedSchedule[]; operationPeriods: UnifiedSchedule[]
  tasks: UnifiedTask[]; periodTasks: UnifiedTask[]; personalSchedules: UnifiedSchedule[]
  weekOffset: number; onDateClick: (d: Date) => void
  allDayInputs: AllDayInputs; filters: Set<FilterKey>; onTaskClick?: (task: UnifiedTask) => void
  highlightIds?: Set<string>
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const days = Array.from({ length: 5 }, (_, i) => addDays(addDays(getWeekStart(TODAY), weekOffset * 7), i))

  const allDayBars = useMemo(
    () => computeAllDayBars(allDayInputs.chapterItems, allDayInputs.curriculumItems, allDayInputs.opPeriodItems, allDayInputs.periodTaskItems, days),
    [allDayInputs, days.map(d => toDateStr(d)).join()],
  )

  const maxRow = getMaxRow(allDayBars)
  const ROW_H = 22
  const allDayHeight = Math.max(maxRow * ROW_H + 4, 26)

  useEffect(() => {
    if (gridRef.current) {
      const nowMins = (TODAY.getHours() - HOUR_START) * 60 + TODAY.getMinutes()
      gridRef.current.scrollTop = Math.max(0, (nowMins / 30) * SLOT_HEIGHT - 100)
    }
  }, [weekOffset])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-foreground/[0.06]">
        <div className="grid" style={{ gridTemplateColumns: '52px repeat(5, 1fr)' }}>
          <div />
          {days.map(date => {
            const isToday = isSameDay(date, TODAY)
            return (
              <div key={toDateStr(date)} className={cn('flex items-center justify-center gap-1.5 py-2', isToday && 'bg-blue-500/[0.03]')}>
                <span className={cn('text-[11px]', isToday ? 'font-semibold text-blue-600' : 'text-foreground/30')}>{DAY_NAMES[date.getDay()]}</span>
                <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px]', isToday ? 'bg-blue-500 font-bold text-white' : 'font-medium text-foreground/50')}>{date.getDate()}</span>
              </div>
            )
          })}
        </div>
      </div>

      {allDayBars.length > 0 && (
        <div className="shrink-0 border-b border-foreground/[0.06] bg-foreground/[0.01]">
          <div className="grid" style={{ gridTemplateColumns: '52px repeat(5, 1fr)' }}>
            <div className="flex items-start justify-end pr-2 pt-1.5">
              <span className="text-[10px] font-medium text-foreground/20">종일</span>
            </div>
            <div className="col-span-5 relative" style={{ height: `${allDayHeight}px` }}>
              {allDayBars.map(bar => <AllDayBarRenderer key={bar.id} bar={bar} cols={5} rowHeight={ROW_H} highlightIds={highlightIds} />)}
            </div>
          </div>
        </div>
      )}

      <div ref={gridRef} className="flex-1 overflow-y-auto">
        {(() => {
          const untimedByDay = days.map(date => {
            const dateStr = toDateStr(date)
            const showTask = filters.has('task')
            const showMy = filters.has('my')
            const t = tasks.filter(tt => tt.startDate === dateStr && !tt.startTime).filter(tt => {
              const self = tt.source === 'self' || tt.source === 'request_sent'
              return self ? showMy : showTask
            })
            const p = showMy ? personalSchedules.filter(ps => ps.startDate === dateStr && !ps.startTime) : []
            return [...t.map(x => ({ id: x.id, title: x.title, isSelf: x.source === 'self' || x.source === 'request_sent' })), ...p.map(x => ({ id: x.id, title: x.title, isSelf: true }))]
          })
          const hasAny = untimedByDay.some(arr => arr.length > 0)
          if (!hasAny) return null
          const maxItems = Math.max(...untimedByDay.map(arr => Math.min(arr.length, 3)))
          const rowH = maxItems * 18 + 8
          return (
            <div className="sticky top-0 z-20 border-b border-foreground/[0.06] bg-background">
              <div className="grid" style={{ gridTemplateColumns: '52px repeat(5, 1fr)', height: `${rowH}px` }}>
                <div className="flex items-start justify-end pr-2 pt-1">
                  <span className="text-[10px] font-medium text-foreground/20">미지정</span>
                </div>
                {untimedByDay.map((items, i) => (
                  <div key={i} className="flex flex-col gap-0.5 px-1 py-1" style={{ borderLeft: '1px solid rgba(0,0,0,0.04)' }}>
                    {items.slice(0, 3).map(item => (
                      <div key={item.id} className={cn('flex items-center gap-1 overflow-hidden rounded-[3px] px-1.5 py-px',
                        item.isSelf ? LAYER_STYLES.task_self.bg : LAYER_STYLES.task_system.bg,
                      )}>
                        <div className={cn('h-1.5 w-1.5 shrink-0', item.isSelf ? 'rounded-full bg-teal-500' : 'rounded-[1px] bg-foreground/45')} />
                        <span className="truncate text-[11px] font-medium leading-snug text-foreground/70">{item.title}</span>
                      </div>
                    ))}
                    {items.length > 3 && <span className="pl-1 text-[10px] text-foreground/25">+{items.length - 3}</span>}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        <div className="relative grid" style={{ gridTemplateColumns: '52px repeat(5, 1fr)', height: `${SLOT_HEIGHT * SLOTS}px` }}>
          <div className="relative">
            {Array.from({ length: HOUR_END - HOUR_START + 1 }).map((_, i) => (
              <div key={i} className="absolute right-0 flex w-full justify-end pr-1.5" style={{ top: `${i * SLOT_HEIGHT * 2 - 5}px` }}>
                <span className="text-[10px] tabular-nums text-foreground/25">{String(HOUR_START + i).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {days.map((date, colIdx) => {
            const isToday = isSameDay(date, TODAY)
            const dateStr = toDateStr(date)
            const dayTasks = tasks.filter(t => t.startDate === dateStr).filter(t => {
              const self = t.source === 'self' || t.source === 'request_sent'
              return self ? filters.has('my') : filters.has('task')
            })
            const dayPersonal = filters.has('my') ? personalSchedules.filter(ps => ps.startDate === dateStr) : []
            const dayEvents = schedules.filter(s => s.type === 'track_event' && isInRange(dateStr, s.startDate, s.endDate))

            return (
              <div key={dateStr} className={cn('relative cursor-pointer', isToday && 'bg-blue-500/[0.015]')}
                style={{ borderLeft: '1px solid rgba(0,0,0,0.04)' }} onClick={() => onDateClick(date)}>

                {Array.from({ length: HOUR_END - HOUR_START + 1 }).map((_, i) => (
                  <div key={i} className="absolute inset-x-0 border-t border-foreground/[0.05]" style={{ top: `${i * SLOT_HEIGHT * 2}px` }} />
                ))}
                {Array.from({ length: HOUR_END - HOUR_START }).map((_, i) => (
                  <div key={`h-${i}`} className="absolute inset-x-0 border-t border-dashed border-foreground/[0.03]" style={{ top: `${i * SLOT_HEIGHT * 2 + SLOT_HEIGHT}px` }} />
                ))}

                {isToday && (() => {
                  const mins = (TODAY.getHours() - HOUR_START) * 60 + TODAY.getMinutes()
                  const top = (mins / 30) * SLOT_HEIGHT
                  if (top < 0 || top > SLOT_HEIGHT * SLOTS) return null
                  return (
                    <div className="absolute inset-x-0 z-20 flex items-center" style={{ top: `${top}px` }}>
                      <div className="-ml-[3px] h-[7px] w-[7px] rounded-full bg-red-500" />
                      <div className="flex-1 border-t-2 border-red-500" />
                    </div>
                  )
                })()}

                {(() => {
                  type GridItem = { id: string; title: string; slot: number; endSlot: number; timeLabel: string; isSelf: boolean; completed: boolean; task?: UnifiedTask }
                  const items: GridItem[] = []

                  dayEvents.filter(ev => ev.startTime).forEach(ev => {
                    const s = timeToSlot(ev.startTime!), e = ev.endTime ? timeToSlot(ev.endTime) : s + 1
                    items.push({ id: ev.id, title: ev.title, slot: s, endSlot: Math.max(s + 1, e), timeLabel: ev.startTime + (ev.endTime ? `–${ev.endTime}` : ''), isSelf: false, completed: false })
                  })
                  dayTasks.filter(t => t.startTime).forEach(t => {
                    const s = timeToSlot(t.startTime!), e = t.endTime ? timeToSlot(t.endTime) : s + 1
                    items.push({ id: t.id, title: t.title, slot: s, endSlot: Math.max(s + 1, e), timeLabel: t.startTime + (t.endTime ? `–${t.endTime}` : ''), isSelf: t.source === 'self' || t.source === 'request_sent', completed: t.status === 'completed', task: t })
                  })
                  dayPersonal.filter(ps => ps.startTime).forEach(ps => {
                    const s = timeToSlot(ps.startTime!), e = ps.endTime ? timeToSlot(ps.endTime) : s + 1
                    items.push({ id: ps.id, title: ps.title, slot: s, endSlot: Math.max(s + 1, e), timeLabel: ps.startTime + (ps.endTime ? `–${ps.endTime}` : ''), isSelf: true, completed: false })
                  })

                  items.sort((a, b) => a.slot - b.slot || (b.endSlot - b.slot) - (a.endSlot - a.slot))

                  const placed: { col: number; groupSize: number }[] = []
                  const colEnds: number[] = []

                  for (let i = 0; i < items.length; i++) {
                    const item = items[i]
                    let col = 0
                    while (col < colEnds.length && colEnds[col] > item.slot) col++
                    if (col >= colEnds.length) colEnds.push(0)
                    colEnds[col] = item.endSlot
                    placed.push({ col, groupSize: 1 })
                  }

                  for (let i = 0; i < items.length; i++) {
                    let groupMax = placed[i].col + 1
                    for (let j = 0; j < items.length; j++) {
                      if (i === j) continue
                      if (items[j].slot < items[i].endSlot && items[j].endSlot > items[i].slot) {
                        groupMax = Math.max(groupMax, placed[j].col + 1)
                      }
                    }
                    placed[i].groupSize = groupMax
                  }

                  return items.map((item, idx) => {
                    const { col, groupSize } = placed[idx]
                    const spans = item.endSlot - item.slot
                    const h = spans * SLOT_HEIGHT - 2
                    const isCompact = spans <= 1
                    const leftPct = (col / groupSize) * 100
                    const widthPct = (1 / groupSize) * 100

                    return (
                      <div key={item.id}
                        onClick={(e) => { e.stopPropagation(); if (item.task && onTaskClick) onTaskClick(item.task) }}
                        className={cn('absolute z-10 overflow-hidden rounded-[4px] border border-foreground/[0.08] bg-background shadow-[0_0.5px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md',
                          item.completed && 'opacity-30',
                          item.task && 'cursor-pointer',
                        )}
                        style={{
                          top: `${item.slot * SLOT_HEIGHT + 1}px`,
                          height: `${h}px`,
                          left: `calc(${leftPct}% + 1px)`,
                          width: `calc(${widthPct}% - 2px)`,
                        }}>
                        {isCompact ? (
                          <div className="flex h-full items-center gap-1 overflow-hidden px-1.5">
                            <div className={cn('h-1.5 w-1.5 shrink-0', item.isSelf ? 'rounded-full bg-teal-500' : 'rounded-[1px] bg-foreground/45')} />
                            <span className={cn('min-w-0 truncate text-[11px] font-medium leading-snug text-foreground/70', item.completed && 'line-through')}>{item.title}</span>
                            <span className="shrink-0 text-[9px] tabular-nums text-foreground/30">{item.timeLabel.split('–')[0]}</span>
                          </div>
                        ) : (
                          <div className="flex h-full flex-col overflow-hidden px-1.5 pt-0.5">
                            <div className="flex items-center gap-1">
                              <div className={cn('h-1.5 w-1.5 shrink-0', item.isSelf ? 'rounded-full bg-teal-500' : 'rounded-[1px] bg-foreground/45')} />
                              <span className={cn('truncate text-[11px] font-medium leading-snug text-foreground/70', item.completed && 'line-through')}>{item.title}</span>
                            </div>
                            <span className="mt-auto pb-0.5 text-[9px] tabular-nums text-foreground/30">{item.timeLabel}</span>
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
