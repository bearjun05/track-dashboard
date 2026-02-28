export type ScheduleType = 'chapter' | 'curriculum' | 'operation_period' | 'track_event' | 'personal'

export type ScheduleSource = 'system' | 'manual'

export interface UnifiedSchedule {
  id: string
  title: string
  type: ScheduleType
  source: ScheduleSource
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  trackId?: string
  creatorId?: string
  description?: string
  category?: string
  createdAt: string
}

export const SCHEDULE_TYPE_CONFIG: Record<ScheduleType, { label: string }> = {
  chapter: { label: '챕터' },
  curriculum: { label: '커리큘럼' },
  operation_period: { label: '운영일정' },
  track_event: { label: '트랙 일정' },
  personal: { label: '개인 일정' },
}
