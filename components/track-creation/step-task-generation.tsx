'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  Plus, Clock, CalendarDays, BookOpen, CalendarRange,
  Layers, Info, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { generateTasks } from '@/lib/task-generator'
import { taskTemplates, ROLE_LABELS } from '@/lib/task-templates'
import type {
  TrackCreationData, RecurrenceConfig, TaskTemplateConfig, Chapter, DriRole,
} from '@/lib/track-creation-types'

interface StepTaskGenerationProps {
  data: TrackCreationData
  updateData: (partial: Partial<TrackCreationData>) => void
}

type AdHocScheduleMode = 'daily' | 'weekly' | 'track_phase'

interface TemplateState {
  enabled: boolean
  time?: string
  daysOfWeek?: number[]
  biweekly?: boolean
  triggerOffset?: number
  triggerType?: string
  adHocMode?: AdHocScheduleMode
}

const DEFAULT_TIMES: Record<string, string> = {
  'tpl-43': '09:00',
  'tpl-44': '09:00',
  'tpl-45': '09:00',
  'tpl-46': '13:00',
  'tpl-48': '14:00',
  'tpl-47': '15:00',
  'tpl-40': '18:00',
}

const TIME_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const h = i + 8
  return `${String(h).padStart(2, '0')}:00`
})

const DAY_LABELS_SHORT = ['일', '월', '화', '수', '목', '금', '토']

type FrequencyKey = 'daily' | 'weekly' | 'per_chapter' | 'monthly' | 'once' | 'ad_hoc'

const SECTION_META: {
  id: FrequencyKey
  title: string
  description: string
  icon: typeof Clock
}[] = [
  {
    id: 'daily',
    title: '매일 반복 업무',
    description: '학관매가 매일 수행하는 핵심 업무예요. 필요 없는 건 체크 해제하고, 시간을 바꾸고 싶으면 시간을 눌러주세요.',
    icon: Clock,
  },
  {
    id: 'weekly',
    title: '주간 반복 업무',
    description: '매주 특정 요일에 반복되는 업무예요. 요일을 바꾸고 싶으면 요일 버튼을 눌러주세요.',
    icon: CalendarDays,
  },
  {
    id: 'per_chapter',
    title: '챕터별 업무',
    description: '각 챕터가 시작되거나 끝날 때 자동으로 생기는 업무예요. 챕터 일정이 바뀌면 같이 조정돼요.',
    icon: BookOpen,
  },
  {
    id: 'monthly',
    title: '월간 업무',
    description: '매월 반복되는 업무예요.',
    icon: CalendarRange,
  },
  {
    id: 'once',
    title: '트랙 일정 업무',
    description: '개강 전, 개강 후, 수료 준비 등 특정 시점에 한 번 수행하는 업무예요.',
    icon: Layers,
  },
  {
    id: 'ad_hoc',
    title: '수시 업무',
    description: '트랙 운영 중 필요할 때 수행하는 업무예요. 지금 추가하지 않아도 운영 중 언제든 추가할 수 있어요.',
    icon: Info,
  },
]

function groupByFrequency(templates: TaskTemplateConfig[]): Record<FrequencyKey, TaskTemplateConfig[]> {
  const result: Record<FrequencyKey, TaskTemplateConfig[]> = {
    daily: [], weekly: [], per_chapter: [], monthly: [], once: [], ad_hoc: [],
  }
  for (const tpl of templates) {
    const key = tpl.frequency as FrequencyKey
    if (result[key]) result[key].push(tpl)
  }
  return result
}

function groupOnceByPhase(templates: TaskTemplateConfig[]) {
  const phases: { label: string; key: string; templates: TaskTemplateConfig[] }[] = [
    { label: '개강 전', key: 'pre', templates: [] },
    { label: '개강 직후', key: 'opening', templates: [] },
    { label: '본과정 중', key: 'main', templates: [] },
    { label: '수료 준비', key: 'closing', templates: [] },
  ]
  for (const tpl of templates) {
    if (tpl.triggerType === 'opening_d' && (tpl.triggerOffset ?? 0) < 0) {
      phases[0].templates.push(tpl)
    } else if (tpl.triggerType === 'opening_d' || tpl.triggerType === 'opening_week') {
      phases[1].templates.push(tpl)
    } else if (tpl.triggerType === 'closing_d') {
      phases[3].templates.push(tpl)
    } else {
      phases[2].templates.push(tpl)
    }
  }
  return phases.filter(p => p.templates.length > 0)
}

