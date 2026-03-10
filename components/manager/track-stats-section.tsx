'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/lib/admin-store'
import type { PlannerTrackCard } from '@/lib/admin-mock-data'
import type { UnifiedSchedule } from '@/components/schedule/schedule-types'
import { Users, GraduationCap, BookOpen, AlertTriangle, ClipboardList, Calendar, BookMarked, FolderOpen, Hash, Settings } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TODAY_STR } from '@/lib/date-constants'
import { MetricsBoxCard } from '@/components/ui/mini-charts'

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 2.5L10.5 2L12.5 4.5V13.5L10 13L3.5 13.5V2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.5 6L7 6M5.5 8.5L10 8.5M5.5 11L8.5 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

interface TrackExternalLinks {
  googleDrive?: string
  studentDocs?: string
  operationDocs?: string
  slackChannel?: string
}

function MiniProgress({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const h = size === 'md' ? 'h-1.5' : 'h-1'
  const barColor = value >= 80 ? 'bg-foreground/70' : value >= 60 ? 'bg-foreground/50' : 'bg-foreground/30'
  return (
    <div className={`${h} w-full overflow-hidden rounded-full bg-foreground/10`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

function ShortcutBtn({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        router.push(href)
      }}
      className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
    >
      {icon}
      {label}
    </button>
  )
}

function TrackStatCard({
  track,
  overdueByStaff,
  currentChapter,
  currentCurriculum,
  showOperator,
}: {
  track: PlannerTrackCard
  overdueByStaff: Map<string, number>
  currentChapter?: string
  currentCurriculum?: string
  showOperator?: boolean
}) {
  const [links, setLinks] = useState<TrackExternalLinks>({})

  return (
    <Link
      href={`/tracks/${track.id}`}
      className="group flex min-h-[240px] flex-col rounded-xl border border-border bg-card px-4 py-3.5 transition-all hover:border-foreground/15 hover:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-semibold"
          style={{ backgroundColor: `${track.color}15`, color: track.color }}
        >
          {track.name}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {track.period.replace(/2026\./g, '').replace(/ /g, '')}
        </span>
      </div>

      {/* 현재 챕터 | 커리큘럼 */}
      {(currentChapter || currentCurriculum) && (
        <div className="mt-2 flex items-center gap-1 overflow-hidden text-[9px]">
          {currentChapter && (
            <span className="inline-flex items-center gap-0.5 truncate rounded bg-foreground/[0.04] px-1.5 py-0.5 font-medium text-foreground/50">
              <BookMarked className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{currentChapter}</span>
            </span>
          )}
          {currentChapter && currentCurriculum && (
            <span className="shrink-0 text-foreground/15">|</span>
          )}
          {currentCurriculum && (
            <span className="inline-flex items-center gap-0.5 truncate rounded bg-foreground/[0.04] px-1.5 py-0.5 font-medium text-foreground/50">
              <span className="truncate">{currentCurriculum}</span>
            </span>
          )}
        </div>
      )}

      {/* 이탈율 · NPS */}
      <div className="mt-2.5">
        <MetricsBoxCard />
      </div>

      {/* 학관 업무완료율 */}
      <div className="mt-2">
        <div className="flex items-end justify-between">
          <span className="text-[10px] text-muted-foreground">학관 완료율</span>
          <span className="text-base font-bold tabular-nums text-foreground">{track.completionRate}%</span>
        </div>
        <div className="mt-1">
          <MiniProgress value={track.completionRate} size="md" />
        </div>
      </div>

      {/* 이슈 */}
      <div className="mt-2.5 flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="font-medium text-foreground">이슈 {track.issueSummary.total}</span>
        <span className="mx-0.5">—</span>
        {track.issueSummary.waiting > 0 ? (
          <span className="font-medium text-amber-600">대기 {track.issueSummary.waiting}</span>
        ) : (
          <span>대기 0</span>
        )}
        <span className="text-foreground/20">/</span>
        <span>진행 {track.issueSummary.inProgress}</span>
        <span className="text-foreground/20">/</span>
        <span>완료 {track.issueSummary.done}</span>
      </div>

      {/* 운영매니저 현황 (총괄 뷰에서만) */}
      {showOperator && track.operator && (
        <div className="mt-2.5">
          <div className="flex items-center gap-2">
            <span className="w-[38px] shrink-0 truncate text-[10px] font-semibold text-foreground">
              {track.operator.name}
            </span>
            <div className="min-w-0 flex-1">
              <MiniProgress value={track.operator.taskCompletionRate} size="md" />
            </div>
            <span className="w-[50px] shrink-0 text-right text-[10px] tabular-nums text-foreground/60">
              {track.operator.taskCompleted}/{track.operator.taskTotal}
            </span>
          </div>
        </div>
      )}

      {/* 구분선 */}
      {showOperator && track.operator && track.staff && track.staff.length > 0 && (
        <div className="mt-2 border-t border-dashed border-foreground/[0.08]" />
      )}

      {/* 학관매 현황 */}
      {track.staff && track.staff.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {track.staff.map((s) => {
            const overdue = overdueByStaff.get(s.id) ?? 0
            return (
              <div key={s.id} className="flex items-center gap-2">
                <span className="w-[38px] shrink-0 truncate text-[10px] font-medium text-foreground">
                  {s.name}
                </span>
                <div className="min-w-0 flex-1">
                  <MiniProgress value={s.taskCompletionRate} />
                </div>
                <span className="w-[26px] shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                  {s.taskCompletionRate}%
                </span>
                {overdue > 0 && (
                  <span className="flex shrink-0 items-center gap-0.5 text-[9px] font-medium text-amber-600">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {overdue}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom-pinned section: External Links + People + Shortcuts */}
      <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
        <div className="border-t border-foreground/[0.08] pt-2">
          <TooltipProvider delayDuration={150}>
          <div className="flex items-center gap-1 text-[9px] text-foreground/40">
            <span className="shrink-0 font-medium">링크</span>
            {([
              { key: 'googleDrive' as const, tip: 'Google Drive', icon: <FolderOpen className="h-3 w-3" /> },
              { key: 'studentDocs' as const, tip: '수강생 독스', icon: <NotionIcon className="h-3 w-3" /> },
              { key: 'operationDocs' as const, tip: '운영진 독스', icon: <NotionIcon className="h-3 w-3" /> },
              { key: 'slackChannel' as const, tip: 'Slack', icon: <Hash className="h-3 w-3" /> },
            ]).map(({ key, tip, icon }) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  {links[key] ? (
                    <a
                      href={links[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-foreground/50 transition-colors hover:bg-foreground/[0.08] hover:text-foreground/70"
                    >
                      {icon}
                    </a>
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-foreground/15">
                      {icon}
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px]">{tip}</TooltipContent>
              </Tooltip>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded text-foreground/20 transition-colors hover:text-foreground/40"
                  title="링크 설정"
                >
                  <Settings className="h-2.5 w-2.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-foreground">외부 링크 설정</h4>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Google Drive</Label>
                      <Input
                        placeholder="https://..."
                        value={links.googleDrive ?? ''}
                        onChange={(e) => setLinks((p) => ({ ...p, googleDrive: e.target.value || undefined }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Notion - 수강생 독스</Label>
                      <Input
                        placeholder="https://..."
                        value={links.studentDocs ?? ''}
                        onChange={(e) => setLinks((p) => ({ ...p, studentDocs: e.target.value || undefined }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Notion - 운영진 독스</Label>
                      <Input
                        placeholder="https://..."
                        value={links.operationDocs ?? ''}
                        onChange={(e) => setLinks((p) => ({ ...p, operationDocs: e.target.value || undefined }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Slack channel</Label>
                      <Input
                        placeholder="https://..."
                        value={links.slackChannel ?? ''}
                        onChange={(e) => setLinks((p) => ({ ...p, slackChannel: e.target.value || undefined }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          </TooltipProvider>
        </div>

        {/* People + Shortcuts */}
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex cursor-help items-center gap-0.5">
                  <Users className="h-3 w-3" />
                  {track.staffCount}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">학습관리매니저</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex cursor-help items-center gap-0.5">
                  <GraduationCap className="h-3 w-3" />
                  {track.studentCount}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">수강생</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex cursor-help items-center gap-0.5">
                  <BookOpen className="h-3 w-3" />
                  {track.tutorCount}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">튜터</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        <div className="flex items-center gap-1">
          <ShortcutBtn icon={<ClipboardList className="h-3 w-3" />} label="Task" href={`/tracks/${track.id}/tasks`} />
          <ShortcutBtn icon={<Calendar className="h-3 w-3" />} label="일정" href={`/tracks/${track.id}/schedule`} />
        </div>
      </div>
      </div>
    </Link>
  )
}

function findCurrentSchedule(schedules: UnifiedSchedule[], trackId: string, type: 'chapter' | 'curriculum'): string | undefined {
  const match = schedules.find(
    (s) => s.type === type && s.trackId === trackId && s.startDate <= TODAY_STR && s.endDate >= TODAY_STR,
  )
  if (!match) return undefined
  return match.title.replace(/^챕터\s*\d+:\s*/, '').replace(/^챕터\s*\d+\s*/, '')
}

export function TrackStatsSection({ tracks, showOperator }: { tracks: PlannerTrackCard[]; showOperator?: boolean }) {
  const { trackTasks, schedules } = useAdminStore()

  const overdueMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>()
    for (const t of trackTasks) {
      if (t.status !== 'overdue' || !t.assigneeId) continue
      if (!map.has(t.trackId)) map.set(t.trackId, new Map())
      const staffMap = map.get(t.trackId)!
      staffMap.set(t.assigneeId, (staffMap.get(t.assigneeId) ?? 0) + 1)
    }
    return map
  }, [trackTasks])

  const currentSchedules = useMemo(() => {
    const map = new Map<string, { chapter?: string; curriculum?: string }>()
    for (const track of tracks) {
      map.set(track.id, {
        chapter: findCurrentSchedule(schedules, track.id, 'chapter'),
        curriculum: findCurrentSchedule(schedules, track.id, 'curriculum'),
      })
    }
    return map
  }, [tracks, schedules])

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">트랙별 현황</h2>
        <span className="text-xs text-muted-foreground">{tracks.length}개</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {tracks.map((track) => {
          const cs = currentSchedules.get(track.id)
          return (
            <TrackStatCard
              key={track.id}
              track={track}
              overdueByStaff={overdueMap.get(track.id) ?? new Map()}
              currentChapter={cs?.chapter}
              currentCurriculum={cs?.curriculum}
              showOperator={showOperator}
            />
          )
        })}
      </div>
    </section>
  )
}
