'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import type { TrackTask, TrackTaskStatus, TaskType } from '@/lib/admin-mock-data'
import { trackTaskToUnified } from '@/components/task/task-adapter'
import { TaskCard } from '@/components/task/task-card'
import type { UnifiedTask, TaskStatus } from '@/components/task/task-types'
import { TaskDetailModal } from '@/components/task/task-detail-modal'
import { NewTaskModal, DeferModal, ReassignModalInline } from './track-modals'
import { STAFF_COLORS, getStaffColor } from './track-utils'
import { TODAY_STR, getWeekRange, getMonthRange } from '@/lib/date-constants'
import { timeToSlot } from '@/components/calendar/calendar-utils'
import { computeOverlapColumns } from '@/lib/grid-utils'
import { Search, Plus, ChevronDown, ChevronRight, ArrowUpDown, Zap, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ================================================================
   Right panel: Staff day grid (per-staff, collapsible, overlap-aware)
   Same policy as ScheduleRightPanel
   ================================================================ */
const HOUR_START = 9
const HOUR_END = 18
const MINI_SLOT = 20
const TOTAL_SLOTS = (HOUR_END - HOUR_START) * 2

interface TimedItem { id: string; title: string; slot: number; endSlot: number; time: string; done: boolean; overdue: boolean }

function OverlapGrid({ items }: { items: TimedItem[] }) {
  const gridHeight = TOTAL_SLOTS * MINI_SLOT
  const sorted = [...items].sort((a, b) => a.slot - b.slot || (b.endSlot - b.slot) - (a.endSlot - a.slot))
  const placed = computeOverlapColumns(sorted)

  return (
    <div className="relative" style={{ height: `${gridHeight}px` }}>
      {Array.from({ length: HOUR_END - HOUR_START + 1 }).map((_, i) => (
        <div key={i} className="absolute inset-x-0 flex items-start" style={{ top: `${i * MINI_SLOT * 2}px` }}>
          <span className="w-[32px] shrink-0 pr-1.5 text-right text-[9px] tabular-nums text-foreground/20">
            {String(HOUR_START + i).padStart(2, '0')}
          </span>
          <div className="flex-1 border-t border-foreground/[0.05]" />
        </div>
      ))}
      {Array.from({ length: HOUR_END - HOUR_START }).map((_, i) => (
        <div key={`h-${i}`} className="absolute right-0" style={{ top: `${i * MINI_SLOT * 2 + MINI_SLOT}px`, left: '32px' }}>
          <div className="border-t border-dashed border-foreground/[0.03]" />
        </div>
      ))}
      {sorted.map((item, idx) => {
        const { col, groupSize } = placed[idx]
        const spans = item.endSlot - item.slot
        const h = spans * MINI_SLOT - 2
        const isCompact = spans <= 1
        return (
          <div key={item.id}
            className={cn(
              'absolute overflow-hidden rounded-[4px] border bg-background shadow-[0_0.5px_2px_rgba(0,0,0,0.04)]',
              item.done ? 'border-foreground/[0.05] opacity-40' : item.overdue ? 'border-red-500/20' : 'border-foreground/[0.08]',
            )}
            style={{
              top: `${item.slot * MINI_SLOT + 1}px`,
              height: `${h}px`,
              left: `calc(36px + ${(col / groupSize) * 100}% - ${(col / groupSize) * 40}px)`,
              width: `calc(${(1 / groupSize) * 100}% - ${40 / groupSize}px)`,
            }}>
            {isCompact ? (
              <div className="flex h-full items-center gap-1 overflow-hidden px-1.5">
                <span className={cn('min-w-0 truncate text-[10px] font-medium', item.done ? 'text-foreground/30 line-through' : item.overdue ? 'text-red-500' : 'text-foreground/70')}>
                  {item.title}
                </span>
                <span className="shrink-0 text-[8px] tabular-nums text-foreground/25">{item.time.split('–')[0]}</span>
              </div>
            ) : (
              <div className="flex h-full flex-col overflow-hidden px-1.5 pt-0.5">
                <span className={cn('truncate text-[10px] font-medium', item.done ? 'text-foreground/30 line-through' : item.overdue ? 'text-red-500' : 'text-foreground/70')}>
                  {item.title}
                </span>
                <span className="mt-auto pb-0.5 text-[8px] tabular-nums text-foreground/25">{item.time}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StaffDayPanel({ staffList, tasksByStaff, staffColors }: {
  staffList: { id: string; name: string }[]
  tasksByStaff: Map<string, TrackTask[]>
  staffColors: Map<string, string>
}) {
  const [openStaffId, setOpenStaffId] = useState<string | null>(staffList[0]?.id ?? null)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-foreground/[0.08] bg-background shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-foreground/[0.06] px-3">
        <span className="text-[13px] font-semibold text-foreground">학관별 오늘 일정</span>
      </div>

      {/* Staff tabs */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-foreground/[0.06] px-3 py-1.5">
        {staffList.map(staff => {
          const isActive = staff.id === openStaffId
          const tasks = tasksByStaff.get(staff.id) ?? []
          const completed = tasks.filter(t => t.status === 'completed').length
          const color = staffColors.get(staff.id) ?? '#94a3b8'
          return (
            <button key={staff.id} type="button"
              onClick={() => setOpenStaffId(isActive ? null : staff.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors',
                isActive ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/[0.03]',
              )}>
              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className={cn('text-[11px]', isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground/40')}>
                {staff.name}
              </span>
              <span className={cn('text-[9px] tabular-nums', isActive ? 'text-foreground/50' : 'text-foreground/20')}>
                {completed}/{tasks.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {openStaffId ? (() => {
          const tasks = tasksByStaff.get(openStaffId) ?? []
          const timedItems: TimedItem[] = tasks
            .filter(t => t.scheduledTime)
            .map(t => {
              const s = timeToSlot(t.scheduledTime!)
              const e = t.dueTime ? timeToSlot(t.dueTime) : s + 1
              return {
                id: t.id, title: t.title, slot: s, endSlot: Math.max(s + 1, e),
                time: t.scheduledTime! + (t.dueTime ? `–${t.dueTime}` : ''),
                done: t.status === 'completed', overdue: t.status === 'overdue',
              }
            })
          const untimedTasks = tasks.filter(t => !t.scheduledTime)

          return (
            <>
              {/* Untimed section */}
              {untimedTasks.length > 0 && (
                <div className="border-b border-foreground/[0.06] px-3 py-2.5">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/25">시간 미지정</p>
                  <div className="space-y-1">
                    {untimedTasks.map(t => {
                      const isDone = t.status === 'completed'
                      return (
                        <div key={t.id} className="flex items-center gap-1.5 rounded-md bg-foreground/[0.03] px-2.5 py-1.5">
                          <div className="h-1.5 w-1.5 shrink-0 rounded-[1px] bg-blue-500" />
                          <span className={cn('truncate text-[11px] font-medium', isDone ? 'text-foreground/25 line-through' : 'text-foreground/70')}>
                            {t.title}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Time grid */}
              {timedItems.length > 0 && (
                <div className="px-2 py-2">
                  <OverlapGrid items={timedItems} />
                </div>
              )}

              {tasks.length === 0 && (
                <p className="py-12 text-center text-[12px] text-foreground/20">오늘 배정된 업무가 없습니다</p>
              )}
            </>
          )
        })() : (
          <p className="py-12 text-center text-[12px] text-foreground/20">학관매를 선택하세요</p>
        )}
      </div>
    </div>
  )
}

type FilterKey = 'all' | TaskStatus
type SortKey = 'date' | 'status' | 'assignee'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<string, number> = {
  overdue: 0, unassigned: 1, pending_review: 2, in_progress: 3, pending: 4, completed: 5,
}

const FILTER_TABS: { key: FilterKey; label: string; color?: 'red' | 'amber' }[] = [
  { key: 'all', label: '전체' },
  { key: 'overdue', label: '지연', color: 'red' },
  { key: 'unassigned', label: '미배정', color: 'amber' },
  { key: 'pending_review', label: '확인요청', color: 'amber' },
  { key: 'pending', label: '대기' },
  { key: 'in_progress', label: '진행중' },
  { key: 'completed', label: '완료' },
]

const PERIOD_OPTIONS = [
  { key: 'all', label: '전체 기간' },
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번주' },
  { key: 'month', label: '이번달' },
  { key: 'custom', label: '날짜 선택...' },
] as const

type PeriodFilter = typeof PERIOD_OPTIONS[number]['key']

export function TrackTaskSheet({
  trackId,
  initialScope,
  initialStatus,
}: {
  trackId: string
  initialScope?: string
  initialStatus?: string
}) {
  const {
    trackTasks, operatorTrackDetails, assignTask,
    updateTrackTaskStatus, addTrackTask, deferTask, reassignTask,
    addTaskMessage,
  } = useAdminStore()

  const staffList = useMemo(() => {
    const allDetails = Object.values(operatorTrackDetails).flat()
    return allDetails.find((d) => d.trackId === trackId)?.staff ?? []
  }, [operatorTrackDetails, trackId])

  const initialStatusFilter: FilterKey = initialScope === 'unassigned'
    ? 'unassigned'
    : (initialStatus as FilterKey) ?? 'all'

  const [statusFilter, setStatusFilter] = useState<FilterKey>(initialStatusFilter)
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today')
  const [customDate, setCustomDate] = useState(TODAY_STR)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<Set<'urgent' | 'important'>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [selectedTask, setSelectedTask] = useState<TrackTask | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [deferTarget, setDeferTarget] = useState<TrackTask | null>(null)
  const [reassignTarget, setReassignTarget] = useState<TrackTask | null>(null)

  const rawTasks = useMemo(() => trackTasks.filter(t => t.trackId === trackId), [trackTasks, trackId])

  const allTrackTasks = useMemo(() => {
    return rawTasks.map((t) => {
      if (t.status === 'unassigned' || t.status === 'completed') return t
      if (t.scheduledDate <= TODAY_STR && t.status === 'pending') return { ...t, status: 'in_progress' as const }
      const dueDate = (t as any).dueDate ?? t.scheduledDate
      if (dueDate < TODAY_STR && t.status === 'in_progress') return { ...t, status: 'overdue' as const }
      return t
    })
  }, [rawTasks])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allTrackTasks.length }
    for (const t of allTrackTasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1
    }
    return counts
  }, [allTrackTasks])

  const priorityCounts = useMemo(() => {
    let urgent = 0, important = 0
    for (const t of allTrackTasks) {
      if (t.priority === 'urgent' || t.status === 'overdue') urgent++
      if (t.priority === 'important') important++
    }
    return { urgent, important }
  }, [allTrackTasks])

  const filteredTasks = useMemo(() => {
    let tasks = allTrackTasks

    if (statusFilter !== 'all') {
      tasks = tasks.filter(t => t.status === statusFilter)
    }
    if (priorityFilter.size > 0) {
      tasks = tasks.filter(t => {
        const p = t.priority ?? (t.status === 'overdue' ? 'urgent' : 'normal')
        return priorityFilter.has(p as 'urgent' | 'important')
      })
    }
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') tasks = tasks.filter(t => !t.assigneeId)
      else tasks = tasks.filter(t => t.assigneeId === assigneeFilter)
    }
    if (typeFilter !== 'all') tasks = tasks.filter(t => t.type === typeFilter)
    if (periodFilter !== 'all') {
      let start: string, end: string
      if (periodFilter === 'today') { start = TODAY_STR; end = TODAY_STR }
      else if (periodFilter === 'week') { [start, end] = getWeekRange() }
      else if (periodFilter === 'month') { [start, end] = getMonthRange() }
      else if (periodFilter === 'custom') { start = customDate; end = customDate }
      else { start = ''; end = '' }
      if (start && end) tasks = tasks.filter(t => t.scheduledDate >= start && t.scheduledDate <= end)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q))
    }

    const sorted = [...tasks]
    sorted.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') {
        cmp = a.scheduledDate.localeCompare(b.scheduledDate)
        if (cmp === 0) cmp = (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '')
      } else if (sortKey === 'status') {
        cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      } else if (sortKey === 'assignee') {
        const na = a.assigneeName ?? '\uffff'
        const nb = b.assigneeName ?? '\uffff'
        cmp = na.localeCompare(nb)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [allTrackTasks, statusFilter, priorityFilter, assigneeFilter, typeFilter, periodFilter, customDate, searchQuery, sortKey, sortDir])

  const unifiedTasks = useMemo(() => filteredTasks.map(trackTaskToUnified), [filteredTasks])

  const assignableStaff = useMemo(() =>
    staffList.map((s, i) => ({ id: s.id, name: s.name, color: STAFF_COLORS[i % STAFF_COLORS.length] })),
  [staffList])

  const staffColors = useMemo(() => {
    const map = new Map<string, string>()
    staffList.forEach((s, i) => map.set(s.id, STAFF_COLORS[i % STAFF_COLORS.length]))
    return map
  }, [staffList])

  const todayTasksByStaff = useMemo(() => {
    const map = new Map<string, TrackTask[]>()
    for (const s of staffList) map.set(s.id, [])
    for (const t of allTrackTasks) {
      if (t.scheduledDate !== TODAY_STR || !t.assigneeId) continue
      const arr = map.get(t.assigneeId)
      if (arr) arr.push(t)
    }
    return map
  }, [allTrackTasks, staffList])

  const handleAssign = useCallback((taskId: string, staffId: string, staffName: string) => {
    assignTask(taskId, staffId, staffName)
  }, [assignTask])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleApprove = useCallback((taskId: string) => {
    const task = allTrackTasks.find(t => t.id === taskId)
    if (task?.status === 'completed') {
      updateTrackTaskStatus(taskId, 'pending_review')
    } else {
      updateTrackTaskStatus(taskId, 'completed')
    }
  }, [allTrackTasks, updateTrackTaskStatus])

  const handleTaskClick = useCallback((ut: UnifiedTask) => {
    const raw = allTrackTasks.find(t => t.id === ut.id)
    if (raw) setSelectedTask(raw)
  }, [allTrackTasks])

  const getColor = useCallback((assigneeId?: string) => {
    return getStaffColor(staffList, assigneeId)
  }, [staffList])

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter.size > 0 || assigneeFilter !== 'all' || typeFilter !== 'all' || periodFilter !== 'all' || searchQuery

  return (
    <div className="flex h-full gap-2 overflow-hidden p-4">
      {/* ═══ Left: Task list ═══ */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-foreground/[0.08] bg-background shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* ── Filter bar ── */}
      <div className="shrink-0 border-b border-border bg-card rounded-t-xl">
        {/* Status tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto px-6 pt-3 pb-1">
          {FILTER_TABS.map(tab => {
            const count = statusCounts[tab.key] ?? 0
            const isActive = statusFilter === tab.key
            const colorCls = tab.color === 'red'
              ? isActive ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-red-500/10'
              : tab.color === 'amber'
                ? isActive ? 'bg-amber-500 text-white' : 'text-amber-600 hover:bg-amber-500/10'
                : isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            const badgeCls = tab.color === 'red'
              ? isActive ? 'bg-white/25 text-white' : 'bg-red-500/10 text-red-500'
              : tab.color === 'amber'
                ? isActive ? 'bg-white/25 text-white' : 'bg-amber-500/10 text-amber-600'
                : isActive ? 'bg-background/20 text-background' : 'bg-foreground/[0.06] text-muted-foreground'
            return (
              <button key={tab.key} type="button"
                onClick={() => setStatusFilter(isActive && tab.key !== 'all' ? 'all' : tab.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                  colorCls,
                )}>
                {tab.label}
                <span className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                  badgeCls,
                )}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-2">
          {([
            { key: 'urgent' as const, label: '긴급', icon: Zap, count: priorityCounts.urgent, activeCls: 'border-red-300 bg-red-500/10 text-red-600', badgeActive: 'bg-red-500/15 text-red-600' },
            { key: 'important' as const, label: '중요', icon: Star, count: priorityCounts.important, activeCls: 'border-amber-300 bg-amber-500/10 text-amber-600', badgeActive: 'bg-amber-500/15 text-amber-600' },
          ]).map(p => {
            const active = priorityFilter.has(p.key)
            return (
              <button key={p.key} type="button"
                onClick={() => setPriorityFilter(prev => {
                  const next = new Set(prev)
                  if (next.has(p.key)) next.delete(p.key); else next.add(p.key)
                  return next
                })}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                  active ? p.activeCls : 'border-border text-muted-foreground hover:bg-secondary',
                )}>
                <p.icon className="h-3 w-3" />
                {p.label}
                <span className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                  active ? p.badgeActive : 'bg-foreground/[0.06] text-muted-foreground',
                )}>{p.count}</span>
              </button>
            )
          })}

          <span className="text-border">|</span>

          <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}
            className={cn('rounded-md border px-2 py-1 text-[11px] font-medium focus:outline-none',
              assigneeFilter !== 'all' ? 'border-foreground/30 bg-foreground/[0.04] text-foreground' : 'border-border bg-transparent text-muted-foreground')}>
            <option value="all">담당자</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="unassigned">미배정</option>
          </select>

          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className={cn('rounded-md border px-2 py-1 text-[11px] font-medium focus:outline-none',
              typeFilter !== 'all' ? 'border-foreground/30 bg-foreground/[0.04] text-foreground' : 'border-border bg-transparent text-muted-foreground')}>
            <option value="all">유형</option>
            <option value="daily">일일</option>
            <option value="milestone">기간</option>
            <option value="manual">수동</option>
          </select>

          <div className="flex items-center gap-1.5">
            <select value={periodFilter} onChange={e => {
              const v = e.target.value as PeriodFilter
              setPeriodFilter(v)
            }}
              className={cn('rounded-md border px-2 py-1 text-[11px] font-medium focus:outline-none',
                periodFilter !== 'all' ? 'border-foreground/30 bg-foreground/[0.04] text-foreground' : 'border-border bg-transparent text-muted-foreground')}>
              {PERIOD_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            {periodFilter === 'custom' && (
              <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
                className="rounded-md border border-foreground/20 bg-background px-2 py-1 text-[11px] tabular-nums text-foreground focus:border-foreground/40 focus:outline-none" />
            )}
          </div>

          {hasActiveFilters && (
            <button type="button"
              onClick={() => { setStatusFilter('all'); setPriorityFilter(new Set()); setAssigneeFilter('all'); setTypeFilter('all'); setPeriodFilter('all'); setSearchQuery(''); setShowSearch(false) }}
              className="text-[11px] text-muted-foreground hover:text-foreground">초기화</button>
          )}

          <span className="text-border">|</span>

          {showSearch ? (
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setShowSearch(false) }}
              placeholder="Task 검색..." autoFocus
              className="w-36 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
          ) : (
            <button type="button" onClick={() => setShowSearch(true)}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Search className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="ml-auto">
            <button type="button" onClick={() => setShowNewTask(true)}
              className="flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background hover:bg-foreground/90">
              <Plus className="h-3 w-3" />새 Task
            </button>
          </div>
        </div>
      </div>

      {/* ── Sort header — fixed-width cols centered, flex-1 title left ── */}
      <div className="flex shrink-0 items-center border-l-2 border-l-transparent border-b border-foreground/[0.06] bg-foreground/[0.015] px-3 py-1.5 text-[10px] font-medium text-foreground/25">
        <div className="flex w-[48px] shrink-0 items-center justify-center pr-2">완료</div>
        <div className="flex w-[56px] shrink-0 items-center justify-center">
          <SortButton label="상태" sortKey="status" current={sortKey} dir={sortDir} onToggle={toggleSort} />
        </div>
        <div className="flex w-5 shrink-0" />
        <div className="flex min-w-0 flex-1 items-center pl-1">제목</div>
        <div className="ml-2 flex w-[72px] shrink-0 items-center justify-center">
          <SortButton label="담당자" sortKey="assignee" current={sortKey} dir={sortDir} onToggle={toggleSort} />
        </div>
        <div className="ml-2 flex w-[84px] shrink-0 items-center justify-center">
          <SortButton label="시간" sortKey="date" current={sortKey} dir={sortDir} onToggle={toggleSort} />
        </div>
        <div className="ml-2 flex w-[48px] shrink-0 items-center justify-center">소스</div>
      </div>

      {/* ── Task list ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {unifiedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
            <Search className="h-8 w-8 opacity-30" />
            <p className="text-[13px]">조건에 맞는 Task가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-foreground/[0.06] pb-20">
            {unifiedTasks.map((ut) => (
              <TaskCard
                key={ut.id}
                variant="compact"
                task={ut}
                onClick={handleTaskClick}
                showApprove
                onApprove={handleApprove}
                showAssignee
                showSource
                showMeta
                staffColor={getColor(ut.assigneeId)}
                assignableStaff={assignableStaff}
                onAssign={handleAssign}
              />
            ))}
          </div>
        )}
      </div>

      </div>{/* end left panel */}

      {/* ═══ Right: Staff day grid ═══ */}
      <div className="w-[320px] shrink-0">
        <StaffDayPanel staffList={staffList} tasksByStaff={todayTasksByStaff} staffColors={staffColors} />
      </div>

      {/* ── Modals ── */}
      {selectedTask && (() => {
        const liveTask = trackTasks.find(t => t.id === selectedTask.id) ?? selectedTask
        const ut = trackTaskToUnified(liveTask)
        return (
          <TaskDetailModal
            task={ut}
            onClose={() => setSelectedTask(null)}
            onComplete={() => { updateTrackTaskStatus(liveTask.id, 'completed'); setSelectedTask(null) }}
            onRequestReview={() => { updateTrackTaskStatus(liveTask.id, 'pending_review'); setSelectedTask(null) }}
            onCancelReview={() => { updateTrackTaskStatus(liveTask.id, 'in_progress'); setSelectedTask(null) }}
            onChangeStatus={(_, status: string) => {
              updateTrackTaskStatus(liveTask.id, status as TrackTaskStatus)
            }}
            onSendMessage={(_, content) => addTaskMessage(liveTask.id, content)}
            onDefer={() => { setSelectedTask(null); setDeferTarget(liveTask) }}
            staffColor={getColor(liveTask.assigneeId) ?? undefined}
          />
        )
      })()}
      {showNewTask && <NewTaskModal trackId={trackId} staffList={staffList} onAdd={addTrackTask} onClose={() => setShowNewTask(false)} />}
      {deferTarget && <DeferModal task={deferTarget} onDefer={(id, start, end) => { deferTask(id, start, end); setDeferTarget(null) }} onClose={() => setDeferTarget(null)} />}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={() => setReassignTarget(null)}>
          <ReassignModalInline task={reassignTarget} staffList={staffList}
            onReassign={(tid, sid, sn, nd) => { reassignTask(tid, sid, sn, nd); setReassignTarget(null) }}
            onClose={() => setReassignTarget(null)} />
        </div>
      )}
    </div>
  )
}

function SortButton({ label, sortKey, current, dir, onToggle, width }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir
  onToggle: (key: SortKey) => void; width?: string
}) {
  const isActive = current === sortKey
  return (
    <button type="button" onClick={() => onToggle(sortKey)}
      className={cn('flex items-center gap-0.5 text-[10px] font-medium transition-colors', width,
        isActive ? 'text-foreground/50' : 'text-foreground/25 hover:text-foreground/40')}>
      {label}
      <ArrowUpDown className={cn('h-2.5 w-2.5', isActive && (dir === 'desc' ? 'rotate-180' : ''))} />
    </button>
  )
}

