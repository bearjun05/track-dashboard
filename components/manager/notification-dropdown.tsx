'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import type { NotificationType, AppNotification } from '@/lib/admin-mock-data'
import { ROLE_LABELS } from '@/lib/role-labels'
import {
  Bell,
  Clock,
  UserX,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  CheckSquare,
  Megaphone,
  LayoutList,
  CalendarOff,
  BarChart3,
  Zap,
  ArrowUpRight,
  History,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react'

const typeConfig: Record<NotificationType, { icon: LucideIcon; label: string }> = {
  task_overdue:                   { icon: Clock,          label: '기한초과' },
  task_unassigned:                { icon: UserX,          label: '미배정' },
  task_activated:                 { icon: CheckSquare,    label: '활성화' },
  issue_new:                      { icon: AlertTriangle,  label: '이슈' },
  issue_urgent:                   { icon: Zap,            label: '긴급' },
  issue_replied:                  { icon: MessageSquare,  label: '이슈답변' },
  issue_status_changed:           { icon: AlertTriangle,  label: '상태변경' },
  task_completed:                 { icon: CheckCircle2,   label: '완료' },
  task_assigned:                  { icon: CheckSquare,    label: '배정' },
  task_reassigned:                { icon: CheckSquare,    label: '재배정' },
  notice_new:                     { icon: Megaphone,      label: '공지' },
  notice_replied:                 { icon: Megaphone,      label: '공지답변' },
  message_new:                    { icon: MessageSquare,  label: '메시지' },
  kanban_created:                 { icon: LayoutList,     label: '칸반' },
  kanban_replied:                 { icon: LayoutList,     label: '칸반답변' },
  vacation_registered:            { icon: CalendarOff,    label: '휴가' },
  threshold_staff_completion:     { icon: BarChart3,      label: '학관완료율' },
  threshold_operator_completion:  { icon: BarChart3,      label: '운영완료율' },
  threshold_pending_issues:       { icon: AlertTriangle,  label: '이슈누적' },
  threshold_unread_messages:      { icon: MessageSquare,  label: '메시지누적' },
  threshold_overdue_tasks:        { icon: Clock,          label: '초과누적' },
}

const HIGHLIGHT_TYPES = new Set<NotificationType>([
  'task_overdue', 'issue_urgent', 'threshold_overdue_tasks',
  'threshold_pending_issues', 'threshold_staff_completion', 'threshold_operator_completion',
])

type ViewMode = 'list' | 'escalation-history'

export function NotificationDropdown() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAdminStore()
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const escalatedNotifications = notifications.filter((n) => n.escalation?.isEscalated)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setViewMode('list')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const recent = notifications.slice(0, 12)

  function formatTime(timestamp: string) {
    const parts = timestamp.split(' ')
    if (parts.length >= 2) return parts[1]
    return timestamp
  }

  function formatDate(timestamp: string) {
    const parts = timestamp.split(' ')
    if (parts.length >= 1) return parts[0].replace('2026-', '')
    return timestamp
  }

  function getRoleLabel(role?: string) {
    if (!role) return ''
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role
  }

  function renderNotificationItem(noti: AppNotification) {
    const cfg = typeConfig[noti.type]
    const Icon = cfg.icon
    const isHighlighted = HIGHLIGHT_TYPES.has(noti.type)
    const isEscalated = noti.escalation?.isEscalated
    const isEscalatedAway = noti.isEscalatedAway

    return (
      <Link
        key={noti.id}
        href={noti.linkTo}
        onClick={() => { markNotificationRead(noti.id); setOpen(false); setViewMode('list') }}
        className={`flex items-start gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-secondary/30 ${!noti.isRead ? 'bg-foreground/[0.02]' : ''} ${isEscalatedAway ? 'opacity-60' : ''}`}
      >
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isEscalated ? 'bg-orange-100 text-orange-600' : isHighlighted ? 'bg-destructive/10 text-destructive' : 'bg-foreground/[0.06] text-foreground/60'}`}>
          {isEscalated ? <ArrowUpRight className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {isEscalated && (
              <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-semibold text-orange-700">
                에스컬레이션
              </span>
            )}
            {isEscalatedAway && (
              <span className="shrink-0 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                에스컬레이션됨
              </span>
            )}
            <span className={`truncate text-[12px] font-medium ${!noti.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
              {noti.title}
            </span>
            {!noti.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{noti.description}</p>
          {isEscalated && noti.escalation?.originalRecipientRole && (
            <p className="mt-0.5 text-[10px] text-orange-600">
              원본 수신: {getRoleLabel(noti.escalation.originalRecipientRole)}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{formatTime(noti.timestamp)}</span>
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setViewMode('list') }}
        className="relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="알림"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {viewMode === 'list' ? (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-[13px] font-semibold text-foreground">알림</h3>
                <div className="flex items-center gap-3">
                  {escalatedNotifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setViewMode('escalation-history')}
                      className="flex items-center gap-1 text-[11px] text-orange-600 hover:text-orange-700"
                    >
                      <History className="h-3 w-3" />
                      에스컬레이션 {escalatedNotifications.length}
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead()}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      모두 읽음
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {recent.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">알림이 없습니다</div>
                ) : (
                  recent.map(renderNotificationItem)
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="rounded-md p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <h3 className="text-[13px] font-semibold text-foreground">에스컬레이션 히스토리</h3>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                  {escalatedNotifications.length}건
                </span>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {escalatedNotifications.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">에스컬레이션 내역이 없습니다</div>
                ) : (
                  escalatedNotifications.map((noti) => {
                    const cfg = typeConfig[noti.type]
                    return (
                      <Link
                        key={noti.id}
                        href={noti.linkTo}
                        onClick={() => { markNotificationRead(noti.id); setOpen(false); setViewMode('list') }}
                        className={`flex items-start gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-secondary/30 ${!noti.isRead ? 'bg-foreground/[0.02]' : ''}`}
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-semibold text-orange-700">
                              에스컬레이션
                            </span>
                            <span className={`truncate text-[12px] font-medium ${!noti.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{noti.description}</p>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>원본: {getRoleLabel(noti.escalation?.originalRecipientRole)}</span>
                            <span className="text-border">→</span>
                            <span className="text-orange-600">{getRoleLabel(noti.recipientRole)}</span>
                            <span className="ml-auto tabular-nums">{formatDate(noti.timestamp)} {formatTime(noti.timestamp)}</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
