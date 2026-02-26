'use client'

import { useState, useMemo } from 'react'
import type { TrackSchedule } from '@/lib/admin-mock-data'
import { useAdminStore } from '@/lib/admin-store'
import { ChevronRight, ChevronLeft, Calendar, Plus, X } from 'lucide-react'
import { TODAY_STR, DAY_NAMES, fmtDate, getWeekDates, getMonthDates } from './track-utils'

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

function AddScheduleModal({ trackId, onAdd, onClose }: { trackId: string; onAdd: (schedule: TrackSchedule) => void; onClose: () => void }) {
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
            <div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">시작일</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" /></div>
            <div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">종료일</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" /></div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none">
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
          <button type="button" disabled={!title.trim()} onClick={() => { onAdd({ id: `sch-new-${Date.now()}`, trackId, title: title.trim(), startDate, endDate: endDate < startDate ? startDate : endDate, source: 'operator', category, description: description.trim() || undefined }); onClose() }}
            className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30">추가</button>
        </div>
      </div>
    </div>
  )
}

function EditScheduleModal({ schedule, onUpdate, onRemove, onClose }: { schedule: TrackSchedule; onUpdate: (id: string, updates: Partial<Omit<TrackSchedule, 'id' | 'source'>>) => void; onRemove: (id: string) => void; onClose: () => void }) {
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
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${isSystem ? 'bg-secondary text-muted-foreground' : 'bg-foreground/[0.06] text-foreground/70'}`}>{isSystem ? '시스템' : '직접 추가'}</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">일정 제목</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSystem} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-60" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">시작일</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isSystem} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-60" /></div>
            <div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">종료일</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isSystem} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-60" /></div>
          </div>
          <div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">카테고리</label><select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} disabled={isSystem} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-60"><option value="강의">강의</option><option value="프로젝트">프로젝트</option><option value="평가">평가</option><option value="행사">행사</option><option value="기타">기타</option></select></div>
          <div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">설명</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSystem} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-60" /></div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          {!isSystem ? (<button type="button" onClick={() => { onRemove(schedule.id); onClose() }} className="rounded-lg px-3 py-1.5 text-[12px] text-destructive hover:bg-destructive/10">삭제</button>) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">{isSystem ? '닫기' : '취소'}</button>
            {!isSystem && (<button type="button" disabled={!title.trim()} onClick={() => { onUpdate(schedule.id, { title: title.trim(), startDate, endDate: endDate < startDate ? startDate : endDate, category, description: description.trim() || undefined }); onClose() }} className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] text-background transition-colors disabled:opacity-30">저장</button>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleWeeklyView({ schedules, onScheduleClick }: { schedules: TrackSchedule[]; onScheduleClick: (s: TrackSchedule) => void }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const baseDate = useMemo(() => { const d = new Date(TODAY_STR); d.setDate(d.getDate() + weekOffset * 7); return d }, [weekOffset])
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate])
  const weekStart = fmtDate(weekDates[0])
  const weekEnd = fmtDate(weekDates[6])

  const { systemSchedules, operatorSchedules } = useMemo(() => {
    const visible = schedules.filter((s) => s.endDate >= weekStart && s.startDate <= weekEnd).sort((a, b) => a.startDate.localeCompare(b.startDate))
    return { systemSchedules: visible.filter((s) => s.source === 'system'), operatorSchedules: visible.filter((s) => s.source === 'operator') }
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
            return (<div key={i} className={`px-2 py-1.5 text-center text-[11px] font-medium ${isToday ? 'bg-foreground/[0.04] text-foreground' : 'text-muted-foreground'}`}><div>{DAY_NAMES[i]}</div><div className={`mt-0.5 tabular-nums ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background' : ''}`}>{d.getDate()}</div></div>)
          })}
        </div>
        <div className="relative min-h-[60px]">
          {systemSchedules.length === 0 && operatorSchedules.length === 0 ? (
            <div className="py-4 text-center text-[11px] text-muted-foreground">이번 주 일정이 없습니다</div>
          ) : (<>
            {systemSchedules.length > 0 && (<div className="space-y-1 p-2">{systemSchedules.map((s) => { const startIdx = weekDates.findIndex((d) => fmtDate(d) === (s.startDate < weekStart ? weekStart : s.startDate)); const endIdx = weekDates.findIndex((d) => fmtDate(d) === (s.endDate > weekEnd ? weekEnd : s.endDate)); if (startIdx < 0 || endIdx < 0) return null; return (<div key={s.id} className="grid grid-cols-7" title={s.description ?? s.title}><button type="button" onClick={() => onScheduleClick(s)} className="flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-2 py-1 text-left transition-colors hover:bg-secondary/80" style={{ gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}` }}><ScheduleCategoryBadge category={s.category} /><span className="truncate text-[10px] font-medium text-foreground">{s.title}</span></button></div>) })}</div>)}
            {systemSchedules.length > 0 && operatorSchedules.length > 0 && <div className="border-t border-dashed border-foreground/10" />}
            {operatorSchedules.length > 0 && (<div className="space-y-1 p-2">{operatorSchedules.map((s) => { const startIdx = weekDates.findIndex((d) => fmtDate(d) === (s.startDate < weekStart ? weekStart : s.startDate)); const endIdx = weekDates.findIndex((d) => fmtDate(d) === (s.endDate > weekEnd ? weekEnd : s.endDate)); if (startIdx < 0 || endIdx < 0) return null; return (<div key={s.id} className="grid grid-cols-7" title={s.description ?? s.title}><button type="button" onClick={() => onScheduleClick(s)} className="flex items-center gap-1 rounded-md border border-dashed border-foreground/15 bg-foreground/[0.03] px-2 py-1 text-left transition-colors hover:bg-foreground/[0.06]" style={{ gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}` }}><ScheduleCategoryBadge category={s.category} /><span className="truncate text-[10px] font-medium text-foreground/70">{s.title}</span></button></div>) })}</div>)}
          </>)}
        </div>
      </div>
    </div>
  )
}