function buildInitialStates(
  allTemplates: TaskTemplateConfig[],
  existingConfigs: Record<string, RecurrenceConfig>,
): Map<string, TemplateState> {
  const map = new Map<string, TemplateState>()
  const hasExisting = Object.keys(existingConfigs).length > 0

  for (const tpl of allTemplates) {
    const existingConfig = existingConfigs[tpl.id]

    if (hasExisting) {
      map.set(tpl.id, {
        enabled: !!existingConfig || tpl.frequency === 'once' || tpl.frequency === 'per_chapter',
        time: existingConfig?.time || (tpl.frequency === 'daily' ? DEFAULT_TIMES[tpl.id] : undefined),
        daysOfWeek: existingConfig?.daysOfWeek || (tpl.frequency === 'weekly' ? [1] : undefined),
        triggerOffset: tpl.triggerOffset,
        triggerType: tpl.triggerType,
        ...(tpl.frequency === 'ad_hoc' ? { adHocMode: 'daily' as AdHocScheduleMode, time: '09:00' } : {}),
      })
    } else {
      map.set(tpl.id, {
        enabled: tpl.frequency !== 'ad_hoc',
        time: tpl.frequency === 'daily' ? (DEFAULT_TIMES[tpl.id] || undefined) : undefined,
        daysOfWeek: tpl.frequency === 'weekly' ? [1] : undefined,
        triggerOffset: tpl.triggerOffset,
        triggerType: tpl.triggerType,
        ...(tpl.frequency === 'ad_hoc' ? { adHocMode: 'daily' as AdHocScheduleMode, time: '09:00' } : {}),
      })
    }
  }
  return map
}

// ─── Main Component ──────────────────────────────────────────────

