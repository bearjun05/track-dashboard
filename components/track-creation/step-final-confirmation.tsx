'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Users, BookOpen, ListChecks, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdminStore } from '@/lib/admin-store'
import { taskTemplates, ROLE_LABELS } from '@/lib/task-templates'
import type { TrackCreationData, DriRole } from '@/lib/track-creation-types'

interface StepFinalConfirmationProps {
  data: TrackCreationData
}

const ROLE_ORDER: DriRole[] = ['operator_manager', 'operator', 'learning_manager']

export function StepFinalConfirmation({ data }: StepFinalConfirmationProps) {
  const router = useRouter()
  const createTrack = useAdminStore(s => s.createTrack)

  const allStaff = useMemo(() => [
    ...data.staff.operatorManagers,
    ...data.staff.operators,
    ...data.staff.learningManagers,
    ...data.staff.tutors,
  ], [data.staff])

  const totalHours = useMemo(() =>
    data.chapters.reduce((sum, ch) => sum + ch.cards.reduce((s, c) => s + c.totalHours, 0), 0),
  [data.chapters])

  const allTemplates = useMemo(() => [
    ...taskTemplates,
    ...data.customTemplates,
  ], [data.customTemplates])

  const taskStats = useMemo(() => {
    const byRole: Record<string, number> = {}
    let recurring = 0
    let track = 0
    for (const tpl of allTemplates) {
      byRole[tpl.driRole] = (byRole[tpl.driRole] || 0) + 1
      if (['daily', 'weekly', 'monthly', 'per_chapter'].includes(tpl.frequency)) recurring++
      else track++
    }
    return { total: allTemplates.length, byRole, recurring, track, custom: data.customTemplates.length }
  }, [allTemplates, data.customTemplates])

  const maxRoleCount = Math.max(...ROLE_ORDER.map(r => taskStats.byRole[r] || 0), 1)

  const handleCreate = () => {
    createTrack({
      name: data.name,
      round: data.round,
      trackStart: data.parsedSchedule?.trackStart || '',
      trackEnd: data.parsedSchedule?.trackEnd || '',
      chapters: data.chapters,
      staff: data.staff,
      tasks: data.generatedTasks,
    })
    router.push('/manager')
  }

  const staffByRole = [
    { key: 'operatorManagers', label: ROLE_LABELS['operator_manager'], members: data.staff.operatorManagers },
    { key: 'operators', label: ROLE_LABELS['operator'], members: data.staff.operators },
    { key: 'learningManagers', label: ROLE_LABELS['learning_manager'], members: data.staff.learningManagers },
    { key: 'tutors', label: ROLE_LABELS['tutor'] ?? '튜터', members: data.staff.tutors },
  ].filter(g => g.members.length > 0)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-foreground/[0.06]">
          <Check className="h-6 w-6 text-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-bold">{data.name} · {data.round}회차</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.parsedSchedule?.trackStart} ~ {data.parsedSchedule?.trackEnd}
          {data.parsedSchedule?.totalWeeks && <span className="ml-1">({data.parsedSchedule.totalWeeks}주)</span>}
        </p>
      </div>

      {/* 3-column stats */}
      <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border">
        <div className="p-4 text-center">
          <Users className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="mt-2 text-2xl font-bold">{allStaff.length}</p>
          <p className="text-[10px] text-muted-foreground">담당 인원</p>
        </div>
        <div className="p-4 text-center">
          <BookOpen className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="mt-2 text-2xl font-bold">{data.chapters.length}</p>
          <p className="text-[10px] text-muted-foreground">챕터 · {totalHours}시간</p>
        </div>
        <div className="p-4 text-center">
          <ListChecks className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="mt-2 text-2xl font-bold">{taskStats.total}</p>
          <p className="text-[10px] text-muted-foreground">Task 템플릿</p>
        </div>
      </div>

      {/* Staff section */}
      <section>
        <SectionHeader icon={<Users className="h-3.5 w-3.5" />} title="담당 인원" />
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5">
          {staffByRole.map(group => (
            <div key={group.key} className="flex items-center gap-1.5">
              <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{group.label}</span>
              <span className="text-[11px] text-foreground/80">{group.members.map(m => m.name).join(', ')}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Chapter timeline */}
      <section>
        <SectionHeader icon={<BookOpen className="h-3.5 w-3.5" />} title={`챕터 구성 (${data.chapters.length}개)`} />
        <div className="mt-3 space-y-0">
          {data.chapters.map((ch, i) => (
            <div key={ch.id} className="flex gap-3">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center">
                <div className="mt-1 h-2 w-2 rounded-full bg-foreground/30" />
                {i < data.chapters.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>
              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] font-semibold text-foreground/90">{ch.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/50">{ch.startDate} ~ {ch.endDate}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {ch.cards.map(c => (
                    <span key={c.id} className="inline-flex items-center rounded bg-foreground/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                      {c.subjectName}
                      <span className="ml-0.5 opacity-50">{c.totalHours}h</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Task overview */}
      <section>
        <SectionHeader icon={<ListChecks className="h-3.5 w-3.5" />} title="Task 구성" />
        <div className="mt-3 grid grid-cols-2 gap-4">
          {/* Left: role breakdown bar */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-muted-foreground">역할별 배분</p>
            {ROLE_ORDER.map(role => {
              const count = taskStats.byRole[role] || 0
              const pct = Math.round((count / maxRoleCount) * 100)
              return (
                <div key={role} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground/70">{ROLE_LABELS[role]}</span>
                    <span className="text-[11px] font-semibold">{count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div className="h-full rounded-full bg-foreground/30 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          {/* Right: type breakdown */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-muted-foreground">유형별 구성</p>
            <div className="grid grid-cols-2 gap-2">
              <StatBox label="반복 일정" value={taskStats.recurring} />
              <StatBox label="트랙 일정" value={taskStats.track} />
              <StatBox label="직접 추가" value={taskStats.custom} />
              <StatBox label="전체" value={taskStats.total} />
            </div>
          </div>
        </div>
      </section>

      {/* Create button */}
      <div className="rounded-xl border border-border bg-foreground/[0.02] p-6 text-center">
        <p className="text-sm text-muted-foreground">위 내용으로 트랙을 생성합니다. 생성 후에도 수정 가능합니다.</p>
        <Button size="lg" onClick={handleCreate} className="mt-4 px-10">
          트랙 생성 확정
        </Button>
      </div>
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[12px] font-semibold text-foreground/80">{title}</span>
      <div className="flex-1 border-t border-border/40" />
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-foreground/[0.02] px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  )
}
