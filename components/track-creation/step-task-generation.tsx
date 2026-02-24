'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Clock, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  RefreshCw, Plus, X, Trash2, Layers, BookOpen, Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generateTasks } from '@/lib/task-generator'
import {
  taskTemplates, ROLE_LABELS,
  getTaskTags, TAG_LABELS, TAG_GROUPS, TAG_GROUP_LABELS,
  tagBelongsToGroup,
  type TaskTag, type TagGroup,
} from '@/lib/task-templates'
import type {
  TrackCreationData, RecurrenceConfig, TaskTemplateConfig, Chapter, DriRole,
} from '@/lib/track-creation-types'
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, isWeekend,
} from 'date-fns'
import { ko } from 'date-fns/locale'

// === Types ===

interface StepTaskGenerationProps {
  data: TrackCreationData
  updateData: (partial: Partial<TrackCreationData>) => void
}

type RecurringTaskEntry = {
  template: TaskTemplateConfig
  recurrence?: RecurrenceConfig
  timeSlot?: number | null
  dayOffset?: number // for per_chapter & monthly: >=0 from start, <0 from end
}

type LifecycleSectionType = 'pre_opening' | 'first_week' | 'chapter' | 'closing' | 'adhoc'

type LifecycleSection = {
  id: string
  label: string
  sublabel?: string
  type: LifecycleSectionType
  tasks: TaskTemplateConfig[]
  chapter?: Chapter
}

type PendingRemove = { tplId: string; entry: RecurringTaskEntry; title: string }

// === Constants ===

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const WEEKDAYS = [1, 2, 3, 4, 5] as const
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => i + 8)

type LeftTab = 'daily' | 'weekly' | 'per_chapter' | 'monthly'
type RightView = 'timeline' | 'month'

// === Helpers ===

function getEffectiveOffset(entry: RecurringTaskEntry): number {
  return entry.dayOffset ?? entry.template.triggerOffset ?? 0
}

function offsetLabel(offset: number, startWord: string, endWord: string): string {
  if (offset >= 0) return offset === 0 ? startWord : `${startWord}+${offset}`
  return offset === -1 ? endWord : `${endWord}${offset + 1}`
}

function classifyToSection(tpl: TaskTemplateConfig): LifecycleSectionType | 'left' {
  if (['daily', 'weekly', 'monthly'].includes(tpl.frequency)) return 'left'
  if (tpl.triggerType === 'opening_d' && (tpl.triggerOffset ?? 0) < 0) return 'pre_opening'
  if (tpl.triggerType === 'opening_d' && (tpl.triggerOffset ?? 0) >= 0) return 'first_week'
  if (tpl.triggerType === 'opening_week') return 'first_week'
  if (tpl.triggerType === 'closing_d') return 'closing'
  if (tpl.frequency === 'per_chapter' || tpl.triggerType === 'schedule') return 'chapter'
  if (tpl.frequency === 'ad_hoc' || tpl.triggerType === 'ad_hoc') return 'adhoc'
  return 'adhoc'
}

// === Main Component ===

