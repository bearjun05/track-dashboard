'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAdminStore } from '@/lib/admin-store'
import { useRoleStore, ROLE_USER_MAP } from '@/lib/role-store'

const REVIEW_NOTIFICATION_TYPES = ['task_review_requested', 'request_received'] as const

/**
 * Hook that watches admin store for notification events and shows toasts.
 * Only active for 총괄 (operator_manager) and 운영 (operator) roles.
 */
export function useToastNotifications() {
  const currentRole = useRoleStore((s) => s.currentRole)
  const notifications = useAdminStore((s) => s.notifications)
  const commMessages = useAdminStore((s) => s.commMessages)
  const toastSettings = useAdminStore((s) => s.toastSettings)

  const prevNotiCountRef = useRef(0)
  const prevMsgCountsRef = useRef<Record<string, number>>({})
  const mountedRef = useRef(false)

  const currentUserId = ROLE_USER_MAP[currentRole]
  const isOperatorOrManager =
    currentRole === 'operator_manager' || currentRole === 'operator'

  useEffect(() => {
    if (!isOperatorOrManager) return

    // Skip first run (initial mount) to avoid toasting on load
    if (!mountedRef.current) {
      mountedRef.current = true
      prevNotiCountRef.current = notifications.length
      prevMsgCountsRef.current = Object.fromEntries(
        Object.entries(commMessages).map(([ch, msgs]) => [ch, msgs.length])
      )
      return
    }

    // Check for new review-related notifications
    if (toastSettings.reviewRequest && notifications.length > prevNotiCountRef.current) {
      const newNotis = notifications.slice(0, notifications.length - prevNotiCountRef.current)
      for (const n of newNotis) {
        if (
          REVIEW_NOTIFICATION_TYPES.includes(n.type as (typeof REVIEW_NOTIFICATION_TYPES)[number]) &&
          n.recipientRole === currentRole
        ) {
          const taskTitle = n.title.replace(/^확인요청: /, '') || 'Task'
          const assigneeName = n.description?.replace(/님이 확인을 요청했습니다/, '') ?? '담당자'
          toast('확인요청', {
            description: `${taskTitle} - ${assigneeName}님이 확인을 요청했습니다`,
          })
        }
      }
    }
    prevNotiCountRef.current = notifications.length

    // Check for new chat messages (from other users)
    if (toastSettings.chat) {
      for (const [channelId, msgs] of Object.entries(commMessages)) {
        const prev = prevMsgCountsRef.current[channelId] ?? 0
        if (msgs.length > prev) {
          const newMsgs = msgs.slice(prev)
          for (const m of newMsgs) {
            if (m.authorId && m.authorId !== currentUserId && m.authorId !== '__system__') {
              const preview = m.content?.slice(0, 50) ?? ''
              toast('채팅', {
                description: `${m.authorName}: ${preview}${preview.length >= 50 ? '…' : ''}`,
              })
            }
          }
        }
        prevMsgCountsRef.current[channelId] = msgs.length
      }
    }
  }, [
    notifications,
    commMessages,
    toastSettings.reviewRequest,
    toastSettings.chat,
    currentRole,
    currentUserId,
    isOperatorOrManager,
  ])
}
