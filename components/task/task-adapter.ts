import type { TrackTask } from '@/lib/admin-mock-data'
import type { UnifiedTask, TaskSource, TaskStatus } from './task-types'

const SELF_MARKER = '__self_added__'
const REQUEST_MARKER = '__request_sent__'

function mapStatus(s: TrackTask['status']): TaskStatus {
  return s as TaskStatus
}

function mapSource(tt: TrackTask): TaskSource {
  if (tt.description?.startsWith(REQUEST_MARKER)) return 'request_sent'
  if (tt.description?.startsWith(SELF_MARKER)) return 'self'
  if (tt.type === 'manual') return 'request_received'
  return 'system'
}

function cleanDescription(desc: string | undefined): string | undefined {
  if (!desc) return undefined
  if (desc.startsWith(SELF_MARKER)) {
    const rest = desc.slice(SELF_MARKER.length).replace(/^\n/, '')
    return rest || undefined
  }
  if (desc.startsWith(REQUEST_MARKER)) {
    const rest = desc.slice(REQUEST_MARKER.length).replace(/^\n/, '')
    return rest || undefined
  }
  return desc
}

export function trackTaskToUnified(tt: TrackTask): UnifiedTask {
  return {
    id: tt.id,
    templateId: tt.templateId,
    trackId: tt.trackId,
    title: tt.title,
    description: cleanDescription(tt.description),
    category: '수강생 관리',
    source: mapSource(tt),
    createdAt: tt.scheduledDate,
    assigneeId: tt.assigneeId,
    reviewerId: tt.reviewerId,
    startDate: tt.scheduledDate,
    endDate: tt.endDate,
    startTime: tt.scheduledTime,
    endTime: tt.dueTime,
    priority: tt.priority ?? (tt.status === 'overdue' ? 'urgent' : 'normal'),
    status: mapStatus(tt.status),
    completedAt: tt.completedAt,
    messages: tt.messages.map(m => ({
      id: m.id,
      authorId: m.isSelf ? 'me' : 'other',
      authorName: m.authorName,
      content: m.content,
      timestamp: m.timestamp,
      isSelf: m.isSelf,
    })),
  }
}