export function StepTaskGeneration({ data, updateData }: StepTaskGenerationProps) {
  const [leftTab, setLeftTab] = useState<LeftTab>('daily')
  const [rightView, setRightView] = useState<RightView>('timeline')
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (data.parsedSchedule?.trackStart) return parseISO(data.parsedSchedule.trackStart)
    return new Date()
  })

  const [recurringTasks, setRecurringTasks] = useState<Map<string, RecurringTaskEntry>>(new Map())
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createTarget, setCreateTarget] = useState<{ panel: 'left'; tab: LeftTab } | { panel: 'right'; sectionId: string } | null>(null)
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null)

  const allTemplates = useMemo(() => [
    ...taskTemplates,
    ...data.customTemplates,
  ], [data.customTemplates])

  const leftTemplates = useMemo(() =>
    allTemplates.filter(t => classifyToSection(t) === 'left' || t.frequency === 'per_chapter'),
  [allTemplates])

  const dailyTemplates = useMemo(() => leftTemplates.filter(t => t.frequency === 'daily'), [leftTemplates])
  const weeklyTemplates = useMemo(() => leftTemplates.filter(t => t.frequency === 'weekly'), [leftTemplates])
  const perChapterTemplates = useMemo(() => leftTemplates.filter(t => t.frequency === 'per_chapter'), [leftTemplates])
  const monthlyTemplates = useMemo(() => leftTemplates.filter(t => t.frequency === 'monthly'), [leftTemplates])

  const rightSections = useMemo((): LifecycleSection[] => {
    const rightTemplates = allTemplates.filter(t => classifyToSection(t) !== 'left')
    const preOpening: TaskTemplateConfig[] = []
    const firstWeek: TaskTemplateConfig[] = []
    const chapterTasks: TaskTemplateConfig[] = []
    const closing: TaskTemplateConfig[] = []
    const adhoc: TaskTemplateConfig[] = []

    for (const tpl of rightTemplates) {
      const sec = classifyToSection(tpl)
      if (sec === 'pre_opening') preOpening.push(tpl)
      else if (sec === 'first_week') firstWeek.push(tpl)
      else if (sec === 'chapter') chapterTasks.push(tpl)
      else if (sec === 'closing') closing.push(tpl)
      else adhoc.push(tpl)
    }

    const sections: LifecycleSection[] = []
    sections.push({ id: 'sec-pre', label: '개강전', sublabel: 'D-14 ~ D-1', type: 'pre_opening', tasks: preOpening })
    sections.push({ id: 'sec-first', label: '개강1주차', sublabel: 'D+0 ~', type: 'first_week', tasks: firstWeek })
    for (const ch of data.chapters) {
      sections.push({ id: `sec-ch-${ch.id}`, label: ch.name, sublabel: `${ch.startDate} ~ ${ch.endDate}`, type: 'chapter', tasks: chapterTasks, chapter: ch })
    }
    sections.push({ id: 'sec-closing', label: '수료준비', sublabel: 'D-10 ~ D+0', type: 'closing', tasks: closing })
    sections.push({ id: 'sec-adhoc', label: '수시 Task', type: 'adhoc', tasks: adhoc })
    return sections
  }, [allTemplates, data.chapters])

  // Auto-place recurring tasks on first load
  useEffect(() => {
    if (recurringTasks.size > 0) return
    const map = new Map<string, RecurringTaskEntry>()
    for (const tpl of leftTemplates) {
      map.set(tpl.id, { template: tpl, timeSlot: null, dayOffset: tpl.triggerOffset ?? 0 })
    }
    setRecurringTasks(map)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // === Computed grid data ===

  const timeGridTasks = useMemo(() => {
    const noTime: RecurringTaskEntry[] = []
    const byHour = new Map<number, RecurringTaskEntry[]>()
    for (const [, entry] of recurringTasks) {
      if (entry.template.frequency !== 'daily') continue
      if (entry.timeSlot == null) noTime.push(entry)
      else {
        if (!byHour.has(entry.timeSlot)) byHour.set(entry.timeSlot, [])
        byHour.get(entry.timeSlot)!.push(entry)
      }
    }
    return { noTime, byHour }
  }, [recurringTasks])

  const weeklyByDay = useMemo(() => {
    const noDay: RecurringTaskEntry[] = []
    const byDay = new Map<number, RecurringTaskEntry[]>()
    for (const tpl of weeklyTemplates) {
      const entry = recurringTasks.get(tpl.id)
      if (!entry) continue
      const days = entry.recurrence?.daysOfWeek
      if (!days || days.length === 0) {
        noDay.push(entry)
      } else {
        // Place under first assigned day only to avoid duplication in the grid
        const primaryDay = days[0]
        if (!byDay.has(primaryDay)) byDay.set(primaryDay, [])
        byDay.get(primaryDay)!.push(entry)
      }
    }
    // Tasks not yet in recurringTasks
    for (const tpl of weeklyTemplates) {
      if (!recurringTasks.has(tpl.id)) noDay.push({ template: tpl })
    }
    return { noDay, byDay }
  }, [weeklyTemplates, recurringTasks])

  const trackMonths = useMemo(() => {
    if (!data.parsedSchedule?.trackStart || !data.parsedSchedule?.trackEnd) return []
    const start = parseISO(data.parsedSchedule.trackStart)
    const end = parseISO(data.parsedSchedule.trackEnd)
    const months: { key: string; label: string; start: string; end: string }[] = []
    let cur = startOfMonth(start)
    while (cur <= end) {
      const mEnd = endOfMonth(cur)
      months.push({
        key: format(cur, 'yyyy-MM'),
        label: format(cur, 'yyyy년 M월', { locale: ko }),
        start: format(cur, 'yyyy-MM-dd'),
        end: format(mEnd, 'yyyy-MM-dd'),
      })
      cur = addMonths(cur, 1)
    }
    return months
  }, [data.parsedSchedule])

  // Stats
  const totalTasks = allTemplates.length
  const leftCount = leftTemplates.length
  const rightCount = totalTasks - leftCount

  // === Remove with undo ===
  const removeTask = useCallback((tplId: string) => {
    const entry = recurringTasks.get(tplId)
    if (!entry) return
    setPendingRemove({ tplId, entry, title: entry.template.title })
    setRecurringTasks(prev => { const next = new Map(prev); next.delete(tplId); return next })
  }, [recurringTasks])

  const undoRemove = useCallback(() => {
    if (!pendingRemove) return
    setRecurringTasks(prev => {
      const next = new Map(prev)
      next.set(pendingRemove.tplId, pendingRemove.entry)
      return next
    })
    setPendingRemove(null)
  }, [pendingRemove])

  useEffect(() => {
    if (!pendingRemove) return
    const timer = setTimeout(() => setPendingRemove(null), 5000)
    return () => clearTimeout(timer)
  }, [pendingRemove])

  // Inline edit handlers
  const saveDayOffset = useCallback((tplId: string, offset: number) => {
    setRecurringTasks(prev => {
      const next = new Map(prev)
      const existing = next.get(tplId)
      if (existing) next.set(tplId, { ...existing, dayOffset: offset })
      return next
    })
    setEditingTaskId(null)
  }, [])

  const saveRecurrence = useCallback((tplId: string, config: RecurrenceConfig) => {
    setRecurringTasks(prev => {
      const next = new Map(prev)
      const existing = next.get(tplId)
      if (existing) {
        const timeSlot = config.time ? parseInt(config.time.split(':')[0]) : null
        next.set(tplId, { ...existing, recurrence: config, timeSlot })
      }
      return next
    })
    setEditingTaskId(null)
  }, [])

  const addCustomTemplate = useCallback((tpl: TaskTemplateConfig) => {
    updateData({ customTemplates: [...data.customTemplates, tpl] })
    const sec = classifyToSection(tpl)
    if (sec === 'left' || tpl.frequency === 'per_chapter') {
      setRecurringTasks(prev => {
        const next = new Map(prev)
        next.set(tpl.id, { template: tpl, timeSlot: null })
        return next
      })
    }
    setCreateModalOpen(false)
  }, [data.customTemplates, updateData])

  const removeCustomTemplate = useCallback((tplId: string) => {
    updateData({ customTemplates: data.customTemplates.filter(t => t.id !== tplId) })
    setRecurringTasks(prev => { const next = new Map(prev); next.delete(tplId); return next })
  }, [data.customTemplates, updateData])

  const handleGenerate = useCallback(() => {
    if (!data.parsedSchedule) return
    const configs: Record<string, RecurrenceConfig> = {}
    for (const [tplId, entry] of recurringTasks) {
      if (entry.recurrence) {
        configs[tplId] = entry.recurrence
      } else if (entry.timeSlot != null) {
        configs[tplId] = { type: 'daily', time: `${String(entry.timeSlot).padStart(2, '0')}:00`, daysOfWeek: [1, 2, 3, 4, 5] }
      } else {
        configs[tplId] = { type: entry.template.frequency === 'weekly' ? 'weekly' : entry.template.frequency === 'monthly' ? 'monthly' : 'daily', daysOfWeek: [1, 2, 3, 4, 5] }
      }
    }
    const tasks = generateTasks(data.parsedSchedule.trackStart, data.parsedSchedule.trackEnd, data.chapters, configs)
    updateData({ generatedTasks: tasks, recurrenceConfigs: configs })
  }, [data.parsedSchedule, data.chapters, recurringTasks, updateData])

  useEffect(() => {
    if (data.parsedSchedule && recurringTasks.size > 0) handleGenerate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurringTasks])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [currentMonth])

  const LEFT_TABS: { key: LeftTab; label: string; count: number }[] = [
    { key: 'daily', label: '일별', count: dailyTemplates.length },
    { key: 'weekly', label: '주별', count: weeklyTemplates.length },
    { key: 'per_chapter', label: '챕터별', count: perChapterTemplates.length },
    { key: 'monthly', label: '월별', count: monthlyTemplates.length },
  ]

  // === RENDER ===
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Task 배치</h2>
          <p className="text-xs text-muted-foreground">각 패널에서 Task를 편집하거나 추가하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5">반복 <strong className="text-foreground">{leftCount}</strong></span>
            <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5">일정 <strong className="text-foreground">{rightCount}</strong></span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setCreateTarget(null); setCreateModalOpen(true) }}>
            <Plus className="mr-1 h-3 w-3" /> 새 Task
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleGenerate}>
            <RefreshCw className="mr-1 h-3 w-3" /> 재생성
          </Button>
        </div>
      </div>

      {/* Two-panel grid */}
      <div className="grid grid-cols-[340px_1fr] gap-2" style={{ height: 'calc(100vh - 280px)', minHeight: 480 }}>

        {/* ===== LEFT PANEL: Recurring Tasks ===== */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex h-[72px] flex-col justify-between border-b border-border">
            <div className="flex items-center gap-2 px-3 pt-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">반복 일정</span>
              <span className="ml-auto rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{leftCount}</span>
            </div>
            <div className="flex px-2">
              {LEFT_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setLeftTab(tab.key)}
                  className={`relative px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    leftTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 text-[9px] opacity-60">{tab.count}</span>
                  {leftTab === tab.key && (
                    <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-foreground rounded-t" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Undo bar - top position for visibility */}
          {pendingRemove && (
            <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-3 py-1.5 animate-in slide-in-from-top-1 duration-200">
              <span className="flex-1 truncate text-[11px] text-muted-foreground">
                &ldquo;{pendingRemove.title}&rdquo; 제외됨
              </span>
              <button
                onClick={undoRemove}
                className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <Undo2 className="h-3 w-3" />
                되돌리기
              </button>
            </div>
          )}

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">

              {/* ── DAILY: time grid ── */}
              {leftTab === 'daily' && (
                <>
                  <div className="mb-2 min-h-[36px] rounded-lg border border-dashed border-border px-2 py-1.5">
                    <p className="mb-1 text-[10px] font-medium text-muted-foreground">시간 미지정</p>
                    <div className="space-y-0.5">
                      {timeGridTasks.noTime.map(entry => (
                        <LeftTaskCard key={entry.template.id} entry={entry} isEditing={editingTaskId === entry.template.id} onEdit={() => setEditingTaskId(editingTaskId === entry.template.id ? null : entry.template.id)} onSave={saveRecurrence} onRemove={removeTask} isCustom={entry.template.id.startsWith('custom-')} onRemoveCustom={removeCustomTemplate} />
                      ))}
                    </div>
                  </div>
                  {TIME_SLOTS.map(hour => {
                    const hourTasks = timeGridTasks.byHour.get(hour) || []
                    return (
                      <div key={hour} className="flex min-h-[32px]">
                        <div className="flex w-10 shrink-0 items-start justify-end pr-2 pt-1">
                          <span className="text-[10px] font-mono text-muted-foreground/50">{String(hour).padStart(2, '0')}</span>
                        </div>
                        <div className="flex-1 border-l border-border py-0.5 pl-2 space-y-0.5">
                          {hourTasks.map(entry => (
                            <LeftTaskCard key={entry.template.id} entry={entry} isEditing={editingTaskId === entry.template.id} onEdit={() => setEditingTaskId(editingTaskId === entry.template.id ? null : entry.template.id)} onSave={saveRecurrence} onRemove={removeTask} isCustom={entry.template.id.startsWith('custom-')} onRemoveCustom={removeCustomTemplate} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}

              {/* ── WEEKLY: day-of-week grid ── */}
              {leftTab === 'weekly' && (
                <>
                  {weeklyTemplates.length === 0 ? (
                    <p className="py-8 text-center text-[11px] text-muted-foreground">주별 반복 Task가 없습니다.</p>
                  ) : (
                    <>
                      <div className="mb-2 min-h-[36px] rounded-lg border border-dashed border-border px-2 py-1.5">
                        <p className="mb-1 text-[10px] font-medium text-muted-foreground">요일 미지정</p>
                        <div className="space-y-0.5">
                          {weeklyByDay.noDay.map(entry => (
                            <LeftTaskCard key={entry.template.id} entry={entry} isEditing={editingTaskId === entry.template.id} onEdit={() => setEditingTaskId(editingTaskId === entry.template.id ? null : entry.template.id)} onSave={saveRecurrence} onRemove={removeTask} isCustom={entry.template.id.startsWith('custom-')} onRemoveCustom={removeCustomTemplate} />
                          ))}
                          {weeklyByDay.noDay.length === 0 && (
                            <p className="py-1 text-[9px] text-muted-foreground/40">모든 Task에 요일이 지정되었습니다</p>
                          )}
                        </div>
                      </div>
                      {WEEKDAYS.map(dayIdx => {
                        const dayTasks = weeklyByDay.byDay.get(dayIdx) || []
                        return (
                          <div key={dayIdx} className="flex min-h-[32px]">
                            <div className="flex w-10 shrink-0 items-start justify-end pr-2 pt-1">
                              <span className="text-[10px] font-medium text-muted-foreground/50">{DAY_LABELS[dayIdx]}</span>
                            </div>
                            <div className="flex-1 border-l border-border py-0.5 pl-2 space-y-0.5">
                              {dayTasks.map(entry => (
                                <LeftTaskCard key={entry.template.id} entry={entry} isEditing={editingTaskId === entry.template.id} onEdit={() => setEditingTaskId(editingTaskId === entry.template.id ? null : entry.template.id)} onSave={saveRecurrence} onRemove={removeTask} isCustom={entry.template.id.startsWith('custom-')} onRemoveCustom={removeCustomTemplate} />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </>
              )}

              {/* ── PER_CHAPTER: offset grid (시작일+N / 종료일-N) ── */}
              {leftTab === 'per_chapter' && (
                <>
                  {perChapterTemplates.length === 0 ? (
                    <p className="py-8 text-center text-[11px] text-muted-foreground">챕터별 반복 Task가 없습니다.</p>
                  ) : (() => {
                    const entries = perChapterTemplates.map(tpl => recurringTasks.get(tpl.id) || { template: tpl, dayOffset: tpl.triggerOffset ?? 0 })
                    const startEntries = entries.filter(e => getEffectiveOffset(e) >= 0)
                    const endEntries = entries.filter(e => getEffectiveOffset(e) < 0)
                    const startOffsets = [...new Set(startEntries.map(e => getEffectiveOffset(e)))].sort((a, b) => a - b)
                    const endOffsets = [...new Set(endEntries.map(e => getEffectiveOffset(e)))].sort((a, b) => a - b)
                    // Ensure minimum rows
                    if (!startOffsets.includes(0)) startOffsets.unshift(0)
                    if (!startOffsets.includes(1)) startOffsets.push(1)
                    startOffsets.sort((a, b) => a - b)
                    if (!endOffsets.includes(-1)) endOffsets.push(-1)
                    if (!endOffsets.includes(-2)) endOffsets.unshift(-2)
                    endOffsets.sort((a, b) => a - b)
                    return (
                      <>
                        {data.chapters.length > 0 && (
                          <p className="px-1 pb-1 text-[10px] text-muted-foreground">{data.chapters.length}개 챕터에 각각 적용</p>
                        )}
                        {/* 챕터 시작 */}
                        <div className="mb-1 mt-1 flex items-center gap-2 px-1">
                          <span className="text-[10px] font-semibold text-foreground/70">챕터 시작</span>
                          <div className="flex-1 border-t border-border/40" />
                        </div>
                        {startOffsets.map(off => {
                          const rowTasks = startEntries.filter(e => getEffectiveOffset(e) === off)
                          return (
                            <div key={`s${off}`} className="flex min-h-[28px]">
                              <div className="flex w-16 shrink-0 items-start justify-end pr-2 pt-1.5">
                                <span className="text-[10px] font-mono text-muted-foreground/50">{offsetLabel(off, '시작일', '종료일')}</span>
                              </div>
                              <div className="flex-1 border-l border-border py-0.5 pl-2 space-y-0.5">
                                {rowTasks.map(entry => (
                                  <LeftTaskCard key={entry.template.id} entry={entry} isEditing={editingTaskId === entry.template.id} onEdit={() => setEditingTaskId(editingTaskId === entry.template.id ? null : entry.template.id)} onSave={saveRecurrence} onRemove={removeTask} isCustom={entry.template.id.startsWith('custom-')} onRemoveCustom={removeCustomTemplate} offsetMode onSaveOffset={saveDayOffset} startWord="시작일" endWord="종료일" />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                        {/* 챕터 종료 */}
                        <div className="mb-1 mt-3 flex items-center gap-2 px-1">
                          <span className="text-[10px] font-semibold text-foreground/70">챕터 종료</span>
                          <div className="flex-1 border-t border-border/40" />
                        </div>
                        {endOffsets.map(off => {
                          const rowTasks = endEntries.filter(e => getEffectiveOffset(e) === off)
                          return (
                            <div key={`e${off}`} className="flex min-h-[28px]">
                              <div className="flex w-16 shrink-0 items-start justify-end pr-2 pt-1.5">
                                <span className="text-[10px] font-mono text-muted-foreground/50">{offsetLabel(off, '시작일', '종료일')}</span>
                              </div>
                              <div className="flex-1 border-l border-border py-0.5 pl-2 space-y-0.5">
                                {rowTasks.map(entry => (
                                  <LeftTaskCard key={entry.template.id} entry={entry} isEditing={editingTaskId === entry.template.id} onEdit={() => setEditingTaskId(editingTaskId === entry.template.id ? null : entry.template.id)} onSave={saveRecurrence} onRemove={removeTask} isCustom={entry.template.id.startsWith('custom-')} onRemoveCustom={removeCustomTemplate} offsetMode onSaveOffset={saveDayOffset} startWord="시작일" endWord="종료일" />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </>
              )}

              {/* ── MONTHLY: offset grid (시작일+N / 종료일-N) ── */}
              {leftTab === 'monthly' && (
                <>
                  {monthlyTemplates.length === 0 ? (
                    <p className="py-8 text-center text-[11px] text-muted-foreground">월별 반복 Task가 없습니다.</p>
                  ) : (() => {
                    const entries = monthlyTemplates.map(tpl => recurringTasks.get(tpl.id) || { template: tpl, dayOffset: tpl.triggerOffset ?? 0 })
                    const startEntries = entries.filter(e => getEffectiveOffset(e) >= 0)
                    const endEntries = entries.filter(e => getEffectiveOffset(e) < 0)
                    const startOffsets = [...new Set(startEntries.map(e => getEffectiveOffset(e)))].sort((a, b) => a - b)
                    const endOffsets = [...new Set(endEntries.map(e => getEffectiveOffset(e)))].sort((a, b) => a - b)
                    if (!startOffsets.includes(0)) startOffsets.unshift(0)
                    if (!startOffsets.includes(1)) startOffsets.push(1)
                    startOffsets.sort((a, b) => a - b)
                    if (!endOffsets.includes(-1)) endOffsets.push(-1)
                    if (!endOffsets.includes(-2)) endOffsets.unshift(-2)
                    endOffsets.sort((a, b) => a - b)
                    return (
                      <>
                        {trackMonths.length > 0 && (
                          <p className="px-1 pb-1 text-[10px] text-muted-foreground">{trackMonths[0].label} ~ {trackMonths[trackMonths.length - 1].label} ({trackMonths.length}개월)</p>
                        )}
                        {/* 월 시작 */}
                        <div className="mb-1 mt-1 flex items-center gap-2 px-1">
                          <span className="text-[10px] font-semibold text-foreground/70">월 시작</span>
                          <div className="flex-1 border-t border-border/40" />
                        </div>
                        {startOffsets.map(off => {
                          const rowTasks = startEntries.filter(e => getEffectiveOffset(e) === off)
                          return (
                            <div key={`s${off}`} className="flex min-h-[28px]">
                              <div className="flex w-16 shrink-0 items-start justify-end pr-2 pt-1.5">
                                <span className="text-[10px] font-mono text-muted-foreground/50">{offsetLabel(off, '시작일', '종료일')}</span>
                              </div>
                              <div className="flex-1 border-l border-border py-0.5 pl-2 space-y-0.5">
                                {rowTasks.map(entry => (
                                  <LeftTaskCard key={entry.template.id} entry={entry} isEditing={editingTaskId === entry.template.id} onEdit={() => setEditingTaskId(editingTaskId === entry.template.id ? null : entry.template.id)} onSave={saveRecurrence} onRemove={removeTask} isCustom={entry.template.id.startsWith('custom-')} onRemoveCustom={removeCustomTemplate} offsetMode onSaveOffset={saveDayOffset} startWord="시작일" endWord="종료일" />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                        {/* 월 종료 */}
                        <div className="mb-1 mt-3 flex items-center gap-2 px-1">
                          <span className="text-[10px] font-semibold text-foreground/70">월 종료</span>
                          <div className="flex-1 border-t border-border/40" />
                        </div>
                        {endOffsets.map(off => {
                          const rowTasks = endEntries.filter(e => getEffectiveOffset(e) === off)
                          return (
                            <div key={`e${off}`} className="flex min-h-[28px]">
                              <div className="flex w-16 shrink-0 items-start justify-end pr-2 pt-1.5">
                                <span className="text-[10px] font-mono text-muted-foreground/50">{offsetLabel(off, '시작일', '종료일')}</span>
                              </div>
                              <div className="flex-1 border-l border-border py-0.5 pl-2 space-y-0.5">
                                {rowTasks.map(entry => (
                                  <LeftTaskCard key={entry.template.id} entry={entry} isEditing={editingTaskId === entry.template.id} onEdit={() => setEditingTaskId(editingTaskId === entry.template.id ? null : entry.template.id)} onSave={saveRecurrence} onRemove={removeTask} isCustom={entry.template.id.startsWith('custom-')} onRemoveCustom={removeCustomTemplate} offsetMode onSaveOffset={saveDayOffset} startWord="시작일" endWord="종료일" />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </>
              )}
            </div>
          </ScrollArea>

          {/* Add button */}
          <div className="border-t border-border px-3 py-2">
            <Button
              size="sm" variant="ghost"
              className="h-7 w-full text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => { setCreateTarget({ panel: 'left', tab: leftTab }); setCreateModalOpen(true) }}
            >
              <Plus className="mr-1 h-3 w-3" /> 반복 Task 추가
            </Button>
          </div>
        </div>

        {/* ===== RIGHT PANEL: Track Lifecycle / Calendar ===== */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex h-[72px] flex-col justify-between border-b border-border">
            <div className="flex items-center gap-2 px-3 pt-2">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">트랙 일정</span>
              <span className="ml-auto rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{rightCount}</span>
            </div>
            <div className="flex items-center gap-1 px-3 pb-1.5">
              <div className="flex overflow-hidden rounded-full border border-border">
                <button
                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${rightView === 'timeline' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary/60'}`}
                  onClick={() => setRightView('timeline')}
                >트랙흐름</button>
                <button
                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${rightView === 'month' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary/60'}`}
                  onClick={() => setRightView('month')}
                >월별</button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {rightView === 'timeline' ? (
                rightSections.map(section => (
                  <TimelineSection
                    key={section.id}
                    section={section}
                    editingTaskId={editingTaskId}
                    onEditTask={(id) => setEditingTaskId(editingTaskId === id ? null : id)}
                    onRemoveCustom={removeCustomTemplate}
                    onAddTask={() => { setCreateTarget({ panel: 'right', sectionId: section.id }); setCreateModalOpen(true) }}
                  />
                ))
              ) : (
                <MonthView
                  currentMonth={currentMonth}
                  calendarDays={calendarDays}
                  onPrev={() => setCurrentMonth(m => addMonths(m, -1))}
                  onNext={() => setCurrentMonth(m => addMonths(m, 1))}
                  chapters={data.chapters}
                  trackStart={data.parsedSchedule?.trackStart}
                  trackEnd={data.parsedSchedule?.trackEnd}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* ===== BOTTOM STATUS BAR ===== */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-muted-foreground">전체 Task</span>
          <strong className="text-foreground">{totalTasks}</strong>
          <span className="mx-1 h-3 w-px bg-border" />
          <span className="text-muted-foreground">반복</span>
          <strong className="text-foreground">{leftCount}</strong>
          <span className="mx-1 h-3 w-px bg-border" />
          <span className="text-muted-foreground">일정</span>
          <strong className="text-foreground">{rightCount}</strong>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground" onClick={() => setSheetOpen(true)}>
          전체 Task 시트 보기 <ChevronUp className="ml-1 h-3 w-3" />
        </Button>
      </div>

      {sheetOpen && (
        <SheetOverlay allTemplates={allTemplates} recurringTasks={recurringTasks} onClose={() => setSheetOpen(false)} onRemoveCustom={removeCustomTemplate} />
      )}

      <CreateTaskModal open={createModalOpen} onOpenChange={setCreateModalOpen} target={createTarget} chapters={data.chapters} onAdd={addCustomTemplate} />
    </div>
  )
}

// === Left Panel Task Card ===

function LeftTaskCard({
  entry, isEditing, onEdit, onSave, onRemove, isCustom, onRemoveCustom, hideRecurrenceEditor,
  offsetMode, onSaveOffset, startWord, endWord,
}: {
  entry: RecurringTaskEntry
  isEditing: boolean
  onEdit: () => void
  onSave: (tplId: string, config: RecurrenceConfig) => void
  onRemove: (tplId: string) => void
  isCustom: boolean
  onRemoveCustom: (tplId: string) => void
  hideRecurrenceEditor?: boolean
  offsetMode?: boolean
  onSaveOffset?: (tplId: string, offset: number) => void
  startWord?: string
  endWord?: string
}) {
  const { template, recurrence } = entry
  const tags = getTaskTags(template)

  return (
    <div className={`rounded-lg transition-all ${isEditing ? 'ring-1 ring-foreground/10 shadow-sm' : ''}`}>
      <div
        onClick={onEdit}
        className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] cursor-pointer transition-colors ${
          isEditing ? 'bg-foreground/[0.05]' : 'bg-foreground/[0.02] hover:bg-foreground/[0.05]'
        }`}
      >
        <div className="min-w-0 flex-1 overflow-hidden">
          <span className="block truncate font-medium text-foreground/90 leading-tight">{template.title}</span>
        </div>
        <span className="shrink-0 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
          {ROLE_LABELS[template.driRole]}
        </span>
        {recurrence?.time && (
          <span className="shrink-0 rounded bg-foreground/[0.08] px-1.5 py-0.5 text-[9px] font-mono text-foreground/60">{recurrence.time}</span>
        )}
        {recurrence?.daysOfWeek && recurrence.daysOfWeek.length > 0 && template.frequency === 'weekly' && (
          <span className="shrink-0 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] text-muted-foreground">
            {recurrence.daysOfWeek.map(d => DAY_LABELS[d]).join(',')}
          </span>
        )}
        {isCustom ? (
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveCustom(template.id) }}
            className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-60 hover:bg-destructive/10 transition-all"
          ><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(template.id) }}
            className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-40 hover:bg-secondary transition-all"
            title="제외"
          ><X className="h-3 w-3 text-muted-foreground" /></button>
        )}
      </div>

      {isEditing && (
        <div className="border-t border-border/50 bg-foreground/[0.02] px-3 py-2.5 rounded-b-lg space-y-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map(tag => (
              <span key={tag} className="inline-flex rounded-full bg-foreground/[0.06] px-1.5 py-0.5 text-[8px] font-medium text-muted-foreground">{TAG_LABELS[tag]}</span>
            ))}
            {template.scope && (
              <span className="inline-flex rounded-full border border-border px-1.5 py-0.5 text-[8px] font-medium text-muted-foreground">
                {template.scope === 'common' ? '공통' : '개별'}
              </span>
            )}
            {template.output && (
              <span className="text-[9px] text-muted-foreground/50">산출물: {template.output}</span>
            )}
          </div>

          {!hideRecurrenceEditor && !offsetMode && (
            <InlineRecurrenceEditor
              tplId={template.id}
              defaultType={template.frequency === 'weekly' ? 'weekly' : template.frequency === 'monthly' ? 'monthly' : 'daily'}
              currentConfig={recurrence}
              onSave={onSave}
              onCancel={onEdit}
            />
          )}

          {offsetMode && onSaveOffset && (
            <InlineOffsetEditor
              tplId={template.id}
              currentOffset={getEffectiveOffset(entry)}
              startWord={startWord || '시작일'}
              endWord={endWord || '종료일'}
              onSave={onSaveOffset}
              onCancel={onEdit}
            />
          )}

          {hideRecurrenceEditor && !offsetMode && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground/70">각 챕터 시작 시 자동 생성됩니다.</p>
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2 text-muted-foreground" onClick={(e) => { e.stopPropagation(); onEdit() }}>닫기</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// === Inline Recurrence Editor ===

function InlineRecurrenceEditor({
  tplId, defaultType, currentConfig, onSave, onCancel,
}: {
  tplId: string
  defaultType: RecurrenceConfig['type']
  currentConfig?: RecurrenceConfig
  onSave: (tplId: string, config: RecurrenceConfig) => void
  onCancel: () => void
}) {
  const [config, setConfig] = useState<RecurrenceConfig>(
    currentConfig || { type: defaultType, time: '09:00', daysOfWeek: [1, 2, 3, 4, 5] }
  )

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">반복 주기</Label>
          <Select value={config.type} onValueChange={v => setConfig(prev => ({ ...prev, type: v as RecurrenceConfig['type'] }))}>
            <SelectTrigger className="h-7 text-[10px] bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">매일</SelectItem>
              <SelectItem value="weekly">매주</SelectItem>
              <SelectItem value="monthly">매월</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">시간</Label>
          <Input
            type="time"
            value={config.time || '09:00'}
            onChange={e => setConfig(prev => ({ ...prev, time: e.target.value }))}
            className="h-7 text-[10px] bg-background border-border"
          />
        </div>
      </div>

      {config.type === 'weekly' && (
        <div className="space-y-1">
          <Label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">요일</Label>
          <div className="flex gap-1">
            {DAY_LABELS.map((label, idx) => {
              if (idx === 0 || idx === 6) return null
              const active = (config.daysOfWeek || [1]).includes(idx)
              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    const days = config.daysOfWeek || [1]
                    const next = active ? days.filter(d => d !== idx) : [...days, idx].sort()
                    setConfig(prev => ({ ...prev, daysOfWeek: next.length > 0 ? next : [1] }))
                  }}
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-[9px] font-medium transition-all ${
                    active
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-background text-muted-foreground border border-border hover:border-foreground/20'
                  }`}
                >{label}</button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-0.5">
        <p className="text-[9px] text-muted-foreground/50">
          {config.type === 'daily' && `평일 매일 ${config.time || '시간 미정'}`}
          {config.type === 'weekly' && `매주 ${(config.daysOfWeek || [1]).map(d => DAY_LABELS[d]).join(',')} ${config.time || ''}`}
          {config.type === 'monthly' && `매월 ${config.time || '시간 미정'}`}
        </p>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2 text-muted-foreground" onClick={(e) => { e.stopPropagation(); onCancel() }}>취소</Button>
          <Button size="sm" className="h-6 text-[9px] px-2.5 bg-foreground text-background hover:bg-foreground/90" onClick={(e) => { e.stopPropagation(); onSave(tplId, config) }}>저장</Button>
        </div>
      </div>
    </div>
  )
}

