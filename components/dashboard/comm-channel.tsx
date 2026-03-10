'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useStaffDashboard } from '@/lib/hooks/use-staff-dashboard'
import { SlackMarkdown } from '@/lib/slack-markdown'
import { highlightMatch } from '@/lib/hooks/use-chat-search'
import { trackTaskToUnified } from '@/components/task/task-adapter'
import { TaskDetailModal } from '@/components/task/task-detail-modal'
import type { UnifiedTask } from '@/components/task/task-types'
import {
  Send,
  Pin,
  ThumbsUp,
  Reply,
  MoreHorizontal,
  X,
  ListTodo,
  MessageSquare,
  ChevronUp,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Search,
} from 'lucide-react'

/* ───── Types ───── */

interface Message {
  id: string
  content: string
  authorId: string
  authorName: string
  timestamp: string
  isNotice?: boolean
  isPinned?: boolean
  replyTo?: { authorName: string; content: string }
  reactions?: { emoji: string; count: number }[]
  taskPreview?: {
    taskId: string
    taskTitle: string
    lastAuthor: string
    lastContent: string
    messageCount: number
    unreadCount: number
  }
}

type ContactId = string

interface Contact {
  id: ContactId
  name: string
  role: 'operator' | 'peer' | 'system'
  unread: number
  lastMessage?: string
}

interface SystemNotification {
  id: string
  type: 'task_assigned' | 'task_completed' | 'task_overdue' | 'review_requested' | 'review_done' | 'reminder' | 'general'
  content: string
  timestamp: string
  taskId?: string
  taskTitle?: string
  isRead?: boolean
}

/* ───── Mock data ───── */

const OP_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    content: '이번 주 챕터3 프로젝트 관련해서 궁금한 점 있으면 편하게 물어봐 주세요.',
    authorId: 'op1',
    authorName: '이운영',
    timestamp: '2026-02-11T09:00:00',
    isNotice: true,
    isPinned: true,
  },
  {
    id: 'msg-2',
    content: '수강생 김민수님 출석 관련해서 확인 부탁드립니다. 3일 연속 지각이라 면담이 필요할 것 같습니다.',
    authorId: 'op1',
    authorName: '이운영',
    timestamp: '2026-02-11T09:15:00',
  },
  {
    id: 'msg-3',
    content: '네, 확인했습니다. 오늘 오후에 면담 진행하겠습니다.',
    authorId: 'staff1',
    authorName: '김학관',
    timestamp: '2026-02-11T09:20:00',
  },
  {
    id: 'msg-4',
    content: '감사합니다! 면담 결과는 간단하게 공유 부탁드려요.',
    authorId: 'op1',
    authorName: '이운영',
    timestamp: '2026-02-11T09:22:00',
    reactions: [{ emoji: '👍', count: 1 }],
  },
  {
    id: 'msg-task-1',
    content: '',
    authorId: '__system__',
    authorName: '',
    timestamp: '2026-02-11T09:30:00',
    taskPreview: {
      taskId: 'tt1',
      taskTitle: '오전 출석 체크',
      lastAuthor: '이운영',
      lastContent: '1팀 김철수 학생 추가 상담 필요합니다.',
      messageCount: 3,
      unreadCount: 2,
    },
  },
  {
    id: 'msg-5',
    content: '오늘 프로젝트 중간점검 시간에 팀별 진행 상황 체크해주시면 감사하겠습니다.',
    authorId: 'op1',
    authorName: '이운영',
    timestamp: '2026-02-11T10:00:00',
  },
  {
    id: 'msg-task-2',
    content: '',
    authorId: '__system__',
    authorName: '',
    timestamp: '2026-02-11T10:02:00',
    taskPreview: {
      taskId: 'tt3',
      taskTitle: '프로젝트 중간점검',
      lastAuthor: '이운영',
      lastContent: '팀별 진행률을 정리해서 공유 부탁드립니다.',
      messageCount: 1,
      unreadCount: 1,
    },
  },
  {
    id: 'msg-6',
    content: '네 알겠습니다. 2팀이 좀 진도가 느린 것 같은데 어떻게 할까요?',
    authorId: 'staff1',
    authorName: '김학관',
    timestamp: '2026-02-11T10:05:00',
  },
  {
    id: 'msg-7',
    content: '2팀은 제가 내일 직접 확인해볼게요. 일단 오늘은 진행 상황만 기록해 주세요.',
    authorId: 'op1',
    authorName: '이운영',
    timestamp: '2026-02-11T10:08:00',
  },
]

