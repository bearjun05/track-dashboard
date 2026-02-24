'use client'

import { useAdminStore } from '@/lib/admin-store'
import { KanbanBoard } from './kanban-board'
import { OperatorChatSection } from './operator-chat-section'
import { PlannerTrackCards } from './planner-track-cards'

export function ManagerDashboardHome() {
  const { plannerTracks } = useAdminStore()

  const MAX_SHOWN = 4
  const trackSummary = plannerTracks
    .slice(0, MAX_SHOWN)
    .map((t) => {
      const shortName = t.name.replace(' 트랙', '').replace('트랙 ', '')
      const periodShort = t.period.replace(/2026\./g, '').replace(/ /g, '')
      return `${shortName} (${periodShort})`
    })
    .join('  ·  ')
  const extraCount = plannerTracks.length - MAX_SHOWN
  const trackLabel = extraCount > 0 ? `${trackSummary}  ·  외 ${extraCount}개` : trackSummary

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <h1 className="text-[15px] font-bold tracking-tight text-foreground">{'APM 운영 관리'}</h1>

        <div className="hidden text-xs text-muted-foreground lg:block">
          <span className="font-medium text-foreground">
            {'담당 트랙 '}{plannerTracks.length}{'개'}
          </span>
          <span className="mx-2 text-border">{'|'}</span>
          {trackLabel}
        </div>

        <div className="flex items-center gap-3" />
      </header>

      {/* Body */}
      <main className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
        <KanbanBoard />
        <OperatorChatSection />
        <PlannerTrackCards />
      </main>
    </div>
  )
}
