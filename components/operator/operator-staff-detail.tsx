'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/admin-store'
import type { StaffConversation, StaffIssue } from '@/lib/admin-mock-data'
import { ROLE_LABELS } from '@/lib/role-labels'
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function ThreadModal({ conversation, onClose }: { conversation: StaffConversation; onClose: () => void }) {
  const { addConversationMessage } = useAdminStore()
  const [message, setMessage] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [conversation.messages.length])

  const send = () => {
    if (!message.trim()) return
    addConversationMessage(conversation.id, message.trim())
    setMessage('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">{conversation.taskTitle}</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{conversation.time} · {conversation.isCompleted ? '완료' : '진행중'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto bg-secondary/20 px-4 py-3">
          {conversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-muted-foreground"><MessageSquare className="h-7 w-7" /><p className="text-xs">아직 메시지가 없습니다</p></div>
          ) : (
            <div className="space-y-3">
              {conversation.messages.map((msg) => msg.isSelf ? (
                <div key={msg.id} className="flex justify-end"><div className="flex items-end gap-1.5"><span className="pb-0.5 text-[10px] text-muted-foreground">{msg.timestamp}</span><div className="max-w-[260px] rounded-xl rounded-tr-[4px] bg-foreground/[0.08] px-3 py-2"><p className="text-[13px] leading-relaxed text-foreground">{msg.content}</p></div></div></div>
              ) : (
                <div key={msg.id} className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-foreground">{msg.authorName.charAt(0)}</div>
                  <div className="min-w-0"><span className="text-[11px] font-medium text-foreground">{msg.authorName}</span><div className="mt-0.5 flex items-end gap-1.5"><div className="max-w-[260px] rounded-xl rounded-tl-[4px] bg-card px-3 py-2 shadow-sm"><p className="text-[13px] leading-relaxed text-foreground">{msg.content}</p></div><span className="pb-0.5 text-[10px] text-muted-foreground">{msg.timestamp}</span></div></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-card px-3 py-2">
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
          <button type="button" onClick={send} disabled={!message.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-colors disabled:opacity-30"><Send className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  )
}

function IssueModal({ issue, onClose }: { issue: StaffIssue; onClose: () => void }) {
  const { addIssueReply, updateIssueStatus } = useAdminStore()
  const [reply, setReply] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [issue.replies.length])

  const send = () => {
    if (!reply.trim()) return
    const newStatus = issue.status === 'pending' ? 'in-progress' : issue.status
    addIssueReply(issue.id, reply.trim(), newStatus as StaffIssue['status'], '이운영')
    setReply('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-foreground">{issue.title}</h3>
              {issue.urgency === 'urgent' && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">긴급</span>}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{issue.authorName} · {issue.createdAt}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto bg-secondary/20 px-4 py-3">
          <div className="mb-4 rounded-lg bg-card p-3 shadow-sm"><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{issue.content}</p></div>
          {issue.replies.length > 0 && (
            <div className="space-y-3">
              {issue.replies.map((r) => r.isSelf ? (
                <div key={r.id} className="flex justify-end"><div className="flex items-end gap-1.5"><span className="pb-0.5 text-[10px] text-muted-foreground">{r.timestamp}</span><div className="max-w-[260px] rounded-xl rounded-tr-[4px] bg-foreground/[0.08] px-3 py-2"><p className="text-[13px] leading-relaxed text-foreground">{r.content}</p></div></div></div>
              ) : (
                <div key={r.id} className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-foreground">{r.authorName.charAt(0)}</div>
                  <div className="min-w-0"><span className="text-[11px] font-medium text-foreground">{r.authorName}</span><div className="mt-0.5 flex items-end gap-1.5"><div className="max-w-[260px] rounded-xl rounded-tl-[4px] bg-card px-3 py-2 shadow-sm"><p className="text-[13px] leading-relaxed text-foreground">{r.content}</p></div><span className="pb-0.5 text-[10px] text-muted-foreground">{r.timestamp}</span></div></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-card px-3 py-2">
          {issue.status !== 'done' && (
            <button type="button" onClick={() => updateIssueStatus(issue.id, 'done')} className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary">완료 처리</button>
          )}
          <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="답변을 입력하세요..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
          <button type="button" onClick={send} disabled={!reply.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-colors disabled:opacity-30"><Send className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  )
}

export function OperatorStaffDetail({ trackId, staffId }: { trackId: string; staffId: string }) {
  const { staffConversations, staffIssues, staffTasks, trackTasks, updateTrackTaskStatus, plannerTracks } = useAdminStore()
  const [openThread, setOpenThread] = useState<StaffConversation | null>(null)
  const [openIssue, setOpenIssue] = useState<StaffIssue | null>(null)
  const [issueTab, setIssueTab] = useState<'pending' | 'in-progress' | 'done'>('pending')
  const [taskTab, setTaskTab] = useState<'all' | 'completed' | 'incomplete'>('all')

  const track = plannerTracks.find((t) => t.id === trackId)
  const staffName = staffTasks.length > 0 ? '김학관' : ROLE_LABELS.learning_manager

  const myTasks = trackTasks.filter((t) => t.trackId === trackId && t.assigneeId === staffId)
  const completedCount = myTasks.filter((t) => t.status === 'completed').length
  const overdueCount = myTasks.filter((t) => t.status === 'overdue').length
  const pendingCount = myTasks.filter((t) => t.status === 'pending' || t.status === 'in-progress').length
  const completionRate = myTasks.length > 0 ? Math.round((completedCount / myTasks.length) * 100) : 0

  const issueTabs = [
    { key: 'pending' as const, label: '대기중', count: staffIssues.filter((i) => i.status === 'pending').length },
    { key: 'in-progress' as const, label: '처리중', count: staffIssues.filter((i) => i.status === 'in-progress').length },
    { key: 'done' as const, label: '완료', count: staffIssues.filter((i) => i.status === 'done').length },
  ]

  const filteredIssues = staffIssues.filter((i) => i.status === issueTab)

  const filteredMyTasks = myTasks.filter((t) => {
    if (taskTab === 'all') return true
    if (taskTab === 'completed') return t.status === 'completed'
    return t.status !== 'completed'
  })

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/operator/tracks/${trackId}`} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <span className="text-muted-foreground">{ROLE_LABELS.operator}</span>
          <span className="text-border">/</span>
          {track && <span className="text-muted-foreground">{track.name}</span>}
          <span className="text-border">/</span>
          <span className="font-semibold text-foreground">{staffName}</span>
        </div>
        <span className="text-[13px] text-muted-foreground">이운영 <span className="text-foreground/40">{ROLE_LABELS.operator}</span></span>
      </header>

      <main className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {/* Summary Cards */}
        <section className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground">업무 완료율</span>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{completionRate}%</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground">완료</span>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{completedCount}</p>
          </div>
          <div className={`rounded-xl border bg-card p-4 ${overdueCount > 0 ? 'border-destructive/30' : 'border-border'}`}>
            <span className="text-xs text-muted-foreground">기한초과</span>
            <p className={`mt-1 text-xl font-bold tabular-nums ${overdueCount > 0 ? 'text-destructive' : 'text-foreground'}`}>{overdueCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground">대기/진행</span>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{pendingCount}</p>
          </div>
        </section>

        {/* Two-column: Conversations + Issues */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Task Conversations */}
          <div className="lg:col-span-2">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
              <MessageSquare className="h-4 w-4 text-foreground" />Task 대화
            </h2>
            <div className="space-y-2">
              {staffConversations.map((conv) => (
                <button key={conv.id} type="button" onClick={() => setOpenThread(conv)}
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-secondary/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground">{conv.taskTitle}</span>
                      {conv.isCompleted && <CheckCircle2 className="ml-1 inline h-3 w-3 text-foreground/60" />}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{conv.preview}</p>
                    {conv.newMessageCount > 0 && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium text-foreground">
                        <MessageSquare className="h-2.5 w-2.5" />{conv.newMessageCount}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{conv.time}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div className="lg:col-span-3">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-foreground" />요청 / 이슈
            </h2>
            <div className="mb-3 flex border-b border-border">
              {issueTabs.map((tab) => (
                <button key={tab.key} type="button" onClick={() => setIssueTab(tab.key)}
                  className={cn('px-3 py-2 text-[13px] font-medium transition-colors', issueTab === tab.key ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {tab.label} <span className="ml-1 text-[11px]">{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredIssues.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">이슈가 없습니다</p>
              ) : filteredIssues.map((issue) => (
                <button key={issue.id} type="button" onClick={() => setOpenIssue(issue)}
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-secondary/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground">{issue.title}</span>
                      {issue.urgency === 'urgent' && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">긴급</span>}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{issue.content}</p>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{issue.createdAt.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Task List */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <ClipboardList className="h-[18px] w-[18px]" />업무 리스트
          </h2>
          <div className="mb-3 flex border-b border-border">
            {[
              { key: 'all' as const, label: '전체', count: myTasks.length },
              { key: 'completed' as const, label: '완료', count: completedCount },
              { key: 'incomplete' as const, label: '미완료', count: myTasks.length - completedCount },
            ].map((tab) => (
              <button key={tab.key} type="button" onClick={() => setTaskTab(tab.key)}
                className={cn('px-3 py-2 text-[13px] font-medium transition-colors', taskTab === tab.key ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {tab.label} <span className="ml-1 text-[11px]">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            {filteredMyTasks.map((task) => (
              <div key={task.id} className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 ${task.status === 'overdue' ? 'border-destructive/30' : ''}`}>
                <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  {task.status === 'completed' ? <CheckCircle2 className="h-[18px] w-[18px] text-foreground/60" />
                    : task.status === 'in-progress' ? <Clock className="h-[18px] w-[18px] text-foreground" />
                    : task.status === 'overdue' ? <AlertTriangle className="h-[18px] w-[18px] text-destructive" />
                    : <div className="h-3.5 w-3.5 rounded-full border-2 border-border" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-[13px] font-medium ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</span>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="tabular-nums">{task.scheduledTime}</span>
                    {task.dueTime && <span className="tabular-nums">마감 {task.dueTime}</span>}
                    {task.completedAt && <span className="tabular-nums">완료 {task.completedAt}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {task.messages.length > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-foreground/60"><MessageSquare className="h-3 w-3" />{task.messages.length}</span>
                  )}
                  {task.status !== 'completed' && (
                    <button type="button" onClick={() => updateTrackTaskStatus(task.id, 'completed')}
                      className="rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary">완료</button>
                  )}
                </div>
              </div>
            ))}
            {filteredMyTasks.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Task가 없습니다</p>}
          </div>
        </section>
      </main>

      {openThread && <ThreadModal conversation={openThread} onClose={() => setOpenThread(null)} />}
      {openIssue && <IssueModal issue={openIssue} onClose={() => setOpenIssue(null)} />}
    </div>
  )
}
