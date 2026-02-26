'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import type { TrackTask } from '@/lib/admin-mock-data'
import { ROLE_LABELS } from '@/lib/role-labels'
import { useRoleStore, ROLE_USER_NAME, ROLE_HOME } from '@/lib/role-store'
import {
  ArrowLeft, Users, GraduationCap, ClipboardList, Calendar, Megaphone,
  TrendingUp, AlertCircle, UserX, AlertTriangle,
} from 'lucide-react'
import { TODAY_STR, formatToday } from './track-utils'
import { ProgressBar } from './track-task-card'
import { TrackTaskSection } from './track-task-section'
import { TrackScheduleCalendar } from './track-schedule-section'
import { TrackStaffSection } from './track-staff-section'
import { TrackNoticeSection } from './track-notice-section'
import { TaskDetailModal, DeferModal, NewTaskModal, ReassignModalInline, BulkAssignContent } from './track-modals'

type TabId = 'tasks' | 'schedule' | 'staff' | 'notices'

function StatCard({ icon, label, value, sub, accent, onClick }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string
  accent?: 'default' | 'warning' | 'danger'; onClick?: () => void
}) {
  const accentCls = accent === 'danger' ? 'text-red-500' : accent === 'warning' ? 'text-amber-500' : 'text-foreground'
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-all ${onClick ? 'cursor-pointer hover:border-foreground/20 hover:shadow-sm' : 'cursor-default'}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05] text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold tabular-nums leading-tight ${accentCls}`}>
          {value}{sub && <span className="ml-0.5 text-xs font-normal text-muted-foreground">{sub}</span>}
        </p>
      </div>
    </button>
  )
}

export function TrackDetail({ trackId }: { trackId: string }) {
  const {
    plannerTracks, trackTasks, staffCards, operatorTrackDetails,
    bulkAssignTasks, reassignTask, addTrackTask, updateTrackTaskStatus,
    deferTask, moveTaskToToday, moveTaskToDate,
    trackSchedules, addTrackSchedule, updateTrackSchedule, removeTrackSchedule,
    trackNotices, addTrackNotice, removeTrackNotice, addTrackNoticeReply, extendTrackNotice, markNoticeRead,
    setStaffVacation, removeStaffVacation, updateStaffWorkSchedule, updateStaffMemo,
  } = useAdminStore()
  const currentRole = useRoleStore((s) => s.currentRole)
  const currentUserName = ROLE_USER_NAME[currentRole]
  const homeHref = ROLE_HOME[currentRole]

  const [activeTab, setActiveTab] = useState<TabId>('tasks')
  const [selectedTask, setSelectedTask] = useState<TrackTask | null>(null)
  const [reassignTarget, setReassignTarget] = useState<TrackTask | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [deferTarget, setDeferTarget] = useState<TrackTask | null>(null)
  const [initialScopeFilter, setInitialScopeFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [initialStatusFilter, setInitialStatusFilter] = useState<string>('all')

  const track = plannerTracks.find((t) => t.id === trackId)

  if (!track) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-[15px] font-semibold text-foreground">트랙을 찾을 수 없습니다</p>
        <p className="text-[12px] text-muted-foreground">요청한 트랙(ID: {trackId})이 존재하지 않습니다.</p>
        <Link href={homeHref} className="mt-2 rounded-lg bg-foreground px-4 py-2 text-[12px] text-background transition-colors hover:bg-foreground/90">돌아가기</Link>
      </div>
    )
  }

  const rawTrackTasks = trackTasks.filter((t) => t.trackId === trackId)

  const allTrackTasks = useMemo(() => {
    return rawTrackTasks.map((t) => {
      if (t.status === 'unassigned' || t.status === 'completed') return t
      if (t.scheduledDate <= TODAY_STR && t.status === 'pending') return { ...t, status: 'in-progress' as const }
      const dueDate = t.dueDate ?? t.scheduledDate
      if (dueDate < TODAY_STR && t.status === 'in-progress') return { ...t, status: 'overdue' as const }
      return t
    })
  }, [rawTrackTasks])

  const dDayText = useMemo(() => {
    const parts = track.period.split(' ~ ')
    if (parts.length < 2) return null
    const endDate = new Date(parts[1].replace(/\./g, '-'))
    const today = new Date(TODAY_STR)
    const diff = Math.ceil((endDate.getTime() - today.getTime()) / 86400000)
    if (diff < 0) return { label: `D+${Math.abs(diff)}`, urgent: true }
    if (diff === 0) return { label: 'D-Day', urgent: true }
    return { label: `D-${diff}`, urgent: diff <= 7 }
  }, [track.period])

  const trackSchedulesForTrack = useMemo(() => trackSchedules.filter((s) => s.trackId === trackId), [trackSchedules, trackId])
  const trackNoticesForTrack = useMemo(() => trackNotices.filter((n) => n.trackId === trackId), [trackNotices, trackId])

  const staffList = useMemo(() => {
    const allDetails = Object.values(operatorTrackDetails).flat()
    return allDetails.find((d) => d.trackId === trackId)?.staff ?? []
  }, [operatorTrackDetails, trackId])

  const staffVacationMap = useMemo(() => {
    const map = new Map<string, { start: string; end: string }>()
    for (const sc of staffCards) { if (sc.vacation) map.set(sc.id, sc.vacation) }
    return map
  }, [staffCards])

  const staffTaskStats = useMemo(() => {
    const todayTasks = allTrackTasks.filter((t) => t.scheduledDate === TODAY_STR)
    const map = new Map<string, { completed: number; inProgress: number; overdue: number; pending: number; total: number }>()
    for (const t of todayTasks) {
      if (!t.assigneeId) continue
      if (!map.has(t.assigneeId)) map.set(t.assigneeId, { completed: 0, inProgress: 0, overdue: 0, pending: 0, total: 0 })
      const s = map.get(t.assigneeId)!; s.total++
      if (t.status === 'completed') s.completed++
      else if (t.status === 'in-progress') s.inProgress++
      else if (t.status === 'overdue') s.overdue++
      else if (t.status === 'pending') s.pending++
    }
    return map
  }, [allTrackTasks])

  const unassignedTasks = allTrackTasks.filter((t) => t.status === 'unassigned')
  const overdueTasks = allTrackTasks.filter((t) => t.status === 'overdue')
  const todayTasks = useMemo(() => allTrackTasks.filter((t) => t.scheduledDate === TODAY_STR), [allTrackTasks])
  const todayTaskCount = todayTasks.length
  const todayCompleted = todayTasks.filter((t) => t.status === 'completed').length
  const todayRate = todayTaskCount > 0 ? Math.round((todayCompleted / todayTaskCount) * 100) : 0
  const issueRate = track.operator && track.operator.issueTotal > 0
    ? Math.round((track.operator.issueResolved / track.operator.issueTotal) * 100) : 0

  const toggleTaskSelection = useCallback((id: string) => { setSelectedTaskIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next }) }, [])
  const handleTaskClick = useCallback((task: TrackTask) => { setSelectedTask(task) }, [])
  const handleAssignToday = useCallback((taskId: string) => { moveTaskToToday(taskId) }, [moveTaskToToday])
  const handleDefer = useCallback((task: TrackTask) => { setDeferTarget(task) }, [])
  const handleDeferConfirm = useCallback((taskId: string, newStart: string, newEnd?: string) => { deferTask(taskId, newStart, newEnd) }, [deferTask])
  const handleMoveToDate = useCallback((taskId: string, newDate: string) => { moveTaskToDate(taskId, newDate) }, [moveTaskToDate])

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number; warning?: boolean }[] = [
    { id: 'tasks', label: 'Task 관리', icon: <ClipboardList className="h-3.5 w-3.5" />, count: todayTaskCount },
    { id: 'schedule', label: '일정', icon: <Calendar className="h-3.5 w-3.5" />, count: trackSchedulesForTrack.length },
    { id: 'staff', label: '학관 관리', icon: <Users className="h-3.5 w-3.5" />, count: overdueTasks.length > 0 ? overdueTasks.length : undefined, warning: overdueTasks.length > 0 },
    { id: 'notices', label: '공지', icon: <Megaphone className="h-3.5 w-3.5" />, count: trackNoticesForTrack.length },
  ]

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href={homeHref} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
            <span className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-semibold" style={{ backgroundColor: `${track.color}15`, color: track.color }}>{track.name}</span>
            <span className="text-[11px] text-muted-foreground">{track.period}</span>
            {dDayText && <span className={`rounded-full px-2 py-[2px] text-[10px] font-bold tabular-nums ${dDayText.urgent ? 'bg-destructive/10 text-destructive' : 'bg-foreground/[0.06] text-muted-foreground'}`}>{dDayText.label}</span>}
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">{formatToday()}</span>
        </div>
        <p className="mt-1 pl-9 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{ROLE_LABELS.learning_manager} {staffList.length}명</span>
          <span className="mx-1.5 text-foreground/20">·</span>
          <span className="inline-flex items-center gap-1"><GraduationCap className="h-3 w-3" />{track.studentCount}명</span>
          <span className="mx-1.5 text-foreground/20">·</span>
          오늘 Task {todayTaskCount}건
          {unassignedTasks.length > 0 && <><span className="mx-1.5 text-foreground/20">·</span><span className="text-red-500">미배정 {unassignedTasks.length}건</span></>}
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Summary Stats */}
        <div className="shrink-0 px-6 pt-5 pb-2">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label={`${ROLE_LABELS.learning_manager} 업무완료율`} value={`${track.completionRate}%`}
              accent={track.completionRate < 30 ? 'danger' : track.completionRate < 60 ? 'warning' : 'default'}
              onClick={() => { setActiveTab('staff') }} />
            <StatCard icon={<AlertCircle className="h-4 w-4" />} label="이슈 처리율" value={`${issueRate}%`} sub={`(${track.issueSummary.done}/${track.issueSummary.total})`}
              accent={issueRate < 50 ? 'danger' : 'default'} />
            <StatCard icon={<UserX className="h-4 w-4" />} label="미배정 Task" value={unassignedTasks.length} sub="건"
              accent={unassignedTasks.length > 0 ? 'danger' : 'default'}
              onClick={() => { setActiveTab('tasks'); setInitialScopeFilter('unassigned'); setInitialStatusFilter('all') }} />
            <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="기한초과 Task" value={overdueTasks.length} sub="건"
              accent={overdueTasks.length > 0 ? 'danger' : 'default'}
              onClick={() => { setActiveTab('tasks'); setInitialScopeFilter('all'); setInitialStatusFilter('overdue') }} />
          </div>
        </div>

        {/* Today Summary */}
        <div className="shrink-0 px-6 pt-3">
          <div className="flex items-center gap-3 rounded-lg bg-foreground/[0.03] px-4 py-2.5">
            <div className="flex flex-1 items-center gap-3 text-[12px]">
              <span className="font-medium text-foreground">오늘 Task</span>
              <span className="tabular-nums text-muted-foreground">{todayCompleted}<span className="text-foreground/30">/</span>{todayTaskCount}건 완료</span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-foreground/[0.08]">
                <div className={`h-full rounded-full transition-all ${todayRate < 30 ? 'bg-red-500' : todayRate < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${todayRate}%` }} />
              </div>
              <span className={`text-[11px] font-bold tabular-nums ${todayRate < 30 ? 'text-red-500' : todayRate < 60 ? 'text-amber-500' : 'text-emerald-500'}`}>{todayRate}%</span>
              {unassignedTasks.length > 0 && <><span className="text-foreground/20">|</span><span className="text-red-500/80">미배정 {unassignedTasks.length}건</span></>}
              {overdueTasks.length > 0 && <><span className="text-foreground/20">|</span><span className="text-red-500/80">기한초과 {overdueTasks.length}건</span></>}
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="shrink-0 px-6 pt-3 pb-1">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                  {tab.icon}{tab.label}
                  {tab.count != null && (
                    <span className={`ml-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums ${
                      tab.warning
                        ? isActive ? 'bg-red-500/30 text-background' : 'bg-red-500/10 text-red-500'
                        : isActive ? 'bg-background/20 text-background' : 'bg-foreground/[0.06] text-muted-foreground'
                    }`}>{tab.count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-0 flex-1 px-6 py-4">
          {activeTab === 'tasks' && (
            <TrackTaskSection
              allTrackTasks={allTrackTasks} staffList={staffList} trackId={trackId}
              onTaskClick={handleTaskClick} onAssignToday={handleAssignToday} onDefer={handleDefer} onMoveToDate={handleMoveToDate}
              onShowNewTask={() => setShowNewTask(true)} onShowBulkAssign={() => setShowBulkAssign(true)}
              selectedTaskIds={selectedTaskIds} onToggleSelect={toggleTaskSelection}
              initialScopeFilter={initialScopeFilter} initialStatusFilter={initialStatusFilter}
              onBulkComplete={(ids) => { ids.forEach((id) => updateTrackTaskStatus(id, 'completed')); setSelectedTaskIds(new Set()) }}
              onBulkDefer={(ids) => { const tomorrow = new Date(TODAY_STR); tomorrow.setDate(tomorrow.getDate() + 1); const tStr = tomorrow.toISOString().split('T')[0]; ids.forEach((id) => deferTask(id, tStr)); setSelectedTaskIds(new Set()) }}
            />
          )}
          {activeTab === 'schedule' && (
            <TrackScheduleCalendar trackId={trackId} schedules={trackSchedulesForTrack}
              onAddSchedule={addTrackSchedule} onUpdateSchedule={updateTrackSchedule} onRemoveSchedule={removeTrackSchedule} />
          )}
          {activeTab === 'staff' && (
            <TrackStaffSection
              staffList={staffList} staffTaskStats={staffTaskStats} staffVacationMap={staffVacationMap}
              allTrackTasks={allTrackTasks} staffCards={staffCards}
              trackPeriod={(() => { const parts = track.period.split(' ~ '); return { start: new Date(parts[0].replace(/\./g, '-')), end: new Date(parts[1].replace(/\./g, '-')) } })()}
              onSetVacation={(sid, v) => setStaffVacation(sid, v)}
              onRemoveVacation={(sid, vid) => removeStaffVacation(sid, vid)}
              onUpdateSchedule={(sid, schedule) => updateStaffWorkSchedule(sid, schedule)}
              onUpdateMemo={(sid, memo) => updateStaffMemo(sid, memo)}
            />
          )}
          {activeTab === 'notices' && (
            <TrackNoticeSection trackId={trackId} notices={trackNoticesForTrack} staffList={staffList}
              onAdd={addTrackNotice} onReply={addTrackNoticeReply} onExtend={extendTrackNotice} onRemove={removeTrackNotice}
              onMarkRead={(noticeId) => markNoticeRead(noticeId, currentUserName)} />
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedTask && (() => {
        const liveTask = trackTasks.find((t) => t.id === selectedTask.id) ?? selectedTask
        return <TaskDetailModal task={liveTask} staffList={staffList} onClose={() => setSelectedTask(null)} onComplete={(tid) => updateTrackTaskStatus(tid, 'completed')} onReassign={(t) => setReassignTarget(t)} onDefer={(t) => setDeferTarget(t)} />
      })()}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={() => setReassignTarget(null)}>
          <ReassignModalInline task={reassignTarget} staffList={staffList} onReassign={(tid, sid, sn, nd) => { reassignTask(tid, sid, sn, nd); setReassignTarget(null) }} onClose={() => setReassignTarget(null)} />
        </div>
      )}
      {showBulkAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={() => setShowBulkAssign(false)}>
          <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <BulkAssignContent taskCount={selectedTaskIds.size} staffList={staffList} onAssign={(sid, sn) => { bulkAssignTasks([...selectedTaskIds], sid, sn); setSelectedTaskIds(new Set()); setShowBulkAssign(false) }} onClose={() => setShowBulkAssign(false)} />
          </div>
        </div>
      )}
      {showNewTask && <NewTaskModal trackId={trackId} staffList={staffList} onAdd={addTrackTask} onClose={() => setShowNewTask(false)} />}
      {deferTarget && <DeferModal task={deferTarget} onDefer={handleDeferConfirm} onClose={() => setDeferTarget(null)} />}
    </div>
  )
}
