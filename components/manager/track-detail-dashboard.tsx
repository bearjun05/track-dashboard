'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import type { TrackTask, TrackTaskStatus } from '@/lib/admin-mock-data'
import { ROLE_LABELS, ROLE_LABELS_FULL } from '@/lib/role-labels'
import { ManagerSidebar } from './manager-sidebar'
import {
  ArrowLeft,
  Bell,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Clock,
  UserX,
  ChevronRight,
  ChevronLeft,
  Users,
  GraduationCap,
  ClipboardList,
  Send,
  X,
  Calendar,
  List,
  CalendarDays,
  Check,
  Paperclip,
  RefreshCw,
  CalendarOff,
} from 'lucide-react'

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const color =
    value >= 80 ? 'bg-foreground/70' : value >= 60 ? 'bg-foreground/50' : 'bg-foreground/30'
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-foreground/10 ${className ?? ''}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: TrackTaskStatus }) {
  const config: Record<TrackTaskStatus, { label: string; cls: string }> = {
    'pending': { label: '대기', cls: 'bg-secondary text-muted-foreground' },
    'in-progress': { label: '진행중', cls: 'bg-foreground/[0.06] text-foreground' },
    'completed': { label: '완료', cls: 'bg-foreground/[0.06] text-muted-foreground' },
    'overdue': { label: '기한초과', cls: 'bg-destructive/10 text-destructive' },
    'unassigned': { label: '미배정', cls: 'bg-foreground/[0.06] text-foreground/60' },
  }
  const c = config[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${c.cls}`}>
      {c.label}
    </span>
  )
}

function TypeBadge({ type }: { type: TrackTask['type'] }) {
  const config = {
    daily: { label: '일일', cls: 'bg-foreground/[0.05] text-foreground/60' },
    milestone: { label: '마일스톤', cls: 'bg-foreground/[0.06] text-foreground/70' },
    manual: { label: '수동', cls: 'bg-foreground/[0.05] text-foreground/60' },
  }
  const c = config[type]
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${c.cls}`}>
      {c.label}
    </span>
  )
}

function TaskChatModal({ task, onClose }: { task: TrackTask; onClose: () => void }) {
  const [message, setMessage] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">{task.title}</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{task.assigneeName ?? '미배정'} · {task.scheduledTime}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-secondary/20 px-4 py-3">
          {task.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-muted-foreground">
              <MessageSquare className="h-7 w-7" />
              <p className="text-xs">아직 메시지가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {task.messages.map((msg) =>
                msg.isSelf ? (
                  <div key={msg.id} className="flex justify-end">
                    <div className="flex items-end gap-1.5">
                      <span className="pb-0.5 text-[10px] text-muted-foreground">{msg.timestamp}</span>
                      <div className="max-w-[260px] rounded-xl rounded-tr-[4px] bg-foreground/[0.08] px-3 py-2">
                        <p className="text-[13px] leading-relaxed text-foreground">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-foreground">
                      {msg.authorName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-medium text-foreground">{msg.authorName}</span>
                      <div className="mt-0.5 flex items-end gap-1.5">
                        <div className="max-w-[260px] rounded-xl rounded-tl-[4px] bg-card px-3 py-2 shadow-sm">
                          <p className="text-[13px] leading-relaxed text-foreground">{msg.content}</p>
                        </div>
                        <span className="pb-0.5 text-[10px] text-muted-foreground">{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border bg-card px-3 py-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
          />
          <button type="button" disabled={!message.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-colors disabled:opacity-30">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ReassignModal({ task, staffList, onReassign, onClose }: {
  task: TrackTask
  staffList: { id: string; name: string }[]
  onReassign: (taskId: string, staffId: string, staffName: string, newDate?: string) => void
  onClose: () => void
}) {
  const [selectedStaff, setSelectedStaff] = useState('')
  const [newDate, setNewDate] = useState(task.scheduledDate)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[15px] font-semibold text-foreground">Task 재배정</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">{task.title}</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{`배정할 ${ROLE_LABELS.learning_manager}`}</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none"
            >
              <option value="">선택</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">새 예정일</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">취소</button>
          <button
            type="button"
            disabled={!selectedStaff}
            onClick={() => {
              const s = staffList.find((st) => st.id === selectedStaff)
              if (s) { onReassign(task.id, s.id, s.name, newDate); onClose() }
            }}
            className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30"
          >
            재배정
          </button>
        </div>
      </div>
    </div>
  )
}

function BulkAssignModal({ taskIds, staffList, onBulkAssign, onClose }: {
  taskIds: string[]
  staffList: { id: string; name: string }[]
  onBulkAssign: (taskIds: string[], staffId: string, staffName: string) => void
  onClose: () => void
}) {
  const [selectedStaff, setSelectedStaff] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[15px] font-semibold text-foreground">일괄 배정</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">{taskIds.length}건의 Task를 배정합니다</p>

        <div className="mt-4">
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{`배정할 ${ROLE_LABELS.learning_manager}`}</label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none"
          >
            <option value="">선택</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">취소</button>
          <button
            type="button"
            disabled={!selectedStaff}
            onClick={() => {
              const s = staffList.find((st) => st.id === selectedStaff)
              if (s) { onBulkAssign(taskIds, s.id, s.name); onClose() }
            }}
            className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30"
          >
            일괄 배정
          </button>
        </div>
      </div>
    </div>
  )
}

function VacationModal({ staff, onSetVacation, onClose }: {
  staff: { id: string; name: string }
  onSetVacation: (staffId: string, start: string, end: string) => void
  onClose: () => void
}) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[15px] font-semibold text-foreground">부재 설정</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">{staff.name}의 부재 기간을 설정합니다</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">시작일</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">종료일</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">취소</button>
          <button
            type="button"
            disabled={!start || !end}
            onClick={() => { onSetVacation(staff.id, start, end); onClose() }}
            className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30"
          >
            설정
          </button>
        </div>
      </div>
    </div>
  )
}

type ViewMode = 'list' | 'weekly' | 'monthly'
type TaskFilter = 'all' | 'in-progress' | 'completed' | 'overdue' | 'pending'
type DateRange = 'today' | 'week' | 'month' | 'all'

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getMonthDates(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay()
  const start = new Date(firstDay)
  start.setDate(1 - ((startDay + 6) % 7))
  const dates: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d)
  }
  return dates
}

