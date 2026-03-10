'use client'

import React from 'react'
import { useMemo, useState, useCallback } from 'react'
import type { CommMessage } from '@/lib/admin-mock-data'
import type { StaffConversation } from '@/lib/admin-mock-data'

export interface ChatSearchResult {
  id: string
  channelId: string
  channelName: string
  messageId: string
  content: string
  authorName: string
  timestamp: string
  highlightedContent: React.ReactNode
  source: 'comm' | 'staff'
}

/** Highlight matching text in content (case-insensitive) */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const lower = text.toLowerCase()
  const q = query.toLowerCase().trim()
  const idx = lower.indexOf(q)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-amber-400/40 px-0.5 font-medium">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

/** Search commMessages and staffConversations, return flat results */
export function useChatSearch(
  commMessages: Record<string, CommMessage[]>,
  staffConversations: StaffConversation[],
  getChannelName: (channelId: string) => string
) {
  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const results = useMemo((): ChatSearchResult[] => {
    const q = query.trim()
    if (!q) return []

    const out: ChatSearchResult[] = []

    // Search commMessages
    for (const [channelId, messages] of Object.entries(commMessages)) {
      const channelName = getChannelName(channelId)
      for (const msg of messages) {
        const content = msg.content || msg.taskPreview?.lastContent || ''
        if (content && content.toLowerCase().includes(q.toLowerCase())) {
          out.push({
            id: `comm-${channelId}-${msg.id}`,
            channelId,
            channelName,
            messageId: msg.id,
            content,
            authorName: msg.authorName,
            timestamp: msg.timestamp,
            highlightedContent: highlightMatch(content, q),
            source: 'comm',
          })
        }
      }
    }

    // Search staffConversations messages
    for (const conv of staffConversations) {
      const channelName = conv.taskTitle
      for (const msg of conv.messages) {
        const content = msg.content || ''
        if (content && content.toLowerCase().includes(q.toLowerCase())) {
          out.push({
            id: `staff-${conv.id}-${msg.id}`,
            channelId: conv.id,
            channelName,
            messageId: msg.id,
            content,
            authorName: msg.authorName,
            timestamp: msg.timestamp,
            highlightedContent: highlightMatch(content, q),
            source: 'staff',
          })
        }
      }
    }

    // Sort by timestamp descending
    out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return out
  }, [query, commMessages, staffConversations, getChannelName])

  const openSearch = useCallback(() => setIsSearchOpen(true), [])
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setQuery('')
  }, [])

  return {
    query,
    setQuery,
    results,
    isSearchOpen,
    setIsSearchOpen,
    openSearch,
    closeSearch,
  }
}
