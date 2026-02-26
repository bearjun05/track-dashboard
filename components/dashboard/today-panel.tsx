'use client'

import { useMemo } from 'react'
import { useDashboardStore } from '@/lib/store'
import { useStaffDashboard } from '@/lib/hooks/use-staff-dashboard'
import { trackTaskToTask } from '@/lib/hooks/track-task-adapter'
import { TaskCard } from './task-card'
import { Plus, ListTodo } from 'lucide-react'
import { useState } from 'react'

export function TodayPanel({ staffId }: { staffId?: string }) {
  const legacyStore = useDashboardStore()
  const staffData = useStaffDashboard(staffId ?? '')

  const todayTasks = useMemo(() => {
    if (staffId) {
      return [
        ...staffData.untimedTasks.map(trackTaskToTask),
        ...staffData.selfTasks.map(trackTaskToTask),
      ]
    }
    return legacyStore.todayTasks
  }, [staffId, staffData.untimedTasks, staffData.selfTasks, legacyStore.todayTasks])

  const addTodayTask = staffId ? staffData.addSelfTask : legacyStore.addTodayTask

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const requestedTasks = todayTasks.filter((t) => t.type === 'manager_request')
  const systemTasks = todayTasks.filter(
    (t) => t.type === 'system' || t.type === 'period',
  )
  const selfTasks = todayTasks.filter((t) => t.type === 'self_added')

  // Sort period tasks by deadline (closest first)
  systemTasks.sort((a, b) => {
    if (a.endDate && b.endDate) {
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
    }
    return 0
  })

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    addTodayTask(newTaskTitle.trim())
    setNewTaskTitle('')
    setShowAddForm(false)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-gray-200 bg-card">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold tracking-tight text-gray-900">
            {'오늘 할 일'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="할 일 추가"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {showAddForm && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
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
              onClick={handleAddTask}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {'추가'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-0 overflow-y-auto px-3 py-3">
        {/* Requested tasks */}
        {requestedTasks.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {'요청 받은 일'}
            </h3>
            <div className="space-y-2">
              {requestedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {/* System / period tasks */}
        {systemTasks.length > 0 && (
          <section className="mt-4">
            {requestedTasks.length > 0 && (
              <div className="mb-3 border-t border-gray-200" />
            )}
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {'오늘 해야 하는 일'}
            </h3>
            <div className="space-y-2">
              {systemTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {/* Self-added tasks */}
        {selfTasks.length > 0 && (
          <section className="mt-4">
            <div className="mb-3 border-t border-gray-200" />
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {'내가 추가한 일'}
            </h3>
            <div className="space-y-2">
              {selfTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
