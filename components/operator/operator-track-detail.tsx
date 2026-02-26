'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import type { TrackTask, TrackTaskStatus, TaskType, TrackSchedule, TrackNotice, VacationEntry, WorkScheduleEntry, StaffCard as StaffCardType } from '@/lib/admin-mock-data'
import { ROLE_LABELS, ROLE_LABELS_FULL } from '@/lib/role-labels'

import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import {
  ArrowLeft,
  AlertTriangle,
  MessageSquare,
  Clock,
  UserX,
  ChevronRight,
  ChevronLeft,
  Users,
  GraduationCap,
  ClipboardList,
  X,
  Calendar,
  CalendarOff,
  Plus,
  Layers,
  CheckCircle2,
  Send,
  RefreshCw,
  Megaphone,
  CornerDownLeft,
  Trash2,
  Check,
  Settings,
  Pencil,
  Save,
} from 'lucide-react'

// Staff accent colors — achromatic-friendly palette with subtle tints
const STAFF_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ec4899', // pink
  '#64748b', // slate
]

function getStaffColor(staffList: { id: string }[], staffId: string | undefined): string | null {
  if (!staffId) return null
  const idx = staffList.findIndex((s) => s.id === staffId)
  return idx >= 0 ? STAFF_COLORS[idx % STAFF_COLORS.length] : null
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const color = value >= 80 ? 'bg-foreground/70' : value >= 60 ? 'bg-foreground/50' : 'bg-foreground/30'
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-foreground/10 ${className ?? ''}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
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
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${c.cls}`}>{c.label}</span>
}

function TypeBadge({ type }: { type: TrackTask['type'] }) {
  const config = {
    daily: { label: '일일', cls: 'bg-foreground/[0.05] text-foreground/60' },
    milestone: { label: '마일스톤', cls: 'bg-foreground/[0.06] text-foreground/70' },
    manual: { label: '수동', cls: 'bg-foreground/[0.05] text-foreground/60' },
  }
  const c = config[type]
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${c.cls}`}>{c.label}</span>
}

type UnassignedViewMode = 'daily' | 'weekly' | 'chapter' | 'monthly'

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']
const TODAY_STR = '2026-02-19'

function fmtDate(d: Date) { return d.toISOString().split('T')[0] }

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
}

function getMonthDates(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay()
  const start = new Date(firstDay)
  start.setDate(1 - ((startDay + 6) % 7))
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return fmtDate(d)
}

