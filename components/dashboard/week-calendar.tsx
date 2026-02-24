'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { mockCalendarEvents, mockChapterEvents, mockTodayTasks } from '@/lib/mock-data'
import type { CalendarEvent } from '@/lib/types'
import { Calendar, ChevronRight, X, Plus } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

const EVENT_STYLE = { bg: 'bg-blue-50 border border-blue-200/60', text: 'text-blue-700' }

interface DateModalProps {
  date: Date
  events: CalendarEvent[]
  onClose: () => void
}

function DateModal({ date, events, onClose }: DateModalProps) {
  const { addTodayTask } = useDashboardStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const dayName = DAY_NAMES[date.getDay()]
  const tasks = mockTodayTasks.filter((t) => {
    const taskDate = new Date(t.dueDate)
    return isSameDay(taskDate, date)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            {`${date.getMonth() + 1}월 ${date.getDate()}일 ${dayName}요일`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {events.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {'트랙 일정'}
              </p>
              {events.map((event) => (
                  <div
                    key={event.id}
                    className={cn('mb-1.5 rounded-md px-3 py-2', EVENT_STYLE.bg)}
                  >
                    <span className={cn('text-sm font-medium', EVENT_STYLE.text)}>
                      {event.title}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {tasks.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {'내 Task'}
              </p>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="mb-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <span className={cn('text-sm text-gray-900', task.isCompleted && 'text-gray-500 line-through')}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {events.length === 0 && tasks.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">
              {'일정이 없습니다'}
            </p>
          )}
        </div>

        <div className="mt-4 border-t border-gray-200 pt-4">
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              <Plus className="h-4 w-4" />
              {'할 일 추가'}
            </button>
          ) : (
            <div>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTitle.trim()) {
                    addTodayTask(newTitle.trim())
                    setNewTitle('')
                    setShowAddForm(false)
                  }
                }}
                placeholder="할 일을 입력하세요..."
                className="w-full rounded-md border border-gray-300 bg-card px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                autoFocus
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-md border border-gray-300 bg-card px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {'취소'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newTitle.trim()) {
                      addTodayTask(newTitle.trim())
                      setNewTitle('')
                      setShowAddForm(false)
                    }
                  }}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {'추가'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function WeekChapterCalendar() {
  const [view, setView] = useState<'week' | 'chapter'>('week')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Use the same pinned date as mock-data.ts so that event dates align with "today"
  const safeToday = new Date(2026, 1, 11, 9, 0, 0)
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(safeToday, i))

  const chapterStart = addDays(safeToday, -3)
  const chapterWeeks: Date[][] = []
  for (let w = 0; w < 3; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(addDays(chapterStart, w * 7 + d))
    }
    chapterWeeks.push(week)
  }

  function getEventsForDate(date: Date, source: CalendarEvent[]): CalendarEvent[] {
    const dateStr = date.toISOString().split('T')[0]
    return source.filter((e) => e.date === dateStr)
  }

  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate, view === 'week' ? mockCalendarEvents : mockChapterEvents)
    : []

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toggle */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold tracking-tight text-gray-900">{'캘린더'}</h2>
        </div>
        <div className="flex rounded-md border border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setView('week')}
            className={cn(
              'rounded-l-md px-3 py-1 text-xs font-medium transition-colors',
              view === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            {'주 캘린더'}
          </button>
          <button
            type="button"
            onClick={() => setView('chapter')}
            className={cn(
              'rounded-r-md px-3 py-1 text-xs font-medium transition-colors',
              view === 'chapter'
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            {'챕터 캘린더'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        {view === 'week' ? (
          <div className="grid flex-1 grid-cols-5 gap-2">
            {weekDays.map((date, idx) => {
              const events = getEventsForDate(date, mockCalendarEvents)
              const isToday = idx === 0
              const tasks = mockTodayTasks.filter((t) => {
                const taskDate = new Date(t.dueDate)
                return isSameDay(taskDate, date)
              })

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'flex h-full flex-col rounded-lg border border-gray-200 p-2 text-left transition-all hover:border-gray-300 hover:shadow-sm',
                    isToday && 'border-primary/30 bg-blue-50/30',
                  )}
                >
                  <div className="mb-2 flex items-center gap-1">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isToday ? 'text-primary' : 'text-gray-600',
                      )}
                    >
                      {formatDate(date)}
                    </span>
                    <span
                      className={cn(
                        'text-xs',
                        isToday ? 'text-primary' : 'text-gray-400',
                      )}
                    >
                      {DAY_NAMES[date.getDay()]}
                    </span>
                    {isToday && (
                      <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        {'오늘'}
                      </span>
                    )}
                  </div>

                  {/* Scrollable event area */}
                  <div className="flex-1 space-y-1 overflow-y-auto">
                    {/* Track events */}
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'rounded px-2 py-1 text-[11px] font-medium',
                          EVENT_STYLE.bg,
                          EVENT_STYLE.text,
                        )}
                      >
                        {event.title}
                      </div>
                    ))}

                    {/* Separator */}
                    {events.length > 0 && tasks.filter((t) => t.type !== 'system').length > 0 && (
                      <div className="border-t border-gray-200" />
                    )}

                    {/* Tasks */}
                    {tasks
                      .filter((t) => t.type !== 'system')
                      .map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            'rounded bg-gray-100 px-2 py-1 text-[11px] text-gray-700',
                            task.isCompleted && 'text-gray-400 line-through',
                          )}
                        >
                          {task.title}
                        </div>
                      ))}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          /* Chapter Calendar */
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">
                {'챕터 3 기간'}
              </p>
              <p className="text-xs text-gray-400">
                {`${formatDate(addDays(safeToday, -3))} ~ ${formatDate(addDays(safeToday, 14))}`}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {DAY_NAMES.map((name) => (
                  <div
                    key={name}
                    className="py-1.5 text-center text-xs font-medium text-gray-500"
                  >
                    {name}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {chapterWeeks.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
                  {week.map((date) => {
                    const events = getEventsForDate(date, mockChapterEvents)
                    const isCurrentDay = isSameDay(date, safeToday)

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'flex min-h-[80px] flex-col border-r border-gray-100 p-1.5 text-left transition-colors last:border-0 hover:bg-gray-50',
                          isCurrentDay && 'bg-blue-50/50',
                        )}
                      >
                        <span
                          className={cn(
                            'mb-1 text-[11px]',
                            isCurrentDay
                              ? 'font-semibold text-primary'
                              : 'text-gray-600',
                          )}
                        >
                          {date.getDate()}
                        </span>
                        {events.map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                'mb-0.5 truncate rounded px-1 py-0.5 text-[10px] font-medium',
                                EVENT_STYLE.bg,
                                EVENT_STYLE.text,
                              )}
                            >
                              {event.title}
                            </div>
                          ))}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Date Modal */}
      {selectedDate && (
        <DateModal
          date={selectedDate}
          events={selectedDateEvents}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
