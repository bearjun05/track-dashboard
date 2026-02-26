'use client'

import { useState, useRef, useEffect } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import type { TrackTask, TrackTaskStatus, TaskType, VacationEntry } from '@/lib/admin-mock-data'
import { ROLE_LABELS, ROLE_LABELS_FULL } from '@/lib/role-labels'
import { X, Clock, UserX, MessageSquare, CheckCircle2, Send, RefreshCw, Plus, Trash2 } from 'lucide-react'
import { TODAY_STR, addDays, getStaffColor } from './track-utils'
import { StatusBadge, TypeBadge } from './track-task-card'

export function DeferModal({ task, onDefer, onClose }: {
  task: TrackTask
  onDefer: (taskId: string, newStart: string, newEnd?: string) => void
  onClose: () => void
}) {
  const [startDate, setStartDate] = useState(task.scheduledDate)
  const originalDuration = task.endDate
    ? Math.round((new Date(task.endDate).getTime() - new Date(task.scheduledDate).getTime()) / 86400000)
    : 0
  const [endDate, setEndDate] = useState(task.endDate ?? task.scheduledDate)

  const setDatesWithDuration = (newStart: string) => {
    setStartDate(newStart)
    setEndDate(originalDuration > 0 ? addDays(newStart, originalDuration) : newStart)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-foreground">미루기</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">{task.title}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setDatesWithDuration(addDays(TODAY_STR, 1))}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-secondary">내일로</button>
          <button type="button" onClick={() => setDatesWithDuration(addDays(TODAY_STR, 7 - new Date(TODAY_STR).getDay() + 1))}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-secondary">다음주 월요일</button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">시작일</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">종료일</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">취소</button>
          <button type="button"
            onClick={() => { onDefer(task.id, startDate, endDate !== startDate ? endDate : undefined); onClose() }}
            className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors">확인</button>
        </div>
      </div>
    </div>
  )
}

