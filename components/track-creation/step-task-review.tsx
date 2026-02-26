'use client'

import { useMemo } from 'react'
import {
  Clock, CalendarDays, BookOpen, CalendarRange, Layers, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { taskTemplates, ROLE_LABELS } from '@/lib/task-templates'
import type {
  TrackCreationData, TaskTemplateConfig, AssignmentMode, StaffMember,
} from '@/lib/track-creation-types'

interface StepTaskReviewProps {
  data: TrackCreationData
  updateData: (partial: Partial<TrackCreationData>) => void
}

type FrequencyKey = 'daily' | 'weekly' | 'per_chapter' | 'monthly' | 'once' | 'ad_hoc'

const ASSIGN_STYLES: Record<AssignmentMode, string> = {
  all: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  specific: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  rotation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  unassigned: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const ASSIGN_LABELS: Record<AssignmentMode, string> = {
  all: '전원',
  specific: '지정',
  rotation: '순환',
  unassigned: '미배정',
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const SECTION_META: {
  id: FrequencyKey
  title: string
  description: string
  icon: typeof Clock
}[] = [
  {
    id: 'daily',
    title: '매일 반복 업무',
    description: '평일 매일 수행하는 업무예요.',
    icon: Clock,
  },
  {
    id: 'weekly',
    title: '주간 반복 업무',
    description: '매주 특정 요일에 반복되는 업무예요.',
    icon: CalendarDays,
  },
  {
    id: 'per_chapter',
    title: '챕터별 업무',
    description: '각 챕터 시작/종료에 맞춰 생기는 업무예요.',
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
    description: '특정 시점에 한 번 수행하는 업무예요.',
    icon: Layers,
  },
  {
    id: 'ad_hoc',
    title: '수시 업무',
    description: '필요 시 수행하는 업무예요.',
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
    if (tpl.triggerType === 'opening_d' && (tpl.triggerOffset ?? 0) < 0) phases[0].templates.push(tpl)
    else if (tpl.triggerType === 'opening_d' || tpl.triggerType === 'opening_week') phases[1].templates.push(tpl)
    else if (tpl.triggerType === 'closing_d') phases[3].templates.push(tpl)
    else phases[2].templates.push(tpl)
  }
  return phases.filter(p => p.templates.length > 0)
}

// ─── Main Component ──────────────────────────────────────────────

export function StepTaskReview({ data }: StepTaskReviewProps) {
  const allTemplates = useMemo(
    () => [...taskTemplates, ...data.customTemplates],
    [data.customTemplates],
  )

  const activeTemplateIds = useMemo(() => {
    const ids = new Set<string>()
    for (const t of data.generatedTasks) {
      if (t.status !== 'deferred') ids.add(t.templateId)
    }
    return ids
  }, [data.generatedTasks])

  const activeTemplates = useMemo(
    () => allTemplates.filter(t => activeTemplateIds.has(t.id)),
    [allTemplates, activeTemplateIds],
  )

  const grouped = useMemo(() => groupByFrequency(activeTemplates), [activeTemplates])
  const oncePhases = useMemo(() => groupOnceByPhase(grouped.once), [grouped.once])

  const staffMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const lm of data.staff.learningManagers) map.set(lm.id, lm.name)
    for (const op of data.staff.operators) map.set(op.id, op.name)
    for (const om of data.staff.operatorManagers) map.set(om.id, om.name)
    return map
  }, [data.staff])

  function getTimingLabel(tpl: TaskTemplateConfig): string {
    if (tpl.frequency === 'daily') {
      const cfg = data.recurrenceConfigs[tpl.id]
      return cfg?.time || ''
    }
    if (tpl.frequency === 'weekly') {
      const cfg = data.recurrenceConfigs[tpl.id]
      if (cfg?.daysOfWeek?.length) return `매주 ${cfg.daysOfWeek.map(d => DAY_LABELS[d]).join(',')}`
      return '매주'
    }
    if (tpl.frequency === 'per_chapter') {
      const offset = tpl.triggerOffset
      if (offset && offset < 0) return `챕터 시작 D${offset}`
      if (offset && offset > 0) return `챕터 시작 D+${offset}`
      return '챕터 시작'
    }
    if (tpl.frequency === 'monthly') return '매월 초'
    if (tpl.frequency === 'once') {
      const offset = tpl.triggerOffset ?? 0
      if (tpl.triggerType === 'opening_d') return offset === 0 ? '개강일' : offset < 0 ? `개강 D${offset}` : `개강 D+${offset}`
      if (tpl.triggerType === 'opening_week') return `개강 ${offset}주차`
      if (tpl.triggerType === 'closing_d') return offset === 0 ? '수료일' : `수료 D${offset}`
      return '일정 연동'
    }
    return ''
  }

  function getAssignLabel(tpl: TaskTemplateConfig): { mode: AssignmentMode; detail: string } {
    const cfg = data.taskAssignments[tpl.id]
    const mode = cfg?.mode ?? 'unassigned'

    if (mode === 'specific' && cfg?.specificStaffId) {
      return { mode, detail: staffMap.get(cfg.specificStaffId) ?? '지정' }
    }
    if (mode === 'rotation' && cfg?.rotationConfig?.staffOrder.length) {
      const names = cfg.rotationConfig.staffOrder
        .slice(0, 3)
        .map(id => staffMap.get(id) ?? '?')
      return { mode, detail: names.join(' → ') }
    }
    return { mode, detail: ASSIGN_LABELS[mode] }
  }

  const hasAny = activeTemplates.length > 0

  return (
    <div className="space-y-10 pb-4">
      {/* Page intro */}
      <div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          설정한 업무와 배정을 확인해주세요. 수정이 필요하면 이전 단계로 돌아갈 수 있어요.
        </p>
      </div>

      {!hasAny && (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">설정된 업무가 없습니다.</p>
          <p className="mt-1 text-xs text-muted-foreground/60">이전 단계에서 업무를 추가해주세요.</p>
        </div>
      )}

      {/* ── Daily ── */}
      {grouped.daily.length > 0 && (
        <ReviewSection meta={SECTION_META[0]}>
          {grouped.daily.map(tpl => (
            <ReviewRow
              key={tpl.id}
              title={tpl.title}
              timing={getTimingLabel(tpl)}
              role={ROLE_LABELS[tpl.driRole]}
              assign={getAssignLabel(tpl)}
              isRecurring
            />
          ))}
        </ReviewSection>
      )}

      {/* ── Weekly ── */}
      {grouped.weekly.length > 0 && (
        <ReviewSection meta={SECTION_META[1]}>
          {grouped.weekly.map(tpl => (
            <ReviewRow
              key={tpl.id}
              title={tpl.title}
              timing={getTimingLabel(tpl)}
              role={ROLE_LABELS[tpl.driRole]}
              assign={getAssignLabel(tpl)}
              isRecurring
            />
          ))}
        </ReviewSection>
      )}

      {/* ── Per Chapter ── */}
      {grouped.per_chapter.length > 0 && (
        <ReviewSection meta={SECTION_META[2]} note={data.chapters.length > 0 ? `${data.chapters.length}개 챕터에 각각 적용` : undefined}>
          {grouped.per_chapter.map(tpl => (
            <ReviewRow
              key={tpl.id}
              title={tpl.title}
              timing={getTimingLabel(tpl)}
              role={ROLE_LABELS[tpl.driRole]}
            />
          ))}
        </ReviewSection>
      )}

      {/* ── Monthly ── */}
      {grouped.monthly.length > 0 && (
        <ReviewSection meta={SECTION_META[3]}>
          {grouped.monthly.map(tpl => (
            <ReviewRow
              key={tpl.id}
              title={tpl.title}
              timing={getTimingLabel(tpl)}
              role={ROLE_LABELS[tpl.driRole]}
            />
          ))}
        </ReviewSection>
      )}

      {/* ── Once (grouped by phase) ── */}
      {grouped.once.length > 0 && (
        <ReviewSection meta={SECTION_META[4]}>
          {oncePhases.map(phase => (
            <div key={phase.key} className="space-y-0.5">
              <p className="pl-1 pt-2 text-[11px] font-semibold text-muted-foreground/70">{phase.label}</p>
              {phase.templates.map(tpl => (
                <ReviewRow
                  key={tpl.id}
                  title={tpl.title}
                  timing={getTimingLabel(tpl)}
                  role={ROLE_LABELS[tpl.driRole]}
                />
              ))}
            </div>
          ))}
        </ReviewSection>
      )}

      {/* ── Ad Hoc ── */}
      {grouped.ad_hoc.length > 0 && (
        <ReviewSection meta={SECTION_META[5]}>
          {grouped.ad_hoc.map(tpl => (
            <ReviewRow
              key={tpl.id}
              title={tpl.title}
              role={ROLE_LABELS[tpl.driRole]}
            />
          ))}
        </ReviewSection>
      )}

      {/* Footer */}
      <div className="rounded-lg bg-muted/40 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          수정이 필요하면 &ldquo;이전&rdquo; 버튼으로 돌아가세요. 트랙 생성 후에도 언제든 변경할 수 있어요.
        </p>
      </div>
    </div>
  )
}

// ─── Review Section ──────────────────────────────────────────────

function ReviewSection({
  meta,
  note,
  children,
}: {
  meta: (typeof SECTION_META)[number]
  note?: string
  children: React.ReactNode
}) {
  const Icon = meta.icon
  return (
    <section className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{meta.title}</h3>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{meta.description}</p>
        {note && <p className="mt-0.5 text-[11px] text-muted-foreground/60">{note}</p>}
      </div>
      <div className="space-y-0.5">
        {children}
      </div>
    </section>
  )
}

// ─── Review Row ──────────────────────────────────────────────────

function ReviewRow({
  title,
  timing,
  role,
  assign,
  isRecurring,
}: {
  title: string
  timing?: string
  role: string
  assign?: { mode: AssignmentMode; detail: string }
  isRecurring?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2">
      <span className="flex-1 text-[13px] leading-snug text-foreground">{title}</span>

      {timing && (
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          {timing}
        </span>
      )}

      <span className="shrink-0 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {role}
      </span>

      {isRecurring && assign && (
        <span className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
          ASSIGN_STYLES[assign.mode],
        )}>
          {assign.detail}
        </span>
      )}
    </div>
  )
}
