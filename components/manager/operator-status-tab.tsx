'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import type { PlannerTrackCard, KanbanCard } from '@/lib/admin-mock-data'
import { ROLE_LABELS } from '@/lib/role-labels'
import {
  TrendingUp,
  AlertCircle,
  FolderKanban,
  ChevronRight,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

interface OperatorSummary {
  id: string
  name: string
  tracks: PlannerTrackCard[]
  avgCompletion: number
  issuesPending: number
  kanbanWaiting: number
  kanbanInProgress: number
  overdueTracks: number
}

function buildOperatorSummaries(
  allTracks: PlannerTrackCard[],
  kanbanCards: KanbanCard[],
): OperatorSummary[] {
  const operatorMap = new Map<string, OperatorSummary>()

  for (const track of allTracks) {
    if (!track.operator) continue
    const opId = track.operator.id
    if (!operatorMap.has(opId)) {
      operatorMap.set(opId, {
        id: opId,
        name: track.operator.name,
        tracks: [],
        avgCompletion: 0,
        issuesPending: 0,
        kanbanWaiting: 0,
        kanbanInProgress: 0,
        overdueTracks: 0,
      })
    }
    const summary = operatorMap.get(opId)!
    summary.tracks.push(track)
    summary.issuesPending += track.issueSummary.waiting
    if (track.completionRate < 30) summary.overdueTracks += 1
  }

  for (const [, summary] of operatorMap) {
    if (summary.tracks.length > 0) {
      summary.avgCompletion = Math.round(
        summary.tracks.reduce((s, t) => s + t.completionRate, 0) / summary.tracks.length,
      )
    }
  }

  for (const card of kanbanCards) {
    const op = allTracks.find((t) => t.name.includes(card.trackName))?.operator
    if (!op || !operatorMap.has(op.id)) continue
    const summary = operatorMap.get(op.id)!
    if (card.status === 'waiting') summary.kanbanWaiting += 1
    else if (card.status === 'in-progress') summary.kanbanInProgress += 1
  }

  return Array.from(operatorMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function OperatorCard({ op }: { op: OperatorSummary }) {
  const hasWarning = op.overdueTracks > 0 || op.issuesPending > 3

  return (
    <Link href={`/operators/${op.id}`}>
      <div className={`rounded-xl border px-5 py-4 transition-all hover:shadow-sm ${
        hasWarning ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-border bg-card'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/[0.06] text-[13px] font-bold text-foreground">
              {op.name.charAt(0)}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">{op.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {ROLE_LABELS.operator} · 담당 트랙 {op.tracks.length}개
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </div>

        <div className="mt-3.5 grid grid-cols-4 gap-2">
          <MiniStat
            icon={<TrendingUp className="h-3 w-3" />}
            label="평균 완료율"
            value={`${op.avgCompletion}%`}
            accent={op.avgCompletion < 30 ? 'danger' : op.avgCompletion < 60 ? 'warning' : 'default'}
          />
          <MiniStat
            icon={<AlertCircle className="h-3 w-3" />}
            label="대기 이슈"
            value={`${op.issuesPending}건`}
            accent={op.issuesPending > 3 ? 'warning' : 'default'}
          />
          <MiniStat
            icon={<FolderKanban className="h-3 w-3" />}
            label="칸반 대기"
            value={`${op.kanbanWaiting}건`}
            accent={op.kanbanWaiting > 5 ? 'warning' : 'default'}
          />
          <MiniStat
            icon={<AlertTriangle className="h-3 w-3" />}
            label="주의 트랙"
            value={`${op.overdueTracks}개`}
            accent={op.overdueTracks > 0 ? 'danger' : 'default'}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {op.tracks.map((track) => (
            <span
              key={track.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] font-medium"
              style={{ backgroundColor: `${track.color}15`, color: track.color }}
            >
              {track.name.replace(' 트랙', '')}
              <span className="opacity-60">{track.completionRate}%</span>
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

function MiniStat({
  icon,
  label,
  value,
  accent = 'default',
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: 'default' | 'warning' | 'danger'
}) {
  const accentCls =
    accent === 'danger' ? 'text-red-500' : accent === 'warning' ? 'text-amber-500' : 'text-foreground'

  return (
    <div className="rounded-lg bg-foreground/[0.03] px-2.5 py-2">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}<span className="text-[10px]">{label}</span></div>
      <p className={`mt-0.5 text-[14px] font-bold tabular-nums leading-tight ${accentCls}`}>{value}</p>
    </div>
  )
}

export function OperatorStatusTab() {
  const { plannerTracks, kanbanCards } = useAdminStore()

  const summaries = useMemo(
    () => buildOperatorSummaries(plannerTracks, kanbanCards),
    [plannerTracks, kanbanCards],
  )

  const totalOperators = summaries.length
  const warningOperators = summaries.filter((o) => o.overdueTracks > 0 || o.issuesPending > 3).length

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">{ROLE_LABELS.operator} 현황</h2>
          <span className="flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
            <Users className="h-3 w-3" />{totalOperators}명
          </span>
          {warningOperators > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
              <AlertTriangle className="h-3 w-3" />주의 {warningOperators}명
            </span>
          )}
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <CheckCircle2 className="h-10 w-10 text-foreground/10" />
          <p className="text-[13px] text-muted-foreground">등록된 운영매니저가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map((op) => (
            <OperatorCard key={op.id} op={op} />
          ))}
        </div>
      )}
    </div>
  )
}
