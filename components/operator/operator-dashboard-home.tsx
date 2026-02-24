'use client'

import { useAdminStore } from '@/lib/admin-store'
import { ROLE_LABELS } from '@/lib/role-labels'
import { KanbanBoard } from '@/components/manager/kanban-board'
import { OperatorChatSection } from '@/components/manager/operator-chat-section'
import { PlannerTrackCards } from '@/components/manager/planner-track-cards'
import { NotificationDropdown } from '@/components/manager/notification-dropdown'

const CURRENT_OPERATOR_NAME = '이운영'

export function OperatorDashboardHome() {
  const { plannerTracks } = useAdminStore()

  const operatorTracks = plannerTracks.filter((t) => t.operator?.name === CURRENT_OPERATOR_NAME)

  const MAX_SHOWN = 4
  const trackSummary = operatorTracks
    .slice(0, MAX_SHOWN)
    .map((t) => {
      const shortName = t.name.replace(' 트랙', '').replace('트랙 ', '')
      const periodShort = t.period.replace(/2026\./g, '').replace(/ /g, '')
      return `${shortName} (${periodShort})`
    })
    .join('  ·  ')
  const extraCount = operatorTracks.length - MAX_SHOWN
  const trackLabel = extraCount > 0 ? `${trackSummary}  ·  외 ${extraCount}개` : trackSummary

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <h1 className="text-[15px] font-bold tracking-tight text-foreground">운영 관리</h1>

        <div className="hidden text-xs text-muted-foreground lg:block">
          <span className="font-medium text-foreground">
            담당 트랙 {operatorTracks.length}개
          </span>
          <span className="mx-2 text-border">|</span>
          {trackLabel}
        </div>

        <div className="flex items-center gap-3">
          <NotificationDropdown />
          <div className="h-5 w-px bg-border" />
          <span className="text-[13px] text-muted-foreground">{CURRENT_OPERATOR_NAME} <span className="text-foreground/40">{ROLE_LABELS.operator}</span></span>
        </div>
      </header>

      <main className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
        <KanbanBoard />
        <OperatorChatSection />
        <PlannerTrackCards basePath="/operator" />
      </main>
    </div>
  )
}
