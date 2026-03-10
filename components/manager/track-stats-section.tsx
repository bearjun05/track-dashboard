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
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fillOpacity="0.12" />
      <path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L75.99 3.143C71.717 0.037 69.97 -0.353 63.17 0.227L61.35 0.227zM25.697 19.013c-5.27 0.33 -6.467 0.4 -9.49 -1.963L8.927 11.307c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.543 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.907 -0.263zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zM71.603 34.46c0.39 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L20.86 41.307c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l14.22 -0.433z" />
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
      {/* Header + Chapter: fixed height so all rows below align across cards */}
      <div className="min-h-[50px]">
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
      </div>

      {/* 구분선 + 이탈율 · NPS */}
      <div className="mt-2 border-t border-foreground/[0.06] pt-2">
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
              { key: 'studentDocs' as const, tip: '수강생 독스', icon: <GraduationCap className="h-3 w-3" /> },
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
