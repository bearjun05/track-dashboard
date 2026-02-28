'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare, X, Minus, ChevronDown, ChevronRight,
  Pin, Plus, Send, Reply, ThumbsUp, MoreHorizontal,
  Bell, ListTodo, CheckCircle2, AlertTriangle, Clock, UserCheck, Pencil, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/lib/admin-store'
import { useRoleStore, ROLE_USER_MAP, ROLE_USER_NAME } from '@/lib/role-store'
import type { AppRole } from '@/lib/role-store'
import type { CommMessage, CommSystemNotification, StickyNotice } from '@/lib/admin-mock-data'

const NOTIF_ICON_MAP: Record<CommSystemNotification['type'], { icon: typeof Bell; color: string }> = {
  task_assigned: { icon: ListTodo, color: 'text-blue-500' },
  task_completed: { icon: CheckCircle2, color: 'text-emerald-500' },
  task_overdue: { icon: AlertTriangle, color: 'text-amber-500' },
  review_requested: { icon: UserCheck, color: 'text-violet-500' },
  review_done: { icon: CheckCircle2, color: 'text-emerald-500' },
  reminder: { icon: Clock, color: 'text-orange-400' },
  general: { icon: Bell, color: 'text-foreground/40' },
}

/* ================================================================
   Helpers
   ================================================================ */

