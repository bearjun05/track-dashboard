'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import { ROLE_LABELS } from '@/lib/role-labels'
import { KanbanBoard } from './kanban-board'
import { OperatorChatSection } from './operator-chat-section'
import { PlannerTrackCards } from './planner-track-cards'
import { TodayActionList } from './today-action-list'
import { OperatorStatusTab } from './operator-status-tab'
import {
  ClipboardList,
  TrendingUp,
  AlertCircle,
  UserX,
  MessageSquare,
  LayoutGrid,
  FolderKanban,
  CalendarCheck,
  Users,
} from 'lucide-react'

type DashboardRole = 'operator_manager' | 'operator'

const ROLE_USER_NAME: Record<DashboardRole, string> = {
  operator_manager: '이운기',
  operator: '이운영',
}

const ROLE_TITLE: Record<DashboardRole, string> = {
  operator_manager: 'APM 운영 관리',
  operator: '운영 관리',
}

type OperatorTabId = 'today' | 'tracks' | 'kanban' | 'chat'
type ManagerTabId = 'tracks' | 'operators' | 'kanban' | 'chat'
type TabId = OperatorTabId | ManagerTabId

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

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent?: 'default' | 'warning' | 'danger'
}) {
  const accentCls =
    accent === 'danger'
      ? 'text-red-500'
      : accent === 'warning'
        ? 'text-amber-500'
        : 'text-foreground'

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05] text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold tabular-nums leading-tight ${accentCls}`}>
          {value}
          {sub && <span className="ml-0.5 text-xs font-normal text-muted-foreground">{sub}</span>}
        </p>
      </div>
    </div>
  )
}

export function DashboardHome({
  userId,
  role,
}: {
  userId: string
  role: DashboardRole
}) {
  const { plannerTracks, kanbanCards, trackTasks } = useAdminStore()
  const isManager = role === 'operator_manager'
  const defaultTab: TabId = isManager ? 'tracks' : 'today'
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)

  const tracks = useMemo(() => {
    if (role === 'operator') {
      return plannerTracks.filter((t) => t.operator?.id === userId)
    }
    return plannerTracks
  }, [plannerTracks, role, userId])

  const stats = useMemo(() => {
    const activeKanban = kanbanCards.filter(
      (c) => c.status === 'waiting' || c.status === 'in-progress',
    ).length

    const avgCompletion =
      tracks.length > 0
        ? Math.round(tracks.reduce((s, t) => s + t.completionRate, 0) / tracks.length)
        : 0

    const waitingIssues = tracks.reduce((s, t) => s + t.issueSummary.waiting, 0)

    const unassigned = trackTasks.filter((t) => t.status === 'unassigned').length

    const TODAY_STR = new Date().toISOString().split('T')[0]
    const todayPendingCount = (() => {
      const urgentKanbans = kanbanCards.filter((c) => c.isUrgent && c.status !== 'done').length
      const overdueTasks = trackTasks.filter((t) => {
        if (t.status === 'completed' || t.status === 'unassigned') return false
        const dueDate = t.dueDate ?? t.scheduledDate
        return dueDate < TODAY_STR
      }).length
      const unassignedTasks = trackTasks.filter((t) => t.status === 'unassigned').length
      return urgentKanbans + overdueTasks + unassignedTasks + waitingIssues + activeKanban
    })()

    return { activeKanban, avgCompletion, waitingIssues, unassigned, todayPendingCount }
  }, [kanbanCards, tracks, trackTasks])

  const handleSwitchToKanban = useCallback(() => setActiveTab('kanban'), [])

  const operatorTabs: { id: OperatorTabId; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'today',
      label: '오늘의 할 일',
      icon: <CalendarCheck className="h-3.5 w-3.5" />,
      count: stats.todayPendingCount > 0 ? stats.todayPendingCount : undefined,
    },
    {
      id: 'tracks',
      label: '담당 트랙',
      icon: <LayoutGrid className="h-3.5 w-3.5" />,
      count: tracks.length,
    },
    {
      id: 'kanban',
      label: '업무/요청',
      icon: <FolderKanban className="h-3.5 w-3.5" />,
      count: stats.activeKanban,
    },
    {
      id: 'chat',
      label: '소통',
      icon: <MessageSquare className="h-3.5 w-3.5" />,
    },
  ]

  const managerTabs: { id: ManagerTabId; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'tracks',
      label: '트랙 현황',
      icon: <LayoutGrid className="h-3.5 w-3.5" />,
      count: tracks.length,
    },
    {
      id: 'operators',
      label: `${ROLE_LABELS.operator} 현황`,
      icon: <Users className="h-3.5 w-3.5" />,
    },
    {
      id: 'kanban',
      label: '업무 관리',
      icon: <FolderKanban className="h-3.5 w-3.5" />,
      count: stats.activeKanban,
    },
    {
      id: 'chat',
      label: '소통',
      icon: <MessageSquare className="h-3.5 w-3.5" />,
    },
  ]

  const tabs = isManager ? managerTabs : operatorTabs
  const userName = ROLE_USER_NAME[role]

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
              {ROLE_TITLE[role]} · 담당 트랙 {tracks.length}개 · 오늘 처리할 업무{' '}
              {stats.activeKanban}건
            </p>
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">{formatToday()}</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Summary Stats */}
        <div className="shrink-0 px-6 pt-5 pb-2">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={<ClipboardList className="h-4 w-4" />}
              label="진행중 업무"
              value={stats.activeKanban}
              sub="건"
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="평균 완료율"
              value={`${stats.avgCompletion}%`}
              accent={stats.avgCompletion < 30 ? 'danger' : stats.avgCompletion < 60 ? 'warning' : 'default'}
            />
            <StatCard
              icon={<AlertCircle className="h-4 w-4" />}
              label="대기 이슈"
              value={stats.waitingIssues}
              sub="건"
              accent={stats.waitingIssues > 0 ? 'warning' : 'default'}
            />
            <StatCard
              icon={<UserX className="h-4 w-4" />}
              label="미배정 업무"
              value={stats.unassigned}
              sub="건"
              accent={stats.unassigned > 0 ? 'danger' : 'default'}
            />
          </div>
        </div>

        {/* Tab Bar */}
        <div className="shrink-0 px-6 pt-3 pb-1">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count != null && (
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums ${
                        isActive
                          ? 'bg-background/20 text-background'
                          : 'bg-foreground/[0.06] text-muted-foreground'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-0 flex-1 px-6 py-4">
          {activeTab === 'today' && (
            <TodayActionList tracks={tracks} onSwitchToKanban={handleSwitchToKanban} />
          )}
          {activeTab === 'tracks' && <PlannerTrackCards tracks={tracks} />}
          {activeTab === 'operators' && <OperatorStatusTab />}
          {activeTab === 'kanban' && <KanbanBoard />}
          {activeTab === 'chat' && <OperatorChatSection />}
        </div>
      </div>
    </div>
  )
}
