export interface Message {
  id: string
  authorId: string
  authorName: string
  content: string
  timestamp: string
  isFromManager: boolean
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: 'notion' | 'link' | 'file'
}

export interface Task {
  id: string
  title: string
  dueDate: string
  dueTime?: string
  isCompleted: boolean
  isImportant: boolean
  type: 'system' | 'manager_request' | 'self_added' | 'period'
  startDate?: string
  endDate?: string
  chatMessages: Message[]
  detailContent?: string
  relatedIssueId?: string
  attachments?: Attachment[]
  managerRequestCount?: number
}

export interface Notice {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  isGlobal: boolean
  isRead: boolean
  timestamp: string
  replies: Message[]
}

export interface Issue {
  id: string
  title: string
  content: string
  urgency: 'normal' | 'urgent'
  status: 'pending' | 'answered'
  timestamp: string
  relatedTaskId?: string
  replies: Message[]
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  category: 'assignment' | 'project' | 'evaluation' | 'general'
}

// --- Interview Management Types ---

export interface Student {
  id: string
  name: string
  teamNumber: number
  consecutiveAbsentDays: number
}

export interface TeamRoundCheck {
  studentId: string
  date: string
  period: 'morning' | 'afternoon'
  isAbsent?: boolean
  healthCheck?: boolean
  progressCheck?: boolean
  specialNote?: string
}

export interface StudentLog {
  id: string
  studentId: string
  studentName: string
  content: string
  authorId: string
  authorName: string
  period: 'morning' | 'afternoon'
  createdAt: string
}
