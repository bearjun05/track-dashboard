'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import { ROLE_LABELS_FULL } from '@/lib/role-labels'
import { ArrowLeft, Bell, ChevronDown, ChevronUp, MessageSquare, AlertTriangle } from 'lucide-react'

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const color =
    value >= 80 ? 'bg-success' : value >= 60 ? 'bg-warning' : 'bg-destructive'
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-secondary ${className ?? ''}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

export function OperatorDetailPage({ operatorId }: { operatorId: string }) {
  const { operators, operatorTasks, operatorTrackDetails } = useAdminStore()
  const [showCompleted, setShowCompleted] = useState(false)

  const operator = operators.find((op) => op.id === operatorId) ?? operators[0]
  const tasks = operatorTasks[operator.id] ?? []
  const trackDetails = operatorTrackDetails[operator.id] ?? []

  const completedTasks = tasks.filter((t) => t.isCompleted)
  const incompleteTasks = tasks.filter((t) => !t.isCompleted)

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/managers/mgr1"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">
              {`${ROLE_LABELS_FULL.operator}: `}{operator.name}
            </span>
            <span className="text-border">{'|'}</span>
            <span className="text-muted-foreground">
              {'담당 트랙: '}{operator.tracks.map((t) => t.trackName).join(', ')}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="알림"
        >
          <Bell className="h-5 w-5" />
        </button>
      </header>

      {/* Body: 2 columns */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left (40%): Operator Tasks */}
        <section className="flex w-2/5 flex-col border-r border-border">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">{`${ROLE_LABELS_FULL.operator} 업무 현황`}</h2>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{'업무 완료율'}</span>
                <span className="font-medium text-foreground">
                  {operator.taskCompletionRate}{'% ('}{operator.taskCompleted}{'/'}{operator.taskTotal}{')'}
                </span>
              </div>
              <ProgressBar value={operator.taskCompletionRate} className="mt-2" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Incomplete tasks (priority) */}
            <div className="mb-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
                {'미완료 ('}{incompleteTasks.length}{')'}
              </h3>
              <div className="space-y-2">
                {incompleteTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-border bg-background p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{task.title}</span>
                    </div>
                    <span className="mt-1.5 block text-xs text-destructive">
                      {task.dueDate}{' 마감'}
                    </span>
                  </div>
                ))}
                {incompleteTasks.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">{'미완료 업무가 없습니다'}</p>
                )}
              </div>
            </div>

            {/* Completed tasks (collapsible) */}
            <div>
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className="mb-3 flex w-full items-center justify-between text-sm font-semibold text-success"
              >
                <span>{'완료 ('}{completedTasks.length}{')'}</span>
                {showCompleted ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showCompleted && (
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg bg-secondary/50 p-3.5"
                    >
                      <span className="text-sm text-muted-foreground line-through">{task.title}</span>
                      {task.completedAt && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {'완료: '}{task.completedAt}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right (60%): Track Staff Status */}
        <section className="flex w-3/5 flex-col overflow-y-auto px-6 py-4">
          {trackDetails.map((trackDetail) => (
            <div key={trackDetail.trackId} className="mb-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                {'담당 트랙: '}{trackDetail.trackName}
              </h2>
              <div className="space-y-3">
                {trackDetail.staff.map((staff) => (
                  <div
                    key={staff.id}
                    className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{staff.name}</h3>
                      <Link
                        href={`/tracks/${trackDetail.trackId}`}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        {'상세보기'}
                      </Link>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{'업무 완료율'}</span>
                        <span className="font-medium text-foreground">
                          {staff.taskCompletionRate}{'% ('}{staff.taskCompleted}{'/'}{staff.taskTotal}{')'}
                        </span>
                      </div>
                      <ProgressBar value={staff.taskCompletionRate} className="mt-1.5" />
                    </div>

                    <div className="mt-2.5 flex items-center gap-4 text-xs">
                      {staff.unreadMessages > 0 && (
                        <span className="flex items-center gap-1 text-primary">
                          <MessageSquare className="h-3 w-3" />
                          {'안읽은 대화: '}{staff.unreadMessages}{'건'}
                        </span>
                      )}
                      {staff.missedRound && (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {'미완료 팀순회: '}{staff.missedRound}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
