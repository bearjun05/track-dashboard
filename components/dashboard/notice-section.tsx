'use client'

import { useDashboardStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Megaphone,
  User,
  Check,
  CornerDownLeft,
  Send,
} from 'lucide-react'
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

export function NoticeSection() {
  const { notices, markNoticeRead, addNoticeReply } = useDashboardStore()
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [now, setNow] = useState(0)

  useEffect(() => {
    setNow(Date.now())
  }, [])

  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-gray-200 px-4">
        <Megaphone className="h-4 w-4 text-gray-500" />
        <h2 className="text-sm font-semibold tracking-tight text-gray-900">{'공지'}</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {sortedNotices.map((notice) => {
          const isExpanded = expandedNotice === notice.id

          return (
            <div
              key={notice.id}
              className={cn(
                'rounded-lg border border-gray-200 transition-all duration-200',
                notice.isRead && 'bg-gray-50 opacity-70',
                !notice.isRead && 'bg-card',
              )}
            >
              <div className="p-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                  {notice.isGlobal ? (
                    <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      <Megaphone className="h-3 w-3" />
                      {'전체'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      <User className="h-3 w-3" />
                      {'개인'}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{notice.authorName}</span>
                  <span className="text-xs text-gray-400">{now ? formatTimeAgo(notice.timestamp, now) : ''}</span>
                </div>

                {/* Content */}
                <p className="mt-2 text-sm text-gray-900">{notice.content}</p>

                {/* Actions */}
                <div className="mt-2 flex items-center gap-2">
                  {!notice.isRead && (
                    <button
                      type="button"
                      onClick={() => markNoticeRead(notice.id)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Check className="h-3 w-3" />
                      {'읽음'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedNotice(isExpanded ? null : notice.id)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    <CornerDownLeft className="h-3 w-3" />
                    {'답장'}
                    {notice.replies.length > 0 && (
                      <span className="text-gray-400">({notice.replies.length})</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Thread */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-3">
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {notice.replies.map((reply) => (
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
                              ? 'bg-gray-200 text-gray-900'
                              : 'bg-primary text-primary-foreground',
                          )}
                        >
                          <p className="mb-0.5 text-[10px] font-medium opacity-70">
                            {reply.authorName} {'  '} {now ? formatTimeAgo(reply.timestamp, now) : ''}
                          </p>
                          <p>{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply input */}
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && replyText.trim()) {
                          addNoticeReply(notice.id, replyText.trim())
                          setReplyText('')
                        }
                      }}
                      placeholder="답장을 입력하세요..."
                      className="flex-1 rounded-md border border-gray-300 bg-card px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (replyText.trim()) {
                          addNoticeReply(notice.id, replyText.trim())
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
      </div>
    </div>
  )
}
