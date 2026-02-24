'use client'

import { useDashboardStore } from '@/lib/store'
import { TaskCard } from './task-card'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9) // 9:00 ~ 18:00

function groupTasksByHour(tasks: Task[]): Record<number, Task[]> {
  const groups: Record<number, Task[]> = {}
  for (const task of tasks) {
    if (!task.dueTime) continue
    const hour = Number.parseInt(task.dueTime.split(':')[0], 10)
    if (!groups[hour]) groups[hour] = []
    groups[hour].push(task)
  }
  return groups
}

export function TimePanel() {
  const { timedTasks } = useDashboardStore()
  const grouped = groupTasksByHour(timedTasks)
  const [currentHour, setCurrentHour] = useState(-1)

  useEffect(() => {
    setCurrentHour(new Date().getHours())
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-gray-200 bg-card">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-200 px-4">
        <Clock className="h-4 w-4 text-gray-500" />
        <h2 className="text-sm font-semibold tracking-tight text-gray-900">
          {'시간 기반 Task'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => {
          const tasks = grouped[hour] || []
          const isCurrentHour = hour === currentHour
          const isPast = hour < currentHour

          return (
            <div
              key={hour}
              className={cn(
                'relative border-b border-gray-100',
                isCurrentHour && 'bg-blue-50/50',
              )}
            >
              {/* Time label */}
              <div className="flex">
                <div
                  className={cn(
                    'flex w-14 shrink-0 items-start justify-end border-r border-gray-200 px-2 py-2',
                    isCurrentHour && 'border-r-primary',
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isCurrentHour
                        ? 'text-primary'
                        : isPast
                          ? 'text-gray-400'
                          : 'text-gray-500',
                    )}
                  >
                    {`${hour}:00`}
                  </span>
                </div>

                <div className="min-h-[60px] flex-1 p-2">
                  {tasks.length === 0 ? (
                    <div className="h-full" />
                  ) : tasks.length <= 2 ? (
                    <div className="space-y-1.5">
                      {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} showTime />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                      <p className="mb-1.5 text-xs font-medium text-gray-600">
                        {'Task '}{tasks.length}
                      </p>
                      {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} compact />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 30min line */}
              <div className="absolute left-14 right-0 top-1/2 border-t border-dashed border-gray-100" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
