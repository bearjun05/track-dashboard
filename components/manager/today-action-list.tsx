'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import type { KanbanCard, KanbanStatus, TrackTask, PlannerTrackCard } from '@/lib/admin-mock-data'
import { ROLE_LABELS } from '@/lib/role-labels'
import {
  AlertTriangle,
  UserX,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Briefcase,
  User,
  Flame,
  CheckCircle2,
  Clock,
  Send,
  CalendarArrowUp,
  Check,
  ExternalLink,
} from 'lucide-react'

const TODAY_STR = new Date().toISOString().split('T')[0]

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
//  ActionItem type with original data references
// ---------------------------------------------------------------------------
type ActionItemType = 'urgent_kanban' | 'overdue_track' | 'unassigned_track' | 'issue_waiting' | 'kanban_task' | 'staff_request'

interface ActionItem {
  id: string
  type: ActionItemType
  priority: number
  title: string
  subtitle: string
  trackName?: string
  trackColor?: string
  trackId?: string
  count?: number
  linkTo: string
  icon: React.ReactNode
  accentClass: string
  kanbanCard?: KanbanCard
  relatedTasks?: TrackTask[]
}

// ---------------------------------------------------------------------------
//  Build action items
// ---------------------------------------------------------------------------
function buildActionItems(
  tracks: PlannerTrackCard[],
  trackTasks: TrackTask[],
  kanbanCards: KanbanCard[],
): ActionItem[] {
  const items: ActionItem[] = []

  const urgentKanbans = kanbanCards.filter((c) => c.isUrgent && c.status !== 'done')
  for (const k of urgentKanbans) {
    items.push({
      id: `urgent-${k.id}`,
      type: 'urgent_kanban',
      priority: 0,
      title: k.title,
      subtitle: `${k.requesterName} · ${k.requesterRole}`,
      trackName: k.trackName,
      trackColor: k.trackColor,
      linkTo: '#kanban',
      icon: <Flame className="h-3.5 w-3.5" />,
      accentClass: 'border-destructive/30 bg-destructive/[0.04]',
      kanbanCard: k,
    })
  }

  for (const track of tracks) {
    const tTasks = trackTasks.filter((t) => t.trackId === track.id)

    const overdueTasks = tTasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'unassigned') return false
      const dueDate = t.dueDate ?? t.scheduledDate
      return dueDate < TODAY_STR
    })
    if (overdueTasks.length > 0) {
      items.push({
        id: `overdue-${track.id}`,
        type: 'overdue_track',
        priority: 1,
        title: `기한초과 Task ${overdueTasks.length}건`,
        subtitle: '즉시 조치 필요',
        trackName: track.name,
        trackColor: track.color,
        trackId: track.id,
        count: overdueTasks.length,
        linkTo: `/tracks/${track.id}?tab=tasks&status=overdue`,
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        accentClass: 'border-destructive/20 bg-destructive/[0.03]',
        relatedTasks: overdueTasks,
      })
    }

    const unassignedTasks = tTasks.filter((t) => t.status === 'unassigned')
    if (unassignedTasks.length > 0) {
      items.push({
        id: `unassigned-${track.id}`,
        type: 'unassigned_track',
        priority: 2,
        title: `미배정 Task ${unassignedTasks.length}건`,
        subtitle: '배정 대기 중',
        trackName: track.name,
        trackColor: track.color,
        trackId: track.id,
        count: unassignedTasks.length,
        linkTo: `/tracks/${track.id}?tab=tasks&scope=unassigned`,
        icon: <UserX className="h-3.5 w-3.5" />,
        accentClass: 'border-amber-500/20 bg-amber-500/[0.03]',
        relatedTasks: unassignedTasks,
      })
    }

    if (track.issueSummary.waiting > 0) {
      items.push({
        id: `issue-${track.id}`,
        type: 'issue_waiting',
        priority: 3,
        title: `대기 이슈 ${track.issueSummary.waiting}건`,
        subtitle: '학관매 요청 확인 필요',
        trackName: track.name,
        trackColor: track.color,
        trackId: track.id,
        count: track.issueSummary.waiting,
        linkTo: `/tracks/${track.id}`,
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        accentClass: 'border-border',
      })
    }
  }

  const activeKanbans = kanbanCards.filter(
    (c) => !c.isUrgent && (c.status === 'waiting' || c.status === 'in-progress'),
  )
  const managerKanbans = activeKanbans.filter((c) => c.requesterRole === ROLE_LABELS.operator_manager)
  const staffKanbans = activeKanbans.filter((c) => c.requesterRole !== ROLE_LABELS.operator_manager)

  for (const k of managerKanbans) {
    items.push({
      id: `kanban-mgr-${k.id}`,
      type: 'kanban_task',
      priority: 4,
      title: k.title,
      subtitle: `${k.requesterName} 지시 · ${k.status === 'waiting' ? '대기' : '진행중'}`,
      trackName: k.trackName,
      trackColor: k.trackColor,
      linkTo: '#kanban',
      icon: <Briefcase className="h-3.5 w-3.5" />,
      accentClass: 'border-border',
      kanbanCard: k,
    })
  }

  for (const k of staffKanbans) {
    items.push({
      id: `kanban-staff-${k.id}`,
      type: 'staff_request',
      priority: 5,
      title: k.title,
      subtitle: `${k.requesterName} 요청 · ${k.status === 'waiting' ? '대기' : '진행중'}`,
      trackName: k.trackName,
      trackColor: k.trackColor,
      linkTo: '#kanban',
      icon: <User className="h-3.5 w-3.5" />,
      accentClass: 'border-border',
      kanbanCard: k,
    })
  }

  return items.sort((a, b) => a.priority - b.priority)
}

