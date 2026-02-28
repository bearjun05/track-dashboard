'use client'

import { useMemo, useState, useEffect } from 'react'
import { useStaffDashboard } from '@/lib/hooks/use-staff-dashboard'
import { trackTaskToUnified } from '@/components/task/task-adapter'
import { TaskCard } from '@/components/task/task-card'
import { TaskDetailModal } from '@/components/task/task-detail-modal'
import type { UnifiedTask } from '@/components/task/task-types'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9)

function groupByHour(tasks: UnifiedTask[]): Record<number, UnifiedTask[]> {
  const groups: Record<number, UnifiedTask[]> = {}
  for (const task of tasks) {
    if (!task.startTime) continue
    const hour = Number.parseInt(task.startTime.split(':')[0], 10)
    if (!groups[hour]) groups[hour] = []
    groups[hour].push(task)
  }
  return groups
}

export function TimePanel({ staffId, selectedDate }: { staffId?: string; selectedDate?: string }) {
  const staffData = useStaffDashboard(staffId ?? '', selectedDate)

  const tasks = useMemo(
    () => staffData.timedTasks.map(trackTaskToUnified),
    [staffData.timedTasks],
  )

  const grouped = groupByHour(tasks)
  const [currentHour, setCurrentHour] = useState(-1)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) ?? null : null

  useEffect(() => { setCurrentHour(new Date().getHours()) }, [])

  const handleSendMessage = (taskId: string, content: string) => {
    staffData.addTaskMessage(taskId, content)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-foreground/[0.08] bg-background shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex h-11 shrink-0 items-center gap-2 px-4">
        <Clock className="h-3.5 w-3.5 text-foreground/30" />
        <h2 className="text-[13px] font-semibold text-foreground">시간 지정 업무</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => {
          const hourTasks = grouped[hour] || []
          const isCurrent = hour === currentHour
          const isPast = hour < currentHour

          return (
            <div key={hour} className={cn('relative border-b border-foreground/[0.03]', isCurrent && 'bg-blue-500/[0.03]')}>
              <div className="flex">
                {/* Time label */}
                <div className={cn(
                  'flex w-14 shrink-0 items-start justify-end border-r px-2 py-2',
                  isCurrent ? 'border-r-blue-500' : 'border-r-foreground/[0.05]',
                )}>
                  <span className={cn(
                    'text-xs font-medium tabular-nums',
                    isCurrent ? 'text-blue-600' : isPast ? 'text-foreground/15' : 'text-foreground/35',
                  )}>
                    {hour}:00
                  </span>
                </div>

                {/* Tasks */}
                <div className="min-h-[60px] flex-1 p-1.5">
                  {hourTasks.length === 0 ? (
                    <div className="h-full" />
                  ) : (
                    <div className="space-y-1.5">
                      {hourTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          variant="card"
                          task={task}
                          onClick={(t) => setSelectedTaskId(t.id)}
                          showCheckbox
                          onCheck={(id) => staffData.toggleTaskStatus(id)}
                          hideAssignee
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 30-min dashed line */}
              <div className="pointer-events-none absolute left-14 right-0 top-1/2 border-t border-dashed border-foreground/[0.03]" />
            </div>
          )
        })}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onComplete={(id) => staffData.toggleTaskStatus(id)}
          onSendMessage={handleSendMessage}
          onRequestReview={(id) => staffData.requestReview(id)}
          onCancelReview={(id) => staffData.cancelReview(id)}
          onChangeStatus={(id, status) => staffData.changeStatus(id, status as any)}
          onMarkInProgress={(id) => staffData.markInProgress(id)}
        />
      )}
    </div>
  )
}