export function StepTaskGeneration({ data, updateData }: StepTaskGenerationProps) {
  const allTemplates = useMemo(
    () => [...taskTemplates, ...data.customTemplates],
    [data.customTemplates],
  )
  const grouped = useMemo(() => groupByFrequency(allTemplates), [allTemplates])
  const oncePhases = useMemo(() => groupOnceByPhase(grouped.once), [grouped.once])

  const [states, setStates] = useState<Map<string, TemplateState>>(
    () => buildInitialStates(allTemplates, data.recurrenceConfigs),
  )

  const sortedDaily = useMemo(() => {
    return [...grouped.daily].sort((a, b) => {
      const aTime = states.get(a.id)?.time
      const bTime = states.get(b.id)?.time
      if (!aTime && bTime) return -1
      if (aTime && !bTime) return 1
      return (aTime || '').localeCompare(bTime || '')
    })
  }, [grouped.daily, states])

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createTarget, setCreateTarget] = useState<FrequencyKey | null>(null)

  const isFirstRender = useRef(true)

  const toggleTemplate = useCallback((tplId: string) => {
    setStates(prev => {
      const next = new Map(prev)
      const cur = next.get(tplId)
      if (cur) next.set(tplId, { ...cur, enabled: !cur.enabled })
      return next
    })
  }, [])

  const updateTime = useCallback((tplId: string, time: string) => {
    setStates(prev => {
      const next = new Map(prev)
      const cur = next.get(tplId)
      if (cur) next.set(tplId, { ...cur, time })
      return next
    })
  }, [])

  const updateTrigger = useCallback((tplId: string, offset: number, type?: string) => {
    setStates(prev => {
      const next = new Map(prev)
      const cur = next.get(tplId)
      if (cur) next.set(tplId, { ...cur, triggerOffset: offset, ...(type ? { triggerType: type } : {}) })
      return next
    })
  }, [])

  const toggleDay = useCallback((tplId: string, day: number) => {
    setStates(prev => {
      const next = new Map(prev)
      const cur = next.get(tplId)
      if (cur) {
        const days = cur.daysOfWeek || [1]
        const updated = days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort()
        next.set(tplId, { ...cur, daysOfWeek: updated.length > 0 ? updated : [1] })
      }
      return next
    })
  }, [])

  const toggleBiweekly = useCallback((tplId: string) => {
    setStates(prev => {
      const next = new Map(prev)
      const cur = next.get(tplId)
      if (cur) next.set(tplId, { ...cur, biweekly: !cur.biweekly })
      return next
    })
  }, [])

  const updateAdHocMode = useCallback((tplId: string, mode: AdHocScheduleMode) => {
    setStates(prev => {
      const next = new Map(prev)
      const cur = next.get(tplId)
      if (cur) {
        const updates: Partial<TemplateState> = { adHocMode: mode }
        if (mode === 'daily') { updates.time = '09:00' }
        if (mode === 'weekly') { updates.daysOfWeek = [1]; updates.biweekly = false }
        if (mode === 'track_phase') { updates.triggerType = 'opening_d'; updates.triggerOffset = 0 }
        next.set(tplId, { ...cur, ...updates })
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!data.parsedSchedule) return

    const configs: Record<string, RecurrenceConfig> = {}
    const enabledIds = new Set<string>()

    for (const [tplId, state] of states) {
      if (!state.enabled) continue
      enabledIds.add(tplId)

      const tpl = allTemplates.find(t => t.id === tplId)
      if (!tpl) continue

      if (tpl.frequency === 'daily') {
        configs[tplId] = { type: 'daily', time: state.time || '09:00', daysOfWeek: [1, 2, 3, 4, 5] }
      } else if (tpl.frequency === 'weekly') {
        configs[tplId] = { type: 'weekly', time: '09:00', daysOfWeek: state.daysOfWeek || [1] }
      } else if (tpl.frequency === 'monthly') {
        configs[tplId] = { type: 'monthly', time: '09:00' }
      }
    }

    const allTasks = generateTasks(
      data.parsedSchedule.trackStart,
      data.parsedSchedule.trackEnd,
      data.chapters,
      configs,
    )
    const enabledTasks = allTasks.filter(t => enabledIds.has(t.templateId))
    updateData({ generatedTasks: enabledTasks, recurrenceConfigs: configs })

    if (isFirstRender.current) isFirstRender.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states, data.parsedSchedule, data.chapters])

  const addCustomTemplate = useCallback((tpl: TaskTemplateConfig) => {
    updateData({ customTemplates: [...data.customTemplates, tpl] })
    setStates(prev => {
      const next = new Map(prev)
      next.set(tpl.id, {
        enabled: tpl.frequency !== 'ad_hoc',
        time: tpl.frequency === 'daily' ? '09:00' : undefined,
        daysOfWeek: tpl.frequency === 'weekly' ? [1] : undefined,
      })
      return next
    })
    setCreateModalOpen(false)
  }, [data.customTemplates, updateData])

  return (
    <div className="space-y-10 pb-4">
      {/* ── Daily ── */}
      <Section meta={SECTION_META[0]} count={grouped.daily.length}>
        <div className="space-y-0.5">
          {sortedDaily.map(tpl => (
            <TaskRow key={tpl.id} tpl={tpl} state={states.get(tpl.id)} onToggle={toggleTemplate}>
              {states.get(tpl.id)?.enabled && (
                <TimeSelect value={states.get(tpl.id)?.time} onChange={t => updateTime(tpl.id, t)} />
              )}
            </TaskRow>
          ))}
        </div>
        <AddButton label="매일 반복 업무 추가" onClick={() => { setCreateTarget('daily'); setCreateModalOpen(true) }} />
      </Section>

      {/* ── Weekly ── */}
      <Section meta={SECTION_META[1]} count={grouped.weekly.length}>
        <div className="space-y-0.5">
          {grouped.weekly.map(tpl => {
            const st = states.get(tpl.id)
            return (
              <TaskRow key={tpl.id} tpl={tpl} state={st} onToggle={toggleTemplate}>
                {st?.enabled && (
                  <DaySelect
                    days={st.daysOfWeek || [1]}
                    onToggle={d => toggleDay(tpl.id, d)}
                    biweekly={st.biweekly ?? false}
                    onToggleBiweekly={() => toggleBiweekly(tpl.id)}
                  />
                )}
              </TaskRow>
            )
          })}
        </div>
        <AddButton label="주간 반복 업무 추가" onClick={() => { setCreateTarget('weekly'); setCreateModalOpen(true) }} />
      </Section>

      {/* ── Per Chapter ── */}
      <Section meta={SECTION_META[2]} count={grouped.per_chapter.length}>
        <div className="space-y-0.5">
          {grouped.per_chapter.map(tpl => {
            const st = states.get(tpl.id)
            return (
              <TaskRow key={tpl.id} tpl={tpl} state={st} onToggle={toggleTemplate}>
                {st?.enabled && (
                  <ChapterOffsetSelect
                    offset={st.triggerOffset ?? tpl.triggerOffset ?? 0}
                    onChange={v => updateTrigger(tpl.id, v)}
                  />
                )}
              </TaskRow>
            )
          })}
        </div>
        <AddButton label="챕터별 업무 추가" onClick={() => { setCreateTarget('per_chapter'); setCreateModalOpen(true) }} />
      </Section>

      {/* ── Monthly ── */}
      <Section meta={SECTION_META[3]} count={grouped.monthly.length}>
        <div className="space-y-0.5">
          {grouped.monthly.map(tpl => {
            const st = states.get(tpl.id)
            return (
              <TaskRow key={tpl.id} tpl={tpl} state={st} onToggle={toggleTemplate}>
                {st?.enabled && (
                  <MonthDaySelect
                    offset={st.triggerOffset ?? tpl.triggerOffset ?? 1}
                    onChange={v => updateTrigger(tpl.id, v)}
                  />
                )}
              </TaskRow>
            )
          })}
        </div>
      </Section>

      {/* ── Once (grouped by phase) ── */}
      <Section meta={SECTION_META[4]} count={grouped.once.length}>
        {oncePhases.map(phase => (
          <div key={phase.key} className="space-y-0.5">
            <p className="pl-1 pt-2 text-[11px] font-semibold text-muted-foreground/70">{phase.label}</p>
            {phase.templates.map(tpl => {
              const st = states.get(tpl.id)
              return (
                <TaskRow key={tpl.id} tpl={tpl} state={st} onToggle={toggleTemplate}>
                  {st?.enabled && (
                    <OnceTriggerSelect
                      triggerType={st.triggerType ?? tpl.triggerType ?? 'opening_d'}
                      offset={st.triggerOffset ?? tpl.triggerOffset ?? 0}
                      onChange={(type, off) => updateTrigger(tpl.id, off, type)}
                    />
                  )}
                </TaskRow>
              )
            })}
          </div>
        ))}
      </Section>

      {/* ── Ad Hoc ── */}
      <Section meta={SECTION_META[5]} count={grouped.ad_hoc.length}>
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2.5 mb-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            체크하면 일정 설정이 필요해요.
            <span className="font-medium text-foreground/70"> 매일 반복, 매주/격주, 트랙 흐름(개강/수료 전후) 중 선택할 수 있어요.</span>
            {' '}지금 추가하지 않아도 운영 중 언제든 추가할 수 있어요.
          </p>
        </div>
        <div className="space-y-0.5">
          {grouped.ad_hoc.map(tpl => {
            const st = states.get(tpl.id)
            return (
              <TaskRow key={tpl.id} tpl={tpl} state={st} onToggle={toggleTemplate}>
                {st?.enabled && (
                  <AdHocScheduleSelect
                    mode={st.adHocMode ?? 'daily'}
                    time={st.time}
                    daysOfWeek={st.daysOfWeek || [1]}
                    biweekly={st.biweekly ?? false}
                    triggerType={st.triggerType ?? 'opening_d'}
                    triggerOffset={st.triggerOffset ?? 0}
                    onModeChange={m => updateAdHocMode(tpl.id, m)}
                    onTimeChange={t => updateTime(tpl.id, t)}
                    onDayToggle={d => toggleDay(tpl.id, d)}
                    onBiweeklyToggle={() => toggleBiweekly(tpl.id)}
                    onTriggerChange={(type, off) => updateTrigger(tpl.id, off, type)}
                  />
                )}
              </TaskRow>
            )
          })}
        </div>
      </Section>

      {/* Footer */}
      <div className="rounded-lg bg-muted/40 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          이 설정은 나중에 트랙 운영 중 언제든 수정할 수 있어요. 지금은 대략적으로 확인만 해주시면 됩니다.
        </p>
      </div>

      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        target={createTarget}
        chapters={data.chapters}
        onAdd={addCustomTemplate}
      />
    </div>
  )
}

// ─── Section Wrapper ─────────────────────────────────────────────

function Section({
  meta,
  count,
  children,
}: {
  meta: (typeof SECTION_META)[number]
  count: number
  children: React.ReactNode
}) {
  const Icon = meta.icon
  return (
    <section className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{meta.title}</h3>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{meta.description}</p>
      </div>
      {children}
    </section>
  )
}

// ─── Task Row ────────────────────────────────────────────────────

function TaskRow({
  tpl,
  state,
  onToggle,
  children,
}: {
  tpl: TaskTemplateConfig
  state?: TemplateState
  onToggle: (id: string) => void
  children?: React.ReactNode
}) {
  const enabled = state?.enabled ?? false
  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
        enabled ? 'hover:bg-muted/50' : 'opacity-50',
      )}
    >
      <Checkbox
        checked={enabled}
        onCheckedChange={() => onToggle(tpl.id)}
        className="shrink-0"
      />
      <span className={cn('flex-1 text-[13px] leading-snug', enabled ? 'text-foreground' : 'text-muted-foreground')}>
        {tpl.title}
      </span>
      <span className="shrink-0 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {ROLE_LABELS[tpl.driRole]}
      </span>
      {children}
    </div>
  )
}

