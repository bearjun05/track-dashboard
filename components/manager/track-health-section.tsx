'use client'

import { useMemo, useState, useCallback } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import type { PlannerTrackCard, TrackTask } from '@/lib/admin-mock-data'
import type { UnifiedTask } from '@/components/task/task-types'
import { TrendingUp, TrendingDown, Minus, X, Send, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TODAY_STR } from '@/lib/date-constants'
const BAR_H_MAX = 24
const DAYS_TO_SHOW = 30

function getLast30Days(todayStr: string): string[] {
  const d = new Date(todayStr)
  return Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
    const dd = new Date(d)
    dd.setDate(d.getDate() - (DAYS_TO_SHOW - 1 - i))
    return dd.toISOString().split('T')[0]
  })
}

interface DayStat {
  date: string
  rate: number
  total: number
  completed: number
  overdue: number
  staffBreakdown: { id: string; name: string; total: number; completed: number; overdue: number; rate: number }[]
}

function computeDailyStats(
  trackTasks: TrackTask[],
  trackId: string,
  days: string[],
  staffList: { id: string; name: string }[],
): DayStat[] {
  return days.map((date) => {
    const dayTasks = trackTasks.filter(
      (t) => t.trackId === trackId && t.scheduledDate === date,
    )
    if (dayTasks.length === 0)
      return { date, rate: 0, total: 0, completed: 0, overdue: 0, staffBreakdown: [] }
    const completed = dayTasks.filter((t) => t.status === 'completed').length
    const overdue = dayTasks.filter((t) => t.status === 'overdue').length

    const staffBreakdown = staffList.map((s) => {
      const st = dayTasks.filter((t) => t.assigneeId === s.id)
      const sc = st.filter((t) => t.status === 'completed').length
      const so = st.filter((t) => t.status === 'overdue').length
      return { id: s.id, name: s.name, total: st.length, completed: sc, overdue: so, rate: st.length > 0 ? Math.round((sc / st.length) * 100) : 0 }
    })

    return {
      date,
      rate: Math.round((completed / dayTasks.length) * 100),
      total: dayTasks.length,
      completed,
      overdue,
      staffBreakdown,
    }
  })
}

function barColorClass(rate: number, hasData: boolean): string {
  if (!hasData) return 'bg-foreground/[0.04]'
  if (rate >= 80) return 'bg-foreground/55'
  if (rate >= 60) return 'bg-amber-500/50'
  return 'bg-red-400/40'
}

function rateColorClass(rate: number): string {
  if (rate >= 80) return 'text-foreground/70'
  if (rate >= 60) return 'text-amber-600'
  return 'text-red-500'
}

function fmtShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function fmtDayLabel(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return days[new Date(dateStr).getDay()]
}