// === Inline Offset Editor (for per_chapter/monthly tasks) ===

function InlineOffsetEditor({ tplId, currentOffset, startWord, endWord, onSave, onCancel }: {
  tplId: string
  currentOffset: number
  startWord: string
  endWord: string
  onSave: (tplId: string, offset: number) => void
  onCancel: () => void
}) {
  const [base, setBase] = useState<'start' | 'end'>(currentOffset < 0 ? 'end' : 'start')
  const [dayNum, setDayNum] = useState(() => {
    if (currentOffset >= 0) return currentOffset
    return Math.abs(currentOffset) - 1
  })

  const effectiveOffset = base === 'start' ? dayNum : -(dayNum + 1)
  const preview = offsetLabel(effectiveOffset, startWord, endWord)

  return (
    <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">기준</span>
        <div className="flex gap-1">
          {([['start', startWord], ['end', endWord]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setBase(key); setDayNum(0) }}
              className={`rounded px-2 py-0.5 text-[10px] transition ${base === key ? 'bg-foreground text-background font-medium' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">{base === 'start' ? '+' : '-'}</span>
        <input
          type="number"
          min={0}
          max={30}
          value={dayNum}
          onChange={(e) => setDayNum(Math.max(0, parseInt(e.target.value) || 0))}
          className="h-6 w-14 rounded border border-border bg-background px-1.5 text-[11px] text-center"
        />
        <span className="text-[10px] text-muted-foreground">일</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground">{preview}에 생성</span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2 text-muted-foreground" onClick={onCancel}>취소</Button>
          <Button size="sm" className="h-6 text-[9px] px-2" onClick={() => onSave(tplId, effectiveOffset)}>저장</Button>
        </div>
      </div>
    </div>
  )
}

// === Timeline Section (Right Panel) ===

function TimelineSection({
  section, editingTaskId, onEditTask, onRemoveCustom, onAddTask,
}: {
  section: LifecycleSection
  editingTaskId: string | null
  onEditTask: (id: string) => void
  onRemoveCustom: (id: string) => void
  onAddTask: () => void
}) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between bg-secondary/30 px-3 py-2 text-left transition-colors hover:bg-secondary/50"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${collapsed ? '-rotate-90' : ''}`} />
          <span className="text-xs font-semibold text-foreground">{section.label}</span>
          <span className="rounded-full bg-foreground/[0.06] px-1.5 py-px text-[9px] text-muted-foreground">{section.tasks.length}</span>
        </div>
        {section.sublabel && (
          <span className="text-[10px] text-muted-foreground">{section.sublabel}</span>
        )}
      </button>

      {!collapsed && (
        <>
          {section.chapter && section.chapter.cards.length > 0 && (
            <div className="border-b border-border px-3 py-1.5">
              <div className="flex flex-wrap gap-1">
                {section.chapter.cards.map(card => (
                  <span key={card.id} className="inline-flex items-center rounded-md bg-foreground/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    {card.subjectName}
                    <span className="ml-1 opacity-50">{card.totalHours}h</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="px-2 py-1">
            {section.tasks.length === 0 && (
              <p className="py-3 text-center text-[10px] text-muted-foreground/50">배치된 Task가 없습니다</p>
            )}
            {section.tasks.map(tpl => {
              const isExpanded = editingTaskId === tpl.id
              const isCustom = tpl.id.startsWith('custom-')
              const tags = getTaskTags(tpl)
              return (
                <div key={tpl.id} className={`rounded-lg transition-all ${isExpanded ? 'ring-1 ring-foreground/10 shadow-sm my-1' : ''}`}>
                  <div
                    onClick={() => onEditTask(tpl.id)}
                    className={`group flex items-center gap-2 py-2 px-2 text-[10px] cursor-pointer rounded-lg transition-colors ${
                      isExpanded ? 'bg-foreground/[0.04]' : 'hover:bg-foreground/[0.03]'
                    }`}
                  >
                    <span className="truncate text-foreground/90 font-medium">{tpl.title}</span>
                    <span className="ml-auto shrink-0 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                      {ROLE_LABELS[tpl.driRole]}
                    </span>
                    {tpl.triggerOffset != null && tpl.triggerOffset !== 0 && (
                      <span className="shrink-0 rounded bg-foreground/[0.04] px-1 py-0.5 text-[9px] font-mono text-muted-foreground/60">
                        D{tpl.triggerOffset > 0 ? '+' : ''}{tpl.triggerOffset}
                      </span>
                    )}
                    {tpl.scope && (
                      <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[8px] font-medium text-muted-foreground">
                        {tpl.scope === 'common' ? '공통' : '개별'}
                      </span>
                    )}
                    {isCustom && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveCustom(tpl.id) }}
                        className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-60 hover:bg-destructive/10 transition-all"
                      ><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border/40 bg-foreground/[0.02] px-3 py-2.5 rounded-b-lg">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground/50">분류</span>
                          <div className="flex gap-1">
                            {tags.map(tag => (
                              <span key={tag} className="rounded-full bg-foreground/[0.06] px-1.5 py-0.5 text-[8px] font-medium text-muted-foreground">{TAG_LABELS[tag]}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground/50">담당</span>
                          <span className="font-medium text-foreground/70">{ROLE_LABELS[tpl.driRole]}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground/50">생성 기준</span>
                          <span className="font-medium text-foreground/70">
                            {section.type === 'pre_opening' && `개강 D${tpl.triggerOffset ?? 0}`}
                            {section.type === 'first_week' && `개강 D+${tpl.triggerOffset ?? 0}`}
                            {section.type === 'chapter' && (tpl.frequency === 'per_chapter' ? '챕터 시작' : '일정 연동')}
                            {section.type === 'closing' && `수료 D${tpl.triggerOffset ?? 0}`}
                            {section.type === 'adhoc' && '수동 생성'}
                          </span>
                        </div>
                        {tpl.scope && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground/50">구분</span>
                            <span className="font-medium text-foreground/70">{tpl.scope === 'common' ? '공통' : '개별'}</span>
                          </div>
                        )}
                      </div>
                      {tpl.output && (
                        <div className="mt-2 flex items-center gap-1.5 text-[9px] text-muted-foreground/50">
                          <BookOpen className="h-3 w-3" />
                          <span>산출물: {tpl.output}</span>
                        </div>
                      )}
                      <div className="mt-2.5 flex items-center justify-end gap-1 border-t border-border/30 pt-2">
                        {isCustom && (
                          <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2 text-destructive/70 hover:text-destructive hover:bg-destructive/5" onClick={(e) => { e.stopPropagation(); onRemoveCustom(tpl.id) }}>삭제</Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2 text-muted-foreground" onClick={(e) => { e.stopPropagation(); onEditTask(tpl.id) }}>닫기</Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="border-t border-border px-3 py-1.5">
            <button
              onClick={onAddTask}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <Plus className="h-3 w-3" /> 추가
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// === Month View ===

type CalendarEvent = {
  id: string
  label: string
  startDate: string
  endDate: string
  type: 'chapter' | 'subject'
}

function MonthView({
  currentMonth, calendarDays, onPrev, onNext, chapters, trackStart, trackEnd,
}: {
  currentMonth: Date
  calendarDays: Date[]
  onPrev: () => void
  onNext: () => void
  chapters: Chapter[]
  trackStart?: string
  trackEnd?: string
}) {
  const startDow = getDay(calendarDays[0])
  const emptyCells = startDow === 0 ? 6 : startDow - 1
  const monthStart = format(calendarDays[0], 'yyyy-MM-dd')
  const monthEnd = format(calendarDays[calendarDays.length - 1], 'yyyy-MM-dd')

  const events = useMemo(() => {
    const evts: CalendarEvent[] = []
    for (const ch of chapters) {
      if (ch.endDate < monthStart || ch.startDate > monthEnd) continue
      evts.push({ id: `ch-${ch.id}`, label: ch.name, startDate: ch.startDate, endDate: ch.endDate, type: 'chapter' })
      for (const card of ch.cards) {
        if (card.endDate < monthStart || card.startDate > monthEnd) continue
        evts.push({ id: `sub-${card.id}`, label: card.subjectName, startDate: card.startDate, endDate: card.endDate, type: 'subject' })
      }
    }
    return evts
  }, [chapters, monthStart, monthEnd])

  const weeks = useMemo(() => {
    const result: (Date | null)[][] = []
    let week: (Date | null)[] = Array.from({ length: emptyCells }, () => null)
    for (const day of calendarDays) {
      week.push(day)
      if (week.length === 7) { result.push(week); week = [] }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null)
      result.push(week)
    }
    return result
  }, [calendarDays, emptyCells])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onPrev} className="rounded-md p-1 hover:bg-secondary/60 transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-xs font-semibold text-foreground">{format(currentMonth, 'yyyy년 M월', { locale: ko })}</span>
        <button onClick={onNext} className="rounded-md p-1 hover:bg-secondary/60 transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {['월', '화', '수', '목', '금', '토', '일'].map(d => (
          <div key={d} className="py-1 text-center text-[10px] font-medium text-muted-foreground">{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const firstDay = week.find((d): d is Date => d !== null)
        const lastDay = [...week].reverse().find((d): d is Date => d !== null)
        if (!firstDay || !lastDay) return <div key={wi} className="h-6" />
        const weekStartStr = format(firstDay, 'yyyy-MM-dd')
        const weekEndStr = format(lastDay, 'yyyy-MM-dd')
        const weekEvents = events.filter(evt => evt.startDate <= weekEndStr && evt.endDate >= weekStartStr)

        return (
          <div key={wi}>
            <div className="grid grid-cols-7 border-b border-border/40">
              {week.map((day, di) => {
                if (!day) return <div key={`null-${di}`} className="h-5" />
                const ds = format(day, 'yyyy-MM-dd')
                const inTrack = trackStart && trackEnd ? ds >= trackStart && ds <= trackEnd : false
                const weekend = isWeekend(day)
                return (
                  <div key={ds} className={`h-5 text-center ${!inTrack ? 'opacity-25' : ''}`}>
                    <span className={`text-[10px] font-medium ${weekend ? 'text-muted-foreground/50' : 'text-foreground'}`}>{format(day, 'd')}</span>
                  </div>
                )
              })}
            </div>
            <div className="relative mb-0.5" style={{ minHeight: weekEvents.length > 0 ? weekEvents.length * 18 + 2 : 6 }}>
              {weekEvents.map((evt, ei) => {
                let startCol = 0
                let endCol = 6
                for (let i = 0; i < 7; i++) { const d = week[i]; if (d && format(d, 'yyyy-MM-dd') >= evt.startDate) { startCol = i; break } }
                for (let i = 6; i >= 0; i--) { const d = week[i]; if (d && format(d, 'yyyy-MM-dd') <= evt.endDate) { endCol = i; break } }
                if (startCol > endCol) return null
                const startsHere = week[startCol] && format(week[startCol]!, 'yyyy-MM-dd') <= evt.startDate
                const endsHere = week[endCol] && format(week[endCol]!, 'yyyy-MM-dd') >= evt.endDate
                const leftPct = (startCol / 7) * 100
                const widthPct = ((endCol - startCol + 1) / 7) * 100
                return (
                  <div
                    key={evt.id}
                    className={`absolute h-[16px] px-1.5 text-[9px] font-medium leading-[16px] truncate ${
                      evt.type === 'chapter' ? 'bg-foreground/10 text-foreground/70 font-semibold' : 'bg-foreground/[0.05] text-muted-foreground'
                    } ${startsHere ? 'rounded-l-sm' : ''} ${endsHere ? 'rounded-r-sm' : ''}`}
                    style={{ top: ei * 18, left: `${leftPct}%`, width: `${widthPct}%` }}
                  >{evt.label}</div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// === Sheet Overlay ===

function SheetOverlay({
  allTemplates, recurringTasks, onClose, onRemoveCustom,
}: {
  allTemplates: TaskTemplateConfig[]
  recurringTasks: Map<string, RecurringTaskEntry>
  onClose: () => void
  onRemoveCustom: (id: string) => void
}) {
  const [activeFilter, setActiveFilter] = useState<TaskTag | 'all'>('all')

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allTemplates.length }
    for (const tpl of allTemplates) {
      for (const tag of getTaskTags(tpl)) { counts[tag] = (counts[tag] || 0) + 1 }
    }
    return counts
  }, [allTemplates])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return allTemplates
    return allTemplates.filter(t => getTaskTags(t).includes(activeFilter as TaskTag))
  }, [allTemplates, activeFilter])

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="h-[70vh] overflow-hidden rounded-t-2xl border-t border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">전체 Task 시트</span>
            <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{allTemplates.length}</span>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
            <X className="mr-1 h-3 w-3" /> 닫기
          </Button>
        </div>

        <div className="border-b border-border px-4 py-2">
          <div className="flex items-center gap-1 flex-wrap">
            <FilterPill active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>전체 ({tagCounts.all})</FilterPill>
            {(['repeat', 'track', 'schedule'] as TagGroup[]).map(group => (
              <div key={group} className="flex items-center gap-1">
                <div className="mx-1 h-3 w-px bg-border" />
                <span className="mr-0.5 rounded bg-foreground/[0.04] px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground/60">{TAG_GROUP_LABELS[group]}</span>
                {TAG_GROUPS[group].map(tag => (
                  <FilterPill key={tag} active={activeFilter === tag} onClick={() => setActiveFilter(tag)}>
                    {TAG_LABELS[tag]} ({tagCounts[tag] || 0})
                  </FilterPill>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_52px_1fr_52px_72px] gap-2 border-b border-border bg-secondary/40 px-4 py-1.5 text-[10px] font-medium text-muted-foreground">
          <span>Task</span><span>담당</span><span>분류</span><span>구분</span><span>배치</span>
        </div>

        <ScrollArea className="h-[calc(70vh-140px)]">
          <div>
            {filtered.map(tpl => {
              const tags = getTaskTags(tpl)
              const isLeft = classifyToSection(tpl) === 'left' || tpl.frequency === 'per_chapter'
              const isPlaced = isLeft ? recurringTasks.has(tpl.id) : true
              const isCustom = tpl.id.startsWith('custom-')
              return (
                <div key={tpl.id} className={`group grid grid-cols-[1fr_52px_1fr_52px_72px] gap-2 border-b border-border px-4 py-2 text-xs ${isPlaced ? '' : 'opacity-50'}`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-medium text-foreground">{tpl.title}</span>
                    {isCustom && (
                      <button onClick={() => onRemoveCustom(tpl.id)} className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{ROLE_LABELS[tpl.driRole]}</span>
                  <div className="flex flex-wrap items-center gap-0.5 min-w-0">
                    {tags.map(tag => {
                      const group = tagBelongsToGroup(tag)
                      return (
                        <span key={tag} className={`inline-flex shrink-0 rounded px-1 py-px text-[8px] font-medium leading-tight ${
                          group === 'repeat' ? 'bg-foreground/[0.07] text-foreground/60' : group === 'track' ? 'bg-foreground/[0.12] text-foreground/70' : 'border border-border text-muted-foreground'
                        }`}>{TAG_LABELS[tag]}</span>
                      )
                    })}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{tpl.scope === 'common' ? '공통' : tpl.scope === 'individual' ? '개별' : '—'}</span>
                  <span className={`text-[10px] ${isPlaced ? 'text-foreground' : 'text-muted-foreground/50'}`}>{isPlaced ? '배치' : '미배치'}</span>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
        active ? 'bg-foreground text-background' : 'bg-secondary/80 text-muted-foreground hover:bg-secondary'
      }`}
    >{children}</button>
  )
}

// === Create Task Modal ===

function CreateTaskModal({
  open, onOpenChange, target, chapters, onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: { panel: 'left'; tab: LeftTab } | { panel: 'right'; sectionId: string } | null
  chapters: Chapter[]
  onAdd: (tpl: TaskTemplateConfig) => void
}) {
  const [title, setTitle] = useState('')
  const [role, setRole] = useState<DriRole>('learning_manager')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'once' | 'per_chapter' | 'ad_hoc'>('daily')
  const [triggerType, setTriggerType] = useState('daily')
  const [triggerOffset, setTriggerOffset] = useState(0)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setRole('learning_manager')
    if (target?.panel === 'left') {
      const tab = target.tab
      if (tab === 'per_chapter') { setFrequency('per_chapter'); setTriggerType('schedule') }
      else { setFrequency(tab); setTriggerType(tab) }
    } else if (target?.panel === 'right') {
      const sId = target.sectionId
      if (sId === 'sec-pre') { setFrequency('once'); setTriggerType('opening_d'); setTriggerOffset(-7) }
      else if (sId === 'sec-first') { setFrequency('once'); setTriggerType('opening_week'); setTriggerOffset(1) }
      else if (sId === 'sec-closing') { setFrequency('once'); setTriggerType('closing_d'); setTriggerOffset(-5) }
      else if (sId === 'sec-adhoc') { setFrequency('ad_hoc'); setTriggerType('ad_hoc') }
      else if (sId.startsWith('sec-ch-')) { setFrequency('per_chapter'); setTriggerType('schedule') }
      else { setFrequency('once'); setTriggerType('ad_hoc') }
    } else { setFrequency('daily'); setTriggerType('daily') }
  }, [open, target])

  const handleCreate = () => {
    if (!title.trim()) return
    const tpl: TaskTemplateConfig = {
      id: `custom-${Date.now()}`,
      number: 900 + Math.floor(Math.random() * 100),
      category: '커스텀',
      subcategory: '사용자 추가',
      title: title.trim(),
      driRole: role,
      frequency,
      triggerType,
      triggerOffset: triggerOffset || undefined,
      priority: 'medium',
    }
    onAdd(tpl)
    setTitle('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">새 Task 추가</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {target?.panel === 'left' ? '반복 일정에 추가됩니다.' : target?.panel === 'right' ? '트랙 일정에 추가됩니다.' : '새 Task를 생성합니다.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Task 이름</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 주간 리포트 작성" className="h-8 text-xs" onKeyDown={e => { if (e.key === 'Enter') handleCreate() }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">담당 역할</Label>
              <Select value={role} onValueChange={v => setRole(v as DriRole)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">빈도</Label>
              <Select value={frequency} onValueChange={v => {
                setFrequency(v as typeof frequency)
                if (v === 'daily' || v === 'weekly' || v === 'monthly') setTriggerType(v)
                else if (v === 'per_chapter') setTriggerType('schedule')
                else if (v === 'ad_hoc') setTriggerType('ad_hoc')
                else setTriggerType('opening_d')
              }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">매일</SelectItem>
                  <SelectItem value="weekly">매주</SelectItem>
                  <SelectItem value="monthly">매월</SelectItem>
                  <SelectItem value="once">1회성</SelectItem>
                  <SelectItem value="per_chapter">챕터별</SelectItem>
                  <SelectItem value="ad_hoc">수시</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {frequency === 'once' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">트리거</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opening_d">개강 기준</SelectItem>
                    <SelectItem value="opening_week">개강 주차</SelectItem>
                    <SelectItem value="closing_d">수료 기준</SelectItem>
                    <SelectItem value="schedule">일정 연동</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">D+/- 오프셋</Label>
                <Input type="number" value={triggerOffset} onChange={e => setTriggerOffset(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>취소</Button>
          <Button size="sm" onClick={handleCreate} disabled={!title.trim()}>추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
