'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import type { UnifiedTask, TaskStatus } from '@/components/task/task-types'
import type { PlannerTrackCard } from '@/lib/admin-mock-data'
import { TaskCard } from '@/components/task/task-card'
import { TaskDetailModal } from '@/components/task/task-detail-modal'
import { cn } from '@/lib/utils'
import {
  Plus,
  Search,
  Zap,
  Star,
  X,
} from 'lucide-react'
import { TODAY_STR, getWeekRange, getMonthRange } from '@/lib/date-constants'

type DashboardRole = 'operator_manager' | 'operator'
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'pending_review' | 'completed'
type SortKey = 'date' | 'status'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<string, number> = {
  overdue: 0, pending_review: 1, in_progress: 2, pending: 3, completed: 4,
}

const FILTER_TABS: { key: StatusFilter; label: string; color?: 'amber' }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '대기' },
  { key: 'in_progress', label: '진행중' },
  { key: 'pending_review', label: '확인요청', color: 'amber' },
  { key: 'completed', label: '완료' },
]

const PERIOD_OPTIONS = [
  { key: 'all', label: '전체 기간' },
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번주' },
  { key: 'month', label: '이번달' },
] as const
type PeriodFilter = typeof PERIOD_OPTIONS[number]['key']

function SortButton({ label, sortKey, current, dir, onToggle }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir
  onToggle: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <button type="button" onClick={() => onToggle(sortKey)}
      className={cn('flex items-center gap-0.5', active ? 'text-foreground/60' : '')}>
      {label}
      {active && <span className="text-[8px]">{dir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  )
}

/* ── Create Task Modal ── */
function CreateTaskModal({
  onClose,
  onCreate,
  role,
  userId,
  operators,
}: {
  onClose: () => void
  onCreate: (task: UnifiedTask) => void
  role: DashboardRole
  userId: string
  operators: { id: string; name: string }[]
}) {
  const [tab, setTab] = useState<'self' | 'request'>('self')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [startDate, setStartDate] = useState(TODAY_STR)
  const [startTime, setStartTime] = useState('')
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal')
  const [reqTitle, setReqTitle] = useState('')
  const [reqContent, setReqContent] = useState('')
  const [reqUrgent, setReqUrgent] = useState(false)
  const [reqAssignee, setReqAssignee] = useState(
    role === 'operator' ? 'mgr1' : (operators[0]?.id ?? ''),
  )

  const handleSelf = () => {
    if (!title.trim()) return
    onCreate({
      id: `mt_${Date.now()}`,
      trackId: '_manager',
      title: title.trim(),
      description: desc.trim() || undefined,
      category: '운영 관리',
      source: 'self',
      assigneeId: userId,
      startDate,
      startTime: startTime || undefined,
      priority,
      status: 'pending',
      createdAt: TODAY_STR,
      messages: [],
    })
    onClose()
  }

  const handleRequest = () => {
    if (!reqTitle.trim() || !reqContent.trim()) return
    const isOperator = role === 'operator'
    onCreate({
      id: `mt_${Date.now()}`,
      trackId: '_manager',
      title: reqTitle.trim(),
      description: reqContent.trim(),
      category: '운영 관리',
      source: isOperator ? 'request_sent' : 'request_received',
      creatorId: userId,
      assigneeId: reqAssignee,
      reviewerId: isOperator ? 'mgr1' : undefined,
      startDate: TODAY_STR,
      priority: reqUrgent ? 'urgent' : 'normal',
      status: 'pending_review',
      createdAt: TODAY_STR,
      messages: [{
        id: `mtm_${Date.now()}`,
        authorId: userId,
        authorName: isOperator ? '나' : '나',
        content: reqContent.trim(),
        timestamp: new Date().toTimeString().slice(0, 5),
        isSelf: true,
      }],
    })
    onClose()
  }

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-[15px] font-semibold text-foreground">할 일 생성</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['self', 'request'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2.5 text-[13px] font-medium transition-colors',
                tab === t ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}>
              {t === 'self' ? '내 할 일' : role === 'operator' ? '총괄에게 요청' : '운영매에게 지시'}
            </button>
          ))}
        </div>

        {tab === 'self' ? (
          <div className="space-y-3 px-5 py-4">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="할 일 제목" className={inputCls} autoFocus />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="설명 (선택)" rows={2} className={inputCls} />
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={cn(inputCls, 'flex-1')} />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={cn(inputCls, 'w-28')} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">우선순위</span>
              {(['normal', 'important', 'urgent'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                    priority === p ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground')}>
                  {p === 'urgent' ? '긴급' : p === 'important' ? '중요' : '보통'}
                </button>
              ))}
            </div>
            <button type="button" onClick={handleSelf} disabled={!title.trim()}
              className="w-full rounded-lg bg-foreground py-2.5 text-[13px] font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-40">
              생성
            </button>
          </div>
        ) : (
          <div className="space-y-3 px-5 py-4">
            {role === 'operator_manager' && operators.length > 0 && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">담당 운영매니저</label>
                <select value={reqAssignee} onChange={(e) => setReqAssignee(e.target.value)} className={inputCls}>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>{op.name}</option>
                  ))}
                </select>
              </div>
            )}
            {role === 'operator' && (
              <div className="rounded-lg bg-foreground/[0.03] px-3 py-2 text-[12px] text-muted-foreground">
                담당: <span className="font-medium text-foreground">이운기 (총괄)</span>
              </div>
            )}
            <input type="text" value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="업무 제목" className={inputCls} autoFocus />
            <textarea value={reqContent} onChange={(e) => setReqContent(e.target.value)} placeholder="상세 내용" rows={3} className={inputCls} />
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <input type="checkbox" checked={reqUrgent} onChange={(e) => setReqUrgent(e.target.checked)} className="rounded" />
              긴급
            </label>
            <button type="button" onClick={handleRequest} disabled={!reqTitle.trim() || !reqContent.trim()}
              className="w-full rounded-lg bg-foreground py-2.5 text-[13px] font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-40">
              {role === 'operator' ? '요청 보내기' : '업무 지시'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Section ── */
export function MyTaskSection({
  managerId,
  role = 'operator',
  tracks = [],
}: {
  managerId: string
  role?: DashboardRole
  tracks?: PlannerTrackCard[]
}) {
  const {
    managerTasks,
    addManagerTask,
    updateManagerTaskStatus,
    addManagerTaskMessage,
  } = useAdminStore()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<Set<'urgent' | 'important'>>(new Set())
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const myTasks = useMemo(
    () => managerTasks.filter((t) => t.assigneeId === managerId),
    [managerTasks, managerId],
  )

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: myTasks.length }
    for (const t of myTasks) c[t.status] = (c[t.status] ?? 0) + 1
    return c
  }, [myTasks])

  const priorityCounts = useMemo(() => {
    const c = { urgent: 0, important: 0 }
    for (const t of myTasks) {
      if (t.priority === 'urgent') c.urgent++
      else if (t.priority === 'important') c.important++
    }
    return c
  }, [myTasks])

  const filtered = useMemo(() => {
    let tasks = myTasks
    if (statusFilter !== 'all') tasks = tasks.filter((t) => t.status === statusFilter)
    if (priorityFilter.size > 0) tasks = tasks.filter((t) => priorityFilter.has(t.priority as 'urgent' | 'important'))
    if (periodFilter !== 'all') {
      let start: string, end: string
      if (periodFilter === 'today') { start = TODAY_STR; end = TODAY_STR }
      else if (periodFilter === 'week') { [start, end] = getWeekRange() }
      else { [start, end] = getMonthRange() }
      tasks = tasks.filter((t) => t.startDate >= start && t.startDate <= end)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(q))
    }
    const sorted = [...tasks]
    sorted.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') {
        cmp = a.startDate.localeCompare(b.startDate)
        if (cmp === 0) cmp = (a.startTime ?? '').localeCompare(b.startTime ?? '')
      } else {
        cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [myTasks, statusFilter, priorityFilter, periodFilter, searchQuery, sortKey, sortDir])

  const operators = useMemo(() => {
    const map = new Map<string, string>()
    tracks.forEach((t) => { if (t.operator) map.set(t.operator.id, t.operator.name) })
    return Array.from(map, ([id, name]) => ({ id, name }))
  }, [tracks])

  const totalToday = myTasks.filter((t) => t.startDate === TODAY_STR).length
  const completedToday = myTasks.filter((t) => t.startDate === TODAY_STR && t.status === 'completed').length
  const progressPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter.size > 0 || periodFilter !== 'all' || searchQuery.trim() !== ''

  const toggleSort = useCallback((k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir('asc') }
  }, [sortKey])

  const handleCheck = useCallback((taskId: string) => {
    const task = managerTasks.find((t) => t.id === taskId)
    if (!task) return
    if (task.status === 'completed') {
      updateManagerTaskStatus(taskId, 'in_progress')
    } else if (task.status === 'in_progress' || task.status === 'pending') {
      if (task.status === 'pending') {
        updateManagerTaskStatus(taskId, 'in_progress')
        return
      }
      if (task.reviewerId) {
        updateManagerTaskStatus(taskId, 'pending_review')
      } else {
        updateManagerTaskStatus(taskId, 'completed')
      }
    }
  }, [managerTasks, updateManagerTaskStatus])

  const handleApprove = useCallback((taskId: string) => {
    updateManagerTaskStatus(taskId, 'completed')
  }, [updateManagerTaskStatus])

  const handleTaskClick = useCallback((task: UnifiedTask) => {
    setSelectedTask(task)
  }, [])

  const liveSelectedTask = selectedTask
    ? managerTasks.find((t) => t.id === selectedTask.id) ?? null
    : null

  const userName = useMemo(() => {
    if (role === 'operator') {
      return tracks.find((t) => t.operator?.id === managerId)?.operator?.name ?? managerId
    }
    return '이운기'
  }, [tracks, role, managerId])

  return (
    <section>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">내가 할 일</h2>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {completedToday}/{totalToday} 완료
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-20 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-foreground/50 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground">{progressPct}%</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Status tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto px-4 pt-3 pb-1">
          {FILTER_TABS.map((tab) => {
            const count = statusCounts[tab.key] ?? 0
            const isActive = statusFilter === tab.key
            const colorCls = tab.color === 'amber'
              ? isActive ? 'bg-amber-500 text-white' : 'text-amber-600 hover:bg-amber-500/10'
              : isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            const badgeCls = tab.color === 'amber'
              ? isActive ? 'bg-white/25 text-white' : 'bg-amber-500/10 text-amber-600'
              : isActive ? 'bg-background/20 text-background' : 'bg-foreground/[0.06] text-muted-foreground'
            return (
              <button key={tab.key} type="button"
                onClick={() => setStatusFilter(isActive && tab.key !== 'all' ? 'all' : tab.key)}
                className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors', colorCls)}>
                {tab.label}
                <span className={cn('rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums', badgeCls)}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2">
          {([
            { key: 'urgent' as const, label: '긴급', icon: Zap, count: priorityCounts.urgent, activeCls: 'border-red-300 bg-red-500/10 text-red-600', badgeActive: 'bg-red-500/15 text-red-600' },
            { key: 'important' as const, label: '중요', icon: Star, count: priorityCounts.important, activeCls: 'border-amber-300 bg-amber-500/10 text-amber-600', badgeActive: 'bg-amber-500/15 text-amber-600' },
          ]).map((p) => {
            const active = priorityFilter.has(p.key)
            return (
              <button key={p.key} type="button"
                onClick={() => setPriorityFilter((prev) => {
                  const next = new Set(prev)
                  if (next.has(p.key)) next.delete(p.key); else next.add(p.key)
                  return next
                })}
                className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                  active ? p.activeCls : 'border-border text-muted-foreground hover:bg-secondary')}>
                <p.icon className="h-3 w-3" />
                {p.label}
                <span className={cn('rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                  active ? p.badgeActive : 'bg-foreground/[0.06] text-muted-foreground')}>{p.count}</span>
              </button>
            )
          })}

          <span className="text-border">|</span>

          <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            className={cn('rounded-md border px-2 py-1 text-[11px] font-medium focus:outline-none',
              periodFilter !== 'all' ? 'border-foreground/30 bg-foreground/[0.04] text-foreground' : 'border-border bg-transparent text-muted-foreground')}>
            {PERIOD_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>

          {hasActiveFilters && (
            <button type="button"
              onClick={() => { setStatusFilter('all'); setPriorityFilter(new Set()); setPeriodFilter('all'); setSearchQuery(''); setShowSearch(false) }}
              className="text-[11px] text-muted-foreground hover:text-foreground">초기화</button>
          )}

          <span className="text-border">|</span>

          {showSearch ? (
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setShowSearch(false) }}
              placeholder="검색..." autoFocus
              className="w-36 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
          ) : (
            <button type="button" onClick={() => setShowSearch(true)}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Search className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="ml-auto">
            <button type="button" onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background hover:bg-foreground/90">
              <Plus className="h-3 w-3" />생성
            </button>
          </div>
        </div>

        {/* Sort header */}
        <div className="flex shrink-0 items-center border-l-2 border-l-transparent border-b border-foreground/[0.06] bg-foreground/[0.015] px-3 py-1.5 text-[10px] font-medium text-foreground/25">
          <div className="flex w-[48px] shrink-0 items-center justify-center pr-2">완료</div>
          <div className="flex w-[56px] shrink-0 items-center justify-center">
            <SortButton label="상태" sortKey="status" current={sortKey} dir={sortDir} onToggle={toggleSort} />
          </div>
          <div className="flex w-5 shrink-0" />
          <div className="flex min-w-0 flex-1 items-center pl-1">제목</div>
          <div className="ml-2 flex w-[84px] shrink-0 items-center justify-center">
            <SortButton label="시간" sortKey="date" current={sortKey} dir={sortDir} onToggle={toggleSort} />
          </div>
          <div className="ml-2 flex w-[56px] shrink-0 items-center justify-center">요청자</div>
        </div>

        {/* Task list */}
        <div className="max-h-[420px] min-h-[200px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-[13px]">{searchQuery ? '검색 결과가 없습니다' : '등록된 할 일이 없습니다'}</p>
            </div>
          ) : (
            <div className="divide-y divide-foreground/[0.06]">
              {filtered.map((ut) => (
                <TaskCard
                  key={ut.id}
                  variant="compact"
                  task={ut}
                  onClick={handleTaskClick}
                  showCheckbox
                  onCheck={handleCheck}
                  showApprove
                  onApprove={handleApprove}
                  showSource
                  showMeta
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {liveSelectedTask && (
        <TaskDetailModal
          task={liveSelectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={(id) => updateManagerTaskStatus(id, 'completed')}
          onRequestReview={(id) => updateManagerTaskStatus(id, 'pending_review')}
          onCancelReview={(id) => updateManagerTaskStatus(id, 'in_progress')}
          onChangeStatus={(id, status) => updateManagerTaskStatus(id, status as TaskStatus)}
          onMarkInProgress={(id) => {
            const t = managerTasks.find((tt) => tt.id === id)
            if (t && t.status === 'pending') updateManagerTaskStatus(id, 'in_progress')
          }}
          onSendMessage={(id, content) => addManagerTaskMessage(id, content, managerId, userName, true)}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreate={addManagerTask}
          role={role}
          userId={managerId}
          operators={operators}
        />
      )}
    </section>
  )
}