const TYPE_LABELS: Record<ActionItemType, string> = {
  urgent_kanban: '긴급',
  overdue_track: '트랙 조치 필요',
  unassigned_track: '트랙 조치 필요',
  issue_waiting: '이슈 대기',
  kanban_task: '운기매 지시',
  staff_request: '학관매 요청',
}

const KANBAN_STATUS_LABELS: { id: KanbanStatus; label: string }[] = [
  { id: 'waiting', label: '대기' },
  { id: 'in-progress', label: '진행중' },
  { id: 'done', label: '완료' },
]

// ---------------------------------------------------------------------------
//  Kanban expanded panel: content, messages, reply, status change
// ---------------------------------------------------------------------------
function KanbanExpandedPanel({ card }: { card: KanbanCard }) {
  const { addKanbanReply, updateKanbanCardStatus } = useAdminStore()
  const [reply, setReply] = useState('')

  const liveCard = useAdminStore((s) => s.kanbanCards.find((c) => c.id === card.id)) ?? card

  const handleSend = () => {
    if (!reply.trim()) return
    addKanbanReply(card.id, reply.trim())
    setReply('')
    if (liveCard.status === 'waiting') updateKanbanCardStatus(card.id, 'in-progress')
  }

  const handleStatus = (status: KanbanStatus) => {
    updateKanbanCardStatus(card.id, status)
  }

  const recentMessages = liveCard.messages.slice(-3)

  return (
    <div className="space-y-3 pt-2" onClick={(e) => e.stopPropagation()}>
      {liveCard.content && (
        <p className="rounded-lg bg-foreground/[0.02] px-3 py-2 text-[12px] leading-relaxed text-foreground/80">
          {liveCard.content}
        </p>
      )}

      {recentMessages.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground">최근 대화</p>
          {recentMessages.map((m) => (
            <div key={m.id} className={`rounded-lg px-3 py-2 text-[12px] ${m.isSelf ? 'ml-6 bg-foreground/[0.04]' : 'mr-6 bg-secondary/60'}`}>
              <span className="font-medium text-foreground">{m.authorName}</span>
              <span className="ml-1.5 text-[10px] text-muted-foreground">{m.timestamp}</span>
              <p className="mt-0.5 text-foreground/80">{m.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="답변을 입력하세요..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!reply.trim()}
          className="flex items-center gap-1 rounded-lg bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
        >
          <Send className="h-3 w-3" />
          전송
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">상태</span>
        {KANBAN_STATUS_LABELS.map((col) => (
          <button
            key={col.id}
            type="button"
            onClick={() => handleStatus(col.id)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              liveCard.status === col.id
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {col.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
//  Overdue tasks expanded panel: list + complete / defer buttons
// ---------------------------------------------------------------------------
function OverdueExpandedPanel({ tasks, trackId }: { tasks: TrackTask[]; trackId: string }) {
  const { updateTrackTaskStatus, deferTask } = useAdminStore()
  const liveTasks = useAdminStore((s) =>
    s.trackTasks.filter((t) => tasks.some((ot) => ot.id === t.id) && t.status !== 'completed'),
  )

  const handleComplete = (taskId: string) => updateTrackTaskStatus(taskId, 'completed')
  const handleDeferTomorrow = (taskId: string) => deferTask(taskId, addDays(TODAY_STR, 1))

  if (liveTasks.length === 0) {
    return (
      <div className="flex items-center gap-2 pt-2 text-[12px] text-emerald-600" onClick={(e) => e.stopPropagation()}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        모두 처리 완료
      </div>
    )
  }

  return (
    <div className="space-y-1.5 pt-2" onClick={(e) => e.stopPropagation()}>
      {liveTasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2 rounded-lg bg-foreground/[0.02] px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-foreground">{task.title}</p>
            <p className="text-[10px] text-muted-foreground">
              {task.assigneeName ?? '미배정'} · 기한 {task.dueDate ?? task.scheduledDate}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDeferTomorrow(task.id)}
            className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            <CalendarArrowUp className="h-3 w-3" />
            내일로
          </button>
          <button
            type="button"
            onClick={() => handleComplete(task.id)}
            className="flex shrink-0 items-center gap-1 rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Check className="h-3 w-3" />
            완료
          </button>
        </div>
      ))}
      <Link
        href={`/tracks/${trackId}?tab=tasks&status=overdue`}
        className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ExternalLink className="h-3 w-3" />
        트랙 상세에서 관리
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
//  Unassigned tasks expanded panel: list + link to track
// ---------------------------------------------------------------------------
function UnassignedExpandedPanel({ tasks, trackId }: { tasks: TrackTask[]; trackId: string }) {
  const liveTasks = useAdminStore((s) =>
    s.trackTasks.filter((t) => tasks.some((ot) => ot.id === t.id) && t.status === 'unassigned'),
  )

  if (liveTasks.length === 0) {
    return (
      <div className="flex items-center gap-2 pt-2 text-[12px] text-emerald-600" onClick={(e) => e.stopPropagation()}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        모두 배정 완료
      </div>
    )
  }

  return (
    <div className="space-y-1.5 pt-2" onClick={(e) => e.stopPropagation()}>
      {liveTasks.slice(0, 5).map((task) => (
        <div key={task.id} className="flex items-center gap-2 rounded-lg bg-foreground/[0.02] px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-foreground">{task.title}</p>
            <p className="text-[10px] text-muted-foreground">
              예정일 {task.scheduledDate}
              {task.scheduledTime && ` · ${task.scheduledTime}`}
            </p>
          </div>
        </div>
      ))}
      {liveTasks.length > 5 && (
        <p className="text-[11px] text-muted-foreground">외 {liveTasks.length - 5}건</p>
      )}
      <Link
        href={`/tracks/${trackId}?tab=tasks&scope=unassigned`}
        className="mt-1 flex items-center gap-1 text-[11px] font-medium text-foreground transition-colors hover:text-foreground/80"
      >
        <ExternalLink className="h-3 w-3" />
        트랙 상세에서 배정하기
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
//  Issue expanded panel: simple link
// ---------------------------------------------------------------------------
function IssueExpandedPanel({ trackId, count }: { trackId: string; count: number }) {
  return (
    <div className="pt-2" onClick={(e) => e.stopPropagation()}>
      <p className="text-[12px] text-muted-foreground">
        학관매의 이슈 {count}건이 응답 대기 중입니다.
      </p>
      <Link
        href={`/tracks/${trackId}`}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-foreground transition-colors hover:text-foreground/80"
      >
        <ExternalLink className="h-3 w-3" />
        트랙에서 확인하기
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
//  ActionCard with accordion expand
// ---------------------------------------------------------------------------
function ActionCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: ActionItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const hasExpandContent =
    item.kanbanCard != null ||
    (item.relatedTasks != null && item.relatedTasks.length > 0) ||
    item.type === 'issue_waiting'

  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight

  return (
    <div className={`overflow-hidden rounded-xl border transition-all ${item.accentClass} ${isExpanded ? 'shadow-sm' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          item.priority <= 1 ? 'bg-destructive/10 text-destructive' : 'bg-foreground/[0.05] text-muted-foreground'
        }`}>
          {item.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {item.trackName && (
              <span
                className="inline-flex shrink-0 items-center rounded-full px-2 py-[1px] text-[10px] font-semibold"
                style={{ backgroundColor: `${item.trackColor}15`, color: item.trackColor }}
              >
                {item.trackName}
              </span>
            )}
            <span className="truncate text-[13px] font-medium text-foreground">{item.title}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{item.subtitle}</p>
        </div>
        {hasExpandContent ? (
          <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform" />
        ) : (
          <Link
            href={item.linkTo}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </button>

      {isExpanded && hasExpandContent && (
        <div className="border-t border-border/50 px-4 pb-3">
          {item.kanbanCard && <KanbanExpandedPanel card={item.kanbanCard} />}
          {item.type === 'overdue_track' && item.relatedTasks && item.trackId && (
            <OverdueExpandedPanel tasks={item.relatedTasks} trackId={item.trackId} />
          )}
          {item.type === 'unassigned_track' && item.relatedTasks && item.trackId && (
            <UnassignedExpandedPanel tasks={item.relatedTasks} trackId={item.trackId} />
          )}
          {item.type === 'issue_waiting' && item.trackId && (
            <IssueExpandedPanel trackId={item.trackId} count={item.count ?? 0} />
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
//  Main list
// ---------------------------------------------------------------------------
export function TodayActionList({
  tracks,
  onSwitchToKanban,
}: {
  tracks: PlannerTrackCard[]
  onSwitchToKanban?: () => void
}) {
  const { trackTasks, kanbanCards } = useAdminStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const actionItems = useMemo(
    () => buildActionItems(tracks, trackTasks, kanbanCards),
    [tracks, trackTasks, kanbanCards],
  )

  const completedKanban = kanbanCards.filter((c) => c.status === 'done').length
  const totalKanban = kanbanCards.length

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  if (actionItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <CheckCircle2 className="h-12 w-12 text-foreground/10" />
        <div className="text-center">
          <p className="text-[15px] font-semibold text-foreground">오늘 처리할 업무가 없어요</p>
          <p className="mt-1 text-[12px] text-muted-foreground">모든 업무가 정상 진행 중입니다</p>
        </div>
      </div>
    )
  }

  let lastType: ActionItemType | null = null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">오늘의 할 일</h2>
          <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
            {actionItems.length}건
          </span>
        </div>
        {totalKanban > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>칸반 업무 {completedKanban}/{totalKanban} 완료</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {actionItems.map((item) => {
          const typeLabel = TYPE_LABELS[item.type]
          const showSectionLabel =
            lastType === null ||
            (lastType !== item.type && TYPE_LABELS[lastType] !== typeLabel)
          lastType = item.type

          return (
            <div key={item.id}>
              {showSectionLabel && (
                <div className="mb-1.5 mt-3 first:mt-0">
                  <span className={`text-[11px] font-semibold ${
                    item.priority <= 1 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {typeLabel}
                  </span>
                </div>
              )}
              <ActionCard
                item={item}
                isExpanded={expandedId === item.id}
                onToggle={() => handleToggle(item.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
