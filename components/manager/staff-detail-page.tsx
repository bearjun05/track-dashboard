'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import type { StaffConversation, StaffIssue } from '@/lib/admin-mock-data'
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  Clock,
  X,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Thread Modal ---
function ThreadModal({
  conversation,
  onClose,
}: {
  conversation: StaffConversation
  onClose: () => void
}) {
  const { addConversationMessage } = useAdminStore()
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.messages])

  function handleSend() {
    if (!message.trim()) return
    addConversationMessage(conversation.id, message.trim())
    setMessage('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div
        className="flex h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">
            {conversation.taskTitle}{' - 대화'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex flex-col', msg.isSelf ? 'items-end' : 'items-start')}
            >
              <span className="mb-1 text-xs text-muted-foreground">
                {msg.authorName}{' | '}{msg.timestamp}
              </span>
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2.5 text-sm',
                  msg.isSelf
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground',
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="button"
            onClick={handleSend}
            className="rounded-md bg-primary p-2 text-primary-foreground transition-opacity hover:opacity-80"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Issue Modal ---
function IssueModal({
  issue,
  onClose,
}: {
  issue: StaffIssue
  onClose: () => void
}) {
  const { addIssueReply } = useAdminStore()
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState<StaffIssue['status']>(issue.status)
  const [assignee, setAssignee] = useState(issue.assignee ?? '')

  function handleSubmit() {
    if (!reply.trim()) return
    addIssueReply(issue.id, reply.trim(), status, assignee || undefined)
    setReply('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">{issue.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info */}
        <div className="space-y-2 border-b border-border px-5 py-4 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">{'작성자:'}</span>
            <span className="text-foreground">{issue.authorName}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">{'긴급도:'}</span>
            <span className={issue.urgency === 'urgent' ? 'font-medium text-destructive' : 'text-muted-foreground'}>
              {issue.urgency === 'urgent' ? '긴급' : '일반'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">{'작성일:'}</span>
            <span className="text-foreground">{issue.createdAt}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <div className="whitespace-pre-line rounded-md bg-secondary p-4 text-sm text-foreground">
            {issue.content}
          </div>
        </div>

        {/* Existing replies */}
        {issue.replies.length > 0 && (
          <div className="border-b border-border px-5 py-4">
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              {'이전 답변 ('}{issue.replies.length}{')'}
            </h4>
            <div className="space-y-2">
              {issue.replies.map((r) => (
                <div key={r.id} className="rounded-md bg-primary/5 p-3 text-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{r.authorName}</span>
                    <span>{r.timestamp}</span>
                  </div>
                  <p className="mt-1 text-foreground">{r.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply */}
        <div className="space-y-3 px-5 py-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="답변을 입력하세요..."
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{'상태:'}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StaffIssue['status'])}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="pending">{'대기중'}</option>
                <option value="in-progress">{'처리중'}</option>
                <option value="done">{'완료'}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{'담당자:'}</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">{'선택'}</option>
                <option value="이운영">{'이운영'}</option>
                <option value="김운영">{'김운영'}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="ml-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
            >
              {'답변 전송'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Page ---
export function StaffDetailPage({ trackId, staffId }: { trackId: string; staffId: string }) {
  const {
    staffCards,
    staffConversations,
    staffIssues,
    staffTasks,
    tracks,
  } = useAdminStore()

  const [issueTab, setIssueTab] = useState<'pending' | 'in-progress' | 'done'>('pending')
  const [taskTab, setTaskTab] = useState<'all' | 'done' | 'undone'>('all')
  const [threadModal, setThreadModal] = useState<StaffConversation | null>(null)
  const [issueModal, setIssueModal] = useState<StaffIssue | null>(null)

  const staff = staffCards.find((s) => s.id === staffId) ?? staffCards[0]
  const track = tracks.find((t) => t.id === trackId) ?? tracks[0]

  const filteredIssues = staffIssues.filter((i) => i.status === issueTab)
  const filteredTasks =
    taskTab === 'all'
      ? staffTasks
      : taskTab === 'done'
        ? staffTasks.filter((t) => t.isCompleted)
        : staffTasks.filter((t) => !t.isCompleted)

  const issueTabItems: { key: typeof issueTab; label: string }[] = [
    { key: 'pending', label: '대기중' },
    { key: 'in-progress', label: '처리중' },
    { key: 'done', label: '완료' },
  ]

  const taskTabItems: { key: typeof taskTab; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'done', label: '완료' },
    { key: 'undone', label: '미완료' },
  ]

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-2">
          <Link
            href={`/manager/tracks/${trackId}`}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/manager" className="text-sm text-muted-foreground hover:underline">
            {'관리자'}
          </Link>
          <span className="text-sm text-muted-foreground">{'>'}</span>
          <Link href={`/manager/tracks/${trackId}`} className="text-sm text-muted-foreground hover:underline">
            {track.name}
          </Link>
          <span className="text-sm text-muted-foreground">{'>'}</span>
          <span className="text-sm font-semibold text-foreground">{staff.name}</span>
        </div>
        <button
          type="button"
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="알림"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
      </header>

      {/* Body: 2x2 grid top, full width bottom */}
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Top row: conversations (40%) + issues (60%) */}
        <div className="grid grid-cols-10 gap-4">
          {/* Task Conversations */}
          <section className="col-span-4 rounded-lg border border-border bg-card p-5">
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <MessageSquare className="h-[18px] w-[18px] text-primary" />
                {'Task 대화'}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{'안읽은 대화 우선'}</p>
            </div>

            <div className="space-y-3">
              {staffConversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setThreadModal(conv)}
                  className="w-full rounded-lg border border-border bg-background p-4 text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {'['}{conv.time}{'] '}{conv.taskTitle}
                      {conv.isCompleted && <CheckCircle2 className="ml-1.5 inline h-3.5 w-3.5 text-success" />}
                    </span>
                  </div>
                  {conv.newMessageCount > 0 && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <MessageSquare className="h-3 w-3" />
                      {'새 메시지 '}{conv.newMessageCount}{'개'}
                    </span>
                  )}
                  <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{conv.preview}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Issues / Requests */}
          <section className="col-span-6 rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Bell className="h-[18px] w-[18px] text-primary" />
              {'요청/이슈'}
            </h2>

            {/* Tabs */}
            <div className="mt-3 flex items-center gap-1 border-b border-border">
              {issueTabItems.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setIssueTab(tab.key)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    issueTab === tab.key
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cards */}
            <div className="mt-4 space-y-3">
              {filteredIssues.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{'해당 상태의 이슈가 없습니다'}</p>
              ) : (
                filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {issue.urgency === 'urgent' ? (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            {'긴급'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {'일반'}
                          </span>
                        )}
                        <span className="text-sm font-medium text-foreground">{issue.title}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{issue.authorName}</span>
                        <span>{issue.createdAt}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIssueModal(issue)}
                      className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
                    >
                      {'답변하기'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Bottom: Task List (full width) */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <ClipboardList className="h-[18px] w-[18px] text-primary" />
            {'업무 리스트'}
          </h2>

          {/* Tabs */}
          <div className="mt-3 flex items-center gap-1 border-b border-border">
            {taskTabItems.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTaskTab(tab.key)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  taskTab === tab.key
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="mt-4 space-y-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-center justify-between rounded-md px-4 py-3',
                  task.isCompleted ? 'bg-secondary/50' : 'border border-border bg-background',
                )}
              >
                <div className="flex items-center gap-3">
                  {task.isCompleted ? (
                    <CheckCircle2 className="h-[18px] w-[18px] text-success" />
                  ) : (
                    <XCircle className="h-[18px] w-[18px] text-foreground" />
                  )}
                  <span
                    className={cn(
                      'text-sm',
                      task.isCompleted
                        ? 'text-muted-foreground line-through'
                        : 'font-medium text-foreground',
                    )}
                  >
                    {'['}{task.time}{'] '}{task.title}
                    {!task.isCompleted && task.deadlineMinutes && (
                      <Clock className="ml-1.5 inline h-3.5 w-3.5 text-warning" />
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {task.isCompleted && task.completedTime && (
                    <span>{'완료 시간: '}{task.completedTime}</span>
                  )}
                  {task.isCompleted && task.conversationCount && (
                    <>
                      <span className="text-border">{'|'}</span>
                      <span className="flex items-center gap-1 text-primary">
                        <MessageSquare className="h-3 w-3" />
                        {'대화 '}{task.conversationCount}{'건'}
                      </span>
                    </>
                  )}
                  {!task.isCompleted && task.deadlineMinutes && (
                    <span className="text-destructive">
                      {'마감 임박 ('}{task.deadlineMinutes}{'분 남음)'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modals */}
      {threadModal && (
        <ThreadModal
          conversation={threadModal}
          onClose={() => setThreadModal(null)}
        />
      )}
      {issueModal && (
        <IssueModal
          issue={issueModal}
          onClose={() => setIssueModal(null)}
        />
      )}
    </div>
  )
}
