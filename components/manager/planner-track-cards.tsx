'use client'

import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import { ROLE_LABELS } from '@/lib/role-labels'
import { Users, GraduationCap, BookOpen, Info, ChevronRight } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function MiniProgress({ value, color }: { value: number; color?: string }) {
  const barColor =
    color ?? (value >= 80 ? 'bg-foreground/70' : value >= 60 ? 'bg-foreground/50' : 'bg-foreground/30')
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

export function PlannerTrackCards({ basePath = '/manager' }: { basePath?: string }) {
  const { plannerTracks } = useAdminStore()

  return (
    <TooltipProvider delayDuration={200}>
      <section>
        <h2 className="mb-3 text-base font-semibold text-foreground">
          {'담당 트랙'}{' '}
          <span className="font-normal text-muted-foreground">
            {plannerTracks.length}{'개'}
          </span>
        </h2>

        <div className="space-y-2.5">
          {plannerTracks.map((track) => {
            return (
              <Link
                key={track.id}
                href={`${basePath}/tracks/${track.id}`}
                className="group flex overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/15 hover:shadow-sm"
              >
                {/* ====== 왼쪽 60%: 트랙 정보 ====== */}
                <div className="flex w-[60%] flex-col px-5 py-4">
                  {/* Header */}
                  <div className="flex items-center gap-2.5">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${track.color}15`,
                        color: track.color,
                      }}
                    >
                      {track.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {track.period.replace(/2026\./g, '').replace(/ /g, '')}
                    </span>
                  </div>

                  {/* 완료율 */}
                  <div className="mt-3.5">
                    <div className="flex items-end justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex cursor-help items-center gap-1 text-xs text-muted-foreground">
                            {'완료율'}
                            <Info className="h-3 w-3" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                          {'오늘 해당 기수의 학습관리매니저 평균 업무완료율'}
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-lg font-bold tabular-nums text-foreground">{track.completionRate}{'%'}</span>
                    </div>
                    <div className="mt-1">
                      <MiniProgress value={track.completionRate} />
                    </div>
                  </div>

                  {/* 발생 이슈 */}
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {'이슈 '}{track.issueSummary.total}
                    </span>
                    <span className="mx-0.5">{'—'}</span>
                    <span>{'대기 '}{track.issueSummary.waiting}</span>
                    <span className="text-foreground/20">{'/'}</span>
                    <span>{'진행 '}{track.issueSummary.inProgress}</span>
                    <span className="text-foreground/20">{'/'}</span>
                    <span>{'완료 '}{track.issueSummary.done}</span>
                  </div>

                  {/* People */}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {track.staffCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {track.studentCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {track.tutorCount}
                    </span>
                  </div>
                </div>

                {/* ====== 오른쪽 40%: 학습관리매니저 목록 ====== */}
                {track.staff && track.staff.length > 0 && (
                  <div className="flex w-[40%] shrink-0 flex-col border-l border-border px-5 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">{ROLE_LABELS.learning_manager} {track.staff.length}명</span>
                      <Link
                        href={`${basePath}/tracks/${track.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {'상세'}
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="mt-2 flex-1 space-y-1.5">
                      {track.staff.map(s => {
                        const barColor = s.taskCompletionRate >= 80 ? 'bg-foreground/70' : s.taskCompletionRate >= 60 ? 'bg-foreground/50' : 'bg-foreground/30'
                        return (
                          <div key={s.id} className="flex items-center gap-2">
                            <span className="w-12 shrink-0 truncate text-[12px] font-medium text-foreground">{s.name}</span>
                            <div className="flex-1">
                              <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(s.taskCompletionRate, 100)}%` }} />
                              </div>
                            </div>
                            <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{s.taskCompletionRate}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </section>
    </TooltipProvider>
  )
}