// ─── Time Selector ───────────────────────────────────────────────

function TimeSelect({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const isUnset = !value
  const display = isUnset ? '시간 미지정' : value

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
          isUnset ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-primary/10 font-mono text-primary hover:bg-primary/20',
        )}
      >
        {display}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-md border bg-popover p-1 shadow-md">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={cn(
                'block w-full rounded px-3 py-1 text-left text-[11px] transition-colors',
                !value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              시간 미지정
            </button>
            <div className="my-0.5 border-t border-border" />
            {TIME_OPTIONS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false) }}
                className={cn(
                  'block w-full rounded px-3 py-1 text-left text-[11px] font-mono transition-colors',
                  t === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Day Selector ────────────────────────────────────────────────

function DaySelect({ days, onToggle, biweekly, onToggleBiweekly }: {
  days: number[]; onToggle: (d: number) => void; biweekly: boolean; onToggleBiweekly: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={onToggleBiweekly}
        className={cn(
          'rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
          biweekly
            ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25'
            : 'bg-muted text-muted-foreground hover:bg-muted/80',
        )}
      >
        {biweekly ? '격주' : '매주'}
      </button>
      {[1, 2, 3, 4, 5].map(d => (
        <button
          key={d}
          type="button"
          onClick={() => onToggle(d)}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded text-[9px] font-medium transition-all',
            days.includes(d)
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          {DAY_LABELS_SHORT[d]}
        </button>
      ))}
    </div>
  )
}

// ─── Chapter Offset Selector ─────────────────────────────────────

const CHAPTER_OFFSET_OPTIONS = [
  { value: -7, label: '챕터 시작 D-7' },
  { value: -3, label: '챕터 시작 D-3' },
  { value: -1, label: '챕터 시작 D-1' },
  { value: 0, label: '챕터 시작일' },
  { value: 1, label: '챕터 시작 D+1' },
  { value: 3, label: '챕터 시작 D+3' },
  { value: 7, label: '챕터 시작 D+7' },
]

function ChapterOffsetSelect({ offset, onChange }: { offset: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const label = offset === 0 ? '챕터 시작' : offset < 0 ? `D${offset}` : `D+${offset}`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex shrink-0 items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
      >
        {label}
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-auto rounded-md border bg-popover p-1 shadow-md">
            {CHAPTER_OFFSET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={cn(
                  'block w-full rounded px-3 py-1 text-left text-[11px] transition-colors',
                  opt.value === offset ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Monthly Day Selector ────────────────────────────────────────

const MONTH_DAY_OPTIONS = [
  { value: 1, label: '매월 1일 (초)' },
  { value: 5, label: '매월 5일' },
  { value: 10, label: '매월 10일' },
  { value: 15, label: '매월 15일 (중순)' },
  { value: 20, label: '매월 20일' },
  { value: -1, label: '매월 말일' },
]

function MonthDaySelect({ offset, onChange }: { offset: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const label = offset === -1 ? '매월 말일' : offset <= 1 ? '매월 초' : `매월 ${offset}일`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex shrink-0 items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
      >
        {label}
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-auto rounded-md border bg-popover p-1 shadow-md">
            {MONTH_DAY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={cn(
                  'block w-full rounded px-3 py-1 text-left text-[11px] transition-colors',
                  opt.value === offset ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Once Trigger Selector ──────────────────────────────────────

const ONCE_TRIGGER_TYPES = [
  { value: 'opening_d', label: '개강 기준' },
  { value: 'opening_week', label: '개강 주차' },
  { value: 'closing_d', label: '수료 기준' },
]

const ONCE_OFFSET_OPTIONS: Record<string, { value: number; label: string }[]> = {
  opening_d: [
    { value: -14, label: 'D-14' }, { value: -7, label: 'D-7' }, { value: -3, label: 'D-3' },
    { value: -1, label: 'D-1' }, { value: 0, label: '당일' }, { value: 1, label: 'D+1' },
    { value: 3, label: 'D+3' }, { value: 7, label: 'D+7' }, { value: 14, label: 'D+14' },
  ],
  opening_week: Array.from({ length: 24 }, (_, i) => ({ value: i + 1, label: `${i + 1}주차` })),
  closing_d: [
    { value: -14, label: 'D-14' }, { value: -7, label: 'D-7' }, { value: -3, label: 'D-3' },
    { value: -1, label: 'D-1' }, { value: 0, label: '당일' }, { value: 1, label: 'D+1' },
    { value: 3, label: 'D+3' }, { value: 7, label: 'D+7' },
  ],
}

function getOnceLabel(triggerType: string, offset: number) {
  if (triggerType === 'opening_d') return offset === 0 ? '개강일' : offset < 0 ? `개강 D${offset}` : `개강 D+${offset}`
  if (triggerType === 'opening_week') return `개강 ${offset}주차`
  if (triggerType === 'closing_d') return offset === 0 ? '수료일' : offset < 0 ? `수료 D${offset}` : `수료 D+${offset}`
  return '일정 연동'
}

function OnceTriggerSelect({ triggerType, offset, onChange }: {
  triggerType: string; offset: number; onChange: (type: string, offset: number) => void
}) {
  const [open, setOpen] = useState(false)
  const label = getOnceLabel(triggerType, offset)
  const offsets = ONCE_OFFSET_OPTIONS[triggerType] || ONCE_OFFSET_OPTIONS.opening_d

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex shrink-0 items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
      >
        {label}
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-auto rounded-md border bg-popover p-1 shadow-md">
            <div className="flex items-center gap-0.5 p-1">
              {ONCE_TRIGGER_TYPES.map(tt => (
                <button
                  key={tt.value}
                  type="button"
                  onClick={() => onChange(tt.value, tt.value === triggerType ? offset : 0)}
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                    tt.value === triggerType ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {tt.label}
                </button>
              ))}
            </div>
            <div className="my-0.5 border-t border-border" />
            {offsets.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(triggerType, opt.value); setOpen(false) }}
                className={cn(
                  'block w-full rounded px-3 py-1 text-left text-[11px] transition-colors',
                  opt.value === offset ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Ad Hoc Schedule Selector ────────────────────────────────────

const AD_HOC_MODES: { value: AdHocScheduleMode; label: string; desc: string }[] = [
  { value: 'daily', label: '매일 반복', desc: '매일 지정 시간에 자동 배정' },
  { value: 'weekly', label: '매주/격주', desc: '특정 요일에 반복 배정' },
  { value: 'track_phase', label: '트랙 흐름', desc: '개강/수료 기준 시점에 배정' },
]

function AdHocScheduleSelect({ mode, time, daysOfWeek, biweekly, triggerType, triggerOffset, onModeChange, onTimeChange, onDayToggle, onBiweeklyToggle, onTriggerChange }: {
  mode: AdHocScheduleMode
  time?: string
  daysOfWeek: number[]
  biweekly: boolean
  triggerType: string
  triggerOffset: number
  onModeChange: (m: AdHocScheduleMode) => void
  onTimeChange: (t: string) => void
  onDayToggle: (d: number) => void
  onBiweeklyToggle: () => void
  onTriggerChange: (type: string, offset: number) => void
}) {
  const [open, setOpen] = useState(false)

  let display: string
  if (mode === 'daily') display = time ? `매일 ${time}` : '매일 (시간 미지정)'
  else if (mode === 'weekly') {
    const dayStr = daysOfWeek.map(d => DAY_LABELS_SHORT[d]).join('·')
    display = `${biweekly ? '격주' : '매주'} ${dayStr}`
  } else display = getOnceLabel(triggerType, triggerOffset)

  return (
    <div className="relative flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
      >
        {display}
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-md border bg-popover p-1 shadow-md">
            {AD_HOC_MODES.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => onModeChange(m.value)}
                className={cn(
                  'block w-full rounded px-3 py-1.5 text-left transition-colors',
                  m.value === mode ? 'bg-primary/10' : 'hover:bg-muted',
                )}
              >
                <span className={cn('text-[11px] font-medium', m.value === mode ? 'text-primary' : 'text-foreground')}>{m.label}</span>
                <span className="ml-1.5 text-[10px] text-muted-foreground">{m.desc}</span>
              </button>
            ))}

            <div className="my-1 border-t border-border" />

            {mode === 'daily' && (
              <div className="px-2 py-1">
                <p className="mb-1 text-[10px] text-muted-foreground">시간 선택</p>
                <div className="flex flex-wrap gap-0.5">
                  <button
                    type="button"
                    onClick={() => { onTimeChange(''); setOpen(false) }}
                    className={cn('rounded px-2 py-0.5 text-[10px] transition-colors', !time ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}
                  >미지정</button>
                  {TIME_OPTIONS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { onTimeChange(t); setOpen(false) }}
                      className={cn('rounded px-2 py-0.5 text-[10px] font-mono transition-colors', t === time ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                    >{t}</button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'weekly' && (
              <div className="px-2 py-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onBiweeklyToggle}
                    className={cn(
                      'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                      biweekly ? 'bg-amber-500/15 text-amber-600' : 'bg-foreground text-background',
                    )}
                  >{biweekly ? '격주' : '매주'}</button>
                  <span className="text-[10px] text-muted-foreground">클릭하여 전환</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onDayToggle(d)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium transition-all',
                        daysOfWeek.includes(d)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >{DAY_LABELS_SHORT[d]}</button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'track_phase' && (
              <div className="px-2 py-1">
                <div className="mb-1.5 flex items-center gap-0.5">
                  {ONCE_TRIGGER_TYPES.map(tt => (
                    <button
                      key={tt.value}
                      type="button"
                      onClick={() => onTriggerChange(tt.value, tt.value === triggerType ? triggerOffset : 0)}
                      className={cn(
                        'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                        tt.value === triggerType ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
                      )}
                    >{tt.label}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {(ONCE_OFFSET_OPTIONS[triggerType] || ONCE_OFFSET_OPTIONS.opening_d).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onTriggerChange(triggerType, opt.value); setOpen(false) }}
                      className={cn('rounded px-2 py-0.5 text-[10px] transition-colors', opt.value === triggerOffset ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Add Button ──────────────────────────────────────────────────

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

// ─── Create Task Modal ───────────────────────────────────────────

function CreateTaskModal({
  open, onOpenChange, target, chapters, onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: FrequencyKey | null
  chapters: Chapter[]
  onAdd: (tpl: TaskTemplateConfig) => void
}) {
  const [title, setTitle] = useState('')
  const [role, setRole] = useState<DriRole>('learning_manager')
  const [frequency, setFrequency] = useState<TaskTemplateConfig['frequency']>('daily')
  const [triggerType, setTriggerType] = useState('daily')
  const [triggerOffset, setTriggerOffset] = useState(0)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setRole('learning_manager')
    if (target) {
      setFrequency(target)
      if (target === 'once') { setTriggerType('opening_d'); setTriggerOffset(-7) }
      else if (target === 'ad_hoc') setTriggerType('ad_hoc')
      else if (target === 'per_chapter') setTriggerType('schedule')
      else setTriggerType(target)
    } else {
      setFrequency('daily')
      setTriggerType('daily')
    }
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
          <DialogTitle className="text-sm font-semibold">새 업무 추가</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            트랙에 필요한 새 업무를 추가합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">업무 이름</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 주간 리포트 작성"
              className="h-8 text-xs"
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            />
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
                const f = v as TaskTemplateConfig['frequency']
                setFrequency(f)
                if (f === 'daily' || f === 'weekly' || f === 'monthly') setTriggerType(f)
                else if (f === 'per_chapter') setTriggerType('schedule')
                else if (f === 'ad_hoc') setTriggerType('ad_hoc')
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
                <Label className="text-[11px] text-muted-foreground">시점</Label>
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
                <Input
                  type="number"
                  value={triggerOffset}
                  onChange={e => setTriggerOffset(parseInt(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
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
