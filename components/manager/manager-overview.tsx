'use client'

import { useMemo } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import { TrackHealthSection } from './track-health-section'
import { TrackStatsSection } from './track-stats-section'
import { TrackActionSection } from './track-action-section'
import { MyTaskSection } from './my-task-section'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return '좋은 아침이에요'
  if (h < 18) return '좋은 오후에요'
  return '좋은 저녁이에요'
}

function formatToday(): string {
  const d = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`
}

type DashboardRole = 'operator_manager' | 'operator'

const ROLE_TITLE: Record<DashboardRole, string> = {
  operator_manager: 'EduWorks 운영 관리',
  operator: '운영 관리',
}

export function ManagerOverview({
  userId,
  role = 'operator_manager',
}: {
  userId: string
  role?: DashboardRole
}) {
  const { plannerTracks, trackTasks } = useAdminStore()

  const tracks = useMemo(() => {
    if (role === 'operator') {
      return plannerTracks.filter((t) => t.operator?.id === userId)
    }
    return plannerTracks
  }, [plannerTracks, role, userId])

  const userName = useMemo(() => {
    if (role === 'operator') {
      const op = plannerTracks.find((t) => t.operator?.id === userId)?.operator
      return op?.name ?? userId
    }
    return '이운기'
  }, [plannerTracks, role, userId])

  const isOperator = role === 'operator'

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              {userName}님, {getGreeting()}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ROLE_TITLE[role]} · 담당 트랙 {tracks.length}개
            </p>
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">{formatToday()}</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] space-y-6 px-6 pt-5 pb-24">
          {/* Weekly Health */}
          <TrackHealthSection tracks={tracks} />

          {/* Track Stats */}
          <TrackStatsSection tracks={tracks} showOperator={!isOperator} />

          {/* Track Actions (운영매만) */}
          {isOperator && (
            <TrackActionSection tracks={tracks} managerId={userId} />
          )}

          {/* My Tasks */}
          <MyTaskSection managerId={userId} role={role} tracks={tracks} />
        </div>
      </div>
    </div>
  )
}
