'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { TrackTask, TrackTaskStatus, TaskType } from '@/lib/admin-mock-data'
import { useAdminStore } from '@/lib/admin-store'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Clock, UserX, ChevronRight, ChevronLeft, Layers, Plus, Search, ChevronDown } from 'lucide-react'
import { STAFF_COLORS, TODAY_STR, DAY_NAMES, fmtDate, getWeekDates, getMonthDates, addDays, getStaffColor, type UnassignedViewMode } from './track-utils'
import { TaskCard, StatusBadge } from './track-task-card'

function DailyView({ tasks, staffList, onAssignToday, onDefer, onTaskClick, selectedTaskIds, onToggleSelect }: {
  tasks: TrackTask[]; staffList: { id: string; name: string }[]
  onAssignToday: (taskId: string) => void; onDefer: (task: TrackTask) => void; onTaskClick: (task: TrackTask) => void
  selectedTaskIds: Set<string>; onToggleSelect: (id: string) => void
}) {
  const [dateOffset, setDateOffset] = useState(0)
  const currentDate = useMemo(() => addDays(TODAY_STR, dateOffset), [dateOffset])
  const isToday = currentDate === TODAY_STR
  const dayTasks = useMemo(() => tasks.filter((t) => t.scheduledDate === currentDate), [tasks, currentDate])
  const dailyTasks = useMemo(() => dayTasks.filter((t) => t.type === 'daily' || t.type === 'manual').sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '')), [dayTasks])
  const milestoneTasks = useMemo(() => tasks.filter((t) => { if (t.type !== 'milestone') return false; return currentDate >= t.scheduledDate && currentDate <= (t.endDate ?? t.scheduledDate) }).sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '')), [tasks, currentDate])
  const hours = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 9), [])
  const tasksByHourAndStaff = useMemo(() => {
    const map = new Map<number, Map<string, TrackTask[]>>()
    for (const h of hours) map.set(h, new Map())
    for (const t of dailyTasks) { const h = t.scheduledTime ? parseInt(t.scheduledTime.split(':')[0], 10) : 9; const hourMap = map.get(h) ?? map.get(9)!; const key = t.assigneeId ?? '_unassigned'; if (!hourMap.has(key)) hourMap.set(key, []); hourMap.get(key)!.push(t) }
    return map
  }, [dailyTasks, hours])
  const dateLabel = useMemo(() => { const d = new Date(currentDate); const dayNames = ['일', '월', '화', '수', '목', '금', '토']; return `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]})` }, [currentDate])
  const unassignedCount = dayTasks.filter((t) => t.status === 'unassigned').length
  const assignedCount = dayTasks.filter((t) => t.status !== 'unassigned').length

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setDateOffset((o) => o - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{dateLabel} {isToday && <span className="ml-1 text-[11px] text-muted-foreground">(오늘)</span>}</span>
        <button type="button" onClick={() => setDateOffset((o) => o + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        {dateOffset !== 0 && <button type="button" onClick={() => setDateOffset(0)} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary">오늘</button>}
        <div className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">배정 <span className="font-medium text-foreground">{assignedCount}</span></span>
          <span className="text-foreground/30">|</span>
          <span className="text-muted-foreground">미배정 <span className="font-medium text-foreground">{unassignedCount}</span></span>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {staffList.map((s, i) => (<div key={s.id} className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STAFF_COLORS[i % STAFF_COLORS.length] }} /><span>{s.name}</span></div>))}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="inline-block h-2 w-2 rounded-full border border-dashed border-foreground/30 bg-foreground/[0.03]" /><span>미배정</span></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-2.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" /><h3 className="text-[12px] font-semibold text-foreground">시간대별 Task</h3><span className="text-[11px] text-muted-foreground">{dailyTasks.length}건</span></div>
          <div className="max-h-[500px] overflow-y-auto">
            {hours.map((hour) => { const hourStaffMap = tasksByHourAndStaff.get(hour) ?? new Map(); const staffKeys = Array.from(hourStaffMap.keys()); const hasMultipleStaff = staffKeys.length > 1; return (
              <div key={hour} className="relative border-b border-border/50 last:border-b-0"><div className="flex"><div className="flex w-12 shrink-0 items-start justify-end border-r border-border/50 px-2 py-2"><span className="text-[11px] tabular-nums text-muted-foreground">{hour}:00</span></div><div className="min-h-[56px] flex-1 p-1.5">
                {staffKeys.length === 0 ? (<div className="h-full" />) : hasMultipleStaff ? (
                  <div className="flex gap-1.5">{staffKeys.map((key) => { const sTasks = hourStaffMap.get(key)!; const sc = key === '_unassigned' ? undefined : getStaffColor(staffList, key); const staffName = key === '_unassigned' ? '미배정' : staffList.find((s) => s.id === key)?.name; return (<div key={key} className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-1">{key === '_unassigned' ? <span className="inline-block h-1.5 w-1.5 rounded-full border border-dashed border-foreground/30 bg-foreground/[0.03]" /> : <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sc ?? '#94a3b8' }} />}<span className="truncate text-[9px] text-muted-foreground">{staffName}</span></div><div className="space-y-1">{sTasks.map((t) => (<TaskCard key={t.id} task={t} staffColor={sc ?? null} onAssignToday={onAssignToday} onDefer={onDefer} onClick={onTaskClick} compact selected={selectedTaskIds.has(t.id)} onToggleSelect={onToggleSelect} />))}</div></div>) })}</div>
                ) : (<div className="space-y-1">{staffKeys.flatMap((key) => hourStaffMap.get(key)!).map((t) => (<TaskCard key={t.id} task={t} staffColor={getStaffColor(staffList, t.assigneeId)} onAssignToday={onAssignToday} onDefer={onDefer} onClick={onTaskClick} compact selected={selectedTaskIds.has(t.id)} onToggleSelect={onToggleSelect} />))}</div>)}
              </div></div></div>) })}
            {dailyTasks.length === 0 && (<div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Clock className="mb-2 h-6 w-6" /><p className="text-[12px]">시간대별 Task 없음</p></div>)}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-2.5"><Layers className="h-3.5 w-3.5 text-muted-foreground" /><h3 className="text-[12px] font-semibold text-foreground">기간 Task</h3><span className="text-[11px] text-muted-foreground">{milestoneTasks.length}건</span></div>
          <div className="max-h-[500px] overflow-y-auto p-3">
            {milestoneTasks.length === 0 ? (<div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Layers className="mb-2 h-6 w-6" /><p className="text-[12px]">기간 Task 없음</p></div>) : (<div className="space-y-2">{milestoneTasks.map((t) => (<TaskCard key={t.id} task={t} staffColor={getStaffColor(staffList, t.assigneeId)} onAssignToday={onAssignToday} onDefer={onDefer} onClick={onTaskClick} selected={selectedTaskIds.has(t.id)} onToggleSelect={onToggleSelect} />))}</div>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function WeeklyView({ tasks, staffList, onMoveToDate, onAssignToday, onDefer, onTaskClick, selectedTaskIds, onToggleSelect }: {
  tasks: TrackTask[]; staffList: { id: string; name: string }[]
  onMoveToDate: (taskId: string, newDate: string) => void; onAssignToday: (taskId: string) => void; onDefer: (task: TrackTask) => void; onTaskClick: (task: TrackTask) => void
  selectedTaskIds: Set<string>; onToggleSelect: (id: string) => void
}) {
  const [weekOffset, setWeekOffset] = useState(0)
  const baseDate = useMemo(() => { const d = new Date(TODAY_STR); d.setDate(d.getDate() + weekOffset * 7); return d }, [weekOffset])
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate])
  const allStaffKeys = useMemo(() => [...staffList.map((s) => s.id), '_unassigned'], [staffList])
  const staffNameMap = useMemo(() => { const map = new Map<string, string>(); for (const s of staffList) map.set(s.id, s.name); map.set('_unassigned', '미배정'); return map }, [staffList])

  const spanTasks = useMemo(() => {
    const result: { task: TrackTask; startCol: number; spanCols: number }[] = []; const weekStart = fmtDate(weekDates[0]); const weekEnd = fmtDate(weekDates[6])
    for (const t of tasks) { if (!t.endDate || t.endDate === t.scheduledDate) continue; if (t.endDate < weekStart || t.scheduledDate > weekEnd) continue; const effStart = t.scheduledDate < weekStart ? weekStart : t.scheduledDate; const effEnd = t.endDate > weekEnd ? weekEnd : t.endDate; const startIdx = weekDates.findIndex((d) => fmtDate(d) === effStart); const endIdx = weekDates.findIndex((d) => fmtDate(d) === effEnd); if (startIdx >= 0 && endIdx >= 0) result.push({ task: t, startCol: startIdx, spanCols: endIdx - startIdx + 1 }) }
    return result
  }, [tasks, weekDates])

  const tasksByDateAndStaff = useMemo(() => {
    const map = new Map<string, Map<string, TrackTask[]>>()
    for (const date of weekDates) { const dateStr = fmtDate(date); const staffMap = new Map<string, TrackTask[]>(); for (const t of tasks) { if (t.scheduledDate !== dateStr) continue; if (t.endDate && t.endDate !== t.scheduledDate) continue; const key = t.assigneeId ?? '_unassigned'; if (!staffMap.has(key)) staffMap.set(key, []); staffMap.get(key)!.push(t) }; map.set(dateStr, staffMap) }
    return map
  }, [tasks, weekDates])

  const handleDragEnd = useCallback((result: DropResult) => { if (!result.destination) return; onMoveToDate(result.draggableId, result.destination.droppableId.split('_').pop()!) }, [onMoveToDate])

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setWeekOffset((o) => o - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{weekDates[0].getMonth() + 1}/{weekDates[0].getDate()} ~ {weekDates[6].getMonth() + 1}/{weekDates[6].getDate()}</span>
        <button type="button" onClick={() => setWeekOffset((o) => o + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        {weekOffset !== 0 && <button type="button" onClick={() => setWeekOffset(0)} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary">이번 주</button>}
      </div>
      {spanTasks.length > 0 && (
        <div className="relative mb-2 grid grid-cols-[80px_repeat(7,1fr)] gap-1"><div />{spanTasks.map(({ task: t, startCol, spanCols }) => { const sc = getStaffColor(staffList, t.assigneeId); const isUnassigned = t.status === 'unassigned'; return (<button key={t.id} type="button" onClick={() => onTaskClick(t)} className={`flex items-center rounded-md px-2 py-1 text-left transition-colors hover:bg-foreground/[0.04] ${isUnassigned ? 'border border-dashed border-foreground/20 bg-foreground/[0.02]' : 'border border-border bg-card'}`} style={{ gridColumn: `${startCol + 2} / span ${spanCols}` }}>{!isUnassigned && sc && <span className="mr-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: sc }} />}<span className={`truncate text-[10px] font-medium ${isUnassigned ? 'text-foreground/60' : 'text-foreground'}`}>{t.title}</span><span className="ml-1 shrink-0 text-[9px] tabular-nums text-muted-foreground">{t.scheduledDate.slice(5)}~{t.endDate?.slice(5)}</span>{isUnassigned && <UserX className="ml-1 h-2.5 w-2.5 shrink-0 text-foreground/40" />}</button>) })}</div>
      )}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border bg-secondary/40">
            <div className="px-2 py-2 text-[11px] font-medium text-muted-foreground" />
            {weekDates.map((d, i) => { const isToday = fmtDate(d) === TODAY_STR; return (<div key={i} className={`px-2 py-2 text-center text-[11px] font-medium ${isToday ? 'bg-foreground/[0.04] text-foreground' : 'text-muted-foreground'}`}><div>{DAY_NAMES[i]}</div><div className={`mt-0.5 tabular-nums ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background' : ''}`}>{d.getDate()}</div></div>) })}
          </div>
          {allStaffKeys.map((staffKey) => { const sc = getStaffColor(staffList, staffKey === '_unassigned' ? undefined : staffKey); return (
            <div key={staffKey} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border last:border-b-0">
              <div className="flex items-start gap-1.5 px-2 py-2 text-[11px] font-medium text-foreground">{staffKey !== '_unassigned' && sc && <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: sc }} />}{staffKey === '_unassigned' && <UserX className="mt-0.5 h-3 w-3 shrink-0 text-foreground/40" />}<span className={staffKey === '_unassigned' ? 'text-foreground/60' : ''}>{staffNameMap.get(staffKey)}</span></div>
              {weekDates.map((d) => { const dateStr = fmtDate(d); const dayTasks = tasksByDateAndStaff.get(dateStr)?.get(staffKey) ?? []; const isToday = dateStr === TODAY_STR; const droppableId = `${staffKey}_${dateStr}`; return (
                <Droppable key={droppableId} droppableId={droppableId}>{(provided, snapshot) => (<div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[60px] border-l border-border px-1 py-1 transition-colors ${isToday ? 'bg-foreground/[0.02]' : ''} ${snapshot.isDraggingOver ? 'bg-foreground/[0.04]' : ''}`}>
                  {dayTasks.map((t, idx) => { const isUnassigned = t.status === 'unassigned'; return (
                    <Draggable key={t.id} draggableId={t.id} index={idx}>{(dragProvided, dragSnapshot) => (<div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps} onClick={() => onTaskClick(t)} className={`mb-0.5 cursor-pointer rounded px-1.5 py-0.5 text-[10px] transition-shadow hover:bg-foreground/[0.04] ${dragSnapshot.isDragging ? 'shadow-lg' : ''} ${isUnassigned ? 'border border-dashed border-foreground/20 bg-foreground/[0.02]' : 'border border-border bg-card'} ${selectedTaskIds.has(t.id) ? 'ring-1 ring-foreground/30' : ''}`} style={dragProvided.draggableProps.style}><div className="flex items-center gap-1">{isUnassigned && <input type="checkbox" checked={selectedTaskIds.has(t.id)} onClick={(e) => e.stopPropagation()} onChange={() => onToggleSelect(t.id)} className="h-3 w-3 shrink-0 cursor-pointer accent-foreground" />}<span className={`truncate font-medium ${isUnassigned ? 'text-foreground/60' : t.status === 'completed' ? 'text-muted-foreground line-through' : t.status === 'overdue' ? 'text-destructive' : 'text-foreground'}`}>{t.title}</span></div><div className="tabular-nums text-muted-foreground">{t.scheduledTime}</div></div>)}</Draggable>) })}
                  {provided.placeholder}
                </div>)}</Droppable>) })}
            </div>) })}
        </div>
      </DragDropContext>
    </div>
  )
}

function ChapterView({ tasks, trackId, staffList, onMoveToDate, onAssignToday, onDefer, onTaskClick, selectedTaskIds, onToggleSelect }: {
  tasks: TrackTask[]; trackId: string; staffList: { id: string; name: string }[]
  onMoveToDate: (taskId: string, newDate: string) => void; onAssignToday: (taskId: string) => void; onDefer: (task: TrackTask) => void; onTaskClick: (task: TrackTask) => void
  selectedTaskIds: Set<string>; onToggleSelect: (id: string) => void
}) {
  const storeChapters = useAdminStore((s) => s.chapters)
  const chapters = useMemo(() => storeChapters.filter((c) => c.trackId === trackId), [storeChapters, trackId])
  const [chapterIdx, setChapterIdx] = useState(() => { const idx = chapters.findIndex((c) => c.startDate <= TODAY_STR && c.endDate >= TODAY_STR); return idx >= 0 ? idx : 0 })
  const chapter = chapters[chapterIdx] ?? chapters[0]
  const milestoneTasks = useMemo(() => tasks.filter((t) => t.type === 'milestone'), [tasks])
  const chapterDates = useMemo(() => { if (!chapter) return []; const dates: Date[] = []; const cur = new Date(chapter.startDate); const end = new Date(chapter.endDate); while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }; return dates }, [chapter])
  const weeks = useMemo(() => { const result: Date[][] = []; let currentWeek: Date[] = []; for (const d of chapterDates) { currentWeek.push(d); if (d.getDay() === 0 || d === chapterDates[chapterDates.length - 1]) { result.push(currentWeek); currentWeek = [] } }; if (currentWeek.length > 0) result.push(currentWeek); return result }, [chapterDates])
  const tasksByDate = useMemo(() => { const map = new Map<string, TrackTask[]>(); for (const d of chapterDates) map.set(fmtDate(d), []); for (const t of milestoneTasks) { if (map.has(t.scheduledDate)) map.get(t.scheduledDate)!.push(t) }; return map }, [milestoneTasks, chapterDates])
  const handleDragEnd = useCallback((result: DropResult) => { if (!result.destination) return; onMoveToDate(result.draggableId, result.destination.droppableId) }, [onMoveToDate])

  if (!chapter) return <div className="py-8 text-center text-sm text-muted-foreground">챕터 정보가 없습니다</div>

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setChapterIdx((i) => Math.max(0, i - 1))} disabled={chapterIdx === 0} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{chapter.name}</span>
        <span className="text-[11px] text-muted-foreground">{chapter.startDate.slice(5)} ~ {chapter.endDate.slice(5)}</span>
        <button type="button" onClick={() => setChapterIdx((i) => Math.min(chapters.length - 1, i + 1))} disabled={chapterIdx === chapters.length - 1} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {staffList.map((s, i) => (<div key={s.id} className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STAFF_COLORS[i % STAFF_COLORS.length] }} /><span>{s.name}</span></div>))}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="inline-block h-2 w-2 rounded-full border border-dashed border-foreground/30 bg-foreground/[0.03]" /><span>미배정</span></div>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="overflow-hidden rounded-xl border border-border">
              <div className="grid border-b border-border bg-secondary/40" style={{ gridTemplateColumns: `repeat(${week.length}, 1fr)` }}>
                {week.map((d, i) => { const isToday = fmtDate(d) === TODAY_STR; const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]; return (<div key={i} className={`px-2 py-1.5 text-center text-[11px] font-medium ${isToday ? 'bg-foreground/[0.04] text-foreground' : 'text-muted-foreground'}`}><span>{dayOfWeek}</span> <span className={`tabular-nums ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background' : ''}`}>{d.getDate()}</span></div>) })}
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${week.length}, 1fr)` }}>
                {week.map((d) => { const dateStr = fmtDate(d); const dayTasks = tasksByDate.get(dateStr) ?? []; const isToday = dateStr === TODAY_STR; return (
                  <Droppable key={dateStr} droppableId={dateStr}>{(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[100px] border-r border-border p-1.5 last:border-r-0 transition-colors ${isToday ? 'bg-foreground/[0.02]' : ''} ${snapshot.isDraggingOver ? 'bg-foreground/[0.04]' : ''}`}>
                      {dayTasks.map((t, idx) => { const sc = getStaffColor(staffList, t.assigneeId); const isUnassigned = t.status === 'unassigned'; return (
                        <Draggable key={t.id} draggableId={t.id} index={idx}>{(dragProvided, dragSnapshot) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps} onClick={() => onTaskClick(t)} className={`mb-1 cursor-pointer rounded-md p-1.5 text-[10px] transition-shadow hover:bg-foreground/[0.04] ${dragSnapshot.isDragging ? 'shadow-lg' : ''} ${isUnassigned ? 'border border-dashed border-foreground/20 bg-foreground/[0.02]' : 'border border-border bg-card'} ${selectedTaskIds.has(t.id) ? 'ring-1 ring-foreground/30' : ''}`} style={dragProvided.draggableProps.style}>
                            <div className="flex items-center gap-1">{isUnassigned && <input type="checkbox" checked={selectedTaskIds.has(t.id)} onClick={(e) => e.stopPropagation()} onChange={() => onToggleSelect(t.id)} className="h-3 w-3 shrink-0 cursor-pointer accent-foreground" />}<span className={`truncate font-medium ${isUnassigned ? 'text-foreground/60' : t.status === 'completed' ? 'text-muted-foreground line-through' : t.status === 'overdue' ? 'text-destructive' : 'text-foreground'}`}>{t.title}</span></div>
                            <div className="mt-0.5 flex items-center gap-1 tabular-nums text-muted-foreground"><span>{t.scheduledTime}</span>{!isUnassigned && t.assigneeName && <span className="flex items-center gap-0.5"><span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sc ?? '#94a3b8' }} />{t.assigneeName}</span>}{isUnassigned && <UserX className="h-2.5 w-2.5 text-foreground/40" />}</div>
                            {isUnassigned && (<div className="mt-1 flex gap-1">{t.scheduledDate === TODAY_STR ? (<button type="button" onClick={() => onDefer(t)} className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground hover:bg-secondary">미루기</button>) : (<button type="button" onClick={() => onAssignToday(t.id)} className="rounded bg-foreground px-1.5 py-0.5 text-[9px] text-background">오늘 배정</button>)}</div>)}
                          </div>)}</Draggable>) })}
                      {provided.placeholder}
                    </div>)}</Droppable>) })}
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

function MonthlyView({ tasks, staffList, onMoveToDate, onAssignToday, onDefer, onTaskClick, selectedTaskIds, onToggleSelect }: {
  tasks: TrackTask[]; staffList: { id: string; name: string }[]
  onMoveToDate: (taskId: string, newDate: string) => void; onAssignToday: (taskId: string) => void; onDefer: (task: TrackTask) => void; onTaskClick: (task: TrackTask) => void
  selectedTaskIds: Set<string>; onToggleSelect: (id: string) => void
}) {
  const [monthOffset, setMonthOffset] = useState(0)
  const { year, month } = useMemo(() => { const base = new Date(TODAY_STR); base.setMonth(base.getMonth() + monthOffset); return { year: base.getFullYear(), month: base.getMonth() } }, [monthOffset])
  const monthDates = useMemo(() => getMonthDates(year, month), [year, month])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const statsByDate = useMemo(() => { const map = new Map<string, { total: number; completed: number; overdue: number; unassigned: number }>(); for (const t of tasks) { if (!map.has(t.scheduledDate)) map.set(t.scheduledDate, { total: 0, completed: 0, overdue: 0, unassigned: 0 }); const s = map.get(t.scheduledDate)!; s.total++; if (t.status === 'completed') s.completed++; if (t.status === 'overdue') s.overdue++; if (t.status === 'unassigned') s.unassigned++ }; return map }, [tasks])
  const selectedTasks = useMemo(() => selectedDate ? tasks.filter((t) => t.scheduledDate === selectedDate).sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '')) : [], [tasks, selectedDate])

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{year}년 {month + 1}월</span>
        <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        {monthOffset !== 0 && <button type="button" onClick={() => setMonthOffset(0)} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary">이번 달</button>}
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/40">{DAY_NAMES.map((d) => <div key={d} className="px-2 py-2 text-center text-[11px] font-medium text-muted-foreground">{d}</div>)}</div>
        <div className="grid grid-cols-7">
          {monthDates.map((d, i) => { const dateStr = fmtDate(d); const isCurrentMonth = d.getMonth() === month; const isToday = dateStr === TODAY_STR; const stats = statsByDate.get(dateStr); const isSelected = selectedDate === dateStr; return (
            <button key={i} type="button" onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)} className={`min-h-[72px] border-b border-r border-border p-1.5 text-left transition-colors hover:bg-foreground/[0.02] ${!isCurrentMonth ? 'bg-secondary/20' : ''} ${isSelected ? 'bg-foreground/[0.04]' : ''}`}>
              <div className={`text-[11px] tabular-nums ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}`}>{d.getDate()}</div>
              {stats && isCurrentMonth && (<div className="mt-1 space-y-0.5"><div className="text-[9px] tabular-nums text-muted-foreground">{stats.completed}/{stats.total} 완료</div>{stats.overdue > 0 && <div className="text-[9px] tabular-nums text-destructive">{stats.overdue} 초과</div>}{stats.unassigned > 0 && <div className="text-[9px] tabular-nums text-foreground/50">{stats.unassigned} 미배정</div>}</div>)}
            </button>) })}
        </div>
      </div>
      {selectedDate && selectedTasks.length > 0 && (
        <div className="mt-3 rounded-xl border border-border bg-card p-4">
          <h4 className="mb-2 text-[13px] font-semibold text-foreground">{selectedDate} Task 목록</h4>
          <div className="space-y-1.5">
            {selectedTasks.map((t) => { const sc = getStaffColor(staffList, t.assigneeId); const isUnassigned = t.status === 'unassigned'; return (
              <div key={t.id} onClick={() => onTaskClick(t)} className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary/50 ${selectedTaskIds.has(t.id) ? 'ring-1 ring-foreground/30' : ''}`}>
                {isUnassigned && <input type="checkbox" checked={selectedTaskIds.has(t.id)} onClick={(e) => e.stopPropagation()} onChange={() => onToggleSelect(t.id)} className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-foreground" />}
                <StatusBadge status={t.status} /><span className="text-[12px] tabular-nums text-muted-foreground">{t.scheduledTime}</span>
                <span className={`flex-1 truncate text-[12px] ${t.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{t.title}</span>
                {!isUnassigned && t.assigneeName && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sc ?? '#94a3b8' }} />{t.assigneeName}</span>}
                {isUnassigned && (<div className="flex items-center gap-1.5"><span className="text-[11px] text-foreground/50">미배정</span>{t.scheduledDate === TODAY_STR ? (<button type="button" onClick={() => onDefer(t)} className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-secondary">미루기</button>) : (<button type="button" onClick={() => onAssignToday(t.id)} className="rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background">오늘 배정</button>)}</div>)}
              </div>) })}
          </div>
        </div>
      )}
    </div>
  )
}

function BulkActionDropdown({ count, onAssign, onComplete, onDefer }: { count: number; onAssign: () => void; onComplete: () => void; onDefer: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground">
        일괄 작업 ({count})<ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <button type="button" onClick={() => { onAssign(); setOpen(false) }} className="w-full px-3 py-2 text-left text-[11px] text-foreground hover:bg-secondary">일괄 배정</button>
          <button type="button" onClick={() => { onComplete(); setOpen(false) }} className="w-full px-3 py-2 text-left text-[11px] text-foreground hover:bg-secondary">일괄 완료</button>
          <button type="button" onClick={() => { onDefer(); setOpen(false) }} className="w-full px-3 py-2 text-left text-[11px] text-foreground hover:bg-secondary">일괄 미루기</button>
        </div>
      )}
    </div>
  )
}

export function TrackTaskSection({ allTrackTasks, staffList, trackId, onTaskClick, onAssignToday, onDefer, onMoveToDate, onShowNewTask, onShowBulkAssign, selectedTaskIds, onToggleSelect, initialScopeFilter, initialStatusFilter, onBulkComplete, onBulkDefer }: {
  allTrackTasks: TrackTask[]; staffList: { id: string; name: string }[]; trackId: string
  onTaskClick: (task: TrackTask) => void; onAssignToday: (taskId: string) => void; onDefer: (task: TrackTask) => void
  onMoveToDate: (taskId: string, newDate: string) => void; onShowNewTask: () => void; onShowBulkAssign: () => void
  selectedTaskIds: Set<string>; onToggleSelect: (id: string) => void
  initialScopeFilter?: 'all' | 'assigned' | 'unassigned'; initialStatusFilter?: string
  onBulkComplete?: (ids: string[]) => void; onBulkDefer?: (ids: string[]) => void
}) {
  const [viewMode, setViewMode] = useState<UnassignedViewMode>('daily')
  const [taskScopeFilter, setTaskScopeFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | TaskType>('all')
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | TrackTaskStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    if (initialScopeFilter) setTaskScopeFilter(initialScopeFilter)
    if (initialStatusFilter) setTaskStatusFilter(initialStatusFilter as 'all' | TrackTaskStatus)
  }, [initialScopeFilter, initialStatusFilter])

  const unassignedTasks = allTrackTasks.filter((t) => t.status === 'unassigned')
  const assignedTasks = allTrackTasks.filter((t) => t.status !== 'unassigned')
  const scopeFilteredTasks = useMemo(() => {
    let filtered = allTrackTasks
    if (taskScopeFilter === 'unassigned') filtered = unassignedTasks
    else if (taskScopeFilter === 'assigned') filtered = assignedTasks
    if (taskTypeFilter !== 'all') filtered = filtered.filter((t) => t.type === taskTypeFilter)
    if (taskStatusFilter !== 'all') filtered = filtered.filter((t) => t.status === taskStatusFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(q))
    }
    return filtered
  }, [taskScopeFilter, taskTypeFilter, taskStatusFilter, searchQuery, allTrackTasks, unassignedTasks, assignedTasks])

  const tabCls = (active: boolean) => `px-3 py-2 text-[12px] font-medium transition-colors border-b-2 whitespace-nowrap ${active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground/70'}`
  const scopeCls = (active: boolean) => `px-2 py-1 text-[11px] rounded-md transition-colors ${active ? 'bg-foreground/10 text-foreground font-medium' : 'text-muted-foreground hover:text-foreground/70'}`
  const hasActiveFilters = taskScopeFilter !== 'all' || taskTypeFilter !== 'all' || taskStatusFilter !== 'all'

  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center">
          <button type="button" onClick={() => setViewMode('daily')} className={tabCls(viewMode === 'daily')}>일별</button>
          <button type="button" onClick={() => setViewMode('weekly')} className={tabCls(viewMode === 'weekly')}>주간</button>
          <button type="button" onClick={() => setViewMode('chapter')} className={tabCls(viewMode === 'chapter')}>챕터별</button>
          <button type="button" onClick={() => setViewMode('monthly')} className={tabCls(viewMode === 'monthly')}>월별</button>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => setTaskScopeFilter('all')} className={scopeCls(taskScopeFilter === 'all')}>전체</button>
            <button type="button" onClick={() => setTaskScopeFilter('assigned')} className={scopeCls(taskScopeFilter === 'assigned')}>배정</button>
            <button type="button" onClick={() => setTaskScopeFilter('unassigned')} className={scopeCls(taskScopeFilter === 'unassigned')}>미배정{unassignedTasks.length > 0 && <span className="ml-1 text-[10px] opacity-70">{unassignedTasks.length}</span>}</button>
          </div>
          <span className="text-border">|</span>
          <select value={taskTypeFilter} onChange={(e) => setTaskTypeFilter(e.target.value as 'all' | TaskType)} className={`rounded-md border px-2 py-1 text-[11px] font-medium focus:outline-none ${taskTypeFilter !== 'all' ? 'border-foreground/30 bg-foreground/[0.04] text-foreground' : 'border-border bg-transparent text-muted-foreground'}`}>
            <option value="all">유형</option><option value="daily">일일</option><option value="milestone">마일스톤</option><option value="manual">수동</option>
          </select>
          <select value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value as 'all' | TrackTaskStatus)} className={`rounded-md border px-2 py-1 text-[11px] font-medium focus:outline-none ${taskStatusFilter !== 'all' ? 'border-foreground/30 bg-foreground/[0.04] text-foreground' : 'border-border bg-transparent text-muted-foreground'}`}>
            <option value="all">상태</option><option value="pending">대기</option><option value="in-progress">진행중</option><option value="completed">완료</option><option value="overdue">기한초과</option><option value="unassigned">미배정</option>
          </select>
          {(hasActiveFilters || searchQuery) && (
            <button type="button" onClick={() => { setTaskScopeFilter('all'); setTaskTypeFilter('all'); setTaskStatusFilter('all'); setSearchQuery(''); setShowSearch(false) }} className="text-[11px] text-muted-foreground hover:text-foreground">초기화</button>
          )}
          <span className="text-border">|</span>
          {showSearch ? (
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onBlur={() => { if (!searchQuery) setShowSearch(false) }}
              placeholder="Task 검색..." autoFocus className="w-32 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
          ) : (
            <button type="button" onClick={() => setShowSearch(true)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><Search className="h-3.5 w-3.5" /></button>
          )}
          <button type="button" onClick={onShowNewTask} className="flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background"><Plus className="h-3 w-3" />새 Task</button>
          {selectedTaskIds.size > 0 && (
            <BulkActionDropdown count={selectedTaskIds.size} onAssign={onShowBulkAssign} onComplete={() => onBulkComplete?.([...selectedTaskIds])} onDefer={() => onBulkDefer?.([...selectedTaskIds])} />
          )}
        </div>
      </div>

      {viewMode === 'daily' && <DailyView tasks={scopeFilteredTasks} staffList={staffList} onAssignToday={onAssignToday} onDefer={onDefer} onTaskClick={onTaskClick} selectedTaskIds={selectedTaskIds} onToggleSelect={onToggleSelect} />}
      {viewMode === 'weekly' && <WeeklyView tasks={scopeFilteredTasks} staffList={staffList} onMoveToDate={onMoveToDate} onAssignToday={onAssignToday} onDefer={onDefer} onTaskClick={onTaskClick} selectedTaskIds={selectedTaskIds} onToggleSelect={onToggleSelect} />}
      {viewMode === 'chapter' && <ChapterView tasks={scopeFilteredTasks} trackId={trackId} staffList={staffList} onMoveToDate={onMoveToDate} onAssignToday={onAssignToday} onDefer={onDefer} onTaskClick={onTaskClick} selectedTaskIds={selectedTaskIds} onToggleSelect={onToggleSelect} />}
      {viewMode === 'monthly' && <MonthlyView tasks={scopeFilteredTasks} staffList={staffList} onMoveToDate={onMoveToDate} onAssignToday={onAssignToday} onDefer={onDefer} onTaskClick={onTaskClick} selectedTaskIds={selectedTaskIds} onToggleSelect={onToggleSelect} />}
    </div>
  )
}
