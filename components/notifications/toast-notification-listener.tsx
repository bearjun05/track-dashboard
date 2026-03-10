'use client'

import { useToastNotifications } from '@/lib/hooks/use-toast-notifications'

/**
 * Renders nothing but runs the toast notification hook globally.
 * Must be mounted inside the app (e.g. layout) so it has access to stores.
 */
export function ToastNotificationListener() {
  useToastNotifications()
  return null
}
