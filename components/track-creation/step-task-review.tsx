'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, Clock, Users, Repeat, CalendarDays, BookOpen, Layers } from 'lucide-react'
import {
  taskTemplates, ROLE_LABELS, getTaskTags, TAG_LABELS,
} from '@/lib/task-templates'
import type { TrackCreationData, TaskTemplateConfig, DriRole } from '@/lib/track-creation-types'

interface StepTaskReviewProps {
  data: TrackCreationData
  updateData: (partial: Partial<TrackCreationData>) => void
}

type SectionType = 'pre_opening' | 'first_week' | 'chapter' | 'closing' | 'adhoc'

function classifyToSection(tpl: TaskTemplateConfig): SectionType | 'left' {
  if (['daily', 'weekly', 'monthly'].includes(tpl.frequency)) return 'left'
  if (tpl.triggerType === 'opening_d' && (tpl.triggerOffset ?? 0) < 0) return 'pre_opening'
  if (tpl.triggerType === 'opening_d' && (tpl.triggerOffset ?? 0) >= 0) return 'first_week'
  if (tpl.triggerType === 'opening_week') return 'first_week'
  if (tpl.triggerType === 'closing_d') return 'closing'
  if (tpl.frequency === 'per_chapter' || tpl.triggerType === 'schedule') return 'chapter'
  if (tpl.frequency === 'ad_hoc' || tpl.triggerType === 'ad_hoc') return 'adhoc'
  return 'adhoc'
}

function offsetLabel(offset: number, startWord: string, endWord: string): string {
  if (offset >= 0) return offset === 0 ? startWord : `${startWord}+${offset}`
  return offset === -1 ? endWord : `${endWord}${offset + 1}`
}

const ROLE_ORDER: DriRole[] = ['operator_manager', 'operator', 'learning_manager']