const PEER_MESSAGES: Record<string, Message[]> = {
  staff2: [
    {
      id: 'pm-1',
      content: '혹시 오늘 수강생 출석 관련해서 특이사항 있어?',
      authorId: 'staff2',
      authorName: '이학관',
      timestamp: '2026-02-11T08:30:00',
    },
    {
      id: 'pm-2',
      content: '1팀 김민수님 3일 연속 지각이라 면담 잡으려고!',
      authorId: 'staff1',
      authorName: '김학관',
      timestamp: '2026-02-11T08:35:00',
    },
    {
      id: 'pm-3',
      content: '아 그래? 나도 비슷한 학생 있는데 같이 면담 시간 잡을까?',
      authorId: 'staff2',
      authorName: '이학관',
      timestamp: '2026-02-11T08:37:00',
    },
  ],
  staff3: [
    {
      id: 'pm-4',
      content: '프로젝트 중간점검 자료 혹시 공유해줄 수 있어?',
      authorId: 'staff3',
      authorName: '박학관',
      timestamp: '2026-02-11T09:45:00',
    },
    {
      id: 'pm-5',
      content: '응 이따 오후에 정리해서 보내줄게!',
      authorId: 'staff1',
      authorName: '김학관',
      timestamp: '2026-02-11T09:48:00',
    },
  ],
}

const SYSTEM_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'sys-1',
    type: 'task_assigned',
    content: '새 업무가 배정되었습니다',
    timestamp: '2026-02-11T08:00:00',
    taskId: 'tt1',
    taskTitle: '오전 출석 체크',
  },
  {
    id: 'sys-2',
    type: 'reminder',
    content: '30분 후 시작 예정입니다',
    timestamp: '2026-02-11T08:30:00',
    taskId: 'tt2',
    taskTitle: '수강생 면담 준비',
  },
  {
    id: 'sys-3',
    type: 'task_assigned',
    content: '이운영 매니저가 업무를 배정했습니다',
    timestamp: '2026-02-11T09:00:00',
    taskId: 'tt3',
    taskTitle: '프로젝트 중간점검',
  },
  {
    id: 'sys-4',
    type: 'review_requested',
    content: '확인 요청이 등록되었습니다',
    timestamp: '2026-02-11T09:30:00',
    taskId: 'tt1',
    taskTitle: '오전 출석 체크',
  },
  {
    id: 'sys-5',
    type: 'review_done',
    content: '이운영 매니저가 확인을 완료했습니다',
    timestamp: '2026-02-11T10:15:00',
    taskId: 'tt1',
    taskTitle: '오전 출석 체크',
  },
  {
    id: 'sys-6',
    type: 'task_overdue',
    content: '마감 시간이 지났습니다',
    timestamp: '2026-02-11T10:30:00',
    taskId: 'tt5',
    taskTitle: '주간 보고서 제출',
  },
  {
    id: 'sys-7',
    type: 'general',
    content: '내일 챕터4 수업이 예정되어 있습니다. 자료를 미리 확인해주세요.',
    timestamp: '2026-02-11T11:00:00',
  },
]

const NOTIF_ICON_MAP: Record<SystemNotification['type'], { icon: typeof Bell; color: string }> = {
  task_assigned: { icon: ListTodo, color: 'text-blue-500' },
  task_completed: { icon: CheckCircle2, color: 'text-emerald-500' },
  task_overdue: { icon: AlertTriangle, color: 'text-amber-500' },
  review_requested: { icon: UserCheck, color: 'text-violet-500' },
  review_done: { icon: CheckCircle2, color: 'text-emerald-500' },
  reminder: { icon: Clock, color: 'text-orange-400' },
  general: { icon: Bell, color: 'text-foreground/40' },
}