function fmtDate(d: Date) {
  return d.toISOString().split('T')[0]
}

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']

function WeeklyView({ tasks, staffList, onTaskClick }: {
  tasks: TrackTask[]
  staffList: { id: string; name: string }[]
  onTaskClick: (task: TrackTask) => void
}) {
  const [weekOffset, setWeekOffset] = useState(0)

  const baseDate = useMemo(() => {
    const d = new Date('2026-02-11')
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate])

  const tasksByDateAndStaff = useMemo(() => {
    const map = new Map<string, Map<string, TrackTask[]>>()
    for (const date of weekDates) {
      const dateStr = fmtDate(date)
      const staffMap = new Map<string, TrackTask[]>()
      for (const t of tasks) {
        if (t.scheduledDate !== dateStr) continue
        const key = t.assigneeId ?? '_unassigned'
        if (!staffMap.has(key)) staffMap.set(key, [])
        staffMap.get(key)!.push(t)
      }
      map.set(dateStr, staffMap)
    }
    return map
  }, [tasks, weekDates])

  const allStaffKeys = useMemo(() => {
    const keys = staffList.map((s) => s.id)
    keys.push('_unassigned')
    return keys
  }, [staffList])

  const staffNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of staffList) map.set(s.id, s.name)
    map.set('_unassigned', '미배정')
    return map
  }, [staffList])

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setWeekOffset((o) => o - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">
          {weekDates[0].getMonth() + 1}/{weekDates[0].getDate()} ~ {weekDates[6].getMonth() + 1}/{weekDates[6].getDate()}
        </span>
        <button type="button" onClick={() => setWeekOffset((o) => o + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        {weekOffset !== 0 && (
          <button type="button" onClick={() => setWeekOffset(0)} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary">오늘</button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border bg-secondary/40">
          <div className="px-2 py-2 text-[11px] font-medium text-muted-foreground" />
          {weekDates.map((d, i) => {
            const isToday = fmtDate(d) === '2026-02-11'
            return (
              <div key={i} className={`px-2 py-2 text-center text-[11px] font-medium ${isToday ? 'bg-foreground/[0.04] text-foreground' : 'text-muted-foreground'}`}>
                <div>{DAY_NAMES[i]}</div>
                <div className="mt-0.5 tabular-nums">{d.getDate()}</div>
              </div>
            )
          })}
        </div>

        {allStaffKeys.map((staffKey) => (
          <div key={staffKey} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border last:border-b-0">
            <div className={`flex items-start px-2 py-2 text-[11px] font-medium ${staffKey === '_unassigned' ? 'text-foreground/60' : 'text-foreground'}`}>
              {staffNameMap.get(staffKey)}
            </div>
            {weekDates.map((d, i) => {
              const dateStr = fmtDate(d)
              const dayTasks = tasksByDateAndStaff.get(dateStr)?.get(staffKey) ?? []
              const isToday = dateStr === '2026-02-11'
              return (
                <div key={i} className={`min-h-[60px] border-l border-border px-1 py-1 ${isToday ? 'bg-foreground/[0.02]' : ''}`}>
                  {dayTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onTaskClick(t)}
                      className={`mb-0.5 block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] transition-colors hover:bg-foreground/[0.06] ${
                        t.status === 'completed' ? 'text-muted-foreground line-through' :
                        t.status === 'overdue' ? 'text-destructive' :
                        t.status === 'unassigned' ? 'text-foreground/60' :
                        'text-foreground'
                      }`}
                    >
                      <span className="tabular-nums">{t.scheduledTime}</span> {t.title}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthlyView({ tasks, onTaskClick, onDateSelect }: {
  tasks: TrackTask[]
  onTaskClick: (task: TrackTask) => void
  onDateSelect: (date: string) => void
}) {
  const [monthOffset, setMonthOffset] = useState(0)

  const { year, month } = useMemo(() => {
    const base = new Date('2026-02-11')
    base.setMonth(base.getMonth() + monthOffset)
    return { year: base.getFullYear(), month: base.getMonth() }
  }, [monthOffset])

  const monthDates = useMemo(() => getMonthDates(year, month), [year, month])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; overdue: number; unassigned: number }>()
    for (const t of tasks) {
      if (!map.has(t.scheduledDate)) map.set(t.scheduledDate, { total: 0, completed: 0, overdue: 0, unassigned: 0 })
      const s = map.get(t.scheduledDate)!
      s.total++
      if (t.status === 'completed') s.completed++
      if (t.status === 'overdue') s.overdue++
      if (t.status === 'unassigned') s.unassigned++
    }
    return map
  }, [tasks])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const selectedTasks = selectedDate ? tasks.filter((t) => t.scheduledDate === selectedDate) : []

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{year}년 {month + 1}월</span>
        <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        {monthOffset !== 0 && (
          <button type="button" onClick={() => setMonthOffset(0)} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary">이번 달</button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
          {DAY_NAMES.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-medium text-muted-foreground">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDates.map((d, i) => {
            const dateStr = fmtDate(d)
            const isCurrentMonth = d.getMonth() === month
            const isToday = dateStr === '2026-02-11'
            const stats = tasksByDate.get(dateStr)
            const isSelected = selectedDate === dateStr

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedDate(dateStr === selectedDate ? null : dateStr)
                  onDateSelect(dateStr)
                }}
                className={`min-h-[72px] border-b border-r border-border p-1.5 text-left transition-colors hover:bg-foreground/[0.02] ${
                  !isCurrentMonth ? 'bg-secondary/20' : ''
                } ${isSelected ? 'bg-foreground/[0.04]' : ''}`}
              >
                <div className={`text-[11px] tabular-nums ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                  {d.getDate()}
                </div>
                {stats && isCurrentMonth && (
                  <div className="mt-1 space-y-0.5">
                    <div className="text-[9px] tabular-nums text-muted-foreground">
                      {stats.completed}/{stats.total} 완료
                    </div>
                    {stats.overdue > 0 && (
                      <div className="text-[9px] tabular-nums text-destructive">{stats.overdue} 초과</div>
                    )}
                    {stats.unassigned > 0 && (
                      <div className="text-[9px] tabular-nums text-foreground/50">{stats.unassigned} 미배정</div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && selectedTasks.length > 0 && (
        <div className="mt-3 rounded-xl border border-border bg-card p-4">
          <h4 className="mb-2 text-[13px] font-semibold text-foreground">{selectedDate} Task 목록</h4>
          <div className="space-y-1.5">
            {selectedTasks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTaskClick(t)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary/50"
              >
                <StatusBadge status={t.status} />
                <span className="text-[12px] tabular-nums text-muted-foreground">{t.scheduledTime}</span>
                <span className={`flex-1 truncate text-[12px] ${t.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {t.title}
                </span>
                <span className="text-[11px] text-muted-foreground">{t.assigneeName ?? '미배정'}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TrackDetailDashboard({ trackId }: { trackId: string }) {
  const { plannerTracks, trackTasks, staffCards, operatorTrackDetails, assignTask, bulkAssignTasks, reassignTask } = useAdminStore()
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all')
  const [selectedTask, setSelectedTask] = useState<TrackTask | null>(null)
  const [reassignTarget, setReassignTarget] = useState<TrackTask | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [vacationTarget, setVacationTarget] = useState<{ id: string; name: string } | null>(null)

  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const track = plannerTracks.find((t) => t.id === trackId) ?? plannerTracks[0]
  const allTrackTasks = trackTasks.filter((t) => t.trackId === trackId)

  const staffList = useMemo(() => {
    const allDetails = Object.values(operatorTrackDetails).flat()
    const detail = allDetails.find((d) => d.trackId === trackId)
    return detail?.staff ?? []
  }, [operatorTrackDetails, trackId])

  const staffVacationMap = useMemo(() => {
    const map = new Map<string, { start: string; end: string }>()
    for (const sc of staffCards) {
      if (sc.vacation) map.set(sc.id, sc.vacation)
    }
    return map
  }, [staffCards])

  const tasks = useMemo(() => {
    let filtered = allTrackTasks

    if (dateRange === 'today') {
      filtered = filtered.filter((t) => t.scheduledDate === '2026-02-11')
    } else if (dateRange === 'week') {
      filtered = filtered.filter((t) => t.scheduledDate >= '2026-02-09' && t.scheduledDate <= '2026-02-13')
    } else if (dateRange === 'month') {
      filtered = filtered.filter((t) => t.scheduledDate >= '2026-02-01' && t.scheduledDate <= '2026-02-28')
    }

    if (staffFilter !== 'all') {
      filtered = filtered.filter((t) => t.assigneeId === staffFilter || (!t.assigneeId && staffFilter === '_unassigned'))
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter)
    }

    return filtered
  }, [allTrackTasks, dateRange, staffFilter, typeFilter])

  const staffTaskStats = useMemo(() => {
    const todayTasks = allTrackTasks.filter((t) => t.scheduledDate === '2026-02-11')
    const map = new Map<string, { completed: number; inProgress: number; overdue: number; pending: number; total: number }>()
    for (const t of todayTasks) {
      if (!t.assigneeId) continue
      if (!map.has(t.assigneeId)) map.set(t.assigneeId, { completed: 0, inProgress: 0, overdue: 0, pending: 0, total: 0 })
      const s = map.get(t.assigneeId)!
      s.total++
      if (t.status === 'completed') s.completed++
      else if (t.status === 'in-progress') s.inProgress++
      else if (t.status === 'overdue') s.overdue++
      else if (t.status === 'pending') s.pending++
    }
    return map
  }, [allTrackTasks])

  const taskCounts = useMemo(() => {
    const counts = { all: 0, 'in-progress': 0, completed: 0, overdue: 0, pending: 0 }
    const assigned = tasks.filter((t) => t.status !== 'unassigned')
    counts.all = assigned.length
    for (const t of assigned) {
      if (t.status in counts) counts[t.status as keyof typeof counts]++
    }
    return counts
  }, [tasks])

  const unassignedTasks = tasks.filter((t) => t.status === 'unassigned')
  const filteredTasks = tasks.filter((t) => {
    if (t.status === 'unassigned') return false
    if (taskFilter === 'all') return true
    return t.status === taskFilter
  })

  const issueRate = track.operator && track.operator.issueTotal > 0
    ? Math.round((track.operator.issueResolved / track.operator.issueTotal) * 100)
    : 0

  const filterItems: { key: TaskFilter; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: taskCounts.all },
    { key: 'in-progress', label: '진행중', count: taskCounts['in-progress'] },
    { key: 'completed', label: '완료', count: taskCounts.completed },
    { key: 'overdue', label: '기한초과', count: taskCounts.overdue },
    { key: 'pending', label: '대기', count: taskCounts.pending },
  ]

  const pillCls = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${active ? 'bg-foreground text-background' : 'bg-secondary/80 text-muted-foreground hover:bg-secondary'}`

  const viewModeCls = (active: boolean) =>
    `flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'}`

  const toggleTaskSelection = useCallback((id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSetVacation = useCallback((_staffId: string, _start: string, _end: string) => {
    // In a real app, this would update the staff's vacation and unassign their tasks
  }, [])

  const completionLabel = (task: TrackTask) => {
    const ct = task.completionType ?? (task.type === 'milestone' ? 'evidence' : 'simple')
    return ct === 'evidence' ? '증빙 필요' : '단순 체크'
  }

  return (
    <div className="flex h-screen bg-background">
      <ManagerSidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-2.5 text-sm">
            <Link href="/manager" className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-semibold" style={{ backgroundColor: `${track.color}15`, color: track.color }}>
              {track.name}
            </span>
            <span className="text-[11px] text-muted-foreground">{track.period}</span>
            {track.operator && (
              <>
                <span className="text-border">|</span>
                <span className="text-[11px] text-muted-foreground">담당: {track.operator.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{track.staffCount}</span>
              <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{track.studentCount}</span>
            </div>
            <button type="button" className="relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Bell className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* Key Metrics */}
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{`${ROLE_LABELS.learning_manager} 업무완료율`}</span>
                <span className="text-lg font-bold tabular-nums text-foreground">{track.completionRate}%</span>
              </div>
              <ProgressBar value={track.completionRate} className="mt-2" />
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">이슈 처리율</span>
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {issueRate}%
                  <span className="ml-1 text-xs font-normal text-muted-foreground">({track.issueSummary.done}/{track.issueSummary.total})</span>
                </span>
              </div>
              <ProgressBar value={issueRate} className="mt-2" />
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{`${ROLE_LABELS.operator} 업무완료율`}</span>
                <span className="text-lg font-bold tabular-nums text-foreground">{track.operator?.taskCompletionRate ?? 0}%</span>
              </div>
              <ProgressBar value={track.operator?.taskCompletionRate ?? 0} className="mt-2" />
            </div>
          </section>

          {/* Alerts */}
          {(unassignedTasks.length > 0 || taskCounts.overdue > 0) && (
            <section className="rounded-xl border border-destructive/20 bg-destructive/[0.03] p-4">
              <h3 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" />
                주의 필요
              </h3>
              <div className="flex flex-wrap gap-3">
                {taskCounts.overdue > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
                    <Clock className="h-3 w-3" />기한초과 Task {taskCounts.overdue}건
                  </div>
                )}
                {unassignedTasks.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-foreground/[0.06] px-3 py-1.5 text-xs font-medium text-foreground">
                    <UserX className="h-3 w-3" />미배정 Task {unassignedTasks.length}건
                  </div>
                )}
                {track.issueSummary.waiting > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-foreground/[0.06] px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <Bell className="h-3 w-3" />대기중 이슈 {track.issueSummary.waiting}건
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Staff Task Status */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {ROLE_LABELS_FULL.learning_manager} 현황 <span className="font-normal text-muted-foreground">{staffList.length}명</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {staffList.map((staff) => {
                const stats = staffTaskStats.get(staff.id) ?? { completed: 0, inProgress: 0, overdue: 0, pending: 0, total: 0 }
                const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
                const vacation = staffVacationMap.get(staff.id)

                return (
                  <div
                    key={staff.id}
                    className={`rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm ${stats.overdue > 0 ? 'border-destructive/30' : 'border-border'}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-[13px] font-semibold text-foreground">{staff.name}</h3>
                      <div className="flex items-center gap-1.5">
                        {vacation && (
                          <span className="flex items-center gap-0.5 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-foreground/60">
                            <CalendarOff className="h-2.5 w-2.5" />
                            {vacation.start.slice(5)} ~ {vacation.end.slice(5)}
                          </span>
                        )}
                        {stats.overdue > 0 && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">완료율</span>
                        <span className="font-medium tabular-nums text-foreground">{rate}%</span>
                      </div>
                      <ProgressBar value={rate} className="mt-1.5" />
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                      <div className="rounded-lg bg-foreground/[0.04] py-1.5">
                        <p className="text-sm font-bold tabular-nums text-foreground">{stats.completed}</p>
                        <p className="text-[10px] text-muted-foreground">완료</p>
                      </div>
                      <div className="rounded-lg bg-foreground/[0.04] py-1.5">
                        <p className="text-sm font-bold tabular-nums text-foreground">{stats.inProgress}</p>
                        <p className="text-[10px] text-muted-foreground">진행</p>
                      </div>
                      <div className="rounded-lg bg-foreground/[0.04] py-1.5">
                        <p className="text-sm font-bold tabular-nums text-foreground">{stats.pending}</p>
                        <p className="text-[10px] text-muted-foreground">대기</p>
                      </div>
                      <div className={`rounded-lg py-1.5 ${stats.overdue > 0 ? 'bg-destructive/10' : 'bg-foreground/[0.04]'}`}>
                        <p className={`text-sm font-bold tabular-nums ${stats.overdue > 0 ? 'text-destructive' : 'text-foreground'}`}>{stats.overdue}</p>
                        <p className="text-[10px] text-muted-foreground">초과</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {staff.unreadMessages > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-foreground/60">
                          <MessageSquare className="h-3 w-3" />{staff.unreadMessages}
                        </span>
                      )}
                      {staff.missedRound && (
                        <span className="flex items-center gap-1 text-[10px] text-destructive">
                          <AlertTriangle className="h-3 w-3" />{staff.missedRound}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setVacationTarget({ id: staff.id, name: staff.name })}
                        className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <CalendarOff className="h-3 w-3" />부재
                      </button>
                      <Link
                        href={`/manager/tracks/${trackId}/staff/${staff.id}`}
                        className="flex items-center gap-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        상세<ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Unassigned Tasks */}
          {unassignedTasks.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <UserX className="h-[18px] w-[18px] text-muted-foreground" />
                  미배정 Task <span className="font-normal text-muted-foreground">{unassignedTasks.length}건</span>
                </h2>
                {selectedTaskIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowBulkAssign(true)}
                    className="rounded-lg bg-foreground px-3 py-1.5 text-[11px] font-medium text-background transition-colors"
                  >
                    선택 일괄 배정 ({selectedTaskIds.size}건)
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {unassignedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-xl border border-border bg-foreground/[0.02] p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="h-3.5 w-3.5 shrink-0 rounded border-border accent-foreground"
                      />
                      <UserX className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground">{task.title}</span>
                          <TypeBadge type={task.type} />
                          {(task.completionType === 'evidence' || (!task.completionType && task.type === 'milestone')) && (
                            <span className="flex items-center gap-0.5 rounded-md bg-foreground/[0.05] px-1 py-0.5 text-[9px] text-foreground/60">
                              <Paperclip className="h-2.5 w-2.5" />증빙
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{task.scheduledDate}</span>
                          <span>{task.scheduledTime}{task.dueTime ? ` ~ ${task.dueTime}` : ''}</span>
                          {task.unassignedReason && (
                            <>
                              <span className="text-border">·</span>
                              <span className="text-foreground/60">{task.unassignedReason}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-foreground focus:border-foreground/30 focus:outline-none"
                        defaultValue=""
                        onChange={(e) => {
                          if (!e.target.value) return
                          const s = staffList.find((st) => st.id === e.target.value)
                          if (s) assignTask(task.id, s.id, s.name)
                        }}
                      >
                        <option value="">배정</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Task Views */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <ClipboardList className="h-[18px] w-[18px]" />전체 Task
              </h2>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
                <button type="button" onClick={() => setViewMode('list')} className={viewModeCls(viewMode === 'list')}>
                  <List className="h-3 w-3" />목록
                </button>
                <button type="button" onClick={() => setViewMode('weekly')} className={viewModeCls(viewMode === 'weekly')}>
                  <Calendar className="h-3 w-3" />주간
                </button>
                <button type="button" onClick={() => setViewMode('monthly')} className={viewModeCls(viewMode === 'monthly')}>
                  <CalendarDays className="h-3 w-3" />월간
                </button>
              </div>
            </div>

            {/* Multi-filter bar */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-foreground focus:border-foreground/30 focus:outline-none">
                <option value="all">전체 기간</option>
                <option value="today">오늘</option>
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
              </select>
              <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-foreground focus:border-foreground/30 focus:outline-none">
                <option value="all">{`전체 ${ROLE_LABELS.learning_manager}`}</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="_unassigned">미배정</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-foreground focus:border-foreground/30 focus:outline-none">
                <option value="all">전체 유형</option>
                <option value="daily">일일</option>
                <option value="milestone">마일스톤</option>
                <option value="manual">수동</option>
              </select>
              {(dateRange !== 'all' || staffFilter !== 'all' || typeFilter !== 'all') && (
                <button type="button" onClick={() => { setDateRange('all'); setStaffFilter('all'); setTypeFilter('all') }}
                  className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary">
                  필터 초기화
                </button>
              )}
            </div>

            {viewMode === 'list' && (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                  {filterItems.map((item) => (
                    <button key={item.key} type="button" onClick={() => setTaskFilter(item.key)} className={pillCls(taskFilter === item.key)}>
                      {item.label} {item.count}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground">상태</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground">Task</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground">유형</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground">완료조건</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground">담당자</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground">날짜</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground">시간</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground">마감</th>
                        <th className="w-20 px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr key={task.id} className={`border-b border-border transition-colors last:border-b-0 hover:bg-secondary/30 ${task.status === 'overdue' ? 'bg-destructive/[0.02]' : ''}`}>
                          <td className="px-4 py-2.5"><StatusBadge status={task.status} /></td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[13px] font-medium ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</span>
                          </td>
                          <td className="px-4 py-2.5"><TypeBadge type={task.type} /></td>
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                              {(task.completionType === 'evidence' || (!task.completionType && task.type === 'milestone'))
                                ? <><Paperclip className="h-3 w-3" />증빙</>
                                : <><Check className="h-3 w-3" />체크</>}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[13px] text-foreground">{task.assigneeName ?? '-'}</td>
                          <td className="px-4 py-2.5 text-[13px] tabular-nums text-muted-foreground">{task.scheduledDate.slice(5)}</td>
                          <td className="px-4 py-2.5 text-[13px] tabular-nums text-muted-foreground">{task.scheduledTime ?? '-'}</td>
                          <td className="px-4 py-2.5 text-[13px] tabular-nums text-muted-foreground">
                            {task.status === 'completed' ? (
                              <span className="text-muted-foreground">{task.completedAt}</span>
                            ) : task.status === 'overdue' ? (
                              <span className="text-destructive">{task.dueTime} (초과)</span>
                            ) : (
                              task.dueTime ?? '-'
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              {task.messages.length > 0 && (
                                <button type="button" onClick={() => setSelectedTask(task)}
                                  className="flex items-center gap-0.5 text-[11px] text-foreground/60 hover:text-foreground">
                                  <MessageSquare className="h-3 w-3" />{task.messages.length}
                                </button>
                              )}
                              {task.status === 'overdue' && (
                                <button type="button" onClick={() => setReassignTarget(task)}
                                  className="flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-secondary">
                                  <RefreshCw className="h-2.5 w-2.5" />재배정
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredTasks.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            해당 조건의 Task가 없습니다
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {viewMode === 'weekly' && (
              <WeeklyView tasks={allTrackTasks} staffList={staffList} onTaskClick={setSelectedTask} />
            )}

            {viewMode === 'monthly' && (
              <MonthlyView tasks={allTrackTasks} onTaskClick={setSelectedTask} onDateSelect={() => {}} />
            )}
          </section>

          {/* Students */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">수강생 현황</h2>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="text-foreground">총 <strong>{track.studentCount}명</strong></span>
              <span className="text-border">|</span>
              <span className="text-foreground">출석률 95%</span>
              <span className="text-border">|</span>
              <span className="text-destructive">2일 이상 연속 결석: 3명</span>
            </div>
          </section>
        </main>
      </div>

      {selectedTask && <TaskChatModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
      {reassignTarget && <ReassignModal task={reassignTarget} staffList={staffList} onReassign={reassignTask} onClose={() => setReassignTarget(null)} />}
      {showBulkAssign && <BulkAssignModal taskIds={[...selectedTaskIds]} staffList={staffList} onBulkAssign={(ids, sid, sn) => { bulkAssignTasks(ids, sid, sn); setSelectedTaskIds(new Set()); setShowBulkAssign(false) }} onClose={() => setShowBulkAssign(false)} />}
      {vacationTarget && <VacationModal staff={vacationTarget} onSetVacation={handleSetVacation} onClose={() => setVacationTarget(null)} />}
    </div>
  )
}
