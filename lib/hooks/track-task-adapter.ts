import type { TrackTask } from '@/lib/admin-mock-data'
import type { Task } from '@/lib/types'

/**
 * TrackTask (admin-store) → Task (staff dashboard) 어댑터.
 * TaskCard 컴포넌트를 그대로 재사용하기 위해 타입을 변환한다.
 */
export function trackTaskToTask(tt: TrackTask): Task {
  const isCompleted = tt.status === 'completed'
  const isOverdue = tt.status === 'overdue'

  let taskType: Task['type'] = 'system'
  if (tt.description === '__self_added__') taskType = 'self_added'
  else if (tt.type === 'manual') taskType = 'manager_request'
  else if (tt.endDate && tt.endDate !== tt.scheduledDate) taskType = 'period'

  return {
    id: tt.id,
    title: tt.title,
    dueDate: tt.scheduledDate,
    dueTime: tt.scheduledTime,
    isCompleted,
    isImportant: isOverdue,
    type: taskType,
    startDate: tt.scheduledDate,
    endDate: tt.endDate ?? tt.scheduledDate,
    chatMessages: tt.messages.map(m => ({
      id: m.id,
      authorId: m.isSelf ? 'me' : 'manager',
      authorName: m.authorName,
      content: m.content,
      timestamp: m.timestamp,
      isFromManager: !m.isSelf,
    })),
    detailContent: tt.description !== '__self_added__' ? tt.description : undefined,
  }
}