/* ── Day Detail Modal ── */
function DayDetailModal({
  track,
  stat,
  onClose,
  onSendMessage,
}: {
  track: PlannerTrackCard
  stat: DayStat
  onClose: () => void
  onSendMessage: (content: string) => void
}) {
  const [chatInput, setChatInput] = useState('')

  const handleSend = () => {
    if (!chatInput.trim()) return
    onSendMessage(chatInput.trim())
    setChatInput('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-semibold"
              style={{ backgroundColor: `${track.color}15`, color: track.color }}>
              {track.name}
            </span>
            <span className="text-[13px] font-semibold text-foreground">{fmtShortDate(stat.date)} ({fmtDayLabel(stat.date)})</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary */}
        <div className="border-b border-border px-5 py-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground">완료율</p>
              <p className={cn('text-xl font-bold tabular-nums', rateColorClass(stat.rate))}>{stat.rate}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">완료/전체</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{stat.completed}/{stat.total}</p>
            </div>
            {stat.overdue > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground">지연</p>
                <p className="text-sm font-semibold tabular-nums text-red-500">{stat.overdue}건</p>
              </div>
            )}
          </div>
        </div>

        {/* Staff breakdown */}
        {stat.staffBreakdown.length > 0 && (
          <div className="border-b border-border px-5 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/25">학관매별 현황</p>
            <div className="space-y-1.5">
              {stat.staffBreakdown.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-[42px] shrink-0 truncate text-[11px] font-medium text-foreground">{s.name}</span>
                  <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/10">
                    <div className={cn('h-full rounded-full transition-all', barColorClass(s.rate, s.total > 0))}
                      style={{ width: `${Math.min(s.rate, 100)}%` }} />
                  </div>
                  <span className={cn('w-[30px] shrink-0 text-right text-[10px] tabular-nums font-medium', rateColorClass(s.rate))}>
                    {s.total > 0 ? `${s.rate}%` : '-'}
                  </span>
                  {s.overdue > 0 && (
                    <span className="shrink-0 text-[9px] font-medium text-red-500">지연{s.overdue}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat input -> creates a task */}
        <div className="px-5 py-3">
          <p className="mb-2 text-[10px] text-muted-foreground">
            문의나 지시사항을 입력하면 담당 운영매니저에게 Task로 전달됩니다.
            {track.operator && <span className="font-medium text-foreground/50"> (담당: {track.operator.name})</span>}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="예: 이 날 완료율이 왜 낮았나요?"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
            />
            <button type="button" onClick={handleSend} disabled={!chatInput.trim()}
              className="flex items-center gap-1 rounded-lg bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40">
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Track Row ── */
function TrackHealthRow({
  track,
  dailyStats,
  days,
  onBarClick,
}: {
  track: PlannerTrackCard
  dailyStats: DayStat[]
  days: string[]
  onBarClick: (trackId: string, dayIndex: number) => void
}) {
  const todayIdx = days.indexOf(TODAY_STR)
  const todayStat = todayIdx >= 0 ? dailyStats[todayIdx] : null
  const todayRate = todayStat?.rate ?? 0
  const yesterdayStat = todayIdx > 0 ? dailyStats[todayIdx - 1] : null
  const diff = yesterdayStat && yesterdayStat.total > 0 ? todayRate - yesterdayStat.rate : null

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-foreground/[0.02]">
      {/* Track badge */}
      <span className="inline-flex w-[72px] shrink-0 items-center justify-center rounded-full px-2 py-[2px] text-[10px] font-semibold"
        style={{ backgroundColor: `${track.color}15`, color: track.color }}>
        {track.name.replace(/트랙\s*/, '')}
      </span>

      {/* Today rate + trend (with tooltip) */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-[70px] shrink-0 cursor-help items-baseline gap-1">
              <span className={cn('text-[14px] font-bold tabular-nums', todayStat && todayStat.total > 0 ? rateColorClass(todayRate) : 'text-foreground/25')}>
                {todayStat && todayStat.total > 0 ? `${todayRate}%` : '-'}
              </span>
              {diff !== null && diff !== 0 && (
                <span className={cn('flex items-center gap-0.5 text-[10px] font-medium tabular-nums',
                  diff > 0 ? 'text-foreground/60' : 'text-destructive')}>
                  {diff > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {Math.abs(diff)}%
                </span>
              )}
              {diff === 0 && <Minus className="h-2.5 w-2.5 text-foreground/20" />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-[11px]">
            <p className="font-semibold">오늘 완료율</p>
            <p className="text-muted-foreground">오늘 배정된 전체 Task 중 완료된 비율</p>
            {todayStat && todayStat.total > 0 && (
              <p className="mt-0.5">완료 {todayStat.completed} / 전체 {todayStat.total} = {todayRate}%</p>
            )}
            {diff !== null && (
              <>
                <p className="mt-1 font-semibold">전일 대비</p>
                <p className="text-muted-foreground">어제 완료율({yesterdayStat?.rate ?? 0}%)과의 차이</p>
              </>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 30-day sparkline */}
      <TooltipProvider delayDuration={100}>
        <div className="flex min-w-0 flex-1 items-end gap-[1px]">
          {dailyStats.map((stat, i) => {
            const isFuture = days[i] > TODAY_STR
            const isToday = days[i] === TODAY_STR
            const hasData = stat.total > 0 && !isFuture
            const h = !hasData ? 2 : Math.max(2, Math.round((stat.rate / 100) * BAR_H_MAX))
            return (
              <Tooltip key={stat.date}>
                <TooltipTrigger asChild>
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); if (hasData) onBarClick(track.id, i) }}
                    disabled={!hasData}
                    className={cn(
                      'flex-1 min-w-[3px] max-w-[10px] rounded-[1px] transition-all',
                      isFuture ? 'bg-foreground/[0.03] cursor-default' : !hasData ? 'bg-foreground/[0.06] cursor-default' : cn(barColorClass(stat.rate, true), 'cursor-pointer hover:opacity-80'),
                    )}
                    style={{ height: `${isFuture ? 2 : h}px` }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[11px]">
                  <p className="font-semibold">{fmtShortDate(stat.date)} ({fmtDayLabel(stat.date)})</p>
                  {hasData ? (
                    <>
                      <p className={rateColorClass(stat.rate)}>완료율 {stat.rate}% ({stat.completed}/{stat.total})</p>
                      {stat.overdue > 0 && <p className="text-red-500">지연 {stat.overdue}건</p>}
                      <p className="mt-0.5 text-[9px] text-muted-foreground">클릭하여 상세 보기</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">{isFuture ? '예정' : '데이터 없음'}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      {/* Health day counts */}
      {(() => {
        const pastStats = dailyStats.filter((s, i) => days[i] <= TODAY_STR && s.total > 0)
        const normal = pastStats.filter((s) => s.rate >= 80).length
        const caution = pastStats.filter((s) => s.rate >= 60 && s.rate < 80).length
        const danger = pastStats.filter((s) => s.rate < 60).length
        return (
          <div className="ml-1 flex w-[150px] shrink-0 items-center justify-end gap-1 text-[9px]">
            <span className="rounded bg-foreground/[0.05] px-1.5 py-0.5 tabular-nums text-foreground/50">보통 {normal}</span>
            {caution > 0 && (
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 tabular-nums font-medium text-amber-600">주의 {caution}</span>
            )}
            {danger > 0 && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 tabular-nums font-medium text-red-500">위험 {danger}</span>
            )}
          </div>
        )
      })()}
    </div>
  )
}

/* ── Main Section ── */
export function TrackHealthSection({ tracks }: { tracks: PlannerTrackCard[] }) {
  const { trackTasks, addManagerTask } = useAdminStore()
  const days = useMemo(() => getLast30Days(TODAY_STR), [])

  const trackStats = useMemo(
    () =>
      tracks.map((track) => {
        const staffList = (track.staff ?? []).map((s) => ({ id: s.id, name: s.name }))
        return {
          track,
          dailyStats: computeDailyStats(trackTasks, track.id, days, staffList),
        }
      }),
    [tracks, trackTasks, days],
  )

  const [modalInfo, setModalInfo] = useState<{ trackId: string; dayIndex: number } | null>(null)

  const handleBarClick = useCallback((trackId: string, dayIndex: number) => {
    setModalInfo({ trackId, dayIndex })
  }, [])

  const handleSendMessage = useCallback((content: string) => {
    if (!modalInfo) return
    const ts = trackStats.find((t) => t.track.id === modalInfo.trackId)
    if (!ts) return
    const stat = ts.dailyStats[modalInfo.dayIndex]
    const operatorId = ts.track.operator?.id
    addManagerTask({
      id: `mt_health_${Date.now()}`,
      trackId: '_manager',
      title: `[${ts.track.name} ${fmtShortDate(stat.date)}] ${content}`,
      description: `트랙 건강도 ${stat.rate}% (${stat.completed}/${stat.total}) 관련 문의`,
      category: '운영 관리',
      source: 'request_received',
      creatorId: 'mgr1',
      assigneeId: operatorId ?? 'op1',
      reviewerId: 'mgr1',
      startDate: TODAY_STR,
      priority: 'important',
      status: 'pending',
      createdAt: TODAY_STR,
      messages: [{
        id: `mtm_health_${Date.now()}`,
        authorId: 'mgr1',
        authorName: '나',
        content,
        timestamp: new Date().toTimeString().slice(0, 5),
        isSelf: true,
      }],
    })
  }, [modalInfo, trackStats, addManagerTask])

  const modalTrack = modalInfo ? trackStats.find((t) => t.track.id === modalInfo.trackId) : null
  const modalStat = modalTrack && modalInfo ? modalTrack.dailyStats[modalInfo.dayIndex] : null

  if (tracks.length === 0) return null

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">트랙 건강도</h2>
          <span className="text-[10px] text-muted-foreground">최근 30일</span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px] text-[11px]">
                <p className="font-semibold">완료율 색상 정책</p>
                <div className="mt-1 space-y-0.5">
                  <p><span className="inline-block h-2 w-2 rounded-[1px] bg-foreground/55" /> 80% 이상 — 보통</p>
                  <p><span className="inline-block h-2 w-2 rounded-[1px] bg-amber-500/50" /> 60~80% — 주의</p>
                  <p><span className="inline-block h-2 w-2 rounded-[1px] bg-red-400/40" /> 60% 미만 — 위험</p>
                </div>
                <p className="mt-1 text-muted-foreground">바 클릭 시 상세 현황 확인</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-[9px] tabular-nums text-muted-foreground">{fmtShortDate(days[0])} ~ {fmtShortDate(days[days.length - 1])}</span>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="divide-y divide-border/50">
          {trackStats.map(({ track, dailyStats }) => (
            <TrackHealthRow
              key={track.id}
              track={track}
              dailyStats={dailyStats}
              days={days}
              onBarClick={handleBarClick}
            />
          ))}
        </div>
      </div>

      {/* Day Detail Modal */}
      {modalTrack && modalStat && (
        <DayDetailModal
          track={modalTrack.track}
          stat={modalStat}
          onClose={() => setModalInfo(null)}
          onSendMessage={handleSendMessage}
        />
      )}
    </section>
  )
}