/* ───── Helpers ───── */

function fmtTime(ts: string): string {
  const d = new Date(ts)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h < 12 ? '오전' : '오후'} ${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m}`
}

function fmtDateHeader(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0)
  if (d.toDateString() === today.toDateString()) return '오늘'
  if (d.toDateString() === yesterday.toDateString()) return '어제'
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${dayNames[d.getDay()]}요일`
}

function shouldShowDateHeader(msgs: Message[], idx: number): boolean {
  if (idx === 0) return true
  const prev = new Date(msgs[idx - 1].timestamp).toDateString()
  const curr = new Date(msgs[idx].timestamp).toDateString()
  return prev !== curr
}

function isTimeGap(msgs: Message[], idx: number): boolean {
  if (idx === 0) return true
  const prev = new Date(msgs[idx - 1].timestamp).getTime()
  const curr = new Date(msgs[idx].timestamp).getTime()
  return curr - prev > 5 * 60 * 1000
}

/* ───── Component ───── */

export function CommChannel({ staffId, selectedDate }: { staffId: string; selectedDate?: string }) {
  const {
    staffName,
    operatorId,
    operatorName,
    trackPeers,
    todayTasks,
    toggleTaskStatus,
    addTaskMessage,
    requestReview,
    cancelReview,
    changeStatus,
    markInProgress,
  } = useStaffDashboard(staffId, selectedDate)

  const opId = operatorId ?? 'op1'
  const opName = operatorName ?? '운영매니저'

  const sysUnread = useMemo(
    () => SYSTEM_NOTIFICATIONS.filter(n => !n.isRead).length,
    [],
  )

  const contacts: Contact[] = useMemo(() => {
    const list: Contact[] = [
      { id: '__system__', name: '알림', role: 'system', unread: sysUnread },
      { id: opId, name: opName, role: 'operator', unread: 1, lastMessage: '진행 상황만 기록해 주세요.' },
    ]
    for (const p of trackPeers) {
      const peerMsgs = PEER_MESSAGES[p.id]
      const last = peerMsgs?.[peerMsgs.length - 1]
      list.push({
        id: p.id,
        name: p.name,
        role: 'peer',
        unread: p.id === 'staff2' ? 1 : 0,
        lastMessage: last?.content,
      })
    }
    return list
  }, [opId, opName, trackPeers, sysUnread])

  const [activeContact, setActiveContact] = useState<ContactId>(opId)
  const [allMessages, setAllMessages] = useState<Record<ContactId, Message[]>>({
    [opId]: OP_MESSAGES,
    ...PEER_MESSAGES,
  })
  const [inputText, setInputText] = useState('')
  const [replyTarget, setReplyTarget] = useState<Message | null>(null)
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)
  const [taskModal, setTaskModal] = useState<UnifiedTask | null>(null)
  const [readThreadIds, setReadThreadIds] = useState<Set<string>>(new Set())
  const [ackedNotifIds, setAckedNotifIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const toggleAckNotif = useCallback((id: string) => {
    setAckedNotifIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isSystemChannel = activeContact === '__system__'
  const messages = allMessages[activeContact] ?? []
  const contact = contacts.find(c => c.id === activeContact)
  const pinnedMessage = useMemo(
    () => {
      const opMsgs = allMessages[opId] ?? []
      return opMsgs.find(m => m.isPinned)
    },
    [allMessages, opId],
  )

  const unreadThreads = useMemo(
    () => messages.filter(m => m.taskPreview && !readThreadIds.has(m.taskPreview.taskId)),
    [messages, readThreadIds],
  )

  // Search results across all contacts (excluding system)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const out: { contactId: ContactId; contactName: string; msg: Message }[] = []
    for (const c of contacts) {
      if (c.id === '__system__') continue
      const msgs = allMessages[c.id] ?? []
      for (const msg of msgs) {
        const content = msg.content || msg.taskPreview?.lastContent || ''
        if (content && content.toLowerCase().includes(q)) {
          out.push({ contactId: c.id, contactName: c.name, msg })
        }
      }
    }
    out.sort((a, b) => new Date(b.msg.timestamp).getTime() - new Date(a.msg.timestamp).getTime())
    return out
  }, [searchQuery, contacts, allMessages])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      }
    })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages.length, scrollToBottom])

  function handleSend() {
    const text = inputText.trim()
    if (!text) return
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      content: text,
      authorId: staffId,
      authorName: staffName ?? '나',
      timestamp: new Date().toISOString(),
      replyTo: replyTarget ? { authorName: replyTarget.authorName, content: replyTarget.content } : undefined,
    }
    setAllMessages(prev => ({
      ...prev,
      [activeContact]: [...(prev[activeContact] ?? []), newMsg],
    }))
    setInputText('')
    setReplyTarget(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleReaction(msgId: string, emoji: string) {
    setAllMessages(prev => {
      const msgs = prev[activeContact] ?? []
      return {
        ...prev,
        [activeContact]: msgs.map(m => {
          if (m.id !== msgId) return m
          const existing = m.reactions ?? []
          const found = existing.find(r => r.emoji === emoji)
          if (found) {
            return { ...m, reactions: existing.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) }
          }
          return { ...m, reactions: [...existing, { emoji, count: 1 }] }
        }),
      }
    })
  }

  function handleThreadClick(taskId: string) {
    setReadThreadIds(prev => new Set(prev).add(taskId))
    const raw = todayTasks.find(t => t.id === taskId)
    if (raw) {
      markInProgress(taskId)
      setTaskModal(trackTaskToUnified(raw))
    }
  }

  function scrollToFirstUnread() {
    if (!scrollRef.current || unreadThreads.length === 0) return
    const firstUnread = unreadThreads[0]
    const el = scrollRef.current.querySelector(`[data-thread-id="${firstUnread.taskPreview!.taskId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function handleAutoGrow(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`
  }

  const myId = staffId

  const handleSearchResultClick = useCallback((contactId: ContactId, msgId: string) => {
    setActiveContact(contactId)
    setSearchQuery('')
    setTimeout(() => {
      const el = document.querySelector(`[data-msg-id="${msgId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-foreground/[0.08] bg-background shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* ── Search bar ── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-foreground/[0.06] px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-foreground/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="메시지 검색..."
          className="min-w-0 flex-1 rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-foreground/25 focus:border-foreground/15 focus:outline-none"
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')} className="rounded p-1 text-foreground/30 hover:text-foreground/50">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Search results (when searching) ── */}
      {searchQuery.trim() && (
        <div className="flex-1 overflow-y-auto border-b border-foreground/[0.06]">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-foreground/25">
              <Search className="h-8 w-8" />
              <p className="text-[12px]">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-foreground/[0.04] py-1">
              {searchResults.map(({ contactId, contactName, msg }) => (
                <button
                  key={`${contactId}-${msg.id}`}
                  type="button"
                  onClick={() => handleSearchResultClick(contactId, msg.id)}
                  className="w-full px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.04]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-foreground/50">{contactName}</span>
                    <span className="shrink-0 text-[9px] text-foreground/20">{fmtTime(msg.timestamp)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-foreground/70">
                    {highlightMatch(msg.content || msg.taskPreview?.lastContent || '', searchQuery)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Header + Chat (hidden when searching) ── */}
      {!searchQuery.trim() && (
      <>
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-foreground/[0.06] px-3">
        <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {contacts.map(c => {
            const isActive = c.id === activeContact
            const isSystem = c.role === 'system'
            return (
              <button key={c.id} type="button"
                onClick={() => { setActiveContact(c.id); setReplyTarget(null) }}
                className={cn('relative flex shrink-0 items-center gap-1 rounded-md px-2 py-1 transition-colors',
                  isActive ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/[0.03]',
                )}>
                {isSystem && <Bell className={cn('h-3 w-3', isActive ? 'text-foreground' : 'text-foreground/30')} />}
                <span className={cn('whitespace-nowrap text-[11px]',
                  isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground/35',
                )}>{c.name}</span>
                {c.unread > 0 && (
                  <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-[4px] bg-destructive px-0.5 text-[7px] font-bold leading-none text-white">
                    {c.unread}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {!isSystemChannel && (
          <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-foreground/25">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            온라인
          </span>
        )}
      </div>

      {/* ── Chat area ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Pinned (only for non-system) */}
        {pinnedMessage && (
          <div className="flex items-start gap-2 border-y border-foreground/[0.06] bg-foreground/[0.015] px-4 py-2">
            <Pin className="mt-0.5 h-3 w-3 shrink-0 rotate-45 text-foreground/25" />
            <p className="line-clamp-1 text-[11px] text-foreground/40"><SlackMarkdown text={pinnedMessage.content} className="text-foreground/40" /></p>
          </div>
        )}

        {/* System notification feed */}
        {isSystemChannel ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
            {SYSTEM_NOTIFICATIONS.map((notif, idx) => {
              const showDate = idx === 0 || new Date(SYSTEM_NOTIFICATIONS[idx - 1].timestamp).toDateString() !== new Date(notif.timestamp).toDateString()
              return (
                <div key={notif.id}>
                  {showDate && <DateDivider label={fmtDateHeader(notif.timestamp)} />}
                  <NotificationItem
                    notif={notif}
                    isAcked={ackedNotifIds.has(notif.id)}
                    onAck={toggleAckNotif}
                    onClick={() => {
                      if (notif.taskId) {
                        const raw = todayTasks.find(t => t.id === notif.taskId)
                        if (raw) {
                          markInProgress(notif.taskId)
                          setTaskModal(trackTaskToUnified(raw))
                        }
                      }
                    }}
                  />
                </div>
              )
            })}
          </div>
        ) : (
        /* Messages */
        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-foreground/20">
              <MessageSquare className="h-8 w-8" />
              <p className="text-sm">대화를 시작해보세요</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMe = msg.authorId === myId
            const showDate = shouldShowDateHeader(messages, idx)
            const timeGap = isTimeGap(messages, idx)
            const prevSameAuthor = idx > 0 && messages[idx - 1].authorId === msg.authorId && !timeGap && !showDate
            const nextSameAuthor = idx < messages.length - 1 && messages[idx + 1].authorId === msg.authorId
              && !isTimeGap(messages, idx + 1) && !shouldShowDateHeader(messages, idx + 1)

            if (msg.taskPreview) {
              const isRead = readThreadIds.has(msg.taskPreview.taskId)
              return (
                <div key={msg.id} data-thread-id={msg.taskPreview.taskId}>
                  {showDate && <DateDivider label={fmtDateHeader(msg.timestamp)} />}
                  {timeGap && !showDate && <div className="h-3" />}
                  <TaskPreviewCard
                    preview={msg.taskPreview}
                    isRead={isRead}
                    onClick={() => handleThreadClick(msg.taskPreview!.taskId)}
                  />
                </div>
              )
            }

            if (msg.isNotice) {
              return (
                <div key={msg.id}>
                  {showDate && <DateDivider label={fmtDateHeader(msg.timestamp)} />}
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-foreground/[0.04] px-3 py-1 text-[10px] text-foreground/30">
                      <SlackMarkdown text={msg.content} className="text-foreground/30" />
                    </span>
                  </div>
                </div>
              )
            }

            const bubbleRadius = isMe
              ? cn('rounded-[18px]', prevSameAuthor ? 'rounded-tr-md' : '', nextSameAuthor ? 'rounded-br-md' : 'rounded-br-md')
              : cn('rounded-[18px]', prevSameAuthor ? 'rounded-tl-md' : '', nextSameAuthor ? 'rounded-bl-md' : 'rounded-bl-md')

            return (
              <div key={msg.id} data-msg-id={msg.id}>
                {showDate && <DateDivider label={fmtDateHeader(msg.timestamp)} />}
                {timeGap && !showDate && <div className="h-4" />}

                <div
                  className={cn(
                    'group relative flex flex-col',
                    isMe ? 'items-end' : 'items-start',
                    prevSameAuthor ? 'mt-[3px]' : 'mt-2.5',
                  )}
                  onMouseEnter={() => setHoveredMsg(msg.id)}
                  onMouseLeave={() => setHoveredMsg(null)}
                >
                  {!isMe && !prevSameAuthor && (
                    <span className="mb-1 text-[11px] font-medium text-foreground/30">{msg.authorName}</span>
                  )}

                  <div className={cn('flex max-w-[80%] items-end gap-1.5', isMe && 'flex-row-reverse')}>
                    <div className="relative min-w-0">
                      {msg.replyTo && (
                        <div className="mb-1 rounded-lg border-l-2 border-foreground/10 bg-foreground/[0.025] px-2.5 py-1.5">
                          <p className="text-[10px] font-medium text-foreground/35">{msg.replyTo.authorName}</p>
                          <p className="line-clamp-1 text-[10px] text-foreground/25">{msg.replyTo.content}</p>
                        </div>
                      )}
                        <div
                        className={cn(
                          'px-3 py-[7px] text-[13px] leading-relaxed',
                          bubbleRadius,
                          isMe
                            ? 'bg-foreground text-background'
                            : 'bg-foreground/[0.05] text-foreground',
                        )}
                      >
                        <SlackMarkdown text={msg.content} className={isMe ? 'text-background [&_a]:text-blue-300' : 'text-foreground/70'} />
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

                    <span className={cn(
                      'shrink-0 pb-0.5 text-[9px] text-foreground/15 transition-opacity',
                      prevSameAuthor && hoveredMsg !== msg.id ? 'opacity-0' : 'opacity-100',
                    )}>
                      {fmtTime(msg.timestamp)}
                    </span>
                  </div>

                  {hoveredMsg === msg.id && !msg.isNotice && (
                    <div className={cn(
                      'absolute -top-2.5 z-10 flex items-center gap-px rounded-md border border-foreground/[0.08] bg-background px-0.5 py-0.5 shadow-sm',
                      isMe ? 'right-0' : 'left-0',
                    )}>
                      <ActionBtn icon={<ThumbsUp className="h-2.5 w-2.5" />} onClick={() => handleReaction(msg.id, '👍')} />
                      <ActionBtn icon={<Reply className="h-2.5 w-2.5" />} onClick={() => setReplyTarget(msg)} />
                      <ActionBtn icon={<MoreHorizontal className="h-2.5 w-2.5" />} onClick={() => {}} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        )}

        {/* Unread threads banner (chat only) */}
        {!isSystemChannel && unreadThreads.length > 0 && (
          <button
            type="button"
            onClick={scrollToFirstUnread}
            className="flex shrink-0 items-center justify-center gap-1.5 bg-blue-500/[0.06] py-1.5 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-500/[0.10]"
          >
            <ChevronUp className="h-3 w-3" />
            안 읽은 스레드 {unreadThreads.length}개
          </button>
        )}

        {/* Reply preview (chat only) */}
        {!isSystemChannel && replyTarget && (
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

        {/* Input (chat only) */}
        {!isSystemChannel && (
          <div className="shrink-0 px-3 pb-3 pt-2">
            <div className="flex items-end gap-2 rounded-xl bg-foreground/[0.03] px-3 py-2">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleAutoGrow}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={`${contact?.name ?? '상대'}에게 메시지...`}
                rows={1}
                className="max-h-20 min-h-[28px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-foreground/25 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all active:scale-90',
                  inputText.trim()
                    ? 'bg-foreground text-background'
                    : 'text-foreground/15',
                )}
                aria-label="전송"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Task detail modal */}
      {taskModal && (
        <TaskDetailModal
          task={taskModal}
          onClose={() => setTaskModal(null)}
          onComplete={() => toggleTaskStatus(taskModal.id)}
          onRequestReview={() => requestReview(taskModal.id)}
          onCancelReview={() => cancelReview(taskModal.id)}
          onChangeStatus={(_, status: string) => {
            const statusMap: Record<string, string> = {
              pending: 'pending', in_progress: 'in_progress',
              pending_review: 'pending_review', completed: 'completed',
              overdue: 'overdue', unassigned: 'unassigned',
            }
            changeStatus(taskModal.id, statusMap[status] as any)
          }}
          onSendMessage={(_, content) => addTaskMessage(taskModal.id, content)}
        />
      )}
    </div>
  )
}

/* ───── Sub-components ───── */

function DateDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-foreground/[0.05]" />
      <span className="text-[9px] font-medium tracking-wide text-foreground/20">{label}</span>
      <div className="h-px flex-1 bg-foreground/[0.05]" />
    </div>
  )
}

function ActionBtn({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded text-foreground/25 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50"
    >
      {icon}
    </button>
  )
}

function TaskPreviewCard({
  preview,
  isRead,
  onClick,
}: {
  preview: NonNullable<Message['taskPreview']>
  isRead: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group/task my-2 w-full cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-all',
        isRead
          ? 'border-foreground/[0.05] bg-foreground/[0.015] hover:bg-foreground/[0.035]'
          : 'border-blue-500/15 bg-blue-50/80 hover:bg-blue-50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ListTodo className={cn('h-3.5 w-3.5 shrink-0', isRead ? 'text-foreground/25' : 'text-blue-500')} />
          <p className={cn(
            'truncate text-[12px] font-semibold',
            isRead ? 'text-foreground/50' : 'text-foreground/80',
          )}>
            {preview.taskTitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!isRead && preview.unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-[4px] bg-blue-500 px-1 text-[9px] font-bold text-white">
              {preview.unreadCount}
            </span>
          )}
          <span className="text-[9px] text-foreground/15 transition-colors group-hover/task:text-foreground/30">→</span>
        </div>
      </div>
      <div className="ml-[22px] mt-1">
        <p className={cn(
          'line-clamp-1 text-[11px]',
          isRead ? 'text-foreground/25' : 'text-foreground/45',
        )}>
          <span className={cn('font-medium', isRead ? 'text-foreground/30' : 'text-foreground/55')}>{preview.lastAuthor}</span>
          {' '}{preview.lastContent}
        </p>
      </div>
    </button>
  )
}

function NotificationItem({
  notif,
  onClick,
  isAcked,
  onAck,
}: {
  notif: SystemNotification
  onClick: () => void
  isAcked: boolean
  onAck: (id: string) => void
}) {
  const cfg = NOTIF_ICON_MAP[notif.type]
  const Icon = cfg.icon
  const hasTask = !!notif.taskId

  return (
    <div className={cn(
      'group/notif flex w-full items-start gap-2 rounded-lg px-2.5 py-2 transition-colors',
      isAcked && 'opacity-45',
    )}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onAck(notif.id) }}
        className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-foreground/15 transition-colors hover:border-foreground/30"
      >
        {isAcked && <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30" />}
      </button>
      <button
        type="button"
        onClick={onClick}
        disabled={!hasTask}
        className={cn(
          'flex min-w-0 flex-1 items-start gap-2.5 text-left',
          hasTask && 'cursor-pointer',
        )}
      >
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-foreground/[0.04]">
          <Icon className={cn('h-3 w-3', cfg.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={cn('text-[12px] leading-snug', isAcked ? 'text-foreground/40 line-through' : 'text-foreground/70')}>{notif.content}</p>
            <span className="shrink-0 text-[9px] text-foreground/20">{fmtTime(notif.timestamp)}</span>
          </div>
          {notif.taskTitle && (
            <p className="mt-0.5 truncate text-[11px] font-medium text-foreground/40 transition-colors group-hover/notif:text-foreground/60">
              {notif.taskTitle} {hasTask && '→'}
            </p>
          )}
        </div>
      </button>
    </div>
  )
}
