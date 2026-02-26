'use client'

import { useDashboardStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { AlertCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'

function formatTimeAgo(timestamp: string, now: number): string {
  const then = new Date(timestamp).getTime()
  const diff = Math.floor((now - then) / 60000)
  if (diff < 1) return '방금 전'
  if (diff < 60) return `${diff}분 전`
  const hours = Math.floor(diff / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

export function IssueSection({ staffId }: { staffId?: string }) {
  const { issues, addIssue, addIssueReply } = useDashboardStore()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal')
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [now, setNow] = useState(0)

  useEffect(() => {
    setNow(Date.now())
  }, [])

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return
    addIssue({ title: title.trim(), content: content.trim(), urgency })
    setTitle('')
    setContent('')
    setUrgency('normal')
    setShowForm(false)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold tracking-tight text-gray-900">
            {'요청/Issue'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {showForm ? '취소' : '새 요청'}
        </button>
      </div>

      {/* New issue form */}
      {showForm && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full rounded-md border border-gray-300 bg-card px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요..."
            className="mt-2 w-full resize-none rounded-md border border-gray-300 bg-card px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            rows={3}
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUrgency('normal')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  urgency === 'normal'
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100',
                )}
              >
                {'일반'}
              </button>
              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  urgency === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-500 hover:bg-gray-100',
                )}
              >
                {'긴급'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {'제출'}
            </button>
          </div>
        </div>
      )}

      {/* Issue list */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {issues.map((issue) => {
          const isExpanded = expandedIssue === issue.id

          return (
            <div key={issue.id} className="rounded-lg border border-gray-200 bg-card">
              <button
                type="button"
                onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                className="flex w-full items-start justify-between p-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {issue.title}
                    </span>
                    {issue.urgency === 'urgent' && (
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                        {'긴급'}
                      </span>
                    )}
                    {issue.status === 'answered' ? (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        {'답변 완료'}
                      </span>
                    ) : (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                        {'대기중'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                    {issue.content}
                  </p>
                  <span className="mt-1 block text-[11px] text-gray-400">
                    {now ? formatTimeAgo(issue.timestamp, now) : ''}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 p-3">
                  <p className="mb-3 text-sm text-gray-700">{issue.content}</p>

                  {/* Replies */}
                  {issue.replies.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {issue.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={cn(
                            'flex',
                            reply.isFromManager ? 'justify-start' : 'justify-end',
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[80%] rounded-lg px-3 py-2 text-xs',
                              reply.isFromManager
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-primary text-primary-foreground',
                            )}
                          >
                            <p className="mb-0.5 text-[10px] font-medium opacity-70">
                              {reply.authorName}
                            </p>
                            <p>{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && replyText.trim()) {
                          addIssueReply(issue.id, replyText.trim())
                          setReplyText('')
                        }
                      }}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 rounded-md border border-gray-300 bg-card px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (replyText.trim()) {
                          addIssueReply(issue.id, replyText.trim())
                          setReplyText('')
                        }
                      }}
                      className="rounded-md bg-primary p-1.5 text-primary-foreground transition-colors hover:bg-primary/90"
                      aria-label="전송"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {issues.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            {'등록된 요청/Issue가 없습니다'}
          </p>
        )}
      </div>
    </div>
  )
}