function ScheduleChapterView({ schedules, trackId, onScheduleClick }: { schedules: TrackSchedule[]; trackId: string; onScheduleClick: (s: TrackSchedule) => void }) {
  const storeChapters = useAdminStore((s) => s.chapters)
  const chapters = useMemo(() => storeChapters.filter((c) => c.trackId === trackId), [storeChapters, trackId])
  const [chapterIdx, setChapterIdx] = useState(() => { const idx = chapters.findIndex((c) => c.startDate <= TODAY_STR && c.endDate >= TODAY_STR); return idx >= 0 ? idx : 0 })
  const chapter = chapters[chapterIdx] ?? chapters[0]

  const { chapterSystemSchedules, chapterOperatorSchedules } = useMemo(() => {
    if (!chapter) return { chapterSystemSchedules: [], chapterOperatorSchedules: [] }
    const visible = schedules.filter((s) => s.endDate >= chapter.startDate && s.startDate <= chapter.endDate).sort((a, b) => a.startDate.localeCompare(b.startDate))
    return { chapterSystemSchedules: visible.filter((s) => s.source === 'system'), chapterOperatorSchedules: visible.filter((s) => s.source === 'operator') }
  }, [schedules, chapter])

  const chapterDates = useMemo(() => {
    if (!chapter) return []
    const dates: Date[] = []; const cur = new Date(chapter.startDate); const end = new Date(chapter.endDate)
    while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
    return dates
  }, [chapter])

  if (!chapter) return <div className="py-4 text-center text-[11px] text-muted-foreground">챕터 정보가 없습니다</div>

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <button type="button" onClick={() => setChapterIdx((i) => Math.max(0, i - 1))} disabled={chapterIdx === 0} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{chapter.name}</span>
        <span className="text-[11px] text-muted-foreground">{chapter.startDate.slice(5)} ~ {chapter.endDate.slice(5)}</span>
        <button type="button" onClick={() => setChapterIdx((i) => Math.min(chapters.length - 1, i + 1))} disabled={chapterIdx === chapters.length - 1} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid border-b border-border bg-secondary/40" style={{ gridTemplateColumns: `repeat(${chapterDates.length}, 1fr)` }}>
          {chapterDates.map((d, i) => {
            const isToday = fmtDate(d) === TODAY_STR; const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
            return (<div key={i} className={`px-1 py-1 text-center text-[10px] font-medium ${isToday ? 'bg-foreground/[0.04] text-foreground' : 'text-muted-foreground'}`}><div>{dayOfWeek}</div><div className={`tabular-nums ${isToday ? 'inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] text-background' : ''}`}>{d.getDate()}</div></div>)
          })}
        </div>
        <div className="relative min-h-[50px]">
          {chapterSystemSchedules.length === 0 && chapterOperatorSchedules.length === 0 ? (
            <div className="py-3 text-center text-[11px] text-muted-foreground">이 챕터 기간에 일정이 없습니다</div>
          ) : (<>
            {chapterSystemSchedules.length > 0 && (<div className="space-y-0.5 p-1.5">{chapterSystemSchedules.map((s) => { const startIdx = chapterDates.findIndex((d) => fmtDate(d) === (s.startDate < chapter.startDate ? chapter.startDate : s.startDate)); const endIdx = chapterDates.findIndex((d) => fmtDate(d) === (s.endDate > chapter.endDate ? chapter.endDate : s.endDate)); if (startIdx < 0 || endIdx < 0) return null; return (<div key={s.id} className="grid" style={{ gridTemplateColumns: `repeat(${chapterDates.length}, 1fr)` }} title={s.description ?? s.title}><button type="button" onClick={() => onScheduleClick(s)} className="flex items-center gap-0.5 rounded border border-border bg-secondary/50 px-1.5 py-0.5 text-left transition-colors hover:bg-secondary/80" style={{ gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}` }}><ScheduleCategoryBadge category={s.category} /><span className="truncate text-[9px] font-medium text-foreground">{s.title}</span></button></div>) })}</div>)}
            {chapterSystemSchedules.length > 0 && chapterOperatorSchedules.length > 0 && <div className="border-t border-dashed border-foreground/10" />}
            {chapterOperatorSchedules.length > 0 && (<div className="space-y-0.5 p-1.5">{chapterOperatorSchedules.map((s) => { const startIdx = chapterDates.findIndex((d) => fmtDate(d) === (s.startDate < chapter.startDate ? chapter.startDate : s.startDate)); const endIdx = chapterDates.findIndex((d) => fmtDate(d) === (s.endDate > chapter.endDate ? chapter.endDate : s.endDate)); if (startIdx < 0 || endIdx < 0) return null; return (<div key={s.id} className="grid" style={{ gridTemplateColumns: `repeat(${chapterDates.length}, 1fr)` }} title={s.description ?? s.title}><button type="button" onClick={() => onScheduleClick(s)} className="flex items-center gap-0.5 rounded border border-dashed border-foreground/15 bg-foreground/[0.03] px-1.5 py-0.5 text-left transition-colors hover:bg-foreground/[0.06]" style={{ gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}` }}><ScheduleCategoryBadge category={s.category} /><span className="truncate text-[9px] font-medium text-foreground/70">{s.title}</span></button></div>) })}</div>)}
          </>)}
        </div>
      </div>
    </div>
  )
}