function fmtTime(ts: string): string {
  const d = new Date(ts)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h < 12 ? '오전' : '오후'} ${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m}`
}

/* ================================================================
   FloatingCommWidget — main export
   ================================================================ */

export function FloatingCommWidget() {
  const [open, setOpen] = useState(false)
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const currentRole = useRoleStore(s => s.currentRole)
  const {
    plannerTracks,
    commNotifications,
    commMessages,
    commStickies,
    commUnreadMap,
    addCommMessage,
    addCommReaction,
    updateStickyNote,
    deleteStickyNote,
  } = useAdminStore()
  const router = useRouter()

  const currentUserId = ROLE_USER_MAP[currentRole]
  const currentUserName = ROLE_USER_NAME[currentRole]

  // 학관은 floating 위젯 미제공
  if (currentRole === 'learning_manager') return null

  const totalUnread = Object.values(commUnreadMap).reduce((a, b) => a + b, 0)
    + commNotifications.filter(n => !n.isRead).length

  const handleSendMessage = (channelId: string, text: string, replyTo?: { authorName: string; content: string }) => {
    const newMsg: CommMessage = {
      id: `cm-${Date.now()}`,
      content: text,
      authorId: currentUserId,
      authorName: currentUserName,
      timestamp: new Date().toISOString(),
      replyTo,
    }
    addCommMessage(channelId, newMsg)
  }

  const handleReaction = (channelId: string, msgId: string, emoji: string) => {
    addCommReaction(channelId, msgId, emoji)
  }

  const handleSetSticky = (channelId: string, content: string) => {
    updateStickyNote(channelId, content, currentUserId, currentUserName)
  }

  const handleRemoveSticky = (channelId: string) => {
    deleteStickyNote(channelId)
  }

  const handleTaskClick = (trackId: string, taskId: string) => {
    setOpen(false)
    router.push(`/tracks/${trackId}/tasks?openTask=${taskId}`)
  }

  const canWriteSticky = (channelId: string): boolean => {
    if (currentRole === 'operator_manager') return channelId.startsWith(`chat:${currentUserId}:`)
    if (currentRole === 'operator') return channelId.startsWith(`chat:${currentUserId}:`)
    return false
  }

  const stickyHint = (channelId: string): string => {
    if (currentRole === 'operator_manager') {
      const parts = channelId.split(':')
      const targetId = parts[2]
      const targetTrack = plannerTracks.find((t: any) => t.operator?.id === targetId)
      const name = targetTrack?.operator?.name ?? '운영매니저'
      return `${name}에게만 보입니다`
    }
    if (currentRole === 'operator') {
      const parts = channelId.split(':')
      const targetId = parts[2]
      for (const t of plannerTracks) {
        if (t.staff?.some((s: any) => s.id === targetId)) return `${t.name} 학관매들에게만 보입니다`
      }
      return '학관매에게만 보입니다'
    }
    return ''
  }

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all hover:scale-105 hover:shadow-[0_6px_24px_rgba(0,0,0,0.2)] active:scale-95">
          <MessageSquare className="h-6 w-6" />
          {totalUnread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] w-[680px] overflow-hidden rounded-2xl border border-foreground/[0.08] bg-background shadow-[0_8px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03)]">
          <ChannelSidebar
            plannerTracks={plannerTracks}
            currentRole={currentRole}
            currentUserId={currentUserId}
            activeChannel={activeChannel}
            onSelect={setActiveChannel}
            unreadMap={commUnreadMap}
            notifUnreadCount={commNotifications.filter(n => !n.isRead).length}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <TitleBar
              activeChannel={activeChannel}
              plannerTracks={plannerTracks}
              onMinimize={() => setOpen(false)}
              onClose={() => { setOpen(false); setActiveChannel(null) }}
            />
            {!activeChannel ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-foreground/20">
                <MessageSquare className="h-10 w-10" />
                <p className="text-[13px]">채널을 선택하세요</p>
              </div>
            ) : activeChannel === 'notifications' ? (
              <NotificationFeed
                notifications={commNotifications}
                plannerTracks={plannerTracks}
                currentRole={currentRole}
                currentUserId={currentUserId}
                onTaskClick={handleTaskClick}
              />
            ) : (
              <ChatView
                channelId={activeChannel}
                messages={commMessages[activeChannel] ?? []}
                sticky={commStickies[activeChannel]}
                canWriteSticky={canWriteSticky(activeChannel)}
                stickyHint={stickyHint(activeChannel)}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                onSend={(text, replyTo) => handleSendMessage(activeChannel, text, replyTo)}
                onReaction={(msgId, emoji) => handleReaction(activeChannel, msgId, emoji)}
                onSetSticky={(content) => handleSetSticky(activeChannel, content)}
                onRemoveSticky={() => handleRemoveSticky(activeChannel)}
                onTaskClick={handleTaskClick}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* ================================================================
   Channel Sidebar
   ================================================================ */

function ChannelSidebar({ plannerTracks, currentRole, currentUserId, activeChannel, onSelect, unreadMap, notifUnreadCount }: {
  plannerTracks: any[]; currentRole: AppRole; currentUserId: string
  activeChannel: string | null; onSelect: (id: string) => void
  unreadMap: Record<string, number>; notifUnreadCount: number
}) {
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(() => new Set(plannerTracks.slice(0, 1).map((t: any) => t.id)))

  const toggleTrack = (id: string) => {
    setExpandedTracks(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const visibleTracks = useMemo(() => {
    if (currentRole === 'operator_manager') return plannerTracks
    if (currentRole === 'operator') return plannerTracks.filter((t: any) => t.operator?.id === currentUserId)
    return []
  }, [plannerTracks, currentRole, currentUserId])

  const managers = useMemo(() => {
    if (currentRole !== 'operator') return []
    return [{ id: 'mgr1', name: '박총괄' }]
  }, [currentRole])

  const notifUnread = notifUnreadCount

  return (
    <div className="flex w-[200px] shrink-0 flex-col border-r border-foreground/[0.06] bg-foreground/[0.02]">
      <div className="flex h-12 shrink-0 items-center border-b border-foreground/[0.06] bg-foreground/[0.015] px-3">
        <span className="text-[13px] font-semibold text-foreground">소통</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        <SidebarItem
          icon={<Bell className="h-3.5 w-3.5" />}
          label="알림"
          unread={notifUnread}
          active={activeChannel === 'notifications'}
          onClick={() => onSelect('notifications')}
        />

        {/* 운기매 (운영 시점에서만) */}
        {managers.length > 0 && (
          <>
            <div className="my-1.5 border-t border-foreground/[0.04]" />
            {managers.map(m => {
              const chatId = `chat:${m.id}:${currentUserId}`
              return (
                <SidebarItem key={m.id}
                  icon={<span className="inline-block h-2 w-2 rounded-full bg-violet-400" />}
                  label={m.name}
                  unread={unreadMap[chatId] ?? 0}
                  active={activeChannel === chatId}
                  onClick={() => onSelect(chatId)}
                />
              )
            })}
          </>
        )}

        <div className="my-1.5 border-t border-foreground/[0.04]" />

        {visibleTracks.map((track: any) => {
          const isExpanded = expandedTracks.has(track.id)

          const chatTargets: { id: string; name: string; chatId: string }[] = []
          if (currentRole === 'operator_manager') {
            if (track.operator) {
              chatTargets.push({ id: track.operator.id, name: track.operator.name, chatId: `chat:${currentUserId}:${track.operator.id}` })
            }
          } else if (currentRole === 'operator') {
            track.staff?.forEach((s: any) => {
              chatTargets.push({ id: s.id, name: s.name, chatId: `chat:${currentUserId}:${s.id}` })
            })
          }

          const groupUnread = chatTargets.reduce((a, c) => a + (unreadMap[c.chatId] ?? 0), 0)

          return (
            <div key={track.id}>
              <button type="button" onClick={() => toggleTrack(track.id)}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left transition-colors hover:bg-foreground/[0.03]">
                {isExpanded
                  ? <ChevronDown className="h-3 w-3 shrink-0 text-foreground/30" />
                  : <ChevronRight className="h-3 w-3 shrink-0 text-foreground/30" />}
                <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: track.color }} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-foreground/70">{track.name}</span>
                {!isExpanded && groupUnread > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{groupUnread}</span>
                )}
              </button>
              {isExpanded && (
                <div className="pb-1">
                  {chatTargets.map(ct => (
                    <SidebarItem key={ct.chatId}
                      icon={<span className="inline-block h-2 w-2 rounded-full bg-foreground/20" />}
                      label={ct.name}
                      unread={unreadMap[ct.chatId] ?? 0}
                      active={activeChannel === ct.chatId}
                      onClick={() => onSelect(ct.chatId)}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SidebarItem({ icon, label, unread, active, onClick, indent }: {
  icon: React.ReactNode; label: string; unread: number; active: boolean; onClick: () => void; indent?: boolean
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 py-1.5 text-left transition-colors',
        indent ? 'pl-8 pr-3' : 'px-3',
        active ? 'bg-foreground/[0.06] text-foreground' : 'text-foreground/50 hover:bg-foreground/[0.03] hover:text-foreground/70',
      )}>
      <span className="shrink-0 text-foreground/30">{icon}</span>
      <span className={cn('min-w-0 flex-1 truncate text-[12px]', active && 'font-semibold')}>{label}</span>
      {unread > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{unread}</span>
      )}
    </button>
  )
}

/* ================================================================
   Title Bar
   ================================================================ */

function TitleBar({ activeChannel, plannerTracks, onMinimize, onClose }: {
  activeChannel: string | null; plannerTracks: any[]; onMinimize: () => void; onClose: () => void
}) {
  let title = '소통'

  if (activeChannel === 'notifications') {
    title = '알림'
  } else if (activeChannel?.startsWith('chat:')) {
    const parts = activeChannel.split(':')
    const targetId = parts[2]
    for (const t of plannerTracks) {
      if (t.operator?.id === targetId) { title = t.operator.name; break }
      const found = t.staff?.find((s: any) => s.id === targetId)
      if (found) { title = found.name; break }
    }
    if (targetId === 'mgr1') title = '박총괄'
  }

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-foreground/[0.06] bg-foreground/[0.015] px-4">
      <div className="flex items-center gap-2">
        {activeChannel === 'notifications' && <Bell className="h-3.5 w-3.5 text-foreground/40" />}
        {activeChannel?.startsWith('chat:') && <span className="inline-block h-2 w-2 rounded-full bg-foreground/25" />}
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onMinimize}
          className="flex h-6 w-6 items-center justify-center rounded-md text-foreground/30 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/60">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-foreground/30 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/60">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   Notification Feed
   ================================================================ */

function NotificationFeed({ notifications, plannerTracks, currentRole, currentUserId, onTaskClick }: {
  notifications: CommSystemNotification[]; plannerTracks: any[]; currentRole: AppRole
  currentUserId: string; onTaskClick: (trackId: string, taskId: string) => void
}) {
  const [filter, setFilter] = useState<string>('all')
  const [ackedIds, setAckedIds] = useState<Set<string>>(new Set())

  const toggleAck = useCallback((id: string) => {
    setAckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const visibleTracks = useMemo(() => {
    if (currentRole === 'operator_manager') return plannerTracks
    return plannerTracks.filter((t: any) => t.operator?.id === currentUserId)
  }, [plannerTracks, currentRole, currentUserId])

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications
    return notifications.filter(n => n.trackId === filter)
  }, [notifications, filter])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-foreground/[0.06] px-4 py-2">
        <FilterTab label="전체" active={filter === 'all'} onClick={() => setFilter('all')} />
        {visibleTracks.map((t: any) => (
          <FilterTab key={t.id} label={t.name.replace(/ \d+기$/, '')} color={t.color}
            active={filter === t.id} onClick={() => setFilter(t.id)} />
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-foreground/20">
            <Bell className="h-8 w-8" />
            <p className="text-[12px]">알림이 없습니다</p>
          </div>
        ) : (
          filtered.map(notif => {
            const cfg = NOTIF_ICON_MAP[notif.type]
            const Icon = cfg.icon
            const isAcked = ackedIds.has(notif.id)
            return (
              <div key={notif.id} className={cn('group/n flex w-full items-start gap-2 rounded-lg px-2.5 py-2 transition-colors', isAcked && 'opacity-45')}>
                <button type="button" onClick={() => toggleAck(notif.id)}
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-foreground/15 transition-colors hover:border-foreground/30">
                  {isAcked && <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30" />}
                </button>
                <button type="button"
                  onClick={() => { if (notif.trackId && notif.taskId) onTaskClick(notif.trackId, notif.taskId) }}
                  disabled={!notif.taskId}
                  className={cn('flex min-w-0 flex-1 items-start gap-2.5 text-left', notif.taskId && 'cursor-pointer')}>
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-foreground/[0.04]">
                    <Icon className={cn('h-3 w-3', cfg.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('text-[12px] leading-snug', isAcked ? 'text-foreground/40 line-through' : 'text-foreground/70')}>{notif.content}</p>
                      <span className="shrink-0 text-[9px] text-foreground/20">{fmtTime(notif.timestamp)}</span>
                    </div>
                    {notif.taskTitle && (
                      <p className="mt-0.5 truncate text-[11px] font-medium text-foreground/40 transition-colors group-hover/n:text-foreground/60">
                        {notif.taskTitle} {notif.taskId && '→'}
                      </p>
                    )}
                    {notif.trackName && (
                      <span className="mt-0.5 inline-block rounded bg-foreground/[0.04] px-1 py-px text-[9px] text-foreground/25">{notif.trackName}</span>
                    )}
                  </div>
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function FilterTab({ label, color, active, onClick }: { label: string; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors',
        active ? 'bg-foreground/[0.08] font-semibold text-foreground' : 'text-foreground/40 hover:bg-foreground/[0.04] hover:text-foreground/60',
      )}>
      {color && <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />}
      {label}
    </button>
  )
}

/* ================================================================
   Chat View
   ================================================================ */

function ChatView({ channelId, messages, sticky, canWriteSticky, stickyHint, currentUserId, currentUserName, onSend, onReaction, onSetSticky, onRemoveSticky, onTaskClick }: {
  channelId: string; messages: CommMessage[]; sticky?: StickyNotice
  canWriteSticky: boolean; stickyHint: string
  currentUserId: string; currentUserName: string
  onSend: (text: string, replyTo?: { authorName: string; content: string }) => void
  onReaction: (msgId: string, emoji: string) => void
  onSetSticky: (content: string) => void
  onRemoveSticky: () => void
  onTaskClick: (trackId: string, taskId: string) => void
}) {
  const [input, setInput] = useState('')
  const [replyTarget, setReplyTarget] = useState<CommMessage | null>(null)
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)
  const [stickyInput, setStickyInput] = useState(false)
  const [stickyText, setStickyText] = useState('')
  const [editSticky, setEditSticky] = useState(false)
  const stickyInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    setInput('')
    setReplyTarget(null)
    setStickyInput(false)
    setEditSticky(false)
  }, [channelId])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    onSend(text, replyTarget ? { authorName: replyTarget.authorName, content: replyTarget.content } : undefined)
    setInput('')
    setReplyTarget(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleSaveSticky() {
    if (!stickyText.trim()) return
    onSetSticky(stickyText.trim())
    setStickyText('')
    setStickyInput(false)
    setEditSticky(false)
  }

  function handleAutoGrow(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`
  }

  const isAuthor = sticky?.authorId === currentUserId

  return (
    <>
      {/* Sticky memo area */}
      <div className="shrink-0 border-b border-foreground/[0.06]">
        {sticky && !editSticky ? (
          <div className="flex items-center gap-2 bg-foreground/[0.015] px-4 py-2">
            <Pin className="h-3 w-3 shrink-0 rotate-45 text-foreground/20" />
            <p className="min-w-0 flex-1 truncate text-[11px] text-foreground/50">{sticky.content}</p>
            {isAuthor && (
              <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" onClick={() => { setEditSticky(true); setStickyText(sticky.content); setTimeout(() => stickyInputRef.current?.focus(), 0) }}
                  className="rounded p-0.5 text-foreground/15 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/40">
                  <Pencil className="h-2.5 w-2.5" />
                </button>
                <button type="button" onClick={onRemoveSticky}
                  className="rounded p-0.5 text-foreground/15 transition-colors hover:bg-foreground/[0.06] hover:text-red-400">
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        ) : (stickyInput || editSticky) ? (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 rounded-lg border border-foreground/[0.08] bg-background px-3 py-1.5">
              <Pin className="h-3 w-3 shrink-0 rotate-45 text-foreground/20" />
              <input ref={stickyInputRef} type="text" value={stickyText} onChange={e => setStickyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSaveSticky(); if (e.key === 'Escape') { setStickyInput(false); setEditSticky(false); setStickyText('') } }}
                placeholder="메모를 입력하세요..." autoFocus
                className="min-w-0 flex-1 bg-transparent text-[11px] text-foreground placeholder:text-foreground/25 focus:outline-none" />
              <button type="button" onClick={handleSaveSticky} disabled={!stickyText.trim()}
                className="shrink-0 rounded-md bg-foreground px-2 py-0.5 text-[10px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-20">
                {editSticky ? '수정' : '등록'}</button>
              <button type="button" onClick={() => { setStickyInput(false); setEditSticky(false); setStickyText('') }}
                className="shrink-0 text-foreground/20 transition-colors hover:text-foreground/40">
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="mt-1 pl-8 text-[9px] text-foreground/20">{stickyHint}</p>
          </div>
        ) : canWriteSticky ? (
          <button type="button" onClick={() => { setStickyInput(true); setTimeout(() => stickyInputRef.current?.focus(), 0) }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-foreground/[0.015]">
            <Pin className="h-3 w-3 shrink-0 rotate-45 text-foreground/15" />
            <span className="text-[11px] text-foreground/25">메모 추가...</span>
          </button>
        ) : null}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-foreground/20">
            <MessageSquare className="h-8 w-8" />
            <p className="text-[12px]">대화를 시작해보세요</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.taskPreview) {
              return (
                <TaskPreviewCard key={msg.id} preview={msg.taskPreview}
                  onClick={() => onTaskClick(msg.taskPreview!.trackId, msg.taskPreview!.taskId)} />
              )
            }

            const isMe = msg.authorId === currentUserId
            const prevSameAuthor = idx > 0 && messages[idx - 1].authorId === msg.authorId && !messages[idx - 1].taskPreview
            const bubbleRadius = isMe
              ? cn('rounded-[18px]', prevSameAuthor ? 'rounded-tr-[6px]' : '', 'rounded-br-[6px]')
              : cn('rounded-[18px]', prevSameAuthor ? 'rounded-tl-[6px]' : '', 'rounded-bl-[6px]')

            return (
              <div key={msg.id}
                className={cn('group relative flex flex-col', isMe ? 'items-end' : 'items-start', prevSameAuthor ? 'mt-[3px]' : 'mt-3')}
                onMouseEnter={() => setHoveredMsg(msg.id)} onMouseLeave={() => setHoveredMsg(null)}>
                {!isMe && !prevSameAuthor && (
                  <span className="mb-1 text-[11px] font-medium text-foreground/35">{msg.authorName}</span>
                )}
                <div className={cn('flex max-w-[80%] items-end gap-1.5', isMe && 'flex-row-reverse')}>
                  <div className="relative min-w-0">
                    {msg.replyTo && (
                      <div className="mb-1 rounded-lg border-l-2 border-foreground/10 bg-foreground/[0.025] px-2.5 py-1.5">
                        <p className="text-[10px] font-medium text-foreground/35">{msg.replyTo.authorName}</p>
                        <p className="line-clamp-1 text-[10px] text-foreground/25">{msg.replyTo.content}</p>
                      </div>
                    )}
                    <div className={cn('px-3.5 py-[8px] text-[13px] leading-relaxed', bubbleRadius,
                      isMe ? 'bg-foreground text-background' : 'bg-foreground/[0.05] text-foreground')}>
                      {msg.content}
                    </div>
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={cn('mt-0.5 flex gap-1', isMe ? 'justify-end' : 'justify-start')}>
                        {msg.reactions.map(r => (
                          <span key={r.emoji} className="inline-flex items-center gap-0.5 rounded-full bg-foreground/[0.05] px-1.5 py-0.5 text-[10px]">
                            {r.emoji} <span className="text-foreground/30">{r.count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={cn('shrink-0 pb-0.5 text-[9px] text-foreground/15 transition-opacity',
                    prevSameAuthor && hoveredMsg !== msg.id ? 'opacity-0' : 'opacity-100')}>
                    {fmtTime(msg.timestamp)}
                  </span>
                </div>
                {hoveredMsg === msg.id && (
                  <div className={cn('absolute -top-2.5 z-10 flex items-center gap-px rounded-md border border-foreground/[0.08] bg-background px-0.5 py-0.5 shadow-sm',
                    isMe ? 'right-0' : 'left-0')}>
                    <button type="button" onClick={() => onReaction(msg.id, '👍')}
                      className="flex h-5 w-5 items-center justify-center rounded text-foreground/25 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50">
                      <ThumbsUp className="h-2.5 w-2.5" />
                    </button>
                    <button type="button" onClick={() => setReplyTarget(msg)}
                      className="flex h-5 w-5 items-center justify-center rounded text-foreground/25 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50">
                      <Reply className="h-2.5 w-2.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {replyTarget && (
        <div className="flex items-center gap-2 border-t border-foreground/[0.06] bg-foreground/[0.015] px-4 py-2">
          <Reply className="h-3 w-3 shrink-0 text-foreground/25" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-foreground/45">{replyTarget.authorName}에게 답장</p>
            <p className="line-clamp-1 text-[10px] text-foreground/25">{replyTarget.content}</p>
          </div>
          <button type="button" onClick={() => setReplyTarget(null)} className="text-foreground/20 hover:text-foreground/40">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="shrink-0 border-t border-foreground/[0.06] px-4 pb-3 pt-2">
        <div className="flex items-end gap-2 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] px-3 py-2">
          <textarea ref={textareaRef} value={input} onChange={handleAutoGrow}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend() } }}
            placeholder="메시지를 입력하세요..." rows={1}
            className="max-h-20 min-h-[28px] flex-1 resize-none bg-transparent text-[13px] leading-relaxed text-foreground placeholder:text-foreground/25 focus:outline-none" />
          <button type="button" onClick={handleSend} disabled={!input.trim()}
            className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all active:scale-90',
              input.trim() ? 'bg-foreground text-background' : 'text-foreground/15')}>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}

/* ================================================================
   Task Preview Card
   ================================================================ */

function TaskPreviewCard({ preview, onClick }: {
  preview: NonNullable<CommMessage['taskPreview']>; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}
      className="group/task my-2 w-full cursor-pointer rounded-lg border border-blue-500/15 bg-blue-50/80 px-3 py-2.5 text-left transition-all hover:bg-blue-50 dark:bg-blue-500/[0.06] dark:hover:bg-blue-500/[0.10]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ListTodo className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <p className="truncate text-[12px] font-semibold text-foreground/80">{preview.taskTitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {preview.unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-[4px] bg-blue-500 px-1 text-[9px] font-bold text-white">{preview.unreadCount}</span>
          )}
          <span className="text-[9px] text-foreground/15 transition-colors group-hover/task:text-foreground/30">→</span>
        </div>
      </div>
      <div className="ml-[22px] mt-1">
        <p className="line-clamp-1 text-[11px] text-foreground/45">
          <span className="font-medium text-foreground/55">{preview.lastAuthor}</span>{' '}{preview.lastContent}
        </p>
      </div>
    </button>
  )
}
