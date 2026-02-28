'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useStaffDashboard } from '@/lib/hooks/use-staff-dashboard'
import { useAdminStore } from '@/lib/admin-store'
import { trackTaskToUnified } from '@/components/task/task-adapter'
import type { UnifiedSchedule } from '@/components/schedule/schedule-types'
import type { UnifiedTask } from '@/components/task/task-types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TaskDetailModal } from '@/components/task/task-detail-modal'

import type { CalendarView, FilterKey } from './calendar-types'
import { TODAY, ALL_FILTERS } from './calendar-types'
import { addDays, getWeekStart, getMonthStart, fmtShortRange } from './calendar-utils'
import { MonthView } from './month-view'
import { WeekView } from './week-view'
import { LegendToggle } from './legend-toggle'

export type { CalendarView } from './calendar-types'

export function SharedCalendar({ staffId, trackId, embedded, selectedDate, onSelectDate, view, onViewChange, highlightScheduleId }: {
  staffId?: string; trackId?: string; embedded?: boolean
  selectedDate?: Date | null; onSelectDate?: (d: Date) => void
  view?: CalendarView; onViewChange?: (v: CalendarView) => void
  highlightScheduleId?: string | null
}) {
  const [internalView, setInternalView] = useState<CalendarView>('month')
  const currentView = view ?? internalView
  const setView = (v: CalendarView) => { onViewChange ? onViewChange(v) : setInternalView(v) }
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const handleDateClick = (d: Date) => { onSelectDate?.(d) }
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set(ALL_FILTERS))

  const toggleFilter = (key: FilterKey) => {
    setFilters(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const [taskModal, setTaskModal] = useState<UnifiedTask | null>(null)

  const isTrackMode = !!trackId && !staffId
  const staffData = useStaffDashboard(staffId ?? '')
  const { schedules: storeSchedules, trackTasks: storeTrackTasks, updateTrackTaskStatus } = useAdminStore()

  const trackModeData = useMemo(() => {
    if (!isTrackMode) return null
    const allSchedules = storeSchedules.filter(s => s.trackId === trackId)
    const allTasks = storeTrackTasks.filter(t => t.trackId === trackId)
    const cTasks = allTasks.filter(t => t.type !== 'daily' && t.status !== 'completed' && !t.description?.startsWith('__self_added__'))
    const pTasks = cTasks.filter(t => t.endDate && t.endDate !== t.scheduledDate)
    const ptTasks = cTasks.filter(t => !t.endDate || t.endDate === t.scheduledDate)
    return {
      trackSchedules: allSchedules.filter(s => s.type === 'curriculum' || s.type === 'track_event'),
      chapters: allSchedules.filter(s => s.type === 'chapter'),
      operationPeriods: allSchedules.filter(s => s.type === 'operation_period'),
      personalSchedules: [] as UnifiedSchedule[],
      periodTasks: pTasks,
      pointTasks: ptTasks,
    }
  }, [isTrackMode, storeSchedules, storeTrackTasks, trackId])

  const {
    trackSchedules, chapters, operationPeriods, personalSchedules,
    periodTasks, pointTasks,
  } = isTrackMode && trackModeData ? trackModeData : staffData

  const {
    toggleTaskStatus, requestReview, cancelReview, changeStatus, addTaskMessage, markInProgress,
  } = staffData

  const unifiedPeriodTasks = useMemo(() => periodTasks.map(trackTaskToUnified), [periodTasks])
  const unifiedPointTasks = useMemo(() => pointTasks.map(trackTaskToUnified), [pointTasks])

  const navLabel = currentView === 'month'
    ? (() => { const t = new Date(getMonthStart(TODAY).getFullYear(), getMonthStart(TODAY).getMonth() + monthOffset, 1); return `${t.getFullYear()}년 ${t.getMonth() + 1}월` })()
    : (() => { const ws = addDays(getWeekStart(TODAY), weekOffset * 7); const we = addDays(ws, 4); return `${ws.getMonth() + 1}/${ws.getDate()} ~ ${we.getMonth() + 1}/${we.getDate()}` })()

  const navOffset = currentView === 'month' ? monthOffset : weekOffset
  const handlePrev = () => currentView === 'month' ? setMonthOffset(monthOffset - 1) : setWeekOffset(weekOffset - 1)
  const handleNext = () => currentView === 'month' ? setMonthOffset(monthOffset + 1) : setWeekOffset(weekOffset + 1)
  const handleReset = () => currentView === 'month' ? setMonthOffset(0) : setWeekOffset(0)

  const highlightIds = useMemo(() => {
    if (!highlightScheduleId) return undefined
    return new Set([highlightScheduleId])
  }, [highlightScheduleId])

  const allDayInputs = useMemo(() => {
    const showTask = filters.has('task')
    const showMy = filters.has('my')
    const visiblePeriodTasks = unifiedPeriodTasks.filter(t => {
      const isSelf = t.source === 'self' || t.source === 'request_sent'
      return isSelf ? showMy : showTask
    })
    return {
      chapterItems: chapters.map(ch => ({ id: ch.id, label: ch.title.replace(/^챕터\s*\d+:\s*/, ''), startDate: ch.startDate, endDate: ch.endDate })),
      curriculumItems: filters.has('curriculum')
        ? trackSchedules.filter(s => s.type === 'curriculum').map(s => ({ id: s.id, label: s.title, startDate: s.startDate, endDate: s.endDate }))
        : [],
      opPeriodItems: filters.has('operation')
        ? operationPeriods.map(op => ({ id: op.id, label: op.title, startDate: op.startDate, endDate: op.endDate }))
        : [],
      periodTaskItems: visiblePeriodTasks.map(t => ({
        id: t.id, label: t.title, startDate: t.startDate, endDate: t.endDate ?? t.startDate,
        isSelf: t.source === 'self' || t.source === 'request_sent',
        dateLabel: fmtShortRange(t.startDate, t.endDate),
      })),
    }
  }, [chapters, trackSchedules, operationPeriods, unifiedPeriodTasks, filters])

  return (
    <div className={cn('flex h-full flex-col overflow-hidden', !embedded && 'rounded-xl border border-foreground/[0.08] bg-background shadow-[0_1px_4px_rgba(0,0,0,0.06)]')}>
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-foreground/[0.06] px-4">
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-foreground/[0.08] bg-foreground/[0.02]">
            {(['month', 'week'] as const).map((key, i) => (
              <button key={key} type="button" onClick={() => setView(key)}
                className={cn('px-2.5 py-1 text-[11px] font-medium transition-colors',
                  i === 0 && 'rounded-l-[5px]', i === 1 && 'rounded-r-[5px]',
                  currentView === key ? 'bg-foreground text-background' : 'text-foreground/35 hover:text-foreground/55',
                )}>
                {key === 'month' ? '월간' : '주간'}
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <LegendToggle filterKey="curriculum" label="커리큘럼" shape="bar" cls="bg-blue-500/[0.12]" active={filters.has('curriculum')} onToggle={toggleFilter} />
            <LegendToggle filterKey="operation" label="운영일정" shape="bar" cls="bg-violet-500/[0.08]" border active={filters.has('operation')} onToggle={toggleFilter} />
            <LegendToggle filterKey="task" label="할 일" shape="square" cls="bg-foreground/45" active={filters.has('task')} onToggle={toggleFilter} />
            <LegendToggle filterKey="my" label="MY" shape="circle" cls="bg-teal-500" active={filters.has('my')} onToggle={toggleFilter} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={handlePrev} className="rounded p-1 text-foreground/30 hover:bg-foreground/[0.04]"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <span className="min-w-[100px] text-center text-[12px] font-medium text-foreground/50">{navLabel}</span>
          <button type="button" onClick={handleNext} className="rounded p-1 text-foreground/30 hover:bg-foreground/[0.04]"><ChevronRight className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={handleReset}
            className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium transition-opacity',
              navOffset !== 0 ? 'text-blue-600 hover:bg-blue-500/10 opacity-100' : 'pointer-events-none opacity-0',
            )}>
            {currentView === 'month' ? '이번 달' : '이번 주'}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {currentView === 'month' ? (
          <MonthView schedules={trackSchedules} chapters={chapters} operationPeriods={operationPeriods}
            tasks={unifiedPointTasks} periodTasks={unifiedPeriodTasks} personalSchedules={personalSchedules}
            monthOffset={monthOffset} onDateClick={handleDateClick} allDayInputs={allDayInputs} filters={filters}
            selectedDate={selectedDate ?? undefined} highlightIds={highlightIds} />
        ) : (
          <WeekView schedules={trackSchedules} chapters={chapters} operationPeriods={operationPeriods}
            tasks={unifiedPointTasks} periodTasks={unifiedPeriodTasks} personalSchedules={personalSchedules}
            weekOffset={weekOffset} onDateClick={handleDateClick} allDayInputs={allDayInputs} filters={filters}
            onTaskClick={setTaskModal} highlightIds={highlightIds} />
        )}
      </div>

      {taskModal && (
        <TaskDetailModal
          task={taskModal}
          onClose={() => setTaskModal(null)}
          onComplete={() => {
            if (isTrackMode) { updateTrackTaskStatus(taskModal.id, 'completed') }
            else { toggleTaskStatus(taskModal.id) }
            setTaskModal(null)
          }}
          onRequestReview={() => { if (!isTrackMode) requestReview(taskModal.id); setTaskModal(null) }}
          onCancelReview={() => { if (!isTrackMode) cancelReview(taskModal.id); setTaskModal(null) }}
          onChangeStatus={(_, status: string) => {
            const m: Record<string, string> = { pending: 'pending', in_progress: 'in_progress', pending_review: 'pending_review', completed: 'completed', overdue: 'overdue', unassigned: 'unassigned' }
            if (isTrackMode) { updateTrackTaskStatus(taskModal.id, m[status] as any) }
            else { changeStatus(taskModal.id, m[status] as any) }
          }}
          onSendMessage={(_, content) => { if (!isTrackMode) addTaskMessage(taskModal.id, content) }}
        />
      )}
    </div>
  )
}