function ScheduleMonthlyView({ schedules, onScheduleClick }: { schedules: TrackSchedule[]; onScheduleClick: (s: TrackSchedule) => void }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const { year, month } = useMemo(() => { const base = new Date(TODAY_STR); base.setMonth(base.getMonth() + monthOffset); return { year: base.getFullYear(), month: base.getMonth() } }, [monthOffset])
  const monthDates = useMemo(() => getMonthDates(year, month), [year, month])

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, TrackSchedule[]>()
    for (const d of monthDates) { const ds = fmtDate(d); if (!map.has(ds)) map.set(ds, []) }
    for (const s of schedules) { const cur = new Date(s.startDate); const end = new Date(s.endDate); while (cur <= end) { const ds = fmtDate(cur); if (map.has(ds)) map.get(ds)!.push(s); cur.setDate(cur.getDate() + 1) } }
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
        <div className="grid grid-cols-7 border-b border-border bg-secondary/40">{DAY_NAMES.map((d) => <div key={d} className="px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground">{d}</div>)}</div>
        <div className="grid grid-cols-7">
          {monthDates.map((d, i) => {
            const dateStr = fmtDate(d); const isCurrentMonth = d.getMonth() === month; const isToday = dateStr === TODAY_STR
            const daySchedules = (schedulesByDate.get(dateStr) ?? []).filter(() => isCurrentMonth)
            const uniqueSchedules = daySchedules.filter((s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx)
            const daySys = uniqueSchedules.filter((s) => s.source === 'system'); const dayOp = uniqueSchedules.filter((s) => s.source === 'operator')
            const maxShow = 2
            return (
              <div key={i} className={`min-h-[64px] border-b border-r border-border p-1 ${!isCurrentMonth ? 'bg-secondary/20' : ''}`}>
                <div className={`mb-0.5 text-[10px] tabular-nums ${isToday ? 'inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] text-background' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}`}>{d.getDate()}</div>
                {daySys.slice(0, maxShow).map((s) => (<button key={s.id} type="button" onClick={() => onScheduleClick(s)} className="mb-0.5 block w-full truncate rounded bg-secondary/60 px-1 py-0.5 text-left text-[8px] font-medium text-foreground transition-colors hover:bg-secondary" title={s.title}>{s.title}</button>))}
                {daySys.length > 0 && dayOp.length > 0 && <div className="my-0.5 border-t border-dashed border-foreground/8" />}
                {dayOp.slice(0, Math.max(0, maxShow - daySys.length)).map((s) => (<button key={s.id} type="button" onClick={() => onScheduleClick(s)} className="mb-0.5 block w-full truncate rounded bg-foreground/[0.03] px-1 py-0.5 text-left text-[8px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.06]" title={s.title}>{s.title}</button>))}
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

export function TrackScheduleCalendar({ trackId, schedules, onAddSchedule, onUpdateSchedule, onRemoveSchedule }: {
  trackId: string; schedules: TrackSchedule[]
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
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm border border-border bg-secondary/50" />시스템 {systemCount}</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm border border-dashed border-foreground/15 bg-foreground/[0.03]" />직접 추가 {operatorCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowAddModal(true)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary"><Plus className="h-3 w-3" />일정 추가</button>
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
    </div>
  )
}
