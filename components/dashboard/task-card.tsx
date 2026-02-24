'use client'

import {
  Star,
  MessageCircle,
  AlertTriangle,
  X,
  Send,
  FileText,
  ExternalLink,
  Paperclip,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useDashboardStore } from '@/lib/store'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'

interface TaskCardProps {
  task: Task
  compact?: boolean
  showTime?: boolean
}

function getDDay(endDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function checkOverdue(task: Task): boolean {
  if (task.isCompleted) return false
  if (!task.dueTime) return false
  const now = new Date()
  const [hours, minutes] = task.dueTime.split(':').map(Number)
  const due = new Date()
  due.setHours(hours, minutes, 0, 0)
  return now > due
}

function formatMsgTime(timestamp: string): string {
  const d = new Date(timestamp)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 || 12
  return `${ampm} ${h12}:${m}`
}

/* ===== Detail Modal (iMessage style) ===== */
function TaskDetailModal({
  task,
  onClose,
}: {
  task: Task
  onClose: () => void
}) {
  const { updateTaskDetail, addTaskChatMessage } = useDashboardStore()
  const [chatInput, setChatInput] = useState('')
  const [detailText, setDetailText] = useState(task.detailContent || '')
  const [isEditingDetail, setIsEditingDetail] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [task.chatMessages.length])

  const handleSendMessage = () => {
    if (!chatInput.trim()) return
    addTaskChatMessage(task.id, chatInput.trim())
    setChatInput('')
  }

  const dDay = task.endDate ? getDDay(task.endDate) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-card shadow-2xl">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {task.isImportant && (
                <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
              )}
              <h3 className="truncate text-base font-semibold text-gray-900">
                {task.title}
              </h3>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              {task.dueTime && <span>{task.dueTime}</span>}
              {task.endDate && (
                <span
                  className={cn(
                    dDay !== null && dDay <= 2 && 'font-medium text-destructive',
                  )}
                >
                  {'D'}{dDay !== null && dDay >= 0 ? `-${dDay}` : `+${Math.abs(dDay!)}`}
                </span>
              )}
              {task.type === 'manager_request' && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                  {'매니저 요청'}
                </span>
              )}
              {task.type === 'system' && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                  {'시스템'}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* Detail content section */}
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="mb-2 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {'상세 내용'}
              </span>
            </div>
            {isEditingDetail ? (
              <div>
                <textarea
                  value={detailText}
                  onChange={(e) => setDetailText(e.target.value)}
                  placeholder="추가로 운영매니저가 확인해야 할 내용 등을 적어주세요"
                  className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/10"
                  rows={4}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingDetail(false)}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    {'취소'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateTaskDetail(task.id, detailText)
                      setIsEditingDetail(false)
                    }}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {'저장'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingDetail(true)}
                className="w-full text-left"
              >
                {task.detailContent ? (
                  <p className="text-sm leading-relaxed text-gray-700">
                    {task.detailContent}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    {'추가로 운영매니저가 확인해야 할 내용 등을 적어주세요'}
                  </p>
                )}
              </button>
            )}
          </div>

          {/* Attachments section */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="border-b border-gray-200 px-5 py-3">
              <div className="mb-2 flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {'첨부파일 / 가이드'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {task.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700"
                  >
                    {att.type === 'notion' ? (
                      <span className="shrink-0 text-base">{'N'}</span>
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{att.name}</span>
                    <ExternalLink className="ml-auto h-3 w-3 shrink-0 opacity-40" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* iMessage-style chat */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="px-5 pt-3 pb-1">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {'대화'}
                </span>
                {task.chatMessages.length > 0 && (
                  <span className="rounded-full bg-gray-200 px-1.5 text-[10px] font-medium text-gray-600">
                    {task.chatMessages.length}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {task.chatMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center py-8">
                  <p className="text-sm text-gray-400">{'아직 대화가 없습니다'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {task.chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex flex-col',
                        msg.isFromManager ? 'items-start' : 'items-end',
                      )}
                    >
                      {msg.isFromManager && (
                        <span className="mb-1 text-[11px] font-medium text-gray-500">
                          {msg.authorName}
                        </span>
                      )}
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                          msg.isFromManager
                            ? 'rounded-tl-md bg-gray-200 text-gray-900'
                            : 'rounded-tr-md bg-primary text-primary-foreground',
                        )}
                      >
                        {msg.content}
                      </div>
                      <span className="mt-0.5 text-[10px] text-gray-400">
                        {formatMsgTime(msg.timestamp)}
                      </span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat input */}
        <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="추가로 운영매니저가 확인해야 할 내용 등을 적어주세요"
              className="flex-1 rounded-full border border-gray-300 bg-card px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className={cn(
                'rounded-full p-2 transition-colors',
                chatInput.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-gray-200 text-gray-400',
              )}
              aria-label="메시지 보내기"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===== Main TaskCard ===== */
export function TaskCard({
  task,
  compact = false,
  showTime = false,
}: TaskCardProps) {
  const { toggleTaskComplete, toggleTaskImportant } = useDashboardStore()
  const [showModal, setShowModal] = useState(false)
  const [overdue, setOverdue] = useState(false)

  useEffect(() => {
    setOverdue(checkOverdue(task))
  }, [task])

  const dDay = task.endDate ? getDDay(task.endDate) : null
  const requestCount = task.managerRequestCount ?? 0

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
          task.isCompleted && 'opacity-60',
          overdue && 'bg-red-50',
        )}
      >
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={() => toggleTaskComplete(task.id)}
          className="h-3.5 w-3.5"
          aria-label={`${task.title} 완료 표시`}
        />
        <span
          className={cn(
            'text-xs text-gray-900',
            task.isCompleted && 'text-gray-500 line-through',
          )}
        >
          {task.title}
        </span>
      </div>
    )
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowModal(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setShowModal(true)
        }}
        className={cn(
          'group cursor-pointer rounded-lg border bg-card p-3 transition-all duration-200',
          overdue && !task.isCompleted
            ? 'border-destructive/50 bg-red-50/30'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
          task.isCompleted && 'border-gray-200 bg-gray-50 opacity-70',
        )}
      >
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleTaskImportant(task.id)
            }}
            className={cn(
              'mt-0.5 shrink-0 transition-colors',
              task.isImportant
                ? 'text-amber-400'
                : 'text-gray-300 hover:text-gray-400',
            )}
            aria-label={task.isImportant ? '중��� 표시 해제' : '중요 표시'}
          >
            <Star
              className={cn('h-4 w-4', task.isImportant && 'fill-current')}
            />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <Checkbox
              checked={task.isCompleted}
              onCheckedChange={() => toggleTaskComplete(task.id)}
              className="mt-0.5 shrink-0"
              aria-label={`${task.title} 완료 표시`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-sm font-medium text-gray-900',
                  task.isCompleted && 'text-gray-500 line-through',
                )}
              >
                {task.title}
              </span>
              {overdue && !task.isCompleted && (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
              )}
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              {showTime && task.dueTime && <span>{task.dueTime}</span>}
              {task.endDate && (
                <span
                  className={cn(
                    dDay !== null && dDay <= 2 && 'font-medium text-destructive',
                  )}
                >
                  {'D'}
                  {dDay !== null && dDay >= 0
                    ? `-${dDay}`
                    : `+${Math.abs(dDay!)}`}
                </span>
              )}
              {task.startDate && task.endDate && (
                <span>
                  {new Date(task.startDate).getMonth() + 1}/
                  {new Date(task.startDate).getDate()}
                  {' ~ '}
                  {new Date(task.endDate).getMonth() + 1}/
                  {new Date(task.endDate).getDate()}
                </span>
              )}
            </div>

            {task.detailContent && (
              <p className="mt-1.5 line-clamp-1 text-xs text-gray-500">
                {task.detailContent}
              </p>
            )}
          </div>

        </div>

        {/* Bottom indicators (clip-style: small icon + number) */}
        {(requestCount > 0 || (task.attachments && task.attachments.length > 0) || task.chatMessages.length > 0) && (
          <div className="mt-2 flex items-center gap-3 border-t border-gray-100 pt-2">
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Paperclip className="h-3 w-3" />
                <span>{task.attachments.length}</span>
              </div>
            )}
            {requestCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <MessageCircle className="h-3 w-3" />
                <span className="font-medium">{requestCount}</span>
              </div>
            )}
            {task.chatMessages.length > 0 && requestCount === 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MessageCircle className="h-3 w-3" />
                <span>{task.chatMessages.length}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && (
        <TaskDetailModal task={task} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
