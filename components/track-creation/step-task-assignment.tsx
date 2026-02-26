'use client'

import { useMemo, useCallback } from 'react'
import { Clock, CalendarDays, Users, User, RefreshCw, Clock3, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { taskTemplates, ROLE_LABELS } from '@/lib/task-templates'
import type {
  TrackCreationData,
  TaskTemplateConfig,
  AssignmentMode,
  TaskAssignmentConfig,
  StaffMember,
} from '@/lib/track-creation-types'

interface StepTaskAssignmentProps {
  data: TrackCreationData
  updateData: (partial: Partial<TrackCreationData>) => void
}

const STAFF_COLORS = [
  { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', ring: 'ring-violet-300' },
  { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', ring: 'ring-sky-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-300' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-300' },
  { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', ring: 'ring-rose-300' },
]

function getStaffColor(idx: number) {
  return STAFF_COLORS[idx % STAFF_COLORS.length]
}

const DAY_LABELS = ['월', '화', '수', '목', '금']

// ─── Main Component ──────────────────────────────────────────────

export function StepTaskAssignment({ data, updateData }: StepTaskAssignmentProps) {
  const lms = data.staff.learningManagers
  const assignments = data.taskAssignments

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

  const dailyLmTemplates = useMemo(
    () => allTemplates.filter(t => t.frequency === 'daily' && t.driRole === 'learning_manager' && activeTemplateIds.has(t.id)),
    [allTemplates, activeTemplateIds],
  )
  const weeklyLmTemplates = useMemo(
    () => allTemplates.filter(t => t.frequency === 'weekly' && t.driRole === 'learning_manager' && activeTemplateIds.has(t.id)),
    [allTemplates, activeTemplateIds],
  )

  const dailySectionMode = useMemo(() => inferSectionMode(dailyLmTemplates, assignments), [dailyLmTemplates, assignments])
  const weeklySectionMode = useMemo(() => inferSectionMode(weeklyLmTemplates, assignments), [weeklyLmTemplates, assignments])

  const setSectionMode = useCallback((templates: TaskTemplateConfig[], mode: AssignmentMode, cycle: 'daily' | 'weekly') => {
    const updated = { ...assignments }
    for (const tpl of templates) {
      const config: TaskAssignmentConfig = { templateId: tpl.id, mode }
      if (mode === 'specific' && lms.length > 0) {
        config.specificStaffId = assignments[tpl.id]?.specificStaffId ?? lms[0].id
      }
      if (mode === 'rotation') {
        config.rotationConfig = assignments[tpl.id]?.rotationConfig ?? {
          cycle,
          staffOrder: lms.map(lm => lm.id),
        }
      }
      updated[tpl.id] = config
    }
    updateData({ taskAssignments: updated })
  }, [assignments, lms, updateData])

  const setSingleAssignment = useCallback((templateId: string, partial: Partial<TaskAssignmentConfig>) => {
    const existing = assignments[templateId] || { templateId, mode: 'unassigned' as AssignmentMode }
    updateData({
      taskAssignments: {
        ...assignments,
        [templateId]: { ...existing, ...partial },
      },
    })
  }, [assignments, updateData])

  const updateRotationOrder = useCallback((templates: TaskTemplateConfig[], staffOrder: string[], cycle: 'daily' | 'weekly') => {
    const updated = { ...assignments }
    for (const tpl of templates) {
      if (updated[tpl.id]?.mode === 'rotation') {
        updated[tpl.id] = { ...updated[tpl.id], rotationConfig: { cycle, staffOrder } }
      }
    }
    updateData({ taskAssignments: updated })
  }, [assignments, updateData])

  const getRotationConfig = useCallback((templates: TaskTemplateConfig[]) => {
    for (const tpl of templates) {
      const cfg = assignments[tpl.id]
      if (cfg?.mode === 'rotation' && cfg.rotationConfig) return cfg.rotationConfig
    }
    return { cycle: 'daily' as const, staffOrder: lms.map(lm => lm.id) }
  }, [assignments, lms])

  const hasRecurringTasks = dailyLmTemplates.length > 0 || weeklyLmTemplates.length > 0

  return (
    <div className="space-y-10 pb-4">
      {/* Page intro */}
      <div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          반복 업무의 담당자를 정해주세요.
          지금 정하지 않아도 트랙 운영 중 언제든 배정할 수 있어요.
        </p>
      </div>

      {!hasRecurringTasks && (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">배정할 반복 업무가 없습니다.</p>
          <p className="mt-1 text-xs text-muted-foreground/60">이전 단계에서 매일/주간 반복 업무를 추가해주세요.</p>
        </div>
      )}

      {/* ── Daily Section ── */}
      {dailyLmTemplates.length > 0 && (
        <AssignmentSection
          icon={Clock}
          title="매일 반복 업무"
          description="이 업무들을 누가 담당할까요? 학관매가 여러 명이면 전원이 각자 하거나, 돌아가면서 할 수 있어요."
          templates={dailyLmTemplates}
          sectionMode={dailySectionMode}
          onSetMode={(mode) => setSectionMode(dailyLmTemplates, mode, 'daily')}
          rotationConfig={getRotationConfig(dailyLmTemplates)}
          onUpdateRotation={(order) => updateRotationOrder(dailyLmTemplates, order, 'daily')}
          learningManagers={lms}
          assignments={assignments}
          onSetSingle={setSingleAssignment}
          cycle="daily"
        />
      )}

      {/* ── Weekly Section ── */}
      {weeklyLmTemplates.length > 0 && (
        <AssignmentSection
          icon={CalendarDays}
          title="주간 반복 업무"
          description="매주 반복되는 업무의 담당자를 정해주세요."
          templates={weeklyLmTemplates}
          sectionMode={weeklySectionMode}
          onSetMode={(mode) => setSectionMode(weeklyLmTemplates, mode, 'weekly')}
          rotationConfig={getRotationConfig(weeklyLmTemplates)}
          onUpdateRotation={(order) => updateRotationOrder(weeklyLmTemplates, order, 'weekly')}
          learningManagers={lms}
          assignments={assignments}
          onSetSingle={setSingleAssignment}
          cycle="weekly"
        />
      )}

      {/* ── Rest (not assignable in this step) ── */}
      <section className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">나머지 업무</h3>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            챕터별, 월간, 1회성, 수시 업무는 트랙 운영이 시작되면 상황에 맞게 담당자를 배정할 수 있어요.
            지금은 넘어가셔도 됩니다.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            트랙 상세 페이지에서 운영매니저가 업무별로 담당자를 배정하거나,
            학관매가 직접 업무를 가져갈 수 있어요.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="rounded-lg bg-muted/40 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          배정은 트랙 운영 중 언제든 변경할 수 있어요. 지금은 대략적으로만 정해주시면 됩니다.
        </p>
      </div>
    </div>
  )
}

// ─── Assignment Section ──────────────────────────────────────────

function AssignmentSection({
  icon: Icon,
  title,
  description,
  templates,
  sectionMode,
  onSetMode,
  rotationConfig,
  onUpdateRotation,
  learningManagers,
  assignments,
  onSetSingle,
  cycle,
}: {
  icon: typeof Clock
  title: string
  description: string
  templates: TaskTemplateConfig[]
  sectionMode: AssignmentMode
  onSetMode: (mode: AssignmentMode) => void
  rotationConfig: { cycle: 'daily' | 'weekly'; staffOrder: string[] }
  onUpdateRotation: (order: string[]) => void
  learningManagers: StaffMember[]
  assignments: Record<string, TaskAssignmentConfig>
  onSetSingle: (id: string, partial: Partial<TaskAssignmentConfig>) => void
  cycle: 'daily' | 'weekly'
}) {
  const modeOptions: { mode: AssignmentMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { mode: 'all', label: '전원이 각자', icon: <Users className="h-4 w-4" />, desc: '모든 학관매가 각자 수행' },
    { mode: 'rotation', label: '돌아가면서', icon: <RefreshCw className="h-4 w-4" />, desc: cycle === 'daily' ? '일별로 순환 배정' : '주별로 순환 배정' },
    { mode: 'specific', label: '한 명 지정', icon: <User className="h-4 w-4" />, desc: '특정 학관매에게 고정' },
    { mode: 'unassigned', label: '나중에 배정', icon: <Clock3 className="h-4 w-4" />, desc: '운영 중에 배정' },
  ]

  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {templates.length}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{description}</p>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {modeOptions.map(opt => (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onSetMode(opt.mode)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 transition-all',
              sectionMode === opt.mode
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/30',
            )}
          >
            {opt.icon}
            <span className="text-[12px] font-semibold">{opt.label}</span>
            <span className="text-[10px] leading-tight opacity-70">{opt.desc}</span>
          </button>
        ))}
      </div>

      {/* All mode: show staff pills */}
      {sectionMode === 'all' && learningManagers.length > 0 && (
        <div className="rounded-lg bg-muted/30 px-3 py-2.5">
          <p className="mb-2 text-[11px] text-muted-foreground">아래 학관매 모두가 매 업무를 각자 수행해요.</p>
          <div className="flex flex-wrap gap-1.5">
            {learningManagers.map((lm, i) => {
              const color = getStaffColor(i)
              return (
                <span key={lm.id} className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', color.bg, color.text)}>
                  {lm.name}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Rotation mode: timeline preview */}
      {sectionMode === 'rotation' && learningManagers.length > 0 && (
        <RotationTimeline
          staffOrder={rotationConfig.staffOrder}
          cycle={cycle}
          learningManagers={learningManagers}
          onUpdateOrder={onUpdateRotation}
        />
      )}

      {/* Specific mode: single picker for section */}
      {sectionMode === 'specific' && learningManagers.length > 0 && (
        <div className="rounded-lg bg-muted/30 px-3 py-2.5">
          <p className="mb-2 text-[11px] text-muted-foreground">이 섹션의 모든 업무를 담당할 학관매를 선택해주세요.</p>
          <div className="flex flex-wrap gap-1.5">
            {learningManagers.map((lm, i) => {
              const isSelected = templates.every(tpl => assignments[tpl.id]?.specificStaffId === lm.id)
              const color = getStaffColor(i)
              return (
                <button
                  key={lm.id}
                  type="button"
                  onClick={() => {
                    for (const tpl of templates) {
                      onSetSingle(tpl.id, { mode: 'specific', specificStaffId: lm.id })
                    }
                  }}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-medium ring-2 transition-all',
                    isSelected
                      ? cn(color.bg, color.text, color.ring)
                      : 'bg-muted text-muted-foreground ring-transparent hover:ring-border',
                  )}
                >
                  {lm.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Unassigned mode: simple info */}
      {sectionMode === 'unassigned' && (
        <div className="rounded-lg bg-muted/30 px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">
            이 업무들은 미배정 상태로 생성돼요. 트랙 운영이 시작되면 운영매니저가 배정하거나, 학관매가 직접 가져갈 수 있어요.
          </p>
        </div>
      )}

      {/* Task list with override capability */}
      <div className="space-y-0.5">
        {templates.map(tpl => {
          const tplAssignment = assignments[tpl.id]
          const tplMode = tplAssignment?.mode ?? 'unassigned'
          const isOverridden = tplMode !== sectionMode
          return (
            <TaskAssignmentRow
              key={tpl.id}
              template={tpl}
              mode={tplMode}
              isOverridden={isOverridden}
              assignment={tplAssignment}
              learningManagers={learningManagers}
              onUpdate={(partial) => onSetSingle(tpl.id, partial)}
            />
          )
        })}
      </div>
    </section>
  )
}

// ─── Task Row ────────────────────────────────────────────────────

function TaskAssignmentRow({
  template,
  mode,
  isOverridden,
  assignment,
  learningManagers,
  onUpdate,
}: {
  template: TaskTemplateConfig
  mode: AssignmentMode
  isOverridden: boolean
  assignment?: TaskAssignmentConfig
  learningManagers: StaffMember[]
  onUpdate: (partial: Partial<TaskAssignmentConfig>) => void
}) {
  const staffMap = new Map(learningManagers.map(lm => [lm.id, lm.name]))

  const modeLabel = mode === 'all' ? '전원'
    : mode === 'rotation' ? '순환'
    : mode === 'specific' ? (staffMap.get(assignment?.specificStaffId ?? '') ?? '지정')
    : '미배정'

  return (
    <div className={cn(
      'group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50',
      isOverridden && 'bg-primary/[0.03]',
    )}>
      <span className="flex-1 text-[13px] leading-snug text-foreground">{template.title}</span>

      <span className="shrink-0 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {ROLE_LABELS[template.driRole]}
      </span>

      {/* Compact override selector */}
      <Select
        value={mode}
        onValueChange={(v: string) => {
          const m = v as AssignmentMode
          const update: Partial<TaskAssignmentConfig> = { mode: m }
          if (m === 'specific' && learningManagers.length > 0) {
            update.specificStaffId = assignment?.specificStaffId ?? learningManagers[0].id
          }
          if (m === 'rotation') {
            update.rotationConfig = assignment?.rotationConfig ?? {
              cycle: template.frequency === 'weekly' ? 'weekly' : 'daily',
              staffOrder: learningManagers.map(lm => lm.id),
            }
          }
          onUpdate(update)
        }}
      >
        <SelectTrigger className={cn(
          'h-7 w-[88px] text-[10px]',
          isOverridden ? 'border-primary/40 bg-primary/5' : 'border-border',
        )}>
          <SelectValue>{modeLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전원이 각자</SelectItem>
          <SelectItem value="rotation">돌아가면서</SelectItem>
          <SelectItem value="specific">한 명 지정</SelectItem>
          <SelectItem value="unassigned">나중에 배정</SelectItem>
        </SelectContent>
      </Select>

      {/* Specific staff picker inline */}
      {mode === 'specific' && (
        <Select
          value={assignment?.specificStaffId ?? ''}
          onValueChange={(v) => onUpdate({ specificStaffId: v })}
        >
          <SelectTrigger className="h-7 w-[80px] text-[10px] border-border">
            <SelectValue placeholder="선택" />
          </SelectTrigger>
          <SelectContent>
            {learningManagers.map(lm => (
              <SelectItem key={lm.id} value={lm.id}>{lm.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

// ─── Rotation Timeline ───────────────────────────────────────────

function RotationTimeline({
  staffOrder,
  cycle,
  learningManagers,
  onUpdateOrder,
}: {
  staffOrder: string[]
  cycle: 'daily' | 'weekly'
  learningManagers: StaffMember[]
  onUpdateOrder: (order: string[]) => void
}) {
  const staffMap = new Map(learningManagers.map(lm => [lm.id, lm.name]))
  const staffColorMap = new Map(learningManagers.map((lm, i) => [lm.id, getStaffColor(i)]))

  const slots = cycle === 'daily' ? 5 : 5
  const headers = cycle === 'daily'
    ? DAY_LABELS
    : Array.from({ length: slots }, (_, i) => `${i + 1}주차`)

  const assignedSlots = Array.from({ length: slots }, (_, i) => {
    if (staffOrder.length === 0) return null
    return staffOrder[i % staffOrder.length]
  })

  function moveToFront(staffId: string) {
    const idx = staffOrder.indexOf(staffId)
    if (idx <= 0) return
    const next = [...staffOrder]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    onUpdateOrder(next)
  }

  return (
    <div className="space-y-3 rounded-lg bg-muted/30 px-3 py-3">
      <p className="text-[11px] font-medium text-muted-foreground">
        {cycle === 'daily' ? '일별' : '주별'} 순환 미리보기
      </p>

      {/* Timeline grid */}
      <div className="overflow-x-auto">
        <div className={cn('grid gap-1', cycle === 'daily' ? 'grid-cols-5' : 'grid-cols-5')}>
          {headers.map((header, i) => (
            <div key={header} className="text-center">
              <div className="mb-1 text-[10px] font-medium text-muted-foreground/70">{header}</div>
              {assignedSlots[i] ? (
                <div className={cn(
                  'rounded-md px-1 py-1.5 text-[11px] font-semibold',
                  staffColorMap.get(assignedSlots[i]!)?.bg,
                  staffColorMap.get(assignedSlots[i]!)?.text,
                )}>
                  {staffMap.get(assignedSlots[i]!) ?? '?'}
                </div>
              ) : (
                <div className="rounded-md bg-muted px-1 py-1.5 text-[11px] text-muted-foreground/50">—</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Staff order editor */}
      <div>
        <p className="mb-1.5 text-[10px] text-muted-foreground/70">순서 변경 (클릭하면 앞으로 이동)</p>
        <div className="flex flex-wrap gap-1.5">
          {staffOrder.map((id, i) => {
            const color = staffColorMap.get(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => moveToFront(id)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all',
                  color?.bg, color?.text,
                  i > 0 && 'hover:ring-2 hover:ring-primary/30',
                  i === 0 && 'ring-2 ring-primary/20',
                )}
              >
                <span className="text-[9px] opacity-60">{i + 1}</span>
                {staffMap.get(id) ?? id}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Utilities ───────────────────────────────────────────────────

function inferSectionMode(
  templates: TaskTemplateConfig[],
  assignments: Record<string, TaskAssignmentConfig>,
): AssignmentMode {
  if (templates.length === 0) return 'unassigned'
  const modes = templates.map(t => assignments[t.id]?.mode ?? 'unassigned')
  const first = modes[0]
  if (modes.every(m => m === first)) return first
  return first
}
