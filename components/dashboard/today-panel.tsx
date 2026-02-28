'use client'

import { useMemo, useState } from 'react'
import { useStaffDashboard } from '@/lib/hooks/use-staff-dashboard'
import { trackTaskToUnified } from '@/components/task/task-adapter'
import { TaskCard } from '@/components/task/task-card'
import { TaskDetailModal } from '@/components/task/task-detail-modal'
import type { UnifiedTask } from '@/components/task/task-types'
import { ListTodo } from 'lucide-react'
import { TODAY_STR } from '@/lib/date-constants'

export function TodayPanel({ staffId, selectedDate }: { staffId?: string; selectedDate?: string }) {
  const staffData = useStaffDashboard(staffId ?? '', selectedDate)

  const tasks = useMemo(() => {
    if (!staffId) return [] as UnifiedTask[]
    const unified = staffData.untimedTasks.map(trackTaskToUnified)
    const seen = new Set(unified.map(t => t.id))
    const extraSelf = staffData.selfTasks
      .filter(t => t.scheduledDate === (selectedDate ?? TODAY_STR) && !seen.has(t.id))
      .map(trackTaskToUnified)
    return [...unified, ...extraSelf]
  }, [staffId, staffData.untimedTasks, staffData.selfTasks, selectedDate])

  const sentTasks = tasks.filter(t => t.source === 'request_sent')
  const requestedTasks = tasks.filter(t => t.source === 'request_received')
  const systemTasks = tasks.filter(t => t.source === 'system')
  const selfTasks = tasks.filter(t => t.source === 'self')

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) ?? null : null

  const handleSendMessage = (taskId: string, content: string) => {
    staffData.addTaskMessage(taskId, content)
  }

  const sections = [
    { key: 'sent', label: '요청한', tasks: sentTasks },
    { key: 'requested', label: '받은 요청', tasks: requestedTasks },
    { key: 'system', label: '자동 배정', tasks: systemTasks },
    { key: 'self', label: '내가 추가한', tasks: selfTasks },
  ].filter(s => s.tasks.length > 0)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-foreground/[0.08] bg-background shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex h-11 shrink-0 items-center px-4">
        <div className="flex items-center gap-2">
          <ListTodo className="h-3.5 w-3.5 text-foreground/30" />
          <h2 className="text-[13px] font-semibold text-foreground">업무 리스트</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sections.map((section, idx) => (
          <div key={section.key}>
            {idx > 0 && <div className="mx-3 border-t border-foreground/[0.05]" />}
            <div className="px-3 py-3">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/25">
                {section.label}
              </h3>
              <div className="space-y-1.5">
                {section.tasks.map((task) => (
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
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-foreground/20">할 일이 없습니다</p>
          </div>
        )}
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