export function StepTaskReview({ data }: StepTaskReviewProps) {
  const [roleFilter, setRoleFilter] = useState<DriRole | 'all'>('all')

  const allTemplates = useMemo(() => [
    ...taskTemplates,
    ...data.customTemplates,
  ], [data.customTemplates])

  const filtered = useMemo(() => {
    if (roleFilter === 'all') return allTemplates
    return allTemplates.filter(t => t.driRole === roleFilter)
  }, [allTemplates, roleFilter])

  const recurring = useMemo(() => {
    const daily = filtered.filter(t => t.frequency === 'daily')
    const weekly = filtered.filter(t => t.frequency === 'weekly')
    const perChapter = filtered.filter(t => t.frequency === 'per_chapter')
    const monthly = filtered.filter(t => t.frequency === 'monthly')
    return { daily, weekly, perChapter, monthly }
  }, [filtered])

  const lifecycle = useMemo(() => {
    const sections: { key: SectionType; label: string; icon: typeof CalendarDays; tasks: TaskTemplateConfig[] }[] = [
      { key: 'pre_opening', label: '개강전', icon: CalendarDays, tasks: [] },
      { key: 'first_week', label: '개강 1주차', icon: CalendarDays, tasks: [] },
      { key: 'chapter', label: '챕터별 (트랙 흐름)', icon: BookOpen, tasks: [] },
      { key: 'closing', label: '수료 준비', icon: CalendarDays, tasks: [] },
      { key: 'adhoc', label: '수시', icon: Clock, tasks: [] },
    ]
    for (const tpl of filtered) {
      const sec = classifyToSection(tpl)
      if (sec === 'left') continue
      const found = sections.find(s => s.key === sec)
      if (found) found.tasks.push(tpl)
    }
    return sections
  }, [filtered])

  const stats = useMemo(() => {
    const byRole: Record<string, number> = {}
    for (const tpl of allTemplates) {
      byRole[tpl.driRole] = (byRole[tpl.driRole] || 0) + 1
    }
    const customCount = data.customTemplates.length
    const totalRecurring = recurring.daily.length + recurring.weekly.length + recurring.perChapter.length + recurring.monthly.length
    const totalTrack = lifecycle.reduce((sum, s) => sum + s.tasks.length, 0)
    return { byRole, customCount, totalRecurring, totalTrack, total: filtered.length }
  }, [allTemplates, filtered, data.customTemplates, recurring, lifecycle])

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">Task 최종 확인</h2>
          <p className="text-sm text-muted-foreground">배정된 반복 일정과 트랙 일정을 한눈에 확인하세요.</p>
        </div>
        <div className="flex items-center gap-1">
          {([['all', '전체'], ...ROLE_ORDER.map(r => [r, ROLE_LABELS[r]])] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRoleFilter(key as DriRole | 'all')}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                roleFilter === key
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/[0.1]'
              }`}
            >
              {label}
              {key !== 'all' && <span className="ml-1 opacity-60">{stats.byRole[key] || 0}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="전체 Task" value={stats.total} sub={stats.customCount > 0 ? `직접 추가 ${stats.customCount}건` : undefined} />
        <SummaryCard label="반복 일정" value={stats.totalRecurring} sub={`일${recurring.daily.length} · 주${recurring.weekly.length} · 챕터${recurring.perChapter.length} · 월${recurring.monthly.length}`} />
        <SummaryCard label="트랙 일정" value={stats.totalTrack} sub={lifecycle.filter(s => s.tasks.length > 0).map(s => s.label).join(' · ')} />
        <div className="rounded-xl border border-border bg-foreground/[0.02] p-3">
          <p className="text-[10px] font-medium text-muted-foreground">역할별 배분</p>
          <div className="mt-2 space-y-1">
            {ROLE_ORDER.map(role => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/70">{ROLE_LABELS[role]}</span>
                <span className="text-[11px] font-semibold text-foreground">{stats.byRole[role] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Recurring */}
        <div className="rounded-xl border border-border">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">반복 일정</span>
            <span className="ml-auto rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground">{stats.totalRecurring}개</span>
          </div>
          <div className="divide-y divide-border">
            <RecurringSection
              label="일별"
              count={recurring.daily.length}
              tasks={recurring.daily}
              offsetFn={(tpl) => {
                const cfg = data.recurrenceConfigs[tpl.id]
                return cfg?.time || '시간 미지정'
              }}
            />
            <RecurringSection
              label="주별"
              count={recurring.weekly.length}
              tasks={recurring.weekly}
              offsetFn={(tpl) => {
                const cfg = data.recurrenceConfigs[tpl.id]
                const days = ['일', '월', '화', '수', '목', '금', '토']
                return cfg?.daysOfWeek?.map(d => days[d]).join(', ') || '요일 미지정'
              }}
            />
            <RecurringSection
              label="챕터별"
              count={recurring.perChapter.length}
              tasks={recurring.perChapter}
              offsetFn={(tpl) => offsetLabel(tpl.triggerOffset ?? 0, '시작일', '종료일')}
              note={data.chapters.length > 0 ? `${data.chapters.length}개 챕터에 각각 적용` : undefined}
            />
            <RecurringSection
              label="월별"
              count={recurring.monthly.length}
              tasks={recurring.monthly}
              offsetFn={(tpl) => offsetLabel(tpl.triggerOffset ?? 0, '시작일', '종료일')}
            />
          </div>
        </div>

        {/* Right: Track lifecycle */}
        <div className="rounded-xl border border-border">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">트랙 일정</span>
            <span className="ml-auto rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground">{stats.totalTrack}개</span>
          </div>
          <div className="divide-y divide-border">
            {lifecycle.map(section => (
              <LifecycleSection
                key={section.key}
                label={section.label}
                count={section.tasks.length}
                tasks={section.tasks}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Full task list (compact table) */}
      <div className="rounded-xl border border-border">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">전체 Task 목록</span>
          <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground">{filtered.length}개</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Task명</th>
                <th className="w-14 px-2 py-2 font-medium">담당</th>
                <th className="w-20 px-2 py-2 font-medium">분류</th>
                <th className="w-16 px-2 py-2 font-medium">범위</th>
                <th className="w-24 px-2 py-2 font-medium">타이밍</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(tpl => {
                const tags = getTaskTags(tpl)
                const section = classifyToSection(tpl)
                let timing = ''
                if (section === 'left') {
                  if (tpl.frequency === 'daily') timing = '매일'
                  else if (tpl.frequency === 'weekly') timing = '매주'
                  else if (tpl.frequency === 'monthly') timing = '매월'
                  else if (tpl.frequency === 'per_chapter') timing = `챕터 ${offsetLabel(tpl.triggerOffset ?? 0, '시작일', '종료일')}`
                } else {
                  if (tpl.triggerType === 'opening_d') timing = `개강 ${offsetLabel(tpl.triggerOffset ?? 0, 'D', 'D')}`
                  else if (tpl.triggerType === 'closing_d') timing = `수료 ${offsetLabel(tpl.triggerOffset ?? 0, 'D', 'D')}`
                  else if (tpl.frequency === 'ad_hoc') timing = '수시'
                  else timing = '일정'
                }
                return (
                  <tr key={tpl.id} className="hover:bg-muted/20 transition-colors">
                    <td className="max-w-[240px] truncate px-3 py-1.5 font-medium text-foreground/90">{tpl.title}</td>
                    <td className="px-2 py-1.5">
                      <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-medium">{ROLE_LABELS[tpl.driRole]}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap gap-0.5">
                        {tags.slice(0, 2).map(tag => (
                          <span key={tag} className="rounded-full bg-foreground/[0.05] px-1.5 py-px text-[8px] text-muted-foreground">{TAG_LABELS[tag]}</span>
                        ))}
                        {tags.length > 2 && <span className="text-[8px] text-muted-foreground/50">+{tags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] text-muted-foreground">{tpl.scope === 'common' ? '공통' : tpl.scope === 'individual' ? '개별' : '-'}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{timing}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// === Sub-components ===

function SummaryCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-foreground/[0.02] p-3">
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{sub}</p>}
    </div>
  )
}

function RecurringSection({ label, count, tasks, offsetFn, note }: {
  label: string
  count: number
  tasks: TaskTemplateConfig[]
  offsetFn: (tpl: TaskTemplateConfig) => string
  note?: string
}) {
  if (count === 0) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-[11px] font-medium text-foreground/70">{label}</span>
        <span className="text-[10px] text-muted-foreground/40">없음</span>
      </div>
    )
  }

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
          <span className="rounded-full bg-foreground/[0.06] px-1.5 py-px text-[9px] text-muted-foreground">{count}</span>
        </div>
        {note && <span className="text-[9px] text-muted-foreground/50">{note}</span>}
      </div>
      <div className="mt-1.5 space-y-0.5">
        {tasks.map(tpl => (
          <div key={tpl.id} className="flex items-center gap-2 rounded py-0.5 text-[10px]">
            <ChevronRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground/30" />
            <span className="min-w-0 flex-1 truncate text-foreground/80">{tpl.title}</span>
            <span className="shrink-0 rounded bg-foreground/[0.05] px-1.5 py-px text-[9px] font-medium text-muted-foreground">{ROLE_LABELS[tpl.driRole]}</span>
            <span className="shrink-0 text-[9px] font-mono text-muted-foreground/50">{offsetFn(tpl)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LifecycleSection({ label, count, tasks }: {
  label: string
  count: number
  tasks: TaskTemplateConfig[]
}) {
  if (count === 0) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-[11px] font-medium text-foreground/70">{label}</span>
        <span className="text-[10px] text-muted-foreground/40">없음</span>
      </div>
    )
  }

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
          <span className="rounded-full bg-foreground/[0.06] px-1.5 py-px text-[9px] text-muted-foreground">{count}</span>
        </div>
      </div>
      <div className="mt-1.5 space-y-0.5">
        {tasks.map(tpl => {
          let timing = ''
          if (tpl.triggerType === 'opening_d') timing = offsetLabel(tpl.triggerOffset ?? 0, '개강일', '개강일')
          else if (tpl.triggerType === 'closing_d') timing = offsetLabel(tpl.triggerOffset ?? 0, '수료일', '수료일')
          else if (tpl.frequency === 'per_chapter') timing = offsetLabel(tpl.triggerOffset ?? 0, '시작일', '종료일')
          else if (tpl.frequency === 'ad_hoc') timing = '수시'
          else timing = tpl.triggerType || ''
          return (
            <div key={tpl.id} className="flex items-center gap-2 rounded py-0.5 text-[10px]">
              <ChevronRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground/30" />
              <span className="min-w-0 flex-1 truncate text-foreground/80">{tpl.title}</span>
              <span className="shrink-0 rounded bg-foreground/[0.05] px-1.5 py-px text-[9px] font-medium text-muted-foreground">{ROLE_LABELS[tpl.driRole]}</span>
              <span className="shrink-0 text-[9px] font-mono text-muted-foreground/50">{timing}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
