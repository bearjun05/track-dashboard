export interface SubjectCard {
  id: string
  subjectName: string
  startDate: string
  endDate: string
  totalHours: number
  isProject: boolean
  isHoliday: boolean
  weekNumbers: number[]
}

export interface HolidayEntry {
  date: string
  name: string
}

export interface ParsedSchedule {
  cards: SubjectCard[]
  holidays: HolidayEntry[]
  trackStart: string
  trackEnd: string
  totalWeeks: number
}

export interface Chapter {
  id: string
  name: string
  order: number
  cards: SubjectCard[]
  startDate: string
  endDate: string
}

export interface StaffMember {
  id: string
  name: string
  role: 'operator_manager' | 'operator' | 'learning_manager' | 'tutor'
}

export interface TrackStaffAssignment {
  operatorManagers: StaffMember[]
  operators: StaffMember[]
  learningManagers: StaffMember[]
  tutors: StaffMember[]
}

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'per_chapter'
export type TaskFrequency = 'once' | 'ad_hoc' | 'weekly' | 'per_chapter' | 'monthly' | 'daily'
export type TaskPriority = 'high' | 'medium' | 'low'
export type DriRole = 'operator_manager' | 'operator' | 'learning_manager'

export interface RecurrenceConfig {
  type: RecurrenceType
  time?: string
  daysOfWeek?: number[]
  interval?: number
  startDate?: string
  endDate?: string
}

export type TaskScope = 'common' | 'individual'

export type AssignmentMode = 'all' | 'specific' | 'rotation' | 'unassigned'

export interface RotationConfig {
  cycle: 'daily' | 'weekly'
  staffOrder: string[]
}

export interface TaskAssignmentConfig {
  templateId: string
  mode: AssignmentMode
  specificStaffId?: string
  rotationConfig?: RotationConfig
}

export interface TaskTemplateConfig {
  id: string
  number: number
  category: string
  subcategory: string
  title: string
  description?: string
  driRole: DriRole
  subDriRole?: DriRole
  frequency: TaskFrequency
  triggerType: string
  triggerOffset?: number
  priority: TaskPriority
  scope?: TaskScope
  reviewer?: string
  estimatedDays?: number
  output?: string
}

export interface GeneratedTask {
  id: string
  templateId: string
  title: string
  description?: string
  category: string
  subcategory: string
  assignedRole: DriRole
  assigneeId?: string
  assigneeName?: string
  status: 'pending' | 'unassigned' | 'deferred'
  scheduledDate: string
  dueDate: string
  scheduledTime?: string
  frequency: TaskFrequency
  priority: TaskPriority
  chapterId?: string
  chapterName?: string
  recurrence?: RecurrenceConfig
  reviewer?: string
  output?: string
}

export interface TrackCreationData {
  name: string
  round: number
  parsedSchedule: ParsedSchedule | null
  chapters: Chapter[]
  unassignedCards: SubjectCard[]
  staff: TrackStaffAssignment
  generatedTasks: GeneratedTask[]
  recurrenceConfigs: Record<string, RecurrenceConfig>
  customTemplates: TaskTemplateConfig[]
  taskAssignments: Record<string, TaskAssignmentConfig>
}
