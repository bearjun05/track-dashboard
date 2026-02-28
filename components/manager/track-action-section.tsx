'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import type { PlannerTrackCard, TrackTask } from '@/lib/admin-mock-data'
import { TrackActionCard, type ActionCardItem } from './track-action-card'
import { UserX, MessageSquareDot, ClipboardCheck, ChevronsUpDown, ChevronsDownUp } from 'lucide-react'

const REQUEST_MARKER = '__request_sent__'

interface TrackGroupedItems {
  trackId: string
  trackName: string
  trackColor: string
  items: ActionCardItem[]
}

function groupByTrack(
  tracks: PlannerTrackCard[],
  filteredTasks: TrackTask[],
  filterParam: string,
): TrackGroupedItems[] {
  return tracks.map((track) => {
    const tasks = filteredTasks.filter((t) => t.trackId === track.id)
    return {
      trackId: track.id,
      trackName: track.name,
      trackColor: track.color,
      items: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.assigneeName ?? '미배정',
        linkTo: `/tracks/${track.id}/tasks?${filterParam}&highlight=${t.id}`,
      })),
    }
  })
}

function ColumnHeader({
  icon,
  label,
  totalCount,
}: {
  icon: React.ReactNode
  label: string
  totalCount: number
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground/[0.05] text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-[13px] font-semibold text-foreground">{label}</h3>
      {totalCount > 0 && (
        <span className="rounded-full bg-foreground/[0.06] px-1.5 py-px text-[10px] font-semibold tabular-nums text-muted-foreground">
          {totalCount}
        </span>
      )}
    </div>
  )
}

export function TrackActionSection({
  tracks,
  managerId,
}: {
  tracks: PlannerTrackCard[]
  managerId: string
}) {
  const { trackTasks } = useAdminStore()
  const [collapsed, setCollapsed] = useState(false)

  const trackIds = useMemo(() => new Set(tracks.map((t) => t.id)), [tracks])
  const relevantTasks = useMemo(
    () => trackTasks.filter((t) => trackIds.has(t.trackId)),
    [trackTasks, trackIds],
  )

  const unassignedTasks = useMemo(
    () => relevantTasks.filter((t) => t.status === 'unassigned'),
    [relevantTasks],
  )

  const requestTasks = useMemo(
    () =>
      relevantTasks.filter(
        (t) =>
          t.description?.startsWith(REQUEST_MARKER) &&
          t.status !== 'completed',
      ),
    [relevantTasks],
  )

  const reviewTasks = useMemo(
    () =>
      relevantTasks.filter(
        (t) =>
          t.status === 'pending_review' &&
          !t.description?.startsWith(REQUEST_MARKER),
      ),
    [relevantTasks],
  )

  const unassignedGroups = useMemo(
    () => groupByTrack(tracks, unassignedTasks, 'scope=unassigned'),
    [tracks, unassignedTasks],
  )

  const requestGroups = useMemo(
    () => groupByTrack(tracks, requestTasks, 'source=request'),
    [tracks, requestTasks],
  )

  const reviewGroups = useMemo(
    () => groupByTrack(tracks, reviewTasks, 'status=pending_review'),
    [tracks, reviewTasks],
  )

  const totalUnassigned = unassignedTasks.length
  const totalRequests = requestTasks.length
  const totalReviews = reviewTasks.length

  if (totalUnassigned === 0 && totalRequests === 0 && totalReviews === 0) {
    return (
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">트랙별 할 일</h2>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-8 text-[13px] text-muted-foreground">
          처리할 항목이 없습니다
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">트랙별 할 일</h2>
          <span className="rounded-full bg-foreground/[0.06] px-1.5 py-px text-[10px] font-semibold tabular-nums text-muted-foreground">
            {totalUnassigned + totalRequests + totalReviews}건
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {collapsed ? <ChevronsUpDown className="h-3 w-3" /> : <ChevronsDownUp className="h-3 w-3" />}
          {collapsed ? '펼치기' : '접기'}
        </button>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* 미배정 업무 */}
          <div>
            <ColumnHeader
              icon={<UserX className="h-3.5 w-3.5" />}
              label="미배정 업무"
              totalCount={totalUnassigned}
            />
            <div className="space-y-2">
              {unassignedGroups.map((g) => (
                <TrackActionCard
                  key={g.trackId}
                  trackName={g.trackName}
                  trackColor={g.trackColor}
                  trackId={g.trackId}
                  count={g.items.length}
                  items={g.items}
                  filterParam="scope=unassigned"
                />
              ))}
            </div>
          </div>

          {/* 받은 요청 관리 */}
          <div>
            <ColumnHeader
              icon={<MessageSquareDot className="h-3.5 w-3.5" />}
              label="받은 요청 관리"
              totalCount={totalRequests}
            />
            <div className="space-y-2">
              {requestGroups.map((g) => (
                <TrackActionCard
                  key={g.trackId}
                  trackName={g.trackName}
                  trackColor={g.trackColor}
                  trackId={g.trackId}
                  count={g.items.length}
                  items={g.items}
                  filterParam="source=request"
                />
              ))}
            </div>
          </div>

          {/* 리뷰해줄 것 */}
          <div>
            <ColumnHeader
              icon={<ClipboardCheck className="h-3.5 w-3.5" />}
              label="리뷰해줄 것"
              totalCount={totalReviews}
            />
            <div className="space-y-2">
              {reviewGroups.map((g) => (
                <TrackActionCard
                  key={g.trackId}
                  trackName={g.trackName}
                  trackColor={g.trackColor}
                  trackId={g.trackId}
                  count={g.items.length}
                  items={g.items}
                  filterParam="status=pending_review"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