export function NewTaskModal({ trackId, staffList, onAdd, onClose }: {
  trackId: string
  staffList: { id: string; name: string }[]
  onAdd: (task: TrackTask) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('manual')
  const [assignee, setAssignee] = useState('')
  const [date, setDate] = useState(TODAY_STR)
  const [time, setTime] = useState('10:00')
  const [dueTime, setDueTime] = useState('11:00')
  const [completionType, setCompletionType] = useState<'simple' | 'evidence'>('simple')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-foreground">새 Task 생성</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Task 제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 특별 면담 진행"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">유형</label>
              <select value={type} onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none">
                <option value="manual">수동</option><option value="daily">일일</option><option value="milestone">마일스톤</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">완료 조건</label>
              <select value={completionType} onChange={(e) => setCompletionType(e.target.value as 'simple' | 'evidence')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none">
                <option value="simple">단순 체크</option><option value="evidence">증빙 필요</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">담당자</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none">
              <option value="">미배정</option>
              {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">날짜</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">시작 시간</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">마감 시간</label>
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">취소</button>
          <button type="button" disabled={!title.trim()} onClick={() => {
            const staff = staffList.find((s) => s.id === assignee)
            const newTask: TrackTask = {
              id: `tt-new-${Date.now()}`, title: title.trim(), type, completionType, trackId,
              assigneeId: staff?.id, assigneeName: staff?.name,
              status: staff ? 'pending' : 'unassigned',
              scheduledDate: date, scheduledTime: time, dueTime,
              unassignedReason: staff ? undefined : `${ROLE_LABELS_FULL.operator} 수동 생성 (미배정)`, messages: [],
            }
            onAdd(newTask); onClose()
          }} className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30">생성</button>
        </div>
      </div>
    </div>
  )
}

export function TaskDetailModal({ task, staffList, onClose, onComplete, onReassign, onDefer }: {
  task: TrackTask
  staffList: { id: string; name: string }[]
  onClose: () => void
  onComplete: (taskId: string) => void
  onReassign: (task: TrackTask) => void
  onDefer: (task: TrackTask) => void
}) {
  const { addTaskMessage } = useAdminStore()
  const [message, setMessage] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [task.messages.length])

  const send = () => {
    if (!message.trim()) return
    addTaskMessage(task.id, message.trim())
    setMessage('')
  }

  const isUnassigned = task.status === 'unassigned'
  const isCompleted = task.status === 'completed'
  const staffColor = getStaffColor(staffList, task.assigneeId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={task.status} />
              <h3 className="truncate text-[15px] font-semibold text-foreground">{task.title}</h3>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <TypeBadge type={task.type} />
              {task.completionType && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">{task.completionType === 'simple' ? '체크 완료' : '증빙 제출'}</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 border-b border-border px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">담당자</span>
            {isUnassigned ? (
              <span className="flex items-center gap-1 text-[12px] text-foreground/60"><UserX className="h-3 w-3" />미배정</span>
            ) : (
              <span className="flex items-center gap-1 text-[12px] font-medium text-foreground">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: staffColor ?? '#94a3b8' }} />{task.assigneeName}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">날짜</span>
            <span className="text-[12px] tabular-nums text-foreground">{task.scheduledDate}{task.endDate && task.endDate !== task.scheduledDate && ` ~ ${task.endDate}`}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">시간</span>
            <span className="text-[12px] tabular-nums text-foreground">{task.scheduledTime ?? '-'}{task.dueTime && ` ~ ${task.dueTime}`}</span>
          </div>
          {task.completedAt && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">완료 시각</span>
              <span className="text-[12px] tabular-nums text-foreground">{task.completedAt}</span>
            </div>
          )}
          {task.unassignedReason && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">미배정 사유</span>
              <span className="text-[12px] text-foreground/60">{task.unassignedReason}</span>
            </div>
          )}
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto bg-secondary/20 px-4 py-3">
          {task.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-muted-foreground"><MessageSquare className="h-7 w-7" /><p className="text-xs">아직 메시지가 없습니다</p></div>
          ) : (
            <div className="space-y-3">
              {task.messages.map((msg) => msg.isSelf ? (
                <div key={msg.id} className="flex justify-end"><div className="flex items-end gap-1.5"><span className="pb-0.5 text-[10px] text-muted-foreground">{msg.timestamp}</span><div className="max-w-[260px] rounded-xl rounded-tr-[4px] bg-foreground/[0.08] px-3 py-2"><p className="text-[13px] leading-relaxed text-foreground">{msg.content}</p></div></div></div>
              ) : (
                <div key={msg.id} className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-foreground">{msg.authorName.charAt(0)}</div>
                  <div className="min-w-0"><span className="text-[11px] font-medium text-foreground">{msg.authorName}</span><div className="mt-0.5 flex items-end gap-1.5"><div className="max-w-[260px] rounded-xl rounded-tl-[4px] bg-card px-3 py-2 shadow-sm"><p className="text-[13px] leading-relaxed text-foreground">{msg.content}</p></div><span className="pb-0.5 text-[10px] text-muted-foreground">{msg.timestamp}</span></div></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-border">
          {!isCompleted && (
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              {!isCompleted && task.status !== 'unassigned' && (
                <button type="button" onClick={() => { onComplete(task.id); onClose() }}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary">
                  <CheckCircle2 className="h-3 w-3" />완료 처리
                </button>
              )}
              <button type="button" onClick={() => { onReassign(task); onClose() }}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary">
                <RefreshCw className="h-3 w-3" />재배정
              </button>
              <button type="button" onClick={() => { onDefer(task); onClose() }}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary">
                <Clock className="h-3 w-3" />미루기
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2">
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="메시지를 입력하세요..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
            <button type="button" onClick={send} disabled={!message.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-colors disabled:opacity-30"><Send className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReassignModalInline({ task, staffList, onReassign, onClose }: {
  task: TrackTask
  staffList: { id: string; name: string }[]
  onReassign: (taskId: string, staffId: string, staffName: string, newDate?: string) => void
  onClose: () => void
}) {
  const [selectedStaff, setSelectedStaff] = useState('')
  const [newDate, setNewDate] = useState(task.scheduledDate)
  return (
    <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-[15px] font-semibold text-foreground">Task 재배정</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">{task.title}</p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{`배정할 ${ROLE_LABELS.learning_manager}`}</label>
          <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none">
            <option value="">선택</option>{staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">새 예정일</label>
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">취소</button>
        <button type="button" disabled={!selectedStaff} onClick={() => { const s = staffList.find((st) => st.id === selectedStaff); if (s) onReassign(task.id, s.id, s.name, newDate) }} className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30">재배정</button>
      </div>
    </div>
  )
}

export function BulkAssignContent({ taskCount, staffList, onAssign, onClose }: {
  taskCount: number
  staffList: { id: string; name: string }[]
  onAssign: (staffId: string, staffName: string) => void
  onClose: () => void
}) {
  const [selectedStaff, setSelectedStaff] = useState('')
  return (
    <>
      <h3 className="text-[15px] font-semibold text-foreground">일괄 배정</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">{taskCount}건의 Task를 배정합니다</p>
      <div className="mt-4">
        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{`배정할 ${ROLE_LABELS.learning_manager}`}</label>
        <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none">
          <option value="">선택</option>{staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">취소</button>
        <button type="button" disabled={!selectedStaff} onClick={() => { const s = staffList.find((st) => st.id === selectedStaff); if (s) onAssign(s.id, s.name) }} className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30">일괄 배정</button>
      </div>
    </>
  )
}

export function VacationReassignModal({ staffName, tasks, otherStaff, onClose, onBackToManage }: {
  staffName: string
  tasks: TrackTask[]
  otherStaff: { id: string; name: string }[]
  onClose: () => void
  onBackToManage: () => void
}) {
  const { reassignTask, bulkAssignTasks } = useAdminStore()
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkTarget, setBulkTarget] = useState('')

  const toggleSelect = (id: string) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  const selectAll = () => setSelected(new Set(tasks.map((t) => t.id)))
  const deselectAll = () => setSelected(new Set())

  const handleAssign = (taskId: string, staffId: string) => setAssignments((prev) => ({ ...prev, [taskId]: staffId }))

  const handleConfirm = () => {
    for (const t of tasks) {
      const target = assignments[t.id]
      if (target) {
        const s = otherStaff.find((st) => st.id === target)
        if (s) reassignTask(t.id, s.id, s.name)
      }
    }
    onClose()
  }

  const handleBulkAssign = () => {
    if (!bulkTarget || selected.size === 0) return
    const s = otherStaff.find((st) => st.id === bulkTarget)
    if (!s) return
    bulkAssignTasks([...selected], s.id, s.name)
    const newAssignments = { ...assignments }
    for (const id of selected) newAssignments[id] = bulkTarget
    setAssignments(newAssignments)
    setSelected(new Set())
    setBulkTarget('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">{staffName} 휴가 처리 - Task 재배정</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{tasks.length}건의 task가 미배정으로 전환됨</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 border-b border-border bg-secondary/20 px-5 py-2">
            <span className="text-[11px] text-foreground">{selected.size}건 선택</span>
            <select value={bulkTarget} onChange={(e) => setBulkTarget(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none">
              <option value="">배정 대상 선택</option>
              {otherStaff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="button" onClick={handleBulkAssign} disabled={!bulkTarget}
              className="rounded-lg bg-foreground px-2.5 py-1 text-[11px] text-background disabled:opacity-30">일괄 배정</button>
            <button type="button" onClick={deselectAll} className="ml-auto text-[10px] text-muted-foreground">선택 해제</button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={selected.size === tasks.length ? deselectAll : selectAll}
              className="text-[10px] text-muted-foreground hover:text-foreground">
              {selected.size === tasks.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          <div className="space-y-1.5">
            {tasks.map((t) => {
              const assignedTo = assignments[t.id]
              const assignedName = otherStaff.find((s) => s.id === assignedTo)?.name
              return (
                <div key={t.id} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${assignedTo ? 'border-foreground/20 bg-foreground/[0.03]' : 'border-border'}`}>
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)}
                    className="h-3.5 w-3.5 shrink-0 rounded border-border accent-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-foreground">{t.title}</p>
                    <p className="text-[10px] tabular-nums text-muted-foreground">{t.scheduledDate} {t.scheduledTime && `${t.scheduledTime}`}</p>
                  </div>
                  {assignedTo ? (
                    <span className="shrink-0 rounded-md bg-foreground/[0.08] px-2 py-0.5 text-[10px] font-medium text-foreground">{assignedName}</span>
                  ) : (
                    <select value="" onChange={(e) => handleAssign(t.id, e.target.value)}
                      className="shrink-0 rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none">
                      <option value="">배정</option>
                      {otherStaff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <button type="button" onClick={onBackToManage} className="text-[12px] text-muted-foreground hover:text-foreground">← 돌아가기</button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">미배정 유지</button>
            <button type="button" onClick={handleConfirm} className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background">완료</button>
          </div>
        </div>
      </div>
    </div>
  )
}
