'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { TrackTask, StaffCard as StaffCardType, VacationEntry, WorkScheduleEntry } from '@/lib/admin-mock-data'
import { ROLE_LABELS_FULL } from '@/lib/role-labels'
import { AlertTriangle, MessageSquare, ChevronRight, ChevronLeft, CalendarOff, X, Plus, Settings, Pencil, Save, Trash2 } from 'lucide-react'
import { STAFF_COLORS, TODAY_STR, fmtDate } from './track-utils'
import { ProgressBar } from './track-task-card'
import { VacationReassignModal } from './track-modals'
import type { TaskStats } from './track-utils'

const CALENDAR_DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function StaffManageModal({ staffCard, staffTasks, otherStaff, trackPeriod, onClose, onSetVacation, onRemoveVacation, onUpdateSchedule, onUpdateMemo }: {
  staffCard: StaffCardType; staffTasks: TrackTask[]; otherStaff: { id: string; name: string }[]
  trackPeriod: { start: Date; end: Date }; onClose: () => void
  onSetVacation: (v: VacationEntry) => string[]; onRemoveVacation: (vacationId: string) => void
  onUpdateSchedule: (schedule: WorkScheduleEntry[]) => void; onUpdateMemo: (memo: string) => void
}) {
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(TODAY_STR); return { year: d.getFullYear(), month: d.getMonth() } })
  const [showScheduleEdit, setShowScheduleEdit] = useState(false)
  const [editSchedule, setEditSchedule] = useState<WorkScheduleEntry[]>([...staffCard.workSchedule])
  const [memoEdit, setMemoEdit] = useState(false)
  const [memoText, setMemoText] = useState(staffCard.memo)
  const [showVacationForm, setShowVacationForm] = useState(false)
  const [vacStart, setVacStart] = useState(''); const [vacEnd, setVacEnd] = useState(''); const [vacReason, setVacReason] = useState('')
  const [reassignTasks, setReassignTasks] = useState<TrackTask[] | null>(null)
  const today = new Date(TODAY_STR)

  const calDays = useMemo(() => {
    const first = new Date(calMonth.year, calMonth.month, 1); const lastDay = new Date(calMonth.year, calMonth.month + 1, 0).getDate()
    const startDow = first.getDay(); const days: (number | null)[] = Array(startDow).fill(null)
    for (let i = 1; i <= lastDay; i++) days.push(i)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [calMonth])

  const vacationDates = useMemo(() => {
    const s = new Set<string>()
    for (const v of staffCard.vacationHistory) { const start = new Date(v.start); const end = new Date(v.end); for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) s.add(fmtDate(d)) }
    return s
  }, [staffCard.vacationHistory])

  const workDays = useMemo(() => new Set(staffCard.workSchedule.map((w) => w.dayOfWeek)), [staffCard.workSchedule])

  const handleVacationSubmit = () => {
    if (!vacStart || !vacEnd) return
    const v: VacationEntry = { id: `v-${Date.now()}`, start: vacStart, end: vacEnd, reason: vacReason || '개인사유' }
    const affectedIds = onSetVacation(v)
    if (affectedIds.length > 0) setReassignTasks(staffTasks.filter((t) => affectedIds.includes(t.id)))
    setShowVacationForm(false); setVacStart(''); setVacEnd(''); setVacReason('')
  }

  const prevMonth = () => setCalMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 })
  const nextMonth = () => setCalMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 })
  const toggleScheduleDay = (dow: number) => {
    setEditSchedule((prev) => { const exists = prev.find((w) => w.dayOfWeek === dow); if (exists) return prev.filter((w) => w.dayOfWeek !== dow); return [...prev, { dayOfWeek: dow, startTime: '09:00', endTime: '18:00' }].sort((a, b) => a.dayOfWeek - b.dayOfWeek) })
  }

  if (reassignTasks) return <VacationReassignModal staffName={staffCard.name} tasks={reassignTasks} otherStaff={otherStaff} onClose={() => setReassignTasks(null)} onBackToManage={() => setReassignTasks(null)} />

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {(() => {
          const now = new Date(TODAY_STR); let totalWorkDays = 0; let workedDays = 0
          for (let d = new Date(trackPeriod.start); d <= trackPeriod.end; d.setDate(d.getDate() + 1)) { if (workDays.has(d.getDay()) && !vacationDates.has(fmtDate(d))) { totalWorkDays++; if (d <= now) workedDays++ } }
          let totalVacDays = 0; for (const v of staffCard.vacationHistory) { const vs = new Date(v.start); const ve = new Date(v.end); for (let d = new Date(vs); d <= ve; d.setDate(d.getDate() + 1)) totalVacDays++ }
          return (
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div><h2 className="text-[15px] font-semibold text-foreground">{staffCard.name}</h2><p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground"><span>오늘까지 근무 <span className="font-medium tabular-nums text-foreground">{workedDays}</span>일</span><span className="text-border">|</span><span>총일수 <span className="font-medium tabular-nums text-foreground">{totalWorkDays}</span>일</span><span className="text-border">|</span><span>총 휴가 <span className="font-medium tabular-nums text-foreground">{totalVacDays}</span>일</span></p></div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowScheduleEdit(!showScheduleEdit)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary"><Settings className="h-3 w-3" />근무 스케줄</button>
                <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
              </div>
            </div>
          )
        })()}
        <div className="flex-1 overflow-y-auto">
          {showScheduleEdit && (
            <div className="border-b border-border bg-secondary/20 px-5 py-3">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">근무 요일 설정</p>
              <div className="flex gap-1.5">
                {CALENDAR_DAY_NAMES.map((name, idx) => { const active = editSchedule.some((w) => w.dayOfWeek === idx); return (<button key={idx} type="button" onClick={() => toggleScheduleDay(idx)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-medium transition-colors ${active ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>{name}</button>) })}
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowScheduleEdit(false)} className="text-[11px] text-muted-foreground">취소</button>
                <button type="button" onClick={() => { onUpdateSchedule(editSchedule); setShowScheduleEdit(false) }} className="flex items-center gap-1 rounded-lg bg-foreground px-2.5 py-1 text-[11px] text-background"><Save className="h-3 w-3" />저장</button>
              </div>
            </div>
          )}
          <div className="border-b border-border px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-foreground">{calMonth.year}년 {calMonth.month + 1}월</span>
              <div className="flex gap-1"><button type="button" onClick={prevMonth} className="rounded-lg p-1 hover:bg-secondary"><ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" /></button><button type="button" onClick={nextMonth} className="rounded-lg p-1 hover:bg-secondary"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></button></div>
            </div>
            <div className="grid grid-cols-7 gap-px">
              {CALENDAR_DAY_NAMES.map((d) => <div key={d} className="py-1 text-center text-[10px] font-medium text-muted-foreground">{d}</div>)}
              {calDays.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />
                const dateStr = fmtDate(new Date(calMonth.year, calMonth.month, day)); const isToday = dateStr === TODAY_STR
                const isVacation = vacationDates.has(dateStr); const dow = new Date(calMonth.year, calMonth.month, day).getDay(); const isWorkDay = workDays.has(dow)
                return (<div key={dateStr} className={`relative flex items-center justify-center rounded-lg py-2 text-[12px] ${isToday ? 'bg-foreground text-background' : isVacation ? 'bg-destructive/10 text-destructive' : isWorkDay ? 'text-foreground' : 'text-muted-foreground/40'}`}>{day}{isVacation && !isToday && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-destructive" />}</div>)
              })}
            </div>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-foreground" />오늘</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-destructive" />휴가</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30" />비근무</span>
            </div>
          </div>
          <div className="border-b border-border px-5 py-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[12px] font-semibold text-foreground">메모</p>
              {!memoEdit && (<button type="button" onClick={() => setMemoEdit(true)} className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"><Pencil className="h-2.5 w-2.5" />편집</button>)}
            </div>
            {memoEdit ? (
              <div>
                <textarea value={memoText} onChange={(e) => setMemoText(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" placeholder="메모를 입력하세요..." />
                <div className="mt-1.5 flex justify-end gap-2">
                  <button type="button" onClick={() => { setMemoEdit(false); setMemoText(staffCard.memo) }} className="text-[11px] text-muted-foreground">취소</button>
                  <button type="button" onClick={() => { onUpdateMemo(memoText); setMemoEdit(false) }} className="flex items-center gap-1 rounded-lg bg-foreground px-2.5 py-1 text-[11px] text-background"><Save className="h-3 w-3" />저장</button>
                </div>
              </div>
            ) : (<p className={`text-[12px] leading-relaxed ${staffCard.memo ? 'text-foreground/80' : 'text-muted-foreground italic'}`}>{staffCard.memo || '메모 없음'}</p>)}
          </div>
          <div className="px-5 py-3.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-semibold text-foreground">휴가 관리</p>
              <button type="button" onClick={() => setShowVacationForm(!showVacationForm)} className="flex items-center gap-0.5 rounded-lg bg-foreground px-2 py-1 text-[11px] text-background"><Plus className="h-3 w-3" />휴가 등록</button>
            </div>
            {showVacationForm && (
              <div className="mb-3 rounded-lg border border-border bg-secondary/20 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="mb-0.5 block text-[10px] text-muted-foreground">시작일</label><input type="date" value={vacStart} onChange={(e) => setVacStart(e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[12px] text-foreground focus:border-foreground/30 focus:outline-none" /></div>
                  <div><label className="mb-0.5 block text-[10px] text-muted-foreground">종료일</label><input type="date" value={vacEnd} onChange={(e) => setVacEnd(e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[12px] text-foreground focus:border-foreground/30 focus:outline-none" /></div>
                </div>
                <div className="mt-2"><label className="mb-0.5 block text-[10px] text-muted-foreground">사유</label><input type="text" value={vacReason} onChange={(e) => setVacReason(e.target.value)} placeholder="개인사유" className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" /></div>
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowVacationForm(false)} className="text-[11px] text-muted-foreground">취소</button>
                  <button type="button" onClick={handleVacationSubmit} disabled={!vacStart || !vacEnd} className="rounded-lg bg-foreground px-3 py-1 text-[11px] text-background disabled:opacity-30">등록</button>
                </div>
              </div>
            )}
            {staffCard.vacationHistory.length > 0 ? (
              <div className="space-y-1.5">
                {[...staffCard.vacationHistory].sort((a, b) => b.start.localeCompare(a.start)).map((v) => {
                  const isPast = new Date(v.end) < today
                  return (
                    <div key={v.id} className={`flex items-center justify-between rounded-lg px-2.5 py-2 ${isPast ? 'bg-secondary/30' : 'bg-destructive/[0.05] border border-destructive/20'}`}>
                      <div><span className={`text-[12px] tabular-nums ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>{v.start.slice(5)} ~ {v.end.slice(5)}</span><span className="ml-2 text-[11px] text-muted-foreground">{v.reason}</span></div>
                      <div className="flex items-center gap-1.5">
                        {isPast ? (<span className="text-[10px] text-muted-foreground">완료</span>) : (<><span className="text-[10px] text-destructive">예정</span><button type="button" onClick={() => onRemoveVacation(v.id)} className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="h-3 w-3" /></button></>)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (<p className="text-[11px] italic text-muted-foreground">등록된 휴가가 없습니다</p>)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TrackStaffSection({ staffList, staffTaskStats, staffVacationMap, allTrackTasks, staffCards, trackPeriod, onSetVacation, onRemoveVacation, onUpdateSchedule, onUpdateMemo }: {
  staffList: { id: string; name: string; unreadMessages?: number }[]
  staffTaskStats: Map<string, TaskStats>
  staffVacationMap: Map<string, { start: string; end: string }>
  allTrackTasks: TrackTask[]
  staffCards: StaffCardType[]
  trackPeriod: { start: Date; end: Date }
  onSetVacation: (staffId: string, v: VacationEntry) => string[]
  onRemoveVacation: (staffId: string, vacationId: string) => void
  onUpdateSchedule: (staffId: string, schedule: WorkScheduleEntry[]) => void
  onUpdateMemo: (staffId: string, memo: string) => void
}) {
  const [manageStaffId, setManageStaffId] = useState<string | null>(null)
  const overdueCount = allTrackTasks.filter((t) => t.status === 'overdue').length

  const maxTasks = useMemo(() => {
    let max = 0
    for (const s of staffList) { const st = staffTaskStats.get(s.id); if (st && st.total > max) max = st.total }
    return max || 1
  }, [staffList, staffTaskStats])

  const isOnVacation = (staffId: string) => {
    const v = staffVacationMap.get(staffId)
    if (!v) return false
    return v.start <= TODAY_STR && v.end >= TODAY_STR
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[13px] font-semibold text-foreground">{ROLE_LABELS_FULL.learning_manager} 현황</span>
        <span className="font-normal text-[12px] text-muted-foreground">{staffList.length}명</span>
        {overdueCount > 0 && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">기한초과 {overdueCount}</span>
        )}
      </div>

      {/* Workload Comparison */}
      {staffList.length > 1 && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-[11px] font-medium text-muted-foreground">오늘 워크로드 비교</p>
          <div className="space-y-2">
            {staffList.map((staff, idx) => {
              const stats = staffTaskStats.get(staff.id) ?? { completed: 0, inProgress: 0, overdue: 0, pending: 0, total: 0 }
              const sc = STAFF_COLORS[idx % STAFF_COLORS.length]
              const widthPct = maxTasks > 0 ? (stats.total / maxTasks) * 100 : 0
              const completedPct = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
              const onVac = isOnVacation(staff.id)
              return (
                <div key={staff.id} className={`flex items-center gap-3 ${onVac ? 'opacity-40' : ''}`}>
                  <span className="w-14 truncate text-right text-[11px] font-medium text-foreground">{staff.name}</span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded bg-foreground/[0.04]">
                    <div className="absolute inset-y-0 left-0 rounded bg-foreground/[0.08] transition-all" style={{ width: `${widthPct}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded transition-all" style={{ width: `${widthPct * (completedPct / 100)}%`, backgroundColor: sc }} />
                  </div>
                  <span className="w-24 text-right text-[11px] tabular-nums text-muted-foreground">
                    {stats.total}건 ({stats.completed}완료)
                    {stats.overdue > 0 && <span className="ml-1 text-destructive">{stats.overdue}초과</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {staffList.map((staff, staffIdx) => {
          const stats = staffTaskStats.get(staff.id) ?? { completed: 0, inProgress: 0, overdue: 0, pending: 0, total: 0 }
          const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
          const vacation = staffVacationMap.get(staff.id)
          const onVac = isOnVacation(staff.id)
          const sc = STAFF_COLORS[staffIdx % STAFF_COLORS.length]
          return (
            <div key={staff.id} className={`overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm ${onVac ? 'opacity-60' : ''} ${stats.overdue > 0 ? 'border-destructive/30' : 'border-border'}`}>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sc }} />{staff.name}
                    {onVac && <span className="rounded-full bg-amber-500/15 px-1.5 py-[1px] text-[9px] font-semibold text-amber-600">휴가중</span>}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setManageStaffId(staff.id)} className="rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">휴가관리</button>
                    {vacation && <span className="flex items-center gap-0.5 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-foreground/60"><CalendarOff className="h-2.5 w-2.5" />{vacation.start.slice(5)} ~ {vacation.end.slice(5)}</span>}
                    {stats.overdue > 0 && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">완료율</span>
                    <span className="font-medium tabular-nums text-foreground">{stats.completed}/{stats.total} 완료 · {rate}%</span>
                  </div>
                  <ProgressBar value={rate} className="mt-1.5" />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                  <div className="rounded-lg bg-foreground/[0.04] py-1.5"><p className="text-sm font-bold tabular-nums text-foreground">{stats.completed}</p><p className="text-[10px] text-muted-foreground">완료</p></div>
                  <div className="rounded-lg bg-foreground/[0.04] py-1.5"><p className="text-sm font-bold tabular-nums text-foreground">{stats.inProgress}</p><p className="text-[10px] text-muted-foreground">진행</p></div>
                  <div className="rounded-lg bg-foreground/[0.04] py-1.5"><p className="text-sm font-bold tabular-nums text-foreground">{stats.pending}</p><p className="text-[10px] text-muted-foreground">대기</p></div>
                  <div className={`rounded-lg py-1.5 ${stats.overdue > 0 ? 'bg-destructive/10' : 'bg-foreground/[0.04]'}`}><p className={`text-sm font-bold tabular-nums ${stats.overdue > 0 ? 'text-destructive' : 'text-foreground'}`}>{stats.overdue}</p><p className="text-[10px] text-muted-foreground">초과</p></div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {(staff.unreadMessages ?? 0) > 0 && <span className="flex items-center gap-1 text-[10px] text-foreground/60"><MessageSquare className="h-3 w-3" />{staff.unreadMessages}</span>}
                  <Link href={`/staff/${staff.id}`} className="ml-auto flex items-center gap-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">상세<ChevronRight className="h-3 w-3" /></Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {manageStaffId && (() => {
        const sc = staffCards.find((s) => s.id === manageStaffId)
        if (!sc) return null
        const tasks = allTrackTasks.filter((t) => t.assigneeId === manageStaffId)
        const others = staffList.filter((s) => s.id !== manageStaffId)
        return (
          <StaffManageModal
            staffCard={sc} staffTasks={tasks} otherStaff={others} trackPeriod={trackPeriod}
            onClose={() => setManageStaffId(null)}
            onSetVacation={(v) => onSetVacation(manageStaffId, v)}
            onRemoveVacation={(vid) => onRemoveVacation(manageStaffId, vid)}
            onUpdateSchedule={(schedule) => onUpdateSchedule(manageStaffId, schedule)}
            onUpdateMemo={(memo) => onUpdateMemo(manageStaffId, memo)}
          />
        )
      })()}
    </div>
  )
}