// ─── Schedule Category Badge ───
function ScheduleCategoryBadge({ category }: { category?: string }) {
  if (!category) return null
  const config: Record<string, string> = {
    '강의': 'bg-foreground/[0.06] text-foreground/60',
    '프로젝트': 'bg-foreground/[0.08] text-foreground/70',
    '평가': 'bg-foreground/[0.10] text-foreground/80',
    '행사': 'bg-foreground/[0.05] text-foreground/50',
    '기타': 'bg-foreground/[0.04] text-foreground/40',
  }
  return <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${config[category] ?? config['기타']}`}>{category}</span>
}

// ─── Schedule Bar (for calendar views) ───
function ScheduleBar({ schedule, compact, onClick }: { schedule: TrackSchedule; compact?: boolean; onClick?: (s: TrackSchedule) => void }) {
  const isSystem = schedule.source === 'system'
  return (
    <button type="button" onClick={() => onClick?.(schedule)} className={`flex w-full items-center gap-1 rounded-md px-2 text-left transition-colors hover:bg-foreground/[0.04] ${compact ? 'py-0.5' : 'py-1'} ${
      isSystem
        ? 'border border-border bg-secondary/50'
        : 'border border-dashed border-foreground/15 bg-foreground/[0.03]'
    }`}>
      <ScheduleCategoryBadge category={schedule.category} />
      <span className={`truncate font-medium ${compact ? 'text-[9px]' : 'text-[10px]'} ${isSystem ? 'text-foreground' : 'text-foreground/70'}`}>{schedule.title}</span>
      {schedule.startDate !== schedule.endDate && (
        <span className={`shrink-0 tabular-nums text-muted-foreground ${compact ? 'text-[8px]' : 'text-[9px]'}`}>{schedule.startDate.slice(5)}~{schedule.endDate.slice(5)}</span>
      )}
    </button>
  )
}

// ─── Add Schedule Modal ───
function AddScheduleModal({ trackId, onAdd, onClose }: {
  trackId: string
  onAdd: (schedule: TrackSchedule) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(TODAY_STR)
  const [endDate, setEndDate] = useState(TODAY_STR)
  const [category, setCategory] = useState<'강의' | '프로젝트' | '평가' | '행사' | '기타'>('기타')
  const [description, setDescription] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-foreground">일정 추가</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">일정 제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 멘토링 데이"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none">
              <option value="강의">강의</option><option value="프로젝트">프로젝트</option><option value="평가">평가</option><option value="행사">행사</option><option value="기타">기타</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">설명 (선택)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="간단한 설명"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">취소</button>
          <button type="button" disabled={!title.trim()}
            onClick={() => {
              onAdd({
                id: `sch-new-${Date.now()}`, trackId, title: title.trim(),
                startDate, endDate: endDate < startDate ? startDate : endDate,
                source: 'operator', category, description: description.trim() || undefined,
              })
              onClose()
            }}
            className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30">추가</button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Schedule Modal ───
function EditScheduleModal({ schedule, onUpdate, onRemove, onClose }: {
  schedule: TrackSchedule
  onUpdate: (id: string, updates: Partial<Omit<TrackSchedule, 'id' | 'source'>>) => void
  onRemove: (id: string) => void
  onClose: () => void
}) {
  const isSystem = schedule.source === 'system'
  const [title, setTitle] = useState(schedule.title)
  const [startDate, setStartDate] = useState(schedule.startDate)
  const [endDate, setEndDate] = useState(schedule.endDate)
  const [category, setCategory] = useState<'강의' | '프로젝트' | '평가' | '행사' | '기타'>(schedule.category ?? '기타')
  const [description, setDescription] = useState(schedule.description ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-foreground">{isSystem ? '일정 상세' : '일정 수정'}</h3>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${isSystem ? 'bg-secondary text-muted-foreground' : 'bg-foreground/[0.06] text-foreground/70'}`}>
              {isSystem ? '시스템' : '직접 추가'}
            </span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">일정 제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSystem}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-60" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">시작일</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isSystem}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">종료일</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isSystem}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-60" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} disabled={isSystem}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-60">
              <option value="강의">강의</option><option value="프로젝트">프로젝트</option><option value="평가">평가</option><option value="행사">행사</option><option value="기타">기타</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">설명</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSystem}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-60" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          {!isSystem ? (
            <button type="button" onClick={() => { onRemove(schedule.id); onClose() }}
              className="rounded-lg px-3 py-1.5 text-[12px] text-destructive hover:bg-destructive/10">삭제</button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">
              {isSystem ? '닫기' : '취소'}
            </button>
            {!isSystem && (
              <button type="button" disabled={!title.trim()}
                onClick={() => {
                  onUpdate(schedule.id, { title: title.trim(), startDate, endDate: endDate < startDate ? startDate : endDate, category, description: description.trim() || undefined })
                  onClose()
                }}
                className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30">저장</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Schedule Weekly View ───
function ScheduleWeeklyView({ schedules, onScheduleClick }: { schedules: TrackSchedule[]; onScheduleClick: (s: TrackSchedule) => void }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const baseDate = useMemo(() => { const d = new Date(TODAY_STR); d.setDate(d.getDate() + weekOffset * 7); return d }, [weekOffset])
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate])
  const weekStart = fmtDate(weekDates[0])
  const weekEnd = fmtDate(weekDates[6])

  const { systemSchedules, operatorSchedules } = useMemo(() => {
    const visible = schedules.filter((s) => s.endDate >= weekStart && s.startDate <= weekEnd)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
    return {
      systemSchedules: visible.filter((s) => s.source === 'system'),
      operatorSchedules: visible.filter((s) => s.source === 'operator'),
    }
  }, [schedules, weekStart, weekEnd])

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <button type="button" onClick={() => setWeekOffset((o) => o - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{weekDates[0].getMonth() + 1}/{weekDates[0].getDate()} ~ {weekDates[6].getMonth() + 1}/{weekDates[6].getDate()}</span>
        <button type="button" onClick={() => setWeekOffset((o) => o + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        {weekOffset !== 0 && <button type="button" onClick={() => setWeekOffset(0)} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary">이번 주</button>}
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
          {weekDates.map((d, i) => {
            const isToday = fmtDate(d) === TODAY_STR
            return (
              <div key={i} className={`px-2 py-1.5 text-center text-[11px] font-medium ${isToday ? 'bg-foreground/[0.04] text-foreground' : 'text-muted-foreground'}`}>
                <div>{DAY_NAMES[i]}</div>
                <div className={`mt-0.5 tabular-nums ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background' : ''}`}>{d.getDate()}</div>
              </div>
            )
          })}
        </div>
        <div className="relative min-h-[60px]">
          {systemSchedules.length === 0 && operatorSchedules.length === 0 ? (
            <div className="py-4 text-center text-[11px] text-muted-foreground">이번 주 일정이 없습니다</div>
          ) : (
            <>
              {systemSchedules.length > 0 && (
                <div className="space-y-1 p-2">
                  {systemSchedules.map((s) => {
                    const effStart = s.startDate < weekStart ? weekStart : s.startDate
                    const effEnd = s.endDate > weekEnd ? weekEnd : s.endDate
                    const startIdx = weekDates.findIndex((d) => fmtDate(d) === effStart)
                    const endIdx = weekDates.findIndex((d) => fmtDate(d) === effEnd)
                    if (startIdx < 0 || endIdx < 0) return null
                    return (
                      <div key={s.id} className="grid grid-cols-7" title={s.description ?? s.title}>
                        <button type="button" onClick={() => onScheduleClick(s)} className="flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-2 py-1 text-left transition-colors hover:bg-secondary/80"
                          style={{ gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}` }}>
                          <ScheduleCategoryBadge category={s.category} />
                          <span className="truncate text-[10px] font-medium text-foreground">{s.title}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              {systemSchedules.length > 0 && operatorSchedules.length > 0 && (
                <div className="border-t border-dashed border-foreground/10" />
              )}
              {operatorSchedules.length > 0 && (
                <div className="space-y-1 p-2">
                  {operatorSchedules.map((s) => {
                    const effStart = s.startDate < weekStart ? weekStart : s.startDate
                    const effEnd = s.endDate > weekEnd ? weekEnd : s.endDate
                    const startIdx = weekDates.findIndex((d) => fmtDate(d) === effStart)
                    const endIdx = weekDates.findIndex((d) => fmtDate(d) === effEnd)
                    if (startIdx < 0 || endIdx < 0) return null
                    return (
                      <div key={s.id} className="grid grid-cols-7" title={s.description ?? s.title}>
                        <button type="button" onClick={() => onScheduleClick(s)} className="flex items-center gap-1 rounded-md border border-dashed border-foreground/15 bg-foreground/[0.03] px-2 py-1 text-left transition-colors hover:bg-foreground/[0.06]"
                          style={{ gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}` }}>
                          <ScheduleCategoryBadge category={s.category} />
                          <span className="truncate text-[10px] font-medium text-foreground/70">{s.title}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Schedule Chapter View ───
function ScheduleChapterView({ schedules, trackId, onScheduleClick }: { schedules: TrackSchedule[]; trackId: string; onScheduleClick: (s: TrackSchedule) => void }) {
  const storeChapters = useAdminStore((s) => s.chapters)
  const chapters = useMemo(() => storeChapters.filter((c) => c.trackId === trackId), [storeChapters, trackId])
  const [chapterIdx, setChapterIdx] = useState(() => {
    const idx = chapters.findIndex((c) => c.startDate <= TODAY_STR && c.endDate >= TODAY_STR)
    return idx >= 0 ? idx : 0
  })
  const chapter = chapters[chapterIdx] ?? chapters[0]

  const { chapterSystemSchedules, chapterOperatorSchedules } = useMemo(() => {
    if (!chapter) return { chapterSystemSchedules: [], chapterOperatorSchedules: [] }
    const visible = schedules.filter((s) => s.endDate >= chapter.startDate && s.startDate <= chapter.endDate)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
    return {
      chapterSystemSchedules: visible.filter((s) => s.source === 'system'),
      chapterOperatorSchedules: visible.filter((s) => s.source === 'operator'),
    }
  }, [schedules, chapter])

  const chapterDates = useMemo(() => {
    if (!chapter) return []
    const dates: Date[] = []
    const cur = new Date(chapter.startDate)
    const end = new Date(chapter.endDate)
    while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
    return dates
  }, [chapter])

  if (!chapter) return <div className="py-4 text-center text-[11px] text-muted-foreground">챕터 정보가 없습니다</div>

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <button type="button" onClick={() => setChapterIdx((i) => Math.max(0, i - 1))} disabled={chapterIdx === 0}
          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{chapter.name}</span>
        <span className="text-[11px] text-muted-foreground">{chapter.startDate.slice(5)} ~ {chapter.endDate.slice(5)}</span>
        <button type="button" onClick={() => setChapterIdx((i) => Math.min(chapters.length - 1, i + 1))} disabled={chapterIdx === chapters.length - 1}
          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid border-b border-border bg-secondary/40" style={{ gridTemplateColumns: `repeat(${chapterDates.length}, 1fr)` }}>
          {chapterDates.map((d, i) => {
            const isToday = fmtDate(d) === TODAY_STR
            const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
            return (
              <div key={i} className={`px-1 py-1 text-center text-[10px] font-medium ${isToday ? 'bg-foreground/[0.04] text-foreground' : 'text-muted-foreground'}`}>
                <div>{dayOfWeek}</div>
                <div className={`tabular-nums ${isToday ? 'inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] text-background' : ''}`}>{d.getDate()}</div>
              </div>
            )
          })}
        </div>
        <div className="relative min-h-[50px]">
          {chapterSystemSchedules.length === 0 && chapterOperatorSchedules.length === 0 ? (
            <div className="py-3 text-center text-[11px] text-muted-foreground">이 챕터 기간에 일정이 없습니다</div>
          ) : (
            <>
              {chapterSystemSchedules.length > 0 && (
                <div className="space-y-0.5 p-1.5">
                  {chapterSystemSchedules.map((s) => {
                    const effStart = s.startDate < chapter.startDate ? chapter.startDate : s.startDate
                    const effEnd = s.endDate > chapter.endDate ? chapter.endDate : s.endDate
                    const startIdx = chapterDates.findIndex((d) => fmtDate(d) === effStart)
                    const endIdx = chapterDates.findIndex((d) => fmtDate(d) === effEnd)
                    if (startIdx < 0 || endIdx < 0) return null
                    return (
                      <div key={s.id} className="grid" style={{ gridTemplateColumns: `repeat(${chapterDates.length}, 1fr)` }} title={s.description ?? s.title}>
                        <button type="button" onClick={() => onScheduleClick(s)} className="flex items-center gap-0.5 rounded border border-border bg-secondary/50 px-1.5 py-0.5 text-left transition-colors hover:bg-secondary/80"
                          style={{ gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}` }}>
                          <ScheduleCategoryBadge category={s.category} />
                          <span className="truncate text-[9px] font-medium text-foreground">{s.title}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              {chapterSystemSchedules.length > 0 && chapterOperatorSchedules.length > 0 && (
                <div className="border-t border-dashed border-foreground/10" />
              )}
              {chapterOperatorSchedules.length > 0 && (
                <div className="space-y-0.5 p-1.5">
                  {chapterOperatorSchedules.map((s) => {
                    const effStart = s.startDate < chapter.startDate ? chapter.startDate : s.startDate
                    const effEnd = s.endDate > chapter.endDate ? chapter.endDate : s.endDate
                    const startIdx = chapterDates.findIndex((d) => fmtDate(d) === effStart)
                    const endIdx = chapterDates.findIndex((d) => fmtDate(d) === effEnd)
                    if (startIdx < 0 || endIdx < 0) return null
                    return (
                      <div key={s.id} className="grid" style={{ gridTemplateColumns: `repeat(${chapterDates.length}, 1fr)` }} title={s.description ?? s.title}>
                        <button type="button" onClick={() => onScheduleClick(s)} className="flex items-center gap-0.5 rounded border border-dashed border-foreground/15 bg-foreground/[0.03] px-1.5 py-0.5 text-left transition-colors hover:bg-foreground/[0.06]"
                          style={{ gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}` }}>
                          <ScheduleCategoryBadge category={s.category} />
                          <span className="truncate text-[9px] font-medium text-foreground/70">{s.title}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Schedule Monthly View ───
function ScheduleMonthlyView({ schedules, onScheduleClick }: { schedules: TrackSchedule[]; onScheduleClick: (s: TrackSchedule) => void }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const { year, month } = useMemo(() => { const base = new Date(TODAY_STR); base.setMonth(base.getMonth() + monthOffset); return { year: base.getFullYear(), month: base.getMonth() } }, [monthOffset])
  const monthDates = useMemo(() => getMonthDates(year, month), [year, month])

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, TrackSchedule[]>()
    for (const d of monthDates) {
      const ds = fmtDate(d)
      if (!map.has(ds)) map.set(ds, [])
    }
    for (const s of schedules) {
      const cur = new Date(s.startDate)
      const end = new Date(s.endDate)
      while (cur <= end) {
        const ds = fmtDate(cur)
        if (map.has(ds)) map.get(ds)!.push(s)
        cur.setDate(cur.getDate() + 1)
      }
    }
    return map
  }, [schedules, monthDates])

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{year}년 {month + 1}월</span>
        <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        {monthOffset !== 0 && <button type="button" onClick={() => setMonthOffset(0)} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary">이번 달</button>}
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
          {DAY_NAMES.map((d) => <div key={d} className="px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {monthDates.map((d, i) => {
            const dateStr = fmtDate(d)
            const isCurrentMonth = d.getMonth() === month
            const isToday = dateStr === TODAY_STR
            const daySchedules = (schedulesByDate.get(dateStr) ?? []).filter(() => isCurrentMonth)
            const uniqueSchedules = daySchedules.filter((s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx)
            const daySys = uniqueSchedules.filter((s) => s.source === 'system')
            const dayOp = uniqueSchedules.filter((s) => s.source === 'operator')
            const maxShow = 2
            return (
              <div key={i} className={`min-h-[64px] border-b border-r border-border p-1 ${!isCurrentMonth ? 'bg-secondary/20' : ''}`}>
                <div className={`mb-0.5 text-[10px] tabular-nums ${isToday ? 'inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] text-background' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}`}>{d.getDate()}</div>
                {daySys.slice(0, maxShow).map((s) => (
                  <button key={s.id} type="button" onClick={() => onScheduleClick(s)} className="mb-0.5 block w-full truncate rounded bg-secondary/60 px-1 py-0.5 text-left text-[8px] font-medium text-foreground transition-colors hover:bg-secondary" title={s.title}>{s.title}</button>
                ))}
                {daySys.length > 0 && dayOp.length > 0 && <div className="my-0.5 border-t border-dashed border-foreground/8" />}
                {dayOp.slice(0, Math.max(0, maxShow - daySys.length)).map((s) => (
                  <button key={s.id} type="button" onClick={() => onScheduleClick(s)} className="mb-0.5 block w-full truncate rounded bg-foreground/[0.03] px-1 py-0.5 text-left text-[8px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.06]" title={s.title}>{s.title}</button>
                ))}
                {uniqueSchedules.length > maxShow && <div className="text-[8px] text-muted-foreground">+{uniqueSchedules.length - maxShow}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

type ScheduleViewMode = 'weekly' | 'chapter' | 'monthly'

// ─── Track Schedule Calendar Section ───
function TrackScheduleCalendar({ trackId, schedules, onAddSchedule, onUpdateSchedule, onRemoveSchedule }: {
  trackId: string
  schedules: TrackSchedule[]
  onAddSchedule: (schedule: TrackSchedule) => void
  onUpdateSchedule: (id: string, updates: Partial<Omit<TrackSchedule, 'id' | 'source'>>) => void
  onRemoveSchedule: (id: string) => void
}) {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('weekly')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<TrackSchedule | null>(null)

  const viewCls = (active: boolean) => `rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'}`

  const systemCount = schedules.filter((s) => s.source === 'system').length
  const operatorCount = schedules.filter((s) => s.source === 'operator').length

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />트랙 일정
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm border border-border bg-secondary/50" />시스템 {systemCount}</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm border border-dashed border-foreground/15 bg-foreground/[0.03]" />직접 추가 {operatorCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowAddModal(true)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary">
            <Plus className="h-3 w-3" />일정 추가
          </button>
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
            <button type="button" onClick={() => setViewMode('weekly')} className={viewCls(viewMode === 'weekly')}>주간</button>
            <button type="button" onClick={() => setViewMode('chapter')} className={viewCls(viewMode === 'chapter')}>챕터별</button>
            <button type="button" onClick={() => setViewMode('monthly')} className={viewCls(viewMode === 'monthly')}>월별</button>
          </div>
        </div>
      </div>

      {viewMode === 'weekly' && <ScheduleWeeklyView schedules={schedules} onScheduleClick={setEditingSchedule} />}
      {viewMode === 'chapter' && <ScheduleChapterView schedules={schedules} trackId={trackId} onScheduleClick={setEditingSchedule} />}
      {viewMode === 'monthly' && <ScheduleMonthlyView schedules={schedules} onScheduleClick={setEditingSchedule} />}

      {showAddModal && <AddScheduleModal trackId={trackId} onAdd={onAddSchedule} onClose={() => setShowAddModal(false)} />}
      {editingSchedule && <EditScheduleModal schedule={editingSchedule} onUpdate={onUpdateSchedule} onRemove={onRemoveSchedule} onClose={() => setEditingSchedule(null)} />}
    </section>
  )
}

// ─── Defer Modal ───
function DeferModal({ task, onDefer, onClose }: {
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
    if (originalDuration > 0) {
      setEndDate(addDays(newStart, originalDuration))
    } else {
      setEndDate(newStart)
    }
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
            className="flex-1 rounded-lg border border-border px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-secondary">
            내일로
          </button>
          <button type="button" onClick={() => setDatesWithDuration(addDays(TODAY_STR, 7 - new Date(TODAY_STR).getDay() + 1))}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-secondary">
            다음주 월요일
          </button>
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
            className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors">
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Unified Task Card (supports assigned + unassigned) ───
function TaskCard({ task, staffColor, onAssignToday, onDefer, onClick, compact, selected, onToggleSelect }: {
  task: TrackTask
  staffColor: string | null
  onAssignToday?: (taskId: string) => void
  onDefer?: (task: TrackTask) => void
  onClick?: (task: TrackTask) => void
  compact?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const isUnassigned = task.status === 'unassigned'
  const isToday = task.scheduledDate === TODAY_STR
  const isPast = task.scheduledDate < TODAY_STR
  const isCompleted = task.status === 'completed'
  const isOverdue = task.status === 'overdue'

  return (
    <div
      onClick={() => onClick?.(task)}
      className={`group rounded-lg transition-shadow hover:shadow-sm ${onClick ? 'cursor-pointer' : ''} ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5'} ${
        isUnassigned
          ? `border border-dashed bg-foreground/[0.02] ${isPast ? 'border-destructive/30' : 'border-foreground/20'}`
          : `border border-border bg-card`
      } ${selected ? 'ring-1 ring-foreground/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {isUnassigned && onToggleSelect && (
            <input type="checkbox" checked={!!selected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(task.id)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-border accent-foreground" />
          )}
          <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {isUnassigned && !onToggleSelect && <UserX className="h-3 w-3 shrink-0 text-foreground/40" />}
            <span className={`truncate text-[12px] font-medium ${
              isCompleted ? 'text-muted-foreground line-through' :
              isOverdue ? 'text-destructive' :
              isUnassigned && isPast ? 'text-destructive/80' :
              isUnassigned ? 'text-foreground/60' : 'text-foreground'
            }`}>{task.title}</span>
            <TypeBadge type={task.type} />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="tabular-nums">{task.scheduledTime}{task.dueTime ? ` ~ ${task.dueTime}` : ''}</span>
            {task.endDate && task.endDate !== task.scheduledDate && (
              <span className="tabular-nums">({task.scheduledDate.slice(5)} ~ {task.endDate.slice(5)})</span>
            )}
            {!isUnassigned && task.assigneeName && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: staffColor ?? '#94a3b8' }} />
                {task.assigneeName}
              </span>
            )}
          </div>
          {isUnassigned && task.unassignedReason && <p className="mt-0.5 text-[10px] text-foreground/40">{task.unassignedReason}</p>}
          </div>
        </div>
        {isUnassigned && onAssignToday && onDefer && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {isToday ? (
              <button type="button" onClick={(e) => { e.stopPropagation(); onDefer(task) }}
                className="rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-secondary">
                미루기
              </button>
            ) : (
              <button type="button" onClick={(e) => { e.stopPropagation(); onAssignToday(task.id) }}
                className="rounded-md bg-foreground px-2 py-1 text-[10px] text-background transition-colors hover:bg-foreground/80">
                오늘 배정
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Daily View (ALL tasks) ───
function DailyView({ tasks, staffList, onAssignToday, onDefer, onTaskClick, selectedTaskIds, onToggleSelect }: {
  tasks: TrackTask[]
  staffList: { id: string; name: string }[]
  onAssignToday: (taskId: string) => void
  onDefer: (task: TrackTask) => void
  onTaskClick: (task: TrackTask) => void
  selectedTaskIds: Set<string>
  onToggleSelect: (id: string) => void
}) {
  const [dateOffset, setDateOffset] = useState(0)
  const currentDate = useMemo(() => addDays(TODAY_STR, dateOffset), [dateOffset])
  const isToday = currentDate === TODAY_STR

  const dayTasks = useMemo(() => tasks.filter((t) => t.scheduledDate === currentDate), [tasks, currentDate])
  const dailyTasks = useMemo(() =>
    dayTasks.filter((t) => t.type === 'daily' || t.type === 'manual')
      .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '')),
    [dayTasks])
  const milestoneTasks = useMemo(() =>
    tasks.filter((t) => {
      if (t.type !== 'milestone') return false
      const start = t.scheduledDate
      const end = t.endDate ?? t.scheduledDate
      return currentDate >= start && currentDate <= end
    }).sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '')),
    [tasks, currentDate])

  const hours = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 9), [])

  const tasksByHourAndStaff = useMemo(() => {
    const map = new Map<number, Map<string, TrackTask[]>>()
    for (const h of hours) map.set(h, new Map())
    for (const t of dailyTasks) {
      const h = t.scheduledTime ? parseInt(t.scheduledTime.split(':')[0], 10) : 9
      const hourMap = map.get(h) ?? map.get(9)!
      const key = t.assigneeId ?? '_unassigned'
      if (!hourMap.has(key)) hourMap.set(key, [])
      hourMap.get(key)!.push(t)
    }
    return map
  }, [dailyTasks, hours])

  const dateLabel = useMemo(() => {
    const d = new Date(currentDate)
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    return `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]})`
  }, [currentDate])

  const unassignedCount = dayTasks.filter((t) => t.status === 'unassigned').length
  const assignedCount = dayTasks.filter((t) => t.status !== 'unassigned').length

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setDateOffset((o) => o - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">
          {dateLabel} {isToday && <span className="ml-1 text-[11px] text-muted-foreground">(오늘)</span>}
        </span>
        <button type="button" onClick={() => setDateOffset((o) => o + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        {dateOffset !== 0 && <button type="button" onClick={() => setDateOffset(0)} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary">오늘</button>}
        <div className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">배정 <span className="font-medium text-foreground">{assignedCount}</span></span>
          <span className="text-foreground/30">|</span>
          <span className="text-muted-foreground">미배정 <span className="font-medium text-foreground">{unassignedCount}</span></span>
        </div>
      </div>

      {/* Staff color legend */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {staffList.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STAFF_COLORS[i % STAFF_COLORS.length] }} />
            <span>{s.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full border border-dashed border-foreground/30 bg-foreground/[0.03]" />
          <span>미배정</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Time-based daily tasks */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-2.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-[12px] font-semibold text-foreground">시간대별 Task</h3>
            <span className="text-[11px] text-muted-foreground">{dailyTasks.length}건</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {hours.map((hour) => {
              const hourStaffMap = tasksByHourAndStaff.get(hour) ?? new Map()
              const staffKeys = Array.from(hourStaffMap.keys())
              const hasMultipleStaff = staffKeys.length > 1
              return (
                <div key={hour} className="relative border-b border-border/50 last:border-b-0">
                  <div className="flex">
                    <div className="flex w-12 shrink-0 items-start justify-end border-r border-border/50 px-2 py-2">
                      <span className="text-[11px] tabular-nums text-muted-foreground">{hour}:00</span>
                    </div>
                    <div className="min-h-[56px] flex-1 p-1.5">
                      {staffKeys.length === 0 ? (
                        <div className="h-full" />
                      ) : hasMultipleStaff ? (
                        <div className="flex gap-1.5">
                          {staffKeys.map((key) => {
                            const sTasks = hourStaffMap.get(key)!
                            const sc = key === '_unassigned' ? undefined : getStaffColor(staffList, key)
                            const staffName = key === '_unassigned' ? '미배정' : staffList.find((s) => s.id === key)?.name
                            return (
                              <div key={key} className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-1">
                                  {key === '_unassigned'
                                    ? <span className="inline-block h-1.5 w-1.5 rounded-full border border-dashed border-foreground/30 bg-foreground/[0.03]" />
                                    : <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sc ?? '#94a3b8' }} />}
                                  <span className="truncate text-[9px] text-muted-foreground">{staffName}</span>
                                </div>
                                <div className="space-y-1">
                                  {sTasks.map((t) => (
                                    <TaskCard key={t.id} task={t} staffColor={sc} onAssignToday={onAssignToday} onDefer={onDefer} onClick={onTaskClick} compact selected={selectedTaskIds.has(t.id)} onToggleSelect={onToggleSelect} />
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {staffKeys.flatMap((key) => hourStaffMap.get(key)!).map((t) => (
                            <TaskCard key={t.id} task={t} staffColor={getStaffColor(staffList, t.assigneeId)} onAssignToday={onAssignToday} onDefer={onDefer} onClick={onTaskClick} compact selected={selectedTaskIds.has(t.id)} onToggleSelect={onToggleSelect} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {dailyTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="mb-2 h-6 w-6" />
                <p className="text-[12px]">시간대별 Task 없음</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Milestone tasks */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-2.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-[12px] font-semibold text-foreground">기간 Task</h3>
            <span className="text-[11px] text-muted-foreground">{milestoneTasks.length}건</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-3">
            {milestoneTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Layers className="mb-2 h-6 w-6" />
                <p className="text-[12px]">기간 Task 없음</p>
              </div>
            ) : (
              <div className="space-y-2">
                {milestoneTasks.map((t) => (
                  <TaskCard key={t.id} task={t} staffColor={getStaffColor(staffList, t.assigneeId)} onAssignToday={onAssignToday} onDefer={onDefer} onClick={onTaskClick} selected={selectedTaskIds.has(t.id)} onToggleSelect={onToggleSelect} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Weekly View (staff rows + DnD, ALL tasks) ───
function UnassignedWeeklyView({ tasks, staffList, onMoveToDate, onAssignToday, onDefer, onTaskClick, selectedTaskIds, onToggleSelect }: {
  tasks: TrackTask[]
  staffList: { id: string; name: string }[]
  onMoveToDate: (taskId: string, newDate: string) => void
  onAssignToday: (taskId: string) => void
  onDefer: (task: TrackTask) => void
  onTaskClick: (task: TrackTask) => void
  selectedTaskIds: Set<string>
  onToggleSelect: (id: string) => void
}) {
  const [weekOffset, setWeekOffset] = useState(0)
  const baseDate = useMemo(() => { const d = new Date(TODAY_STR); d.setDate(d.getDate() + weekOffset * 7); return d }, [weekOffset])
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate])

  const allStaffKeys = useMemo(() => [...staffList.map((s) => s.id), '_unassigned'], [staffList])
  const staffNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of staffList) map.set(s.id, s.name)
    map.set('_unassigned', '미배정')
    return map
  }, [staffList])

  const spanTasks = useMemo(() => {
    const result: { task: TrackTask; startCol: number; spanCols: number }[] = []
    const weekStart = fmtDate(weekDates[0])
    const weekEnd = fmtDate(weekDates[6])
    for (const t of tasks) {
      if (!t.endDate || t.endDate === t.scheduledDate) continue
      if (t.endDate < weekStart || t.scheduledDate > weekEnd) continue
      const effStart = t.scheduledDate < weekStart ? weekStart : t.scheduledDate
      const effEnd = t.endDate > weekEnd ? weekEnd : t.endDate
      const startIdx = weekDates.findIndex((d) => fmtDate(d) === effStart)
      const endIdx = weekDates.findIndex((d) => fmtDate(d) === effEnd)
      if (startIdx >= 0 && endIdx >= 0) {
        result.push({ task: t, startCol: startIdx, spanCols: endIdx - startIdx + 1 })
      }
    }
    return result
  }, [tasks, weekDates])

  const tasksByDateAndStaff = useMemo(() => {
    const map = new Map<string, Map<string, TrackTask[]>>()
    for (const date of weekDates) {
      const dateStr = fmtDate(date)
      const staffMap = new Map<string, TrackTask[]>()
      for (const t of tasks) {
        if (t.scheduledDate !== dateStr) continue
        if (t.endDate && t.endDate !== t.scheduledDate) continue
        const key = t.assigneeId ?? '_unassigned'
        if (!staffMap.has(key)) staffMap.set(key, [])
        staffMap.get(key)!.push(t)
      }
      map.set(dateStr, staffMap)
    }
    return map
  }, [tasks, weekDates])

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return
    const taskId = result.draggableId
    const newDate = result.destination.droppableId.split('_').pop()!
    onMoveToDate(taskId, newDate)
  }, [onMoveToDate])

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setWeekOffset((o) => o - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{weekDates[0].getMonth() + 1}/{weekDates[0].getDate()} ~ {weekDates[6].getMonth() + 1}/{weekDates[6].getDate()}</span>
        <button type="button" onClick={() => setWeekOffset((o) => o + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        {weekOffset !== 0 && <button type="button" onClick={() => setWeekOffset(0)} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary">이번 주</button>}
      </div>

      {spanTasks.length > 0 && (
        <div className="relative mb-2 grid grid-cols-[80px_repeat(7,1fr)] gap-1">
          <div />
          {spanTasks.map(({ task: t, startCol, spanCols }) => {
            const sc = getStaffColor(staffList, t.assigneeId)
            const isUnassigned = t.status === 'unassigned'
            return (
              <button key={t.id} type="button" onClick={() => onTaskClick(t)}
                className={`flex items-center rounded-md px-2 py-1 text-left transition-colors hover:bg-foreground/[0.04] ${isUnassigned ? 'border border-dashed border-foreground/20 bg-foreground/[0.02]' : 'border border-border bg-card'}`}
                style={{ gridColumn: `${startCol + 2} / span ${spanCols}` }}>
                {!isUnassigned && sc && <span className="mr-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: sc }} />}
                <span className={`truncate text-[10px] font-medium ${isUnassigned ? 'text-foreground/60' : 'text-foreground'}`}>{t.title}</span>
                <span className="ml-1 shrink-0 text-[9px] tabular-nums text-muted-foreground">{t.scheduledDate.slice(5)}~{t.endDate?.slice(5)}</span>
                {isUnassigned && <UserX className="ml-1 h-2.5 w-2.5 shrink-0 text-foreground/40" />}
              </button>
            )
          })}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border bg-secondary/40">
            <div className="px-2 py-2 text-[11px] font-medium text-muted-foreground" />
            {weekDates.map((d, i) => {
              const isToday = fmtDate(d) === TODAY_STR
              return (
                <div key={i} className={`px-2 py-2 text-center text-[11px] font-medium ${isToday ? 'bg-foreground/[0.04] text-foreground' : 'text-muted-foreground'}`}>
                  <div>{DAY_NAMES[i]}</div>
                  <div className={`mt-0.5 tabular-nums ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background' : ''}`}>{d.getDate()}</div>
                </div>
              )
            })}
          </div>
          {allStaffKeys.map((staffKey) => {
            const sc = getStaffColor(staffList, staffKey === '_unassigned' ? undefined : staffKey)
            return (
              <div key={staffKey} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border last:border-b-0">
                <div className="flex items-start gap-1.5 px-2 py-2 text-[11px] font-medium text-foreground">
                  {staffKey !== '_unassigned' && sc && <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: sc }} />}
                  {staffKey === '_unassigned' && <UserX className="mt-0.5 h-3 w-3 shrink-0 text-foreground/40" />}
                  <span className={staffKey === '_unassigned' ? 'text-foreground/60' : ''}>{staffNameMap.get(staffKey)}</span>
                </div>
                {weekDates.map((d) => {
                  const dateStr = fmtDate(d)
                  const dayTasks = tasksByDateAndStaff.get(dateStr)?.get(staffKey) ?? []
                  const isToday = dateStr === TODAY_STR
                  const droppableId = `${staffKey}_${dateStr}`
                  return (
                    <Droppable key={droppableId} droppableId={droppableId}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[60px] border-l border-border px-1 py-1 transition-colors ${isToday ? 'bg-foreground/[0.02]' : ''} ${snapshot.isDraggingOver ? 'bg-foreground/[0.04]' : ''}`}
                        >
                          {dayTasks.map((t, idx) => {
                            const isUnassigned = t.status === 'unassigned'
                            return (
                              <Draggable key={t.id} draggableId={t.id} index={idx}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={() => onTaskClick(t)}
                                    className={`mb-0.5 cursor-pointer rounded px-1.5 py-0.5 text-[10px] transition-shadow hover:bg-foreground/[0.04] ${dragSnapshot.isDragging ? 'shadow-lg' : ''} ${
                                      isUnassigned
                                        ? 'border border-dashed border-foreground/20 bg-foreground/[0.02]'
                                        : 'border border-border bg-card'
                                    } ${selectedTaskIds.has(t.id) ? 'ring-1 ring-foreground/30' : ''}`}
                                    style={dragProvided.draggableProps.style}
                                  >
                                    <div className="flex items-center gap-1">
                                      {isUnassigned && (
                                        <input type="checkbox" checked={selectedTaskIds.has(t.id)}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={() => onToggleSelect(t.id)}
                                          className="h-3 w-3 shrink-0 cursor-pointer accent-foreground" />
                                      )}
                                      <span className={`truncate font-medium ${
                                        isUnassigned ? 'text-foreground/60' :
                                        t.status === 'completed' ? 'text-muted-foreground line-through' :
                                        t.status === 'overdue' ? 'text-destructive' : 'text-foreground'
                                      }`}>{t.title}</span>
                                    </div>
                                    <div className="tabular-nums text-muted-foreground">{t.scheduledTime}</div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )
                })}
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}

// ─── Chapter View (DnD, ALL tasks) ───
function ChapterView({ tasks, trackId, staffList, onMoveToDate, onAssignToday, onDefer, onTaskClick, selectedTaskIds, onToggleSelect }: {
  tasks: TrackTask[]
  trackId: string
  staffList: { id: string; name: string }[]
  onMoveToDate: (taskId: string, newDate: string) => void
  onAssignToday: (taskId: string) => void
  onDefer: (task: TrackTask) => void
  onTaskClick: (task: TrackTask) => void
  selectedTaskIds: Set<string>
  onToggleSelect: (id: string) => void
}) {
  const storeChapters = useAdminStore((s) => s.chapters)
  const chapters = useMemo(() => storeChapters.filter((c) => c.trackId === trackId), [storeChapters, trackId])
  const [chapterIdx, setChapterIdx] = useState(() => {
    const idx = chapters.findIndex((c) => c.startDate <= TODAY_STR && c.endDate >= TODAY_STR)
    return idx >= 0 ? idx : 0
  })
  const chapter = chapters[chapterIdx] ?? chapters[0]
  const milestoneTasks = useMemo(() => tasks.filter((t) => t.type === 'milestone'), [tasks])

  const chapterDates = useMemo(() => {
    if (!chapter) return []
    const dates: Date[] = []
    const start = new Date(chapter.startDate)
    const end = new Date(chapter.endDate)
    const cur = new Date(start)
    while (cur <= end) {
      dates.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }, [chapter])

  const weeks = useMemo(() => {
    const result: Date[][] = []
    let currentWeek: Date[] = []
    for (const d of chapterDates) {
      currentWeek.push(d)
      if (d.getDay() === 0 || d === chapterDates[chapterDates.length - 1]) {
        result.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) result.push(currentWeek)
    return result
  }, [chapterDates])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TrackTask[]>()
    for (const d of chapterDates) map.set(fmtDate(d), [])
    for (const t of milestoneTasks) {
      if (map.has(t.scheduledDate)) map.get(t.scheduledDate)!.push(t)
    }
    return map
  }, [milestoneTasks, chapterDates])

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return
    onMoveToDate(result.draggableId, result.destination.droppableId)
  }, [onMoveToDate])

  if (!chapter) return <div className="py-8 text-center text-sm text-muted-foreground">챕터 정보가 없습니다</div>

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setChapterIdx((i) => Math.max(0, i - 1))} disabled={chapterIdx === 0}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[13px] font-medium text-foreground">{chapter.name}</span>
        <span className="text-[11px] text-muted-foreground">{chapter.startDate.slice(5)} ~ {chapter.endDate.slice(5)}</span>
        <button type="button" onClick={() => setChapterIdx((i) => Math.min(chapters.length - 1, i + 1))} disabled={chapterIdx === chapters.length - 1}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Staff color legend */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {staffList.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STAFF_COLORS[i % STAFF_COLORS.length] }} />
            <span>{s.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full border border-dashed border-foreground/30 bg-foreground/[0.03]" />
          <span>미배정</span>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="overflow-hidden rounded-xl border border-border">
              <div className="grid border-b border-border bg-secondary/40" style={{ gridTemplateColumns: `repeat(${week.length}, 1fr)` }}>
                {week.map((d, i) => {
                  const isToday = fmtDate(d) === TODAY_STR
                  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
                  return (
                    <div key={i} className={`px-2 py-1.5 text-center text-[11px] font-medium ${isToday ? 'bg-foreground/[0.04] text-foreground' : 'text-muted-foreground'}`}>
                      <span>{dayOfWeek}</span> <span className={`tabular-nums ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background' : ''}`}>{d.getDate()}</span>
                    </div>
                  )
                })}
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${week.length}, 1fr)` }}>
                {week.map((d) => {
                  const dateStr = fmtDate(d)
                  const dayTasks = tasksByDate.get(dateStr) ?? []
                  const isToday = dateStr === TODAY_STR
                  return (
                    <Droppable key={dateStr} droppableId={dateStr}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[100px] border-r border-border p-1.5 last:border-r-0 transition-colors ${isToday ? 'bg-foreground/[0.02]' : ''} ${snapshot.isDraggingOver ? 'bg-foreground/[0.04]' : ''}`}
                        >
                          {dayTasks.map((t, idx) => {
                            const sc = getStaffColor(staffList, t.assigneeId)
                            const isUnassigned = t.status === 'unassigned'
                            return (
                              <Draggable key={t.id} draggableId={t.id} index={idx}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={() => onTaskClick(t)}
                                    className={`mb-1 cursor-pointer rounded-md p-1.5 text-[10px] transition-shadow hover:bg-foreground/[0.04] ${dragSnapshot.isDragging ? 'shadow-lg' : ''} ${
                                      isUnassigned
                                        ? 'border border-dashed border-foreground/20 bg-foreground/[0.02]'
                                        : 'border border-border bg-card'
                                    } ${selectedTaskIds.has(t.id) ? 'ring-1 ring-foreground/30' : ''}`}
                                    style={dragProvided.draggableProps.style}
                                  >
                                    <div className="flex items-center gap-1">
                                      {isUnassigned && (
                                        <input type="checkbox" checked={selectedTaskIds.has(t.id)}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={() => onToggleSelect(t.id)}
                                          className="h-3 w-3 shrink-0 cursor-pointer accent-foreground" />
                                      )}
                                      <span className={`truncate font-medium ${isUnassigned ? 'text-foreground/60' : t.status === 'completed' ? 'text-muted-foreground line-through' : t.status === 'overdue' ? 'text-destructive' : 'text-foreground'}`}>{t.title}</span>
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1 tabular-nums text-muted-foreground">
                                      <span>{t.scheduledTime}</span>
                                      {!isUnassigned && t.assigneeName && (
                                        <span className="flex items-center gap-0.5">
                                          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sc ?? '#94a3b8' }} />
                                          {t.assigneeName}
                                        </span>
                                      )}
                                      {isUnassigned && <UserX className="h-2.5 w-2.5 text-foreground/40" />}
                                    </div>
                                    {isUnassigned && (
                                      <div className="mt-1 flex gap-1">
                                        {t.scheduledDate === TODAY_STR ? (
                                          <button type="button" onClick={() => onDefer(t)} className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground hover:bg-secondary">미루기</button>
                                        ) : (
                                          <button type="button" onClick={() => onAssignToday(t.id)} className="rounded bg-foreground px-1.5 py-0.5 text-[9px] text-background">오늘 배정</button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

// ─── Monthly View (DnD, ALL tasks) ───
function UnassignedMonthlyView({ tasks, staffList, onMoveToDate, onAssignToday, onDefer, onTaskClick, selectedTaskIds, onToggleSelect }: {
  tasks: TrackTask[]
  staffList: { id: string; name: string }[]
  onMoveToDate: (taskId: string, newDate: string) => void
  onAssignToday: (taskId: string) => void
  onDefer: (task: TrackTask) => void
  onTaskClick: (task: TrackTask) => void
  selectedTaskIds: Set<string>
  onToggleSelect: (id: string) => void
}) {
  const [monthOffset, setMonthOffset] = useState(0)
  const { year, month } = useMemo(() => { const base = new Date(TODAY_STR); base.setMonth(base.getMonth() + monthOffset); return { year: base.getFullYear(), month: base.getMonth() } }, [monthOffset])
  const monthDates = useMemo(() => getMonthDates(year, month), [year, month])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const statsByDate = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; overdue: number; unassigned: number }>()
    for (const t of tasks) {
      if (!map.has(t.scheduledDate)) map.set(t.scheduledDate, { total: 0, completed: 0, overdue: 0, unassigned: 0 })
      const s = map.get(t.scheduledDate)!; s.total++
      if (t.status === 'completed') s.completed++
      if (t.status === 'overdue') s.overdue++
      if (t.status === 'unassigned') s.unassigned++
    }
    return map
  }, [tasks])

  const selectedTasks = useMemo(() =>
    selectedDate ? tasks.filter((t) => t.scheduledDate === selectedDate).sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '')) : [],
    [tasks, selectedDate])

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{year}년 {month + 1}월</span>
        <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        {monthOffset !== 0 && <button type="button" onClick={() => setMonthOffset(0)} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary">이번 달</button>}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
          {DAY_NAMES.map((d) => <div key={d} className="px-2 py-2 text-center text-[11px] font-medium text-muted-foreground">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {monthDates.map((d, i) => {
            const dateStr = fmtDate(d)
            const isCurrentMonth = d.getMonth() === month
            const isToday = dateStr === TODAY_STR
            const stats = statsByDate.get(dateStr)
            const isSelected = selectedDate === dateStr
            return (
              <button key={i} type="button" onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className={`min-h-[72px] border-b border-r border-border p-1.5 text-left transition-colors hover:bg-foreground/[0.02] ${!isCurrentMonth ? 'bg-secondary/20' : ''} ${isSelected ? 'bg-foreground/[0.04]' : ''}`}>
                <div className={`text-[11px] tabular-nums ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}`}>{d.getDate()}</div>
                {stats && isCurrentMonth && (
                  <div className="mt-1 space-y-0.5">
                    <div className="text-[9px] tabular-nums text-muted-foreground">{stats.completed}/{stats.total} 완료</div>
                    {stats.overdue > 0 && <div className="text-[9px] tabular-nums text-destructive">{stats.overdue} 초과</div>}
                    {stats.unassigned > 0 && <div className="text-[9px] tabular-nums text-foreground/50">{stats.unassigned} 미배정</div>}
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
            {selectedTasks.map((t) => {
              const sc = getStaffColor(staffList, t.assigneeId)
              const isUnassigned = t.status === 'unassigned'
              return (
                <div key={t.id} onClick={() => onTaskClick(t)} className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary/50 ${selectedTaskIds.has(t.id) ? 'ring-1 ring-foreground/30' : ''}`}>
                  {isUnassigned && (
                    <input type="checkbox" checked={selectedTaskIds.has(t.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleSelect(t.id)}
                      className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-foreground" />
                  )}
                  <StatusBadge status={t.status} />
                  <span className="text-[12px] tabular-nums text-muted-foreground">{t.scheduledTime}</span>
                  <span className={`flex-1 truncate text-[12px] ${t.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{t.title}</span>
                  {!isUnassigned && t.assigneeName && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sc ?? '#94a3b8' }} />
                      {t.assigneeName}
                    </span>
                  )}
                  {isUnassigned && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-foreground/50">미배정</span>
                      {t.scheduledDate === TODAY_STR ? (
                        <button type="button" onClick={() => onDefer(t)} className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-secondary">미루기</button>
                      ) : (
                        <button type="button" onClick={() => onAssignToday(t.id)} className="rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background">오늘 배정</button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── New Task Modal ───
function NewTaskModal({ trackId, staffList, onAdd, onClose }: {
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

// ─── Task Detail Modal ───
function TaskDetailModal({ task, staffList, onClose, onComplete, onReassign, onDefer }: {
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
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: staffColor ?? '#94a3b8' }} />
                {task.assigneeName}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">날짜</span>
            <span className="text-[12px] tabular-nums text-foreground">
              {task.scheduledDate}
              {task.endDate && task.endDate !== task.scheduledDate && ` ~ ${task.endDate}`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">시간</span>
            <span className="text-[12px] tabular-nums text-foreground">
              {task.scheduledTime ?? '-'}
              {task.dueTime && ` ~ ${task.dueTime}`}
            </span>
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

// ─── D-day helper ───
function getDDayLabel(expiresAt: string): { label: string; urgent: boolean } {
  const today = new Date(TODAY_STR)
  const expires = new Date(expiresAt)
  const diff = Math.ceil((expires.getTime() - today.getTime()) / 86400000)
  if (diff <= 0) return { label: '오늘 삭제', urgent: true }
  return { label: `D-${diff}`, urgent: diff <= 1 }
}

function fmtNow(): string {
  return new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\. /g, '-').replace('.', '')
}

function defaultExpiry(): string {
  const d = new Date(TODAY_STR)
  d.setDate(d.getDate() + 1)
  return fmtDate(d)
}

// ─── Notice Thread Modal ───
function NoticeThreadModal({ notice, staffList, onReply, onExtend, onRemove, onClose }: {
  notice: TrackNotice
  staffList: { id: string; name: string }[]
  onReply: (noticeId: string, content: string) => void
  onExtend: (noticeId: string, newExpiresAt: string) => void
  onRemove: (noticeId: string) => void
  onClose: () => void
}) {
  const [reply, setReply] = useState('')
  const [showExtend, setShowExtend] = useState(false)
  const [extendDate, setExtendDate] = useState(notice.expiresAt)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [notice.replies.length])

  const send = () => {
    if (!reply.trim()) return
    onReply(notice.id, reply.trim())
    setReply('')
  }

  const dDay = getDDayLabel(notice.expiresAt)
  const isGlobal = !notice.targetStaffId
  const targetStaff = isGlobal ? staffList : staffList.filter((s) => s.id === notice.targetStaffId)
  const readStaff = targetStaff.filter((s) => notice.readBy.includes(s.id))
  const unreadStaff = targetStaff.filter((s) => !notice.readBy.includes(s.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${isGlobal ? 'bg-foreground/10 text-foreground' : 'bg-foreground/[0.06] text-foreground/70'}`}>
                {isGlobal ? <><Megaphone className="h-2.5 w-2.5" />공통</> : notice.targetStaffName}
              </span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${dDay.urgent ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'}`}>
                {dDay.label}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">{notice.content}</p>
            <span className="text-[10px] tabular-nums text-muted-foreground">{notice.createdAt} · {notice.authorName}</span>
          </div>
          <button type="button" onClick={onClose} className="ml-3 shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        {/* Read status */}
        <div className="border-b border-border px-5 py-2.5">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-muted-foreground">읽음 현황</span>
            <div className="flex items-center gap-1.5">
              {readStaff.map((s) => (
                <span key={s.id} className="flex items-center gap-0.5 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium text-foreground">
                  <Check className="h-2.5 w-2.5 text-foreground/60" />{s.name}
                </span>
              ))}
              {unreadStaff.map((s) => (
                <span key={s.id} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{s.name}</span>
              ))}
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">{readStaff.length}/{targetStaff.length}</span>
          </div>
        </div>

        {/* Thread */}
        <div ref={listRef} className="flex-1 overflow-y-auto bg-secondary/20 px-4 py-3">
          {notice.replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-muted-foreground">
              <CornerDownLeft className="h-7 w-7" /><p className="text-xs">아직 답장이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notice.replies.map((r) => r.isManager ? (
                <div key={r.id} className="flex justify-end">
                  <div className="flex items-end gap-1.5">
                    <span className="pb-0.5 text-[10px] text-muted-foreground">{r.timestamp.split(' ')[1]}</span>
                    <div className="max-w-[260px] rounded-xl rounded-tr-[4px] bg-foreground/[0.08] px-3 py-2">
                      <p className="text-[13px] leading-relaxed text-foreground">{r.content}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={r.id} className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-foreground">{r.authorName.charAt(0)}</div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-foreground">{r.authorName}</span>
                    <div className="mt-0.5 flex items-end gap-1.5">
                      <div className="max-w-[260px] rounded-xl rounded-tl-[4px] bg-card px-3 py-2 shadow-sm">
                        <p className="text-[13px] leading-relaxed text-foreground">{r.content}</p>
                      </div>
                      <span className="pb-0.5 text-[10px] text-muted-foreground">{r.timestamp.split(' ')[1]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions + Reply */}
        <div className="border-t border-border">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <button type="button" onClick={() => setShowExtend(!showExtend)}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary">
              <Clock className="h-3 w-3" />기간 연장
            </button>
            <button type="button" onClick={() => { onRemove(notice.id); onClose() }}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3 w-3" />삭제
            </button>
            <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">만료: {notice.expiresAt}</span>
          </div>
          {showExtend && (
            <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-2">
              <span className="text-[11px] text-muted-foreground">만료일 변경</span>
              <input type="date" value={extendDate} onChange={(e) => setExtendDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1 text-[12px] text-foreground focus:border-foreground/30 focus:outline-none" />
              <button type="button" onClick={() => { onExtend(notice.id, extendDate); setShowExtend(false) }}
                className="rounded-lg bg-foreground px-2.5 py-1 text-[11px] text-background">적용</button>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2">
            <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="답장을 입력하세요..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
            <button type="button" onClick={send} disabled={!reply.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-colors disabled:opacity-30">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Staff Notice Input (inline in card) ───
// ─── Track Notice Section (전체 + 학습관리매니저별 토글) ───
function TrackNoticeSection({ trackId, notices, staffList, onAdd, onReply, onExtend, onRemove }: {
  trackId: string
  notices: TrackNotice[]
  staffList: { id: string; name: string }[]
  onAdd: (notice: TrackNotice) => void
  onReply: (noticeId: string, content: string) => void
  onExtend: (noticeId: string, newExpiresAt: string) => void
  onRemove: (noticeId: string) => void
}) {
  const [msg, setMsg] = useState('')
  const [target, setTarget] = useState<string>('all')
  const [openNotice, setOpenNotice] = useState<TrackNotice | null>(null)
  const [viewFilter, setViewFilter] = useState<'all' | string>('all')

  const send = () => {
    if (!msg.trim()) return
    const staff = target !== 'all' ? staffList.find((s) => s.id === target) : null
    onAdd({
      id: `tn-${Date.now()}`, trackId,
      targetStaffId: staff?.id ?? null, targetStaffName: staff?.name ?? null,
      authorName: '이운영', content: msg.trim(),
      createdAt: fmtNow(), expiresAt: defaultExpiry(), readBy: [], replies: [],
    })
    setMsg('')
  }

  const filteredNotices = viewFilter === 'all'
    ? notices
    : viewFilter === 'global'
      ? notices.filter((n) => !n.targetStaffId)
      : notices.filter((n) => n.targetStaffId === viewFilter)

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
        <Megaphone className="h-[18px] w-[18px]" />공지
        <span className="font-normal text-muted-foreground">{notices.length}건</span>
      </h2>
      <div className="rounded-xl border border-border bg-card p-4">
        {/* 토글 필터 */}
        <div className="mb-3 flex flex-wrap gap-1">
          {[
            { key: 'all', label: '모두', count: notices.length },
            { key: 'global', label: '공통', count: notices.filter((n) => !n.targetStaffId).length },
            ...staffList.map((s) => ({ key: s.id, label: s.name, count: notices.filter((n) => n.targetStaffId === s.id).length })),
          ].map((item) => (
            <button key={item.key} type="button" onClick={() => setViewFilter(item.key)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${viewFilter === item.key ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {item.label}
              {item.count > 0 && <span className="ml-1 tabular-nums">{item.count}</span>}
            </button>
          ))}
        </div>

        {/* 작성 입력 */}
        <div className="flex items-center gap-2">
          <select value={target} onChange={(e) => setTarget(e.target.value)}
            className="shrink-0 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-medium text-foreground focus:outline-none">
            <option value="all">공통 공지</option>
            {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="text" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="공지 내용을 입력하세요..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
          <button type="button" onClick={send} disabled={!msg.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-colors disabled:opacity-30">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 공지 목록 */}
        {filteredNotices.length > 0 ? (
          <div className="mt-3 space-y-1">
            {filteredNotices.map((n) => {
              const dDay = getDDayLabel(n.expiresAt)
              const isGlobal = !n.targetStaffId
              const targetCount = isGlobal ? staffList.length : 1
              const readCount = n.readBy.length
              return (
                <button key={n.id} type="button" onClick={() => setOpenNotice(n)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary/30">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold ${isGlobal ? 'bg-foreground/10 text-foreground' : 'bg-foreground/[0.06] text-foreground/70'}`}>
                    {isGlobal ? '전' : n.targetStaffName?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium ${isGlobal ? 'text-foreground' : 'text-foreground/70'}`}>
                        {isGlobal ? '공통' : n.targetStaffName}
                      </span>
                      {readCount < targetCount && <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />}
                      {n.replies.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <CornerDownLeft className="h-2.5 w-2.5" />{n.replies.length}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] leading-relaxed text-foreground/80">{n.content}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-[10px] tabular-nums text-muted-foreground">{n.createdAt}</span>
                      <span className="text-[9px] tabular-nums text-muted-foreground">읽음 {readCount}/{targetCount}</span>
                    </div>
                  </div>
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${dDay.urgent ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'}`}>
                    {dDay.label}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 text-center text-[11px] italic text-muted-foreground">해당 공지가 없습니다</p>
        )}
      </div>

      {openNotice && (() => {
        const live = notices.find((n) => n.id === openNotice.id) ?? openNotice
        return <NoticeThreadModal notice={live} staffList={staffList} onReply={onReply} onExtend={onExtend} onRemove={onRemove} onClose={() => setOpenNotice(null)} />
      })()}
    </section>
  )
}

// ═══════════════════════════════════════════════
// Staff Management Modal
// ═══════════════════════════════════════════════

const CALENDAR_DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function StaffManageModal({
  staffCard, staffTasks, otherStaff, trackPeriod, onClose, onSetVacation, onRemoveVacation, onUpdateSchedule, onUpdateMemo,
}: {
  staffCard: StaffCardType
  staffTasks: TrackTask[]
  otherStaff: { id: string; name: string }[]
  trackPeriod: { start: Date; end: Date }
  onClose: () => void
  onSetVacation: (v: VacationEntry) => string[]
  onRemoveVacation: (vacationId: string) => void
  onUpdateSchedule: (schedule: WorkScheduleEntry[]) => void
  onUpdateMemo: (memo: string) => void
}) {
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(TODAY_STR); return { year: d.getFullYear(), month: d.getMonth() } })
  const [showScheduleEdit, setShowScheduleEdit] = useState(false)
  const [editSchedule, setEditSchedule] = useState<WorkScheduleEntry[]>([...staffCard.workSchedule])
  const [memoEdit, setMemoEdit] = useState(false)
  const [memoText, setMemoText] = useState(staffCard.memo)
  const [showVacationForm, setShowVacationForm] = useState(false)
  const [vacStart, setVacStart] = useState('')
  const [vacEnd, setVacEnd] = useState('')
  const [vacReason, setVacReason] = useState('')
  const [reassignTasks, setReassignTasks] = useState<TrackTask[] | null>(null)

  const today = new Date(TODAY_STR)
  const calDays = useMemo(() => {
    const first = new Date(calMonth.year, calMonth.month, 1)
    const lastDay = new Date(calMonth.year, calMonth.month + 1, 0).getDate()
    const startDow = first.getDay()
    const days: (number | null)[] = Array(startDow).fill(null)
    for (let i = 1; i <= lastDay; i++) days.push(i)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [calMonth])

  const vacationDates = useMemo(() => {
    const s = new Set<string>()
    for (const v of staffCard.vacationHistory) {
      const start = new Date(v.start); const end = new Date(v.end)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) s.add(fmtDate(d))
    }
    return s
  }, [staffCard.vacationHistory])

  const workDays = useMemo(() => new Set(staffCard.workSchedule.map((w) => w.dayOfWeek)), [staffCard.workSchedule])

  const handleVacationSubmit = () => {
    if (!vacStart || !vacEnd) return
    const v: VacationEntry = { id: `v-${Date.now()}`, start: vacStart, end: vacEnd, reason: vacReason || '개인사유' }
    const affectedIds = onSetVacation(v)
    if (affectedIds.length > 0) {
      const affected = staffTasks.filter((t) => affectedIds.includes(t.id))
      setReassignTasks(affected)
    }
    setShowVacationForm(false); setVacStart(''); setVacEnd(''); setVacReason('')
  }

  const prevMonth = () => setCalMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 })
  const nextMonth = () => setCalMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 })

  const toggleScheduleDay = (dow: number) => {
    setEditSchedule((prev) => {
      const exists = prev.find((w) => w.dayOfWeek === dow)
      if (exists) return prev.filter((w) => w.dayOfWeek !== dow)
      return [...prev, { dayOfWeek: dow, startTime: '09:00', endTime: '18:00' }].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    })
  }

  if (reassignTasks) {
    return <VacationReassignModal staffName={staffCard.name} tasks={reassignTasks} otherStaff={otherStaff} onClose={() => { setReassignTasks(null) }} onBackToManage={() => setReassignTasks(null)} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        {(() => {
          const now = new Date(TODAY_STR)
          let totalWorkDays = 0; let workedDays = 0
          for (let d = new Date(trackPeriod.start); d <= trackPeriod.end; d.setDate(d.getDate() + 1)) {
            if (workDays.has(d.getDay()) && !vacationDates.has(fmtDate(d))) {
              totalWorkDays++
              if (d <= now) workedDays++
            }
          }
          let totalVacDays = 0
          for (const v of staffCard.vacationHistory) {
            const vs = new Date(v.start); const ve = new Date(v.end)
            for (let d = new Date(vs); d <= ve; d.setDate(d.getDate() + 1)) totalVacDays++
          }
          return (
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">{staffCard.name}</h2>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>오늘까지 근무 <span className="font-medium tabular-nums text-foreground">{workedDays}</span>일</span>
                  <span className="text-border">|</span>
                  <span>총일수 <span className="font-medium tabular-nums text-foreground">{totalWorkDays}</span>일</span>
                  <span className="text-border">|</span>
                  <span>총 휴가 <span className="font-medium tabular-nums text-foreground">{totalVacDays}</span>일</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowScheduleEdit(!showScheduleEdit)}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary">
                  <Settings className="h-3 w-3" />근무 스케줄
                </button>
                <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
              </div>
            </div>
          )
        })()}

        <div className="flex-1 overflow-y-auto">
          {/* Schedule edit panel */}
          {showScheduleEdit && (
            <div className="border-b border-border bg-secondary/20 px-5 py-3">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">근무 요일 설정</p>
              <div className="flex gap-1.5">
                {CALENDAR_DAY_NAMES.map((name, idx) => {
                  const active = editSchedule.some((w) => w.dayOfWeek === idx)
                  return (
                    <button key={idx} type="button" onClick={() => toggleScheduleDay(idx)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-medium transition-colors ${active ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                      {name}
                    </button>
                  )
                })}
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowScheduleEdit(false)} className="text-[11px] text-muted-foreground">취소</button>
                <button type="button" onClick={() => { onUpdateSchedule(editSchedule); setShowScheduleEdit(false) }}
                  className="flex items-center gap-1 rounded-lg bg-foreground px-2.5 py-1 text-[11px] text-background"><Save className="h-3 w-3" />저장</button>
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="border-b border-border px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-foreground">{calMonth.year}년 {calMonth.month + 1}월</span>
              <div className="flex gap-1">
                <button type="button" onClick={prevMonth} className="rounded-lg p-1 hover:bg-secondary"><ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" /></button>
                <button type="button" onClick={nextMonth} className="rounded-lg p-1 hover:bg-secondary"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-px">
              {CALENDAR_DAY_NAMES.map((d) => <div key={d} className="py-1 text-center text-[10px] font-medium text-muted-foreground">{d}</div>)}
              {calDays.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />
                const dateStr = fmtDate(new Date(calMonth.year, calMonth.month, day))
                const isToday = dateStr === TODAY_STR
                const isVacation = vacationDates.has(dateStr)
                const dow = new Date(calMonth.year, calMonth.month, day).getDay()
                const isWorkDay = workDays.has(dow)
                return (
                  <div key={dateStr} className={`relative flex items-center justify-center rounded-lg py-2 text-[12px] ${isToday ? 'bg-foreground text-background' : isVacation ? 'bg-destructive/10 text-destructive' : isWorkDay ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                    {day}
                    {isVacation && !isToday && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-destructive" />}
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-foreground" />오늘</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-destructive" />휴가</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30" />비근무</span>
            </div>
          </div>

          {/* Memo */}
          <div className="border-b border-border px-5 py-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[12px] font-semibold text-foreground">메모</p>
              {!memoEdit && (
                <button type="button" onClick={() => setMemoEdit(true)} className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground">
                  <Pencil className="h-2.5 w-2.5" />편집
                </button>
              )}
            </div>
            {memoEdit ? (
              <div>
                <textarea value={memoText} onChange={(e) => setMemoText(e.target.value)} rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
                  placeholder="메모를 입력하세요..." />
                <div className="mt-1.5 flex justify-end gap-2">
                  <button type="button" onClick={() => { setMemoEdit(false); setMemoText(staffCard.memo) }} className="text-[11px] text-muted-foreground">취소</button>
                  <button type="button" onClick={() => { onUpdateMemo(memoText); setMemoEdit(false) }}
                    className="flex items-center gap-1 rounded-lg bg-foreground px-2.5 py-1 text-[11px] text-background"><Save className="h-3 w-3" />저장</button>
                </div>
              </div>
            ) : (
              <p className={`text-[12px] leading-relaxed ${staffCard.memo ? 'text-foreground/80' : 'text-muted-foreground italic'}`}>
                {staffCard.memo || '메모 없음'}
              </p>
            )}
          </div>

          {/* Vacation section */}
          <div className="px-5 py-3.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-semibold text-foreground">휴가 관리</p>
              <button type="button" onClick={() => setShowVacationForm(!showVacationForm)}
                className="flex items-center gap-0.5 rounded-lg bg-foreground px-2 py-1 text-[11px] text-background">
                <Plus className="h-3 w-3" />휴가 등록
              </button>
            </div>

            {showVacationForm && (
              <div className="mb-3 rounded-lg border border-border bg-secondary/20 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] text-muted-foreground">시작일</label>
                    <input type="date" value={vacStart} onChange={(e) => setVacStart(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[12px] text-foreground focus:border-foreground/30 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] text-muted-foreground">종료일</label>
                    <input type="date" value={vacEnd} onChange={(e) => setVacEnd(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[12px] text-foreground focus:border-foreground/30 focus:outline-none" />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="mb-0.5 block text-[10px] text-muted-foreground">사유</label>
                  <input type="text" value={vacReason} onChange={(e) => setVacReason(e.target.value)} placeholder="개인사유"
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowVacationForm(false)} className="text-[11px] text-muted-foreground">취소</button>
                  <button type="button" onClick={handleVacationSubmit} disabled={!vacStart || !vacEnd}
                    className="rounded-lg bg-foreground px-3 py-1 text-[11px] text-background disabled:opacity-30">등록</button>
                </div>
              </div>
            )}

            {staffCard.vacationHistory.length > 0 ? (
              <div className="space-y-1.5">
                {[...staffCard.vacationHistory].sort((a, b) => b.start.localeCompare(a.start)).map((v) => {
                  const isPast = new Date(v.end) < today
                  return (
                    <div key={v.id} className={`flex items-center justify-between rounded-lg px-2.5 py-2 ${isPast ? 'bg-secondary/30' : 'bg-destructive/[0.05] border border-destructive/20'}`}>
                      <div>
                        <span className={`text-[12px] tabular-nums ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {v.start.slice(5)} ~ {v.end.slice(5)}
                        </span>
                        <span className="ml-2 text-[11px] text-muted-foreground">{v.reason}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isPast ? (
                          <span className="text-[10px] text-muted-foreground">완료</span>
                        ) : (
                          <>
                            <span className="text-[10px] text-destructive">예정</span>
                            <button type="button" onClick={() => onRemoveVacation(v.id)}
                              className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[11px] italic text-muted-foreground">등록된 휴가가 없습니다</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Vacation Reassign Modal
// ═══════════════════════════════════════════════
function VacationReassignModal({ staffName, tasks, otherStaff, onClose, onBackToManage }: {
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

  const handleAssign = (taskId: string, staffId: string) => {
    setAssignments((prev) => ({ ...prev, [taskId]: staffId }))
  }

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
    const ids = [...selected]
    bulkAssignTasks(ids, s.id, s.name)
    const newAssignments = { ...assignments }
    for (const id of ids) newAssignments[id] = bulkTarget
    setAssignments(newAssignments)
    setSelected(new Set())
    setBulkTarget('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">{staffName} 휴가 처리 - Task 재배정</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{tasks.length}건의 task가 미배정으로 전환됨</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        {/* Bulk assign bar */}
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

        {/* Task list */}
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

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <button type="button" onClick={onBackToManage} className="text-[12px] text-muted-foreground hover:text-foreground">← 돌아가기</button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">미배정 유지</button>
            <button type="button" onClick={handleConfirm}
              className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background">완료</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════
export function OperatorTrackDetail({ trackId }: { trackId: string }) {
  const {
    plannerTracks, trackTasks, staffCards, operatorTrackDetails,
    bulkAssignTasks, reassignTask, addTrackTask, updateTrackTaskStatus,
    deferTask, moveTaskToToday, moveTaskToDate,
    trackSchedules, addTrackSchedule, updateTrackSchedule, removeTrackSchedule,
    trackNotices, addTrackNotice, removeTrackNotice, addTrackNoticeReply, extendTrackNotice,
    setStaffVacation, removeStaffVacation, updateStaffWorkSchedule, updateStaffMemo,
  } = useAdminStore()

  const [unassignedView, setUnassignedView] = useState<UnassignedViewMode>('daily')
  const [taskScopeFilter, setTaskScopeFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | TaskType>('all')
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | TrackTaskStatus>('all')
  const [selectedTask, setSelectedTask] = useState<TrackTask | null>(null)
  const [reassignTarget, setReassignTarget] = useState<TrackTask | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [deferTarget, setDeferTarget] = useState<TrackTask | null>(null)
  const [manageStaffId, setManageStaffId] = useState<string | null>(null)

  const track = plannerTracks.find((t) => t.id === trackId) ?? plannerTracks[0]
  const allTrackTasks = trackTasks.filter((t) => t.trackId === trackId)
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
      if (t.status === 'completed') s.completed++; else if (t.status === 'in-progress') s.inProgress++
      else if (t.status === 'overdue') s.overdue++; else if (t.status === 'pending') s.pending++
    }
    return map
  }, [allTrackTasks])

  const unassignedTasks = allTrackTasks.filter((t) => t.status === 'unassigned')
  const assignedTasks = allTrackTasks.filter((t) => t.status !== 'unassigned')
  const scopeFilteredTasks = useMemo(() => {
    let filtered = allTrackTasks
    if (taskScopeFilter === 'unassigned') filtered = unassignedTasks
    else if (taskScopeFilter === 'assigned') filtered = assignedTasks
    if (taskTypeFilter !== 'all') filtered = filtered.filter((t) => t.type === taskTypeFilter)
    if (taskStatusFilter !== 'all') filtered = filtered.filter((t) => t.status === taskStatusFilter)
    return filtered
  }, [taskScopeFilter, taskTypeFilter, taskStatusFilter, allTrackTasks, unassignedTasks, assignedTasks])
  const issueRate = track.operator && track.operator.issueTotal > 0 ? Math.round((track.operator.issueResolved / track.operator.issueTotal) * 100) : 0

  const unassignedViewCls = (active: boolean) => `rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'}`
  const toggleTaskSelection = useCallback((id: string) => { setSelectedTaskIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next }) }, [])

  const handleTaskClick = useCallback((task: TrackTask) => { setSelectedTask(task) }, [])
  const handleAssignToday = useCallback((taskId: string) => { moveTaskToToday(taskId) }, [moveTaskToToday])
  const handleDefer = useCallback((task: TrackTask) => { setDeferTarget(task) }, [])
  const handleDeferConfirm = useCallback((taskId: string, newStart: string, newEnd?: string) => {
    deferTask(taskId, newStart, newEnd)
  }, [deferTask])
  const handleMoveToDate = useCallback((taskId: string, newDate: string) => { moveTaskToDate(taskId, newDate) }, [moveTaskToDate])

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-2.5 text-sm">
          <Link href="/" className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <span className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-semibold" style={{ backgroundColor: `${track.color}15`, color: track.color }}>{track.name}</span>
          <span className="text-[11px] text-muted-foreground">{track.period}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{track.staffCount}</span>
            <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{track.studentCount}</span>
          </div>
          <span className="text-[13px] text-muted-foreground">이운영 <span className="text-foreground/40">{ROLE_LABELS.operator}</span></span>
        </div>
      </header>

      <main className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {/* Key Metrics */}
        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{`${ROLE_LABELS.learning_manager} 업무완료율`}</span><span className="text-lg font-bold tabular-nums text-foreground">{track.completionRate}%</span></div>
            <ProgressBar value={track.completionRate} className="mt-2" />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">이슈 처리율</span><span className="text-lg font-bold tabular-nums text-foreground">{issueRate}%<span className="ml-1 text-xs font-normal text-muted-foreground">({track.issueSummary.done}/{track.issueSummary.total})</span></span></div>
            <ProgressBar value={issueRate} className="mt-2" />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">내 업무완료율</span><span className="text-lg font-bold tabular-nums text-foreground">{track.operator?.taskCompletionRate ?? 0}%</span></div>
            <ProgressBar value={track.operator?.taskCompletionRate ?? 0} className="mt-2" />
          </div>
        </section>

        {/* Track Schedule Calendar */}
        <TrackScheduleCalendar trackId={trackId} schedules={trackSchedulesForTrack} onAddSchedule={addTrackSchedule} onUpdateSchedule={updateTrackSchedule} onRemoveSchedule={removeTrackSchedule} />

        {/* Staff Cards */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            {ROLE_LABELS_FULL.learning_manager} 현황 <span className="font-normal text-muted-foreground">{staffList.length}명</span>
            {allTrackTasks.filter((t) => t.status === 'overdue').length > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">기한초과 {allTrackTasks.filter((t) => t.status === 'overdue').length}</span>
            )}
          </h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {staffList.map((staff, staffIdx) => {
              const stats = staffTaskStats.get(staff.id) ?? { completed: 0, inProgress: 0, overdue: 0, pending: 0, total: 0 }
              const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
              const vacation = staffVacationMap.get(staff.id)
              const sc = STAFF_COLORS[staffIdx % STAFF_COLORS.length]
              return (
                <div key={staff.id} className={`rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm ${stats.overdue > 0 ? 'border-destructive/30' : 'border-border'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sc }} />
                      {staff.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setManageStaffId(staff.id)}
                        className="rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                        휴가관리
                      </button>
                      {vacation && <span className="flex items-center gap-0.5 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-foreground/60"><CalendarOff className="h-2.5 w-2.5" />{vacation.start.slice(5)} ~ {vacation.end.slice(5)}</span>}
                      {stats.overdue > 0 && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                  </div>
                  <div className="mt-2.5"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">완료율</span><span className="font-medium tabular-nums text-foreground">{rate}%</span></div><ProgressBar value={rate} className="mt-1.5" /></div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                    <div className="rounded-lg bg-foreground/[0.04] py-1.5"><p className="text-sm font-bold tabular-nums text-foreground">{stats.completed}</p><p className="text-[10px] text-muted-foreground">완료</p></div>
                    <div className="rounded-lg bg-foreground/[0.04] py-1.5"><p className="text-sm font-bold tabular-nums text-foreground">{stats.inProgress}</p><p className="text-[10px] text-muted-foreground">진행</p></div>
                    <div className="rounded-lg bg-foreground/[0.04] py-1.5"><p className="text-sm font-bold tabular-nums text-foreground">{stats.pending}</p><p className="text-[10px] text-muted-foreground">대기</p></div>
                    <div className={`rounded-lg py-1.5 ${stats.overdue > 0 ? 'bg-destructive/10' : 'bg-foreground/[0.04]'}`}><p className={`text-sm font-bold tabular-nums ${stats.overdue > 0 ? 'text-destructive' : 'text-foreground'}`}>{stats.overdue}</p><p className="text-[10px] text-muted-foreground">초과</p></div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {staff.unreadMessages > 0 && <span className="flex items-center gap-1 text-[10px] text-foreground/60"><MessageSquare className="h-3 w-3" />{staff.unreadMessages}</span>}
                    <Link href={`/?staffId=${staff.id}`} className="ml-auto flex items-center gap-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">상세<ChevronRight className="h-3 w-3" /></Link>
                  </div>
                  {/* 개인 공지 제거 — 전체 공지 섹션의 토글로 통합 */}
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══ Task 뷰 (4 view modes — all tasks: assigned + unassigned) ═══ */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <ClipboardList className="h-[18px] w-[18px]" />Task 현황
              <span className="font-normal text-muted-foreground">오늘 {allTrackTasks.filter((t) => t.scheduledDate === TODAY_STR).length}건</span>
              {unassignedTasks.length > 0 && (
                <span className="ml-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-medium text-foreground/60">미배정 {unassignedTasks.length}</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowNewTask(true)} className="flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-[11px] font-medium text-background">
                <Plus className="h-3 w-3" />새 Task
              </button>
              {selectedTaskIds.size > 0 && (
                <button type="button" onClick={() => setShowBulkAssign(true)} className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-foreground">
                  일괄 배정 ({selectedTaskIds.size})
                </button>
              )}
              <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
                <button type="button" onClick={() => setTaskScopeFilter('all')} className={unassignedViewCls(taskScopeFilter === 'all')}>전체</button>
                <button type="button" onClick={() => setTaskScopeFilter('assigned')} className={unassignedViewCls(taskScopeFilter === 'assigned')}>배정</button>
                <button type="button" onClick={() => setTaskScopeFilter('unassigned')} className={unassignedViewCls(taskScopeFilter === 'unassigned')}>미배정</button>
              </div>
              <select value={taskTypeFilter} onChange={(e) => setTaskTypeFilter(e.target.value as 'all' | TaskType)}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] font-medium text-foreground focus:outline-none">
                <option value="all">유형: 전체</option>
                <option value="daily">일일</option>
                <option value="milestone">마일스톤</option>
                <option value="manual">수동</option>
              </select>
              <select value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value as 'all' | TrackTaskStatus)}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] font-medium text-foreground focus:outline-none">
                <option value="all">상태: 전체</option>
                <option value="pending">대기</option>
                <option value="in-progress">진행중</option>
                <option value="completed">완료</option>
                <option value="overdue">기한초과</option>
                <option value="unassigned">미배정</option>
              </select>
              <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
                <button type="button" onClick={() => setUnassignedView('daily')} className={unassignedViewCls(unassignedView === 'daily')}>일별</button>
                <button type="button" onClick={() => setUnassignedView('weekly')} className={unassignedViewCls(unassignedView === 'weekly')}>주간</button>
                <button type="button" onClick={() => setUnassignedView('chapter')} className={unassignedViewCls(unassignedView === 'chapter')}>챕터별</button>
                <button type="button" onClick={() => setUnassignedView('monthly')} className={unassignedViewCls(unassignedView === 'monthly')}>월별</button>
              </div>
            </div>
          </div>

          {unassignedView === 'daily' && (
            <DailyView tasks={scopeFilteredTasks} staffList={staffList} onAssignToday={handleAssignToday} onDefer={handleDefer} onTaskClick={handleTaskClick} selectedTaskIds={selectedTaskIds} onToggleSelect={toggleTaskSelection} />
          )}
          {unassignedView === 'weekly' && (
            <UnassignedWeeklyView tasks={scopeFilteredTasks} staffList={staffList} onMoveToDate={handleMoveToDate} onAssignToday={handleAssignToday} onDefer={handleDefer} onTaskClick={handleTaskClick} selectedTaskIds={selectedTaskIds} onToggleSelect={toggleTaskSelection} />
          )}
          {unassignedView === 'chapter' && (
            <ChapterView tasks={scopeFilteredTasks} trackId={trackId} staffList={staffList} onMoveToDate={handleMoveToDate} onAssignToday={handleAssignToday} onDefer={handleDefer} onTaskClick={handleTaskClick} selectedTaskIds={selectedTaskIds} onToggleSelect={toggleTaskSelection} />
          )}
          {unassignedView === 'monthly' && (
            <UnassignedMonthlyView tasks={scopeFilteredTasks} staffList={staffList} onMoveToDate={handleMoveToDate} onAssignToday={handleAssignToday} onDefer={handleDefer} onTaskClick={handleTaskClick} selectedTaskIds={selectedTaskIds} onToggleSelect={toggleTaskSelection} />
          )}
        </section>

        {/* ═══ 공지 ═══ */}
        <TrackNoticeSection trackId={trackId} notices={trackNoticesForTrack} staffList={staffList} onAdd={addTrackNotice} onReply={addTrackNoticeReply} onExtend={extendTrackNotice} onRemove={removeTrackNotice} />

      </main>

      {/* Task detail modal */}
      {selectedTask && (() => {
        const liveTask = trackTasks.find((t) => t.id === selectedTask.id) ?? selectedTask
        return (
          <TaskDetailModal
            task={liveTask}
            staffList={staffList}
            onClose={() => setSelectedTask(null)}
            onComplete={(tid) => updateTrackTaskStatus(tid, 'completed')}
            onReassign={(t) => setReassignTarget(t)}
            onDefer={(t) => setDeferTarget(t)}
          />
        )
      })()}

      {/* Reassign modal */}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={() => setReassignTarget(null)}>
          <ReassignModalInline task={reassignTarget} staffList={staffList} onReassign={(tid, sid, sn, nd) => { reassignTask(tid, sid, sn, nd); setReassignTarget(null) }} onClose={() => setReassignTarget(null)} />
        </div>
      )}

      {/* Bulk assign modal */}
      {showBulkAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={() => setShowBulkAssign(false)}>
          <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <BulkAssignContent taskCount={selectedTaskIds.size} staffList={staffList} onAssign={(sid, sn) => { bulkAssignTasks([...selectedTaskIds], sid, sn); setSelectedTaskIds(new Set()); setShowBulkAssign(false) }} onClose={() => setShowBulkAssign(false)} />
          </div>
        </div>
      )}

      {/* New task modal */}
      {showNewTask && <NewTaskModal trackId={trackId} staffList={staffList} onAdd={addTrackTask} onClose={() => setShowNewTask(false)} />}

      {/* Defer modal */}
      {deferTarget && <DeferModal task={deferTarget} onDefer={handleDeferConfirm} onClose={() => setDeferTarget(null)} />}

      {/* Staff manage modal */}
      {manageStaffId && (() => {
        const sc = staffCards.find((s) => s.id === manageStaffId)
        if (!sc) return null
        const tasks = allTrackTasks.filter((t) => t.assigneeId === manageStaffId)
        const others = staffList.filter((s) => s.id !== manageStaffId)
        return (
          <StaffManageModal
            staffCard={sc}
            staffTasks={tasks}
            otherStaff={others}
            trackPeriod={(() => {
              const parts = track.period.split(' ~ ')
              return { start: new Date(parts[0].replace(/\./g, '-')), end: new Date(parts[1].replace(/\./g, '-')) }
            })()}
            onClose={() => setManageStaffId(null)}
            onSetVacation={(v) => setStaffVacation(manageStaffId, v)}
            onRemoveVacation={(vid) => removeStaffVacation(manageStaffId, vid)}
            onUpdateSchedule={(schedule) => updateStaffWorkSchedule(manageStaffId, schedule)}
            onUpdateMemo={(memo) => updateStaffMemo(manageStaffId, memo)}
          />
        )
      })()}
    </div>
  )
}

function ReassignModalInline({ task, staffList, onReassign, onClose }: { task: TrackTask; staffList: { id: string; name: string }[]; onReassign: (taskId: string, staffId: string, staffName: string, newDate?: string) => void; onClose: () => void }) {
  const [selectedStaff, setSelectedStaff] = useState(''); const [newDate, setNewDate] = useState(task.scheduledDate)
  return (
    <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-[15px] font-semibold text-foreground">Task 재배정</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">{task.title}</p>
      <div className="mt-4 space-y-3">
        <div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">{`배정할 ${ROLE_LABELS.learning_manager}`}</label><select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none"><option value="">선택</option>{staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">새 예정일</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" /></div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">취소</button>
        <button type="button" disabled={!selectedStaff} onClick={() => { const s = staffList.find((st) => st.id === selectedStaff); if (s) onReassign(task.id, s.id, s.name, newDate) }} className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30">재배정</button>
      </div>
    </div>
  )
}

function BulkAssignContent({ taskCount, staffList, onAssign, onClose }: { taskCount: number; staffList: { id: string; name: string }[]; onAssign: (staffId: string, staffName: string) => void; onClose: () => void }) {
  const [selectedStaff, setSelectedStaff] = useState('')
  return (
    <>
      <h3 className="text-[15px] font-semibold text-foreground">일괄 배정</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">{taskCount}건의 Task를 배정합니다</p>
      <div className="mt-4"><label className="mb-1 block text-[11px] font-medium text-muted-foreground">{`배정할 ${ROLE_LABELS.learning_manager}`}</label><select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none"><option value="">선택</option>{staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">취소</button>
        <button type="button" disabled={!selectedStaff} onClick={() => { const s = staffList.find((st) => st.id === selectedStaff); if (s) onAssign(s.id, s.name) }} className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30">일괄 배정</button>
      </div>
    </>
  )
}
