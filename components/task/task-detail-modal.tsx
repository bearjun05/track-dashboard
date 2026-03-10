'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, FileText, Paperclip, MessageCircle, Clock, User, Calendar, CheckCircle2, Tag, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNameLookup } from '@/lib/hooks/use-name-lookup'
import { useRoleStore } from '@/lib/role-store'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { UnifiedTask, TaskMessage, TaskStatus, TaskPriority } from './task-types'
import { STATUS_CONFIG, PRIORITY_CONFIG } from './task-types'
import { StatusBadge, PriorityBadge, RequesterBadge } from './task-badges'
import { SlackMarkdown } from '@/lib/slack-markdown'

function fmtMsgTime(ts: string): string {
  const d = new Date(ts)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`
}

function fmtDate(s: string) {
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

interface Props {
  task: UnifiedTask
  onClose: () => void
  onComplete?: (id: string) => void
  onDefer?: (task: UnifiedTask) => void
  onSendMessage?: (id: string, content: string) => void
  onRequestReview?: (id: string) => void
  onCancelReview?: (id: string) => void
  onChangeStatus?: (id: string, status: string) => void
  onMarkInProgress?: (id: string) => void
  onEdit?: (id: string, updates: Partial<UnifiedTask>) => void
  onDelete?: (id: string) => void
  staffColor?: string | null
}

export function TaskDetailModal({ task, onClose, onComplete, onDefer, onSendMessage, onRequestReview, onCancelReview, onChangeStatus, onMarkInProgress, onEdit, onDelete, staffColor }: Props) {
  const [chatInput, setChatInput] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description ?? '')
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const done = task.status === 'completed'
  const reviewing = task.status === 'pending_review'
  const getName = useNameLookup()
  const hasReviewer = !!task.reviewerId
  const { currentRole, ROLE_USER_MAP } = useRoleStore()
  const currentUserId = ROLE_USER_MAP[currentRole]
  const canEdit =
    currentRole === 'operator_manager' || currentRole === 'operator'
      ? true
      : task.creatorId === currentUserId

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [task.messages.length])

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(task.title)
      setEditDescription(task.description ?? '')
      setEditPriority(task.priority)
    }
  }, [task.id, task.title, task.description, task.priority, isEditing])

  const handleEditSave = () => {
    const updates: Partial<UnifiedTask> = {}
    if (editTitle !== task.title) updates.title = editTitle
    if (editDescription !== (task.description ?? '')) updates.description = editDescription
    if (editPriority !== task.priority) updates.priority = editPriority
    if (Object.keys(updates).length > 0) onEdit?.(task.id, updates)
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditTitle(task.title)
    setEditDescription(task.description ?? '')
    setEditPriority(task.priority)
    setIsEditing(false)
  }

  const handleDeleteConfirm = () => {
    onDelete?.(task.id)
    setDeleteConfirmOpen(false)
    onClose()
  }

  useEffect(() => {
    if (task.status === 'pending') onMarkInProgress?.(task.id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!statusOpen) return
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [statusOpen])

  const handleSend = () => {
    if (!chatInput.trim()) return
    onSendMessage?.(task.id, chatInput.trim())
    setChatInput('')
  }

  const handleStatusChange = (newStatus: string) => {
    setStatusOpen(false)
    if (newStatus === 'pending_review') {
      onRequestReview?.(task.id)
    } else if (task.status === 'pending_review' && newStatus !== 'pending_review') {
      onCancelReview?.(task.id)
      if (newStatus !== 'in_progress') {
        onChangeStatus?.(task.id, newStatus)
      }
    } else if (newStatus === 'completed') {
      onComplete?.(task.id)
    } else {
      onChangeStatus?.(task.id, newStatus)
    }
  }

  const statusOptions: { key: string; status: TaskStatus; storeStatus: string }[] = [
    { key: 'pending', status: 'pending', storeStatus: 'pending' },
    { key: 'in_progress', status: 'in_progress', storeStatus: 'in_progress' },
    { key: 'pending_review', status: 'pending_review', storeStatus: 'pending_review' },
    { key: 'completed', status: 'completed', storeStatus: 'completed' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* ──── Header ──── */}
        <div className="flex shrink-0 items-center justify-between border-b border-foreground/[0.06] px-5 py-4">
          <div className="min-w-0 flex-1">
            {/* Row 1: title + priority | source */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-foreground/10 bg-transparent px-2 py-1 text-base font-semibold text-foreground focus:border-foreground/20 focus:outline-none"
                />
              ) : (
                <h3 className={cn('min-w-0 truncate text-base font-semibold', done ? 'text-foreground/30 line-through' : 'text-foreground')}>
                  {task.title}
                </h3>
              )}
              <div className="flex shrink-0 items-center gap-1.5">
                {isEditing ? (
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="rounded-md border border-foreground/10 bg-transparent px-2 py-1 text-[11px] text-foreground/70 focus:border-foreground/20 focus:outline-none"
                  >
                    {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                      <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                    ))}
                  </select>
                ) : (
                  <>
                    {task.priority !== 'normal' && <PriorityBadge priority={task.priority} />}
                    {(task.priority !== 'normal') && <span className="text-foreground/10">|</span>}
                  </>
                )}
                <RequesterBadge source={task.source} creatorId={task.creatorId} />
              </div>
            </div>
            {/* Row 2: status dropdown or edit Save/Cancel */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleEditSave}
                    className="rounded-md bg-foreground px-3 py-1.5 text-[11px] font-medium text-background transition-colors hover:bg-foreground/80"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="rounded-md border border-foreground/15 px-3 py-1.5 text-[11px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.04]"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div ref={statusRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { if (!done) setStatusOpen(!statusOpen) }}
                    className={cn('inline-flex items-center gap-1 rounded-full transition-colors', !done && 'hover:opacity-80')}
                  >
                    <StatusBadge status={task.status} />
                    {!done && <ChevronDown className={cn('h-3 w-3 text-foreground/30 transition-transform', statusOpen && 'rotate-180')} />}
                  </button>
                  {statusOpen && (
                    <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-card py-1 shadow-lg">
                      {statusOptions
                        .filter(opt => {
                          if (opt.key === 'completed' && hasReviewer) return false
                          if (opt.key === 'pending_review' && !hasReviewer) return false
                          return true
                        })
                        .map(opt => {
                          const c = STATUS_CONFIG[opt.status]
                          const isCurrent = task.status === opt.status
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => handleStatusChange(opt.storeStatus)}
                              className={cn(
                                'flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors hover:bg-foreground/[0.03]',
                                isCurrent && 'bg-foreground/[0.04] font-medium',
                              )}
                            >
                              <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', c.dotCls)} />
                              <span className={isCurrent ? 'text-foreground' : 'text-foreground/60'}>{c.label}</span>
                              {isCurrent && <span className="ml-auto text-[10px] text-foreground/25">현재</span>}
                            </button>
                          )
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {canEdit && onEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-md p-1.5 text-foreground/25 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/50"
                title="수정"
              >
                <Pencil className="h-5 w-5" />
              </button>
            )}
            {canEdit && onDelete && (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="rounded-md p-1.5 text-foreground/25 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/50 hover:text-destructive/80"
                title="삭제"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded-md p-1.5 text-foreground/25 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/50">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ──── Body ──── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">

          {/* Info Grid */}
          <div className="border-b border-foreground/[0.06] px-5 py-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              <Row icon={<User className="h-3.5 w-3.5" />} label="담당자">
                {task.assigneeId ? (
                  <span className="flex items-center gap-1.5 text-foreground/70">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: staffColor ?? '#94a3b8' }} />
                    {getName(task.assigneeId)}
                  </span>
                ) : <span className="text-foreground/25">미배정</span>}
              </Row>
              {task.reviewerId && <Row icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="검토자"><span className="text-foreground/70">{getName(task.reviewerId)}</span></Row>}
              <Row icon={<Calendar className="h-3.5 w-3.5" />} label="일정">
                <span className="tabular-nums text-foreground/70">{fmtDate(task.startDate)}{task.endDate && task.endDate !== task.startDate && ` ~ ${fmtDate(task.endDate)}`}</span>
              </Row>
              {(task.startTime || task.endTime) && (
                <Row icon={<Clock className="h-3.5 w-3.5" />} label="시간">
                  <span className="tabular-nums text-foreground/70">{task.startTime}{task.endTime ? ` ~ ${task.endTime}` : ''}</span>
                </Row>
              )}
              {task.creatorId && <Row icon={<User className="h-3.5 w-3.5" />} label="생성자"><span className="text-foreground/70">{getName(task.creatorId)}</span></Row>}
              {task.completedAt && <Row icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="완료 시각"><span className="tabular-nums text-foreground/70">{task.completedAt}</span></Row>}
            </div>
          </div>

          {/* Description */}
          <div className="border-b border-foreground/[0.06] px-5 py-4">
            <SectionHead icon={<FileText className="h-3.5 w-3.5" />} label="상세 내용" />
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="mt-2 w-full resize-y rounded-md border border-foreground/10 bg-transparent px-3 py-2 text-sm leading-relaxed text-foreground/60 focus:border-foreground/20 focus:outline-none"
                placeholder="설명을 입력하세요"
              />
            ) : task.description ? (
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">{task.description}</p>
            ) : (
              <p className="mt-2 text-sm text-foreground/20">설명이 없습니다</p>
            )}
          </div>

          {/* Output */}
          {task.output && (
            <div className="border-b border-foreground/[0.06] px-5 py-4">
              <SectionHead icon={<Tag className="h-3.5 w-3.5" />} label="기대 산출물" />
              <p className="mt-2 text-sm text-foreground/70">{task.output}</p>
            </div>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="border-b border-foreground/[0.06] px-5 py-4">
              <SectionHead icon={<Paperclip className="h-3.5 w-3.5" />} label={`첨부 (${task.attachments.length})`} />
              <div className="mt-2 space-y-1.5">
                {task.attachments.map((att) => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-foreground/[0.06] px-3 py-2 text-sm text-foreground/50 transition-colors hover:bg-foreground/[0.02] hover:text-foreground/70">
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{att.name}</span>
                    <span className="ml-auto rounded bg-foreground/[0.04] px-1.5 py-0.5 text-[10px] text-foreground/25">{att.type}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="px-5 pt-4 pb-1">
              <SectionHead icon={<MessageCircle className="h-3.5 w-3.5" />} label={`대화${task.messages.length > 0 ? ` (${task.messages.length})` : ''}`} />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {task.reviewerId && (
                <div className="mb-3 flex justify-center">
                  <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-[11px] leading-relaxed text-amber-600">
                    {getName(task.reviewerId)}님의 확인이 필요한 Task입니다. 확인 요청을 하면 검토 후 완료 처리됩니다.
                  </span>
                </div>
              )}
              {task.messages.length === 0 && !task.reviewerId ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-foreground/20">아직 대화가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {task.messages.map((msg) => <Bubble key={msg.id} msg={msg} />)}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ──── Footer ──── */}
        <div className="shrink-0 border-t border-foreground/[0.06]">
          {onSendMessage && (
            <div className="flex items-center gap-2 px-4 py-3">
              <input type="text" value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="메시지를 입력하세요"
                className="flex-1 rounded-full border border-foreground/10 bg-card px-4 py-2 text-sm text-foreground placeholder:text-foreground/20 focus:border-foreground/20 focus:outline-none"
              />
              <button type="button" onClick={handleSend} disabled={!chatInput.trim()}
                className={cn('rounded-full p-2 transition-colors', chatInput.trim() ? 'bg-foreground text-background hover:bg-foreground/80' : 'bg-foreground/[0.06] text-foreground/20')}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">업무 삭제</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/60">
              이 업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-foreground/10 text-foreground/60 hover:bg-foreground/[0.04]">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-foreground/20">{icon}</span>
      <div>
        <span className="text-[10px] text-foreground/25">{label}</span>
        <div>{children}</div>
      </div>
    </div>
  )
}

function SectionHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-foreground/20">{icon}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/25">{label}</span>
    </div>
  )
}

function Bubble({ msg }: { msg: TaskMessage }) {
  return (
    <div className={cn('flex flex-col', msg.isSelf ? 'items-end' : 'items-start')}>
      {!msg.isSelf && <span className="mb-1 text-[11px] font-medium text-foreground/35">{msg.authorName}</span>}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
        msg.isSelf ? 'rounded-tr-md bg-foreground text-background' : 'rounded-tl-md bg-foreground/[0.06] text-foreground/70',
      )}>
        <SlackMarkdown text={msg.content} className={msg.isSelf ? 'text-background [&_a]:text-blue-300' : 'text-foreground/70'} />
      </div>
      <span className="mt-0.5 text-[10px] text-foreground/20">{fmtMsgTime(msg.timestamp)}</span>
    </div>
  )
}
