export type TaskPriority = 'important' | 'urgent' | 'normal'

export type TaskStatus =
  | 'unassigned'
  | 'pending'
  | 'in_progress'
  | 'pending_review'
  | 'completed'
  | 'overdue'

export type TaskSource = 'system' | 'request_sent' | 'request_received' | 'self'

export type AttachmentType = 'guide' | 'evidence' | 'file' | 'link'

export interface TaskAttachment {
  id: string
  name: string
  url: string
  type: AttachmentType
}

export interface TaskMessage {
  id: string
  authorId: string
  authorName: string
  content: string
  timestamp: string
  isSelf: boolean
}

export interface UnifiedTask {
  id: string
  templateId?: string
  trackId: string
  title: string
  description?: string
  category: string
  subcategory?: string
  output?: string
  attachments?: TaskAttachment[]
  source: TaskSource
  creatorId?: string
  createdAt: string
  assigneeId?: string
  reviewerId?: string
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  priority: TaskPriority
  status: TaskStatus
  completedAt?: string
  messages: TaskMessage[]
}

/*
 * Design system — 3-tone + grayscale
 *
 * 1. Foreground (grayscale, opacity variations) — default
 * 2. Destructive (red) — overdue, urgent ONLY
 * 3. Amber (warm) — needs attention: pending_review, important
 */

export const STATUS_CONFIG: Record<TaskStatus, { label: string; cls: string; dotCls: string; style: 'filled' | 'outline' | 'ghost' }> = {
  unassigned:     { label: '미배정',   cls: 'border border-dashed border-foreground/25 text-foreground/40 bg-transparent',  dotCls: 'bg-foreground/20',  style: 'outline' },
  pending:        { label: '대기',     cls: 'bg-foreground/[0.04] text-foreground/35',                                      dotCls: 'bg-foreground/25',  style: 'ghost' },
  in_progress:    { label: '진행중',   cls: 'bg-blue-500/10 text-blue-600',                                                   dotCls: 'bg-blue-500',       style: 'filled' },
  pending_review: { label: '확인요청', cls: 'bg-amber-500/10 text-amber-600',                                               dotCls: 'bg-amber-500',      style: 'filled' },
  completed:      { label: '완료',     cls: 'bg-foreground/[0.03] text-foreground/25',                                      dotCls: 'bg-foreground/20',  style: 'ghost' },
  overdue:        { label: '지연',     cls: 'bg-destructive/10 text-destructive',                                            dotCls: 'bg-destructive',    style: 'filled' },
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; cls: string }> = {
  normal:    { label: '보통', cls: '' },
  important: { label: '중요', cls: 'text-amber-600' },
  urgent:    { label: '긴급', cls: 'text-destructive' },
}

export const SOURCE_CONFIG: Record<TaskSource, { label: string; cls: string }> = {
  system:           { label: '시스템',   cls: 'bg-foreground/[0.04] text-foreground/40' },
  request_sent:     { label: '보낸요청', cls: 'bg-foreground/[0.06] text-foreground/50' },
  request_received: { label: '받은요청', cls: 'bg-foreground/[0.06] text-foreground/50' },
  self:             { label: '직접추가', cls: 'bg-foreground/[0.03] text-foreground/30' },
}
