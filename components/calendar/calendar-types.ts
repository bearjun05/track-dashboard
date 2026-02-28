import type { UnifiedSchedule } from '@/components/schedule/schedule-types'
import type { UnifiedTask } from '@/components/task/task-types'

export type FilterKey = 'curriculum' | 'operation' | 'task' | 'my'
export const ALL_FILTERS: FilterKey[] = ['curriculum', 'operation', 'task', 'my']

export type CalendarView = 'month' | 'week'

export { TODAY } from '@/lib/date-constants'
export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export const HOUR_START = 9
export const HOUR_END = 18
export const SLOT_HEIGHT = 24
export const SLOTS = (HOUR_END - HOUR_START) * 2

export const LAYER_STYLES = {
  chapter:      { bg: 'bg-foreground/[0.04]', text: 'text-foreground/50' },
  curriculum:   { bg: 'bg-blue-500/[0.12]',   text: 'text-blue-800' },
  operation:    { bg: 'bg-violet-500/[0.08]',  text: 'text-violet-700' },
  period_task:  { bg: 'bg-foreground/[0.06]',    text: 'text-foreground/60' },
  period_self:  { bg: 'bg-teal-500/[0.08]',    text: 'text-teal-800/70' },
  task_system:  { bg: 'bg-foreground/[0.06]',    text: 'text-foreground/80' },
  task_self:    { bg: 'bg-teal-500/[0.08]',    text: 'text-teal-800' },
} as const

export interface SpanBar {
  id: string
  label: string
  layer: 'chapter' | 'curriculum' | 'operation' | 'period_task'
  startCol: number
  span: number
  row: number
  isSelf?: boolean
  dateLabel?: string
}

export interface AllDayInputs {
  chapterItems: { id: string; label: string; startDate: string; endDate: string }[]
  curriculumItems: { id: string; label: string; startDate: string; endDate: string }[]
  opPeriodItems: { id: string; label: string; startDate: string; endDate: string }[]
  periodTaskItems: { id: string; label: string; startDate: string; endDate: string; isSelf: boolean; dateLabel?: string }[]
}

export interface CalendarDataProps {
  schedules: UnifiedSchedule[]
  chapters: UnifiedSchedule[]
  operationPeriods: UnifiedSchedule[]
  tasks: UnifiedTask[]
  periodTasks: UnifiedTask[]
  personalSchedules: UnifiedSchedule[]
  allDayInputs: AllDayInputs
  filters: Set<FilterKey>
}
