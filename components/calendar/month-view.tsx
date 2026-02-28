'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { UnifiedSchedule } from '@/components/schedule/schedule-types'
import type { UnifiedTask } from '@/components/task/task-types'
import type { AllDayInputs, FilterKey, SpanBar } from './calendar-types'
import { TODAY } from './calendar-types'
import { toDateStr, isSameDay, getMonthStart, computeAllDayBars, getMaxRow } from './calendar-utils'
import { AllDayBarRenderer } from './all-day-bar'

export function MonthView({ schedules, chapters, operationPeriods, tasks, periodTasks, personalSchedules, monthOffset, onDateClick, allDayInputs, filters, selectedDate, highlightIds }: {
  schedules: UnifiedSchedule[]; chapters: UnifiedSchedule[]; operationPeriods: UnifiedSchedule[]
  tasks: UnifiedTask[]; periodTasks: UnifiedTask[]; personalSchedules: UnifiedSchedule[]
  monthOffset: number; onDateClick: (d: Date) => void
  allDayInputs: AllDayInputs; filters: Set<FilterKey>; selectedDate?: Date
  highlightIds?: Set<string>
}) {
  const targetMonth = new Date(getMonthStart(TODAY).getFullYear(), getMonthStart(TODAY).getMonth() + monthOffset, 1)
  const year = targetMonth.getFullYear()
  const month = targetMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const allWeekdays: Date[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    if (date.getDay() >= 1 && date.getDay() <= 5) allWeekdays.push(date)
  }

  const weeks: (Date | null)[][] = []
  let currentWeek: (Date | null)[] = []
  if (allWeekdays.length > 0) { for (let i = 1; i < allWeekdays[0].getDay(); i++) currentWeek.push(null) }
  for (const date of allWeekdays) {
    if (date.getDay() === 1 && currentWeek.length > 0) { while (currentWeek.length < 5) currentWeek.push(null); weeks.push(currentWeek); currentWeek = [] }
    while (currentWeek.length < date.getDay() - 1) currentWeek.push(null)
    currentWeek.push(date)
  }
  if (currentWeek.length > 0) { while (currentWeek.length < 5) currentWeek.push(null); weeks.push(currentWeek) }

  const ROW_H = 20

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-3">
      <div className="mb-1 grid grid-cols-5">
        {['월', '화', '수', '목', '금'].map(name => (
          <div key={name} className="py-1 text-center text-[12px] font-medium text-foreground/30">{name}</div>
        ))}
      </div>

      <div className="flex flex-col rounded-lg border border-foreground/[0.06]">
        {weeks.map((weekDays, wi) => {
          const validDays = weekDays.filter(Boolean) as Date[]
          if (validDays.length === 0) return null

          const safeDays = weekDays.map(d => d ?? new Date(0))
          const bars = computeAllDayBars(allDayInputs.chapterItems, allDayInputs.curriculumItems, allDayInputs.opPeriodItems, allDayInputs.periodTaskItems, safeDays)
            .filter(() => weekDays.some(d => d !== null))
          const rowCount = getMaxRow(bars)
          const spanAreaHeight = Math.max(rowCount * ROW_H + 2, 2)

          return (
            <div key={wi} className={cn('relative flex', wi > 0 && 'border-t border-foreground/[0.04]')}
              style={{ minHeight: `${Math.max(100, 28 + spanAreaHeight + 36)}px` }}>
              <div className="pointer-events-none absolute inset-x-0 top-[24px] z-10" style={{ height: `${spanAreaHeight}px` }}>
                {bars.map(bar => <AllDayBarRenderer key={bar.id} bar={bar} cols={5} rowHeight={ROW_H} highlightIds={highlightIds} />)}
              </div>

              {weekDays.map((date, di) => {
                if (!date) return <div key={`e-${wi}-${di}`} className="flex-1 bg-background" style={{ borderRight: di < 4 ? '1px solid rgba(0,0,0,0.03)' : undefined }} />
                const isToday = isSameDay(date, TODAY)
                const dateStr = toDateStr(date)
                const dayTasks = tasks.filter(t => t.startDate === dateStr).filter(t => {
                  const self = t.source === 'self' || t.source === 'request_sent'
                  return self ? filters.has('my') : filters.has('task')
                })
                const dayPersonal = filters.has('my') ? personalSchedules.filter(ps => ps.startDate === dateStr) : []
                const allEvents = [
                  ...dayTasks.map(t => ({ id: t.id, title: t.title, isSelf: t.source === 'self' || t.source === 'request_sent' })),
                  ...dayPersonal.map(ps => ({ id: ps.id, title: ps.title, isSelf: true })),
                ]

                const isSelected = selectedDate && isSameDay(date, selectedDate)
                return (
                  <button key={dateStr} type="button" onClick={() => onDateClick(date)}
                    className={cn('flex flex-1 flex-col bg-background px-1 pb-1 pt-0.5 text-left transition-colors hover:bg-foreground/[0.02]',
                      isToday && 'bg-blue-500/[0.03]',
                      isSelected && !isToday && 'bg-foreground/[0.03]',
                    )}
                    style={{ borderRight: di < 4 ? '1px solid rgba(0,0,0,0.03)' : undefined }}>
                    <span className={cn('mb-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
                      isToday ? 'bg-blue-500 font-semibold text-white' : isSelected ? 'bg-foreground/10 font-semibold text-foreground/70' : 'text-foreground/40',
                    )}>{date.getDate()}</span>
                    <div style={{ height: `${spanAreaHeight}px` }} />
                    {allEvents.length > 0 && (
                      <div className="mt-0.5 flex flex-col gap-px overflow-hidden">
                        {allEvents.slice(0, 2).map(ev => (
                          <div key={ev.id} className="flex items-center gap-1 overflow-hidden">
                            <div className={cn('h-1.5 w-1.5 shrink-0', ev.isSelf ? 'rounded-full bg-teal-500' : 'rounded-[1px] bg-foreground/45')} />
                            <span className="truncate text-[11px] leading-tight text-foreground/60">{ev.title}</span>
                          </div>
                        ))}
                        {allEvents.length > 2 && <span className="text-[11px] text-foreground/30">+{allEvents.length - 2}</span>}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
