// Admin Dashboard Mock Data

// -- Task Template & Track Task types --

export type TaskType = 'daily' | 'milestone' | 'manual'
export type TrackTaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'unassigned' | 'pending_review'

export interface TaskTemplate {
  id: string
  title: string
  description?: string
  type: 'daily' | 'milestone'
  scheduledTime?: string
  milestoneDayOffset?: number
  dueOffsetMinutes?: number
  autoAssign: boolean
}

export interface TaskMessage {
  id: string
  authorName: string
  content: string
  timestamp: string
  isSelf: boolean
}

export type CompletionType = 'simple' | 'evidence'

export interface TrackTask {
  id: string
  title: string
  description?: string
  type: TaskType
  completionType?: CompletionType
  templateId?: string
  trackId: string
  assigneeId?: string
  assigneeName?: string
  status: TrackTaskStatus
  scheduledDate: string
  endDate?: string
  scheduledTime?: string
  dueTime?: string
  completedAt?: string
  unassignedReason?: string
  priority?: 'normal' | 'important' | 'urgent'
  reviewerId?: string
  reviewerName?: string
  messages: TaskMessage[]
}

export interface ChapterInfo {
  id: string
  name: string
  startDate: string
  endDate: string
  trackId: string
}

/** @deprecated TrackSchedule, PersonalSchedule, ChapterInfo는 UnifiedSchedule로 통합됨 — schedule-types.ts 참조 */

export interface OperatorTrackSummary {
  trackName: string
  staffAvgCompletion: number
  issueResolutionRate: number
}

export interface OperatorCard {
  id: string
  name: string
  displayName: string
  taskCompletionRate: number
  taskCompleted: number
  taskTotal: number
  tracks: OperatorTrackSummary[]
}

export interface TrackCard {
  id: string
  name: string
  staffAvgCompletion: number
  issueResolutionRate: number
  urgentIssues: number
  pendingRequests: number
  staffCount: number
  studentCount: number
  isOwned: boolean
}

export interface VacationEntry {
  id: string
  start: string
  end: string
  reason: string
}

export interface WorkScheduleEntry {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface StaffCard {
  id: string
  name: string
  taskCompletionRate: number
  taskCompleted: number
  taskTotal: number
  unreadMessages: number
  missedRound?: string
  isWarning: boolean
  vacation?: { start: string; end: string }
  vacationHistory: VacationEntry[]
  workSchedule: WorkScheduleEntry[]
  memo: string
}

// --- Notification System ---

export type NotificationType =
  // System auto (SYS) — 필수, 비활성화 불가
  | 'task_overdue'              // SYS-01: Task 기한초과
  | 'task_unassigned'           // SYS-02: Task 미배정
  | 'task_reminder'             // SYS-03: Task 시작 리마인더 (startTime 30분 전)
  | 'escalation_triggered'      // SYS-04: 에스컬레이션 발동
  // Action-based (ACT) — 일부 선택 가능
  | 'task_assigned'             // ACT-01: Task 배정
  | 'task_reassigned'           // ACT-02: Task 재배정
  | 'task_completed'            // ACT-03: Task 완료 (선택)
  | 'task_review_requested'     // ACT-04: 확인요청 (pending_review 전환)
  | 'task_review_done'          // ACT-05: 확인완료 (reviewer 승인)
  | 'request_received'          // ACT-06: 업무 요청/지시 수신
  | 'message_new'               // ACT-07: 새 메시지
  | 'notice_new'                // ACT-08: 새 공지
  | 'notice_replied'            // ACT-09: 공지 답변 (선택)
  | 'vacation_registered'       // ACT-10: 휴가 등록
  | 'schedule_changed'          // ACT-11: 일정 변경 (선택)
  // Threshold (THR) — 선택 가능
  | 'threshold_staff_completion'    // THR-01
  | 'threshold_operator_completion' // THR-02
  | 'threshold_pending_issues'      // THR-03
  | 'threshold_unread_messages'     // THR-04
  | 'threshold_overdue_tasks'       // THR-05

export type NotificationCategory = 'system' | 'action' | 'threshold'
export type RecipientRole = 'operator_manager' | 'operator' | 'learning_manager'

export interface AppNotification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  description: string
  timestamp: string
  isRead: boolean
  linkTo: string
  recipientRole: RecipientRole
  relatedTrackId?: string
  relatedTaskId?: string
  relatedStaffId?: string
  priority?: 'normal' | 'urgent'
  escalation?: {
    isEscalated: boolean
    originalRecipientRole?: RecipientRole
    escalatedAt?: string
    originalNotificationId?: string
  }
  isEscalatedAway?: boolean
}

export interface NotificationConfig {
  trackId: string
  thresholds: {
    staffCompletionRate: number
    operatorCompletionRate: number
    pendingIssueCount: number
    unreadMessageCount: number
    overdueTaskCount: number
  }
  escalation: {
    staffToOperatorHours: number
    operatorToManagerHours: number
  }
  disabledOptionalAlerts: string[]
  digestMode: 'realtime' | 'hourly' | 'daily'
  quietHours: { start: string; end: string } | null
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
  label: string
  description: string
  category: NotificationCategory
  recipients: RecipientRole[]
}> = {
  // SYS
  task_overdue:                   { label: '기한초과',       description: 'Task 마감 시간 초과 시 담당자와 운영매에게 알림',                  category: 'system',    recipients: ['operator', 'learning_manager'] },
  task_unassigned:                { label: '미배정',         description: '담당자가 지정되지 않은 Task 발생 시 운영매에게 알림',               category: 'system',    recipients: ['operator'] },
  task_reminder:                  { label: '시작 리마인더',  description: 'Task 시작 시간 30분 전에 담당 학관에게 알림',                       category: 'system',    recipients: ['learning_manager'] },
  escalation_triggered:           { label: '에스컬레이션',   description: '운영매 미조치 시 설정된 시간 경과 후 총괄에게 자동 에스컬레이션',      category: 'system',    recipients: ['operator_manager'] },
  // ACT
  task_assigned:                  { label: 'Task 배정',      description: '새 Task가 배정되었을 때 담당 학관에게 알림',                       category: 'action',    recipients: ['learning_manager'] },
  task_reassigned:                { label: 'Task 재배정',    description: 'Task 담당자가 변경되었을 때 새 담당자에게 알림',                    category: 'action',    recipients: ['learning_manager'] },
  task_completed:                 { label: 'Task 완료',      description: '학관이 Task를 완료 처리했을 때 운영매에게 알림',                    category: 'action',    recipients: ['operator'] },
  task_review_requested:          { label: '확인요청',       description: '학관이 확인요청(pending_review)을 보냈을 때 reviewer에게 알림',     category: 'action',    recipients: ['operator'] },
  task_review_done:               { label: '확인완료',       description: 'reviewer가 승인하여 Task가 완료되었을 때 학관에게 알림',            category: 'action',    recipients: ['learning_manager'] },
  request_received:               { label: '업무요청 수신',  description: '업무 요청 또는 지시를 받았을 때 대상자에게 알림',                    category: 'action',    recipients: ['operator', 'operator_manager'] },
  message_new:                    { label: '새 메시지',      description: '소통 채널에 새 메시지가 도착했을 때 알림',                          category: 'action',    recipients: ['operator', 'operator_manager', 'learning_manager'] },
  notice_new:                     { label: '새 공지',        description: '트랙 공지가 등록되었을 때 학관에게 알림',                           category: 'action',    recipients: ['learning_manager'] },
  notice_replied:                 { label: '공지 답변',      description: '공지에 답장이 달렸을 때 알림',                                     category: 'action',    recipients: ['learning_manager'] },
  vacation_registered:            { label: '휴가 등록',      description: '학관 휴가 등록 시 운영매에게 알림 (업무 재배정 필요)',               category: 'action',    recipients: ['operator'] },
  schedule_changed:               { label: '일정 변경',      description: '트랙 운영일정이 추가/변경되었을 때 학관에게 알림',                   category: 'action',    recipients: ['learning_manager'] },
  // THR
  threshold_staff_completion:     { label: '학관 완료율',    description: '오후 2시 기준 학관 완료율이 기준치 미만일 때 운영매에게 알림',       category: 'threshold', recipients: ['operator'] },
  threshold_operator_completion:  { label: '운영 완료율',    description: '오후 2시 기준 운영매 완료율이 기준치 미만일 때 총괄에게 알림',       category: 'threshold', recipients: ['operator_manager'] },
  threshold_pending_issues:       { label: '이슈 누적',      description: '미처리 이슈가 설정 건수 이상 누적되었을 때 운영매에게 알림',        category: 'threshold', recipients: ['operator'] },
  threshold_unread_messages:      { label: '메시지 누적',    description: '안읽은 메시지가 설정 건수 이상 누적되었을 때 알림',                 category: 'threshold', recipients: ['operator_manager'] },
  threshold_overdue_tasks:        { label: '기한초과 누적',  description: 'overdue Task가 설정 건수 이상 누적되었을 때 운영매에게 알림',       category: 'threshold', recipients: ['operator'] },
}

export const DEFAULT_NOTIFICATION_CONFIG: Omit<NotificationConfig, 'trackId'> = {
  thresholds: {
    staffCompletionRate: 30,
    operatorCompletionRate: 30,
    pendingIssueCount: 3,
    unreadMessageCount: 5,
    overdueTaskCount: 3,
  },
  escalation: {
    staffToOperatorHours: 4,
    operatorToManagerHours: 8,
  },
  disabledOptionalAlerts: [],
  digestMode: 'realtime',
  quietHours: null,
}

export interface StaffConversation {
  id: string
  taskTitle: string
  time: string
  isCompleted: boolean
  newMessageCount: number
  preview: string
  messages: StaffMessage[]
}

export interface StaffMessage {
  id: string
  authorName: string
  content: string
  timestamp: string
  isSelf: boolean
}

export interface StaffIssue {
  id: string
  title: string
  content: string
  urgency: 'urgent' | 'normal'
  status: 'pending' | 'in_progress' | 'done'
  authorName: string
  createdAt: string
  assignee?: string
  replies: StaffMessage[]
}

export interface StaffTask {
  id: string
  title: string
  time: string
  isCompleted: boolean
  completedTime?: string
  conversationCount?: number
  deadlineMinutes?: number
}

// Operator Detail types
export interface OperatorTask {
  id: string
  title: string
  dueDate: string
  isCompleted: boolean
  completedAt?: string
}

export interface OperatorTrackStaff {
  id: string
  name: string
  taskCompletionRate: number
  taskCompleted: number
  taskTotal: number
  unreadMessages: number
  missedRound?: string
}

export interface OperatorTrackDetail {
  trackId: string
  trackName: string
  staff: OperatorTrackStaff[]
}

// -- Kanban Board types --

export type KanbanStatus = 'waiting' | 'in_progress' | 'done'
import type { RequesterRole } from './role-labels'
export type { RequesterRole } from './role-labels'

export interface KanbanCard {
  id: string
  trackName: string
  trackColor: string // hex color
  operatorName: string
  requesterRole: RequesterRole   // 누가 시킨 업무인지
  requesterName: string          // 요청자 이름
  title: string
  content: string
  timeAgo: string
  createdAt: string
  isUrgent: boolean
  status: KanbanStatus
  messages: StaffMessage[]
}

export interface ChatBubbleData {
  id: string
  isSelf: boolean
  authorName: string
  message: string
  time: string       // e.g. "09:30"
  taskTitle?: string
  taskContent?: string
  relatedKanbanId?: string
}

export interface ChatRoom {
  id: string
  operatorName: string
  operatorId: string
  tracks: string[]       // e.g. ['AI 7기','AI 8기']
  lastMessage: string
  lastTime: string
  unreadCount: number
  hasUrgent: boolean
  messages: ChatBubbleData[]
}

// 기수별 채팅을 위한 새 타입 (기수 = cohort = track period)
export interface CohortInfo {
  id: string
  name: string        // e.g. 'AI 7기'
  color: string       // hex
}

export interface PlannerTrackCard {
  id: string
  name: string
  period: string
  color: string
  completionRate: number
  issueSummary: {
    total: number
    waiting: number
    inProgress: number
    done: number
  }
  staffCount: number
  studentCount: number
  tutorCount: number
  operator?: {
    id: string
    name: string
    taskCompletionRate: number
    taskCompleted: number
    taskTotal: number
    issueResolutionRate: number
    issueResolved: number
    issueTotal: number
  }
  staff?: { id: string; name: string; taskCompletionRate: number }[]
}

// -- Admin Dashboard Home Data --

export const mockOperators: OperatorCard[] = [
  {
    id: 'op1',
    name: '이운영',
    displayName: '운영 A (이운영)',
    taskCompletionRate: 85,
    taskCompleted: 17,
    taskTotal: 20,
    tracks: [
      { trackName: 'AI 7기', staffAvgCompletion: 92, issueResolutionRate: 95 },
      { trackName: 'BE 5기', staffAvgCompletion: 88, issueResolutionRate: 90 },
    ],
  },
  {
    id: 'op2',
    name: '김운영',
    displayName: '운영 B (김운영)',
    taskCompletionRate: 90,
    taskCompleted: 18,
    taskTotal: 20,
    tracks: [
      { trackName: 'AI 8기', staffAvgCompletion: 85, issueResolutionRate: 88 },
    ],
  },
]

export const mockTracks: TrackCard[] = [
  {
    id: 'track1',
    name: 'AI 트랙 7기',
    staffAvgCompletion: 92,
    issueResolutionRate: 95,
    urgentIssues: 2,
    pendingRequests: 5,
    staffCount: 3,
    studentCount: 70,
    isOwned: true,
  },
  {
    id: 'track2',
    name: 'BE 트랙 5기',
    staffAvgCompletion: 88,
    issueResolutionRate: 90,
    urgentIssues: 0,
    pendingRequests: 3,
    staffCount: 2,
    studentCount: 50,
    isOwned: false,
  },
]

// -- Operator Detail Data --

export const mockOperatorTasks: Record<string, OperatorTask[]> = {
  op1: [
    { id: 'ot1', title: 'AI 7기 중간 평가 기준 수립', dueDate: '2/10', isCompleted: true, completedAt: '2/9 17:00' },
    { id: 'ot2', title: '멘토 일정 조율', dueDate: '2/12', isCompleted: false },
    { id: 'ot3', title: '학관 주간 미팅 준비', dueDate: '2/10', isCompleted: true, completedAt: '2/10 09:00' },
    { id: 'ot4', title: 'BE 5기 챕터2 커리큘럼 검토', dueDate: '2/11', isCompleted: false },
    { id: 'ot5', title: 'AI 7기 중간 평가 준비', dueDate: '2/10', isCompleted: false },
    { id: 'ot6', title: '수강생 출결 리포트 작성', dueDate: '2/9', isCompleted: true, completedAt: '2/9 16:30' },
    { id: 'ot7', title: '교육장 시설 점검 보고', dueDate: '2/8', isCompleted: true, completedAt: '2/8 18:00' },
    { id: 'ot8', title: '주간 운영 회의 참석', dueDate: '2/10', isCompleted: true, completedAt: '2/10 11:00' },
    { id: 'ot9', title: '학관 평가 기준 초안 작성', dueDate: '2/7', isCompleted: true, completedAt: '2/7 15:00' },
    { id: 'ot10', title: '수강생 만족도 설문 취합', dueDate: '2/6', isCompleted: true, completedAt: '2/6 17:00' },
    { id: 'ot11', title: '팀 재편성 계획서 작성', dueDate: '2/6', isCompleted: true, completedAt: '2/6 14:00' },
    { id: 'ot12', title: 'AI 7기 OT 자료 준비', dueDate: '2/5', isCompleted: true, completedAt: '2/5 16:00' },
    { id: 'ot13', title: '긴급 이슈 대응 가이드 작성', dueDate: '2/5', isCompleted: true, completedAt: '2/5 11:00' },
    { id: 'ot14', title: 'BE 5기 멘토링 매칭', dueDate: '2/4', isCompleted: true, completedAt: '2/4 15:00' },
    { id: 'ot15', title: '교육 콘텐츠 업데이트', dueDate: '2/4', isCompleted: true, completedAt: '2/4 17:00' },
    { id: 'ot16', title: '학관 온보딩 가이드 업데이트', dueDate: '2/3', isCompleted: true, completedAt: '2/3 16:00' },
    { id: 'ot17', title: '이전 기수 데이터 정리', dueDate: '2/3', isCompleted: true, completedAt: '2/3 14:00' },
    { id: 'ot18', title: '운영 매뉴얼 검토', dueDate: '2/2', isCompleted: true, completedAt: '2/2 17:00' },
    { id: 'ot19', title: '예산 정산 보고', dueDate: '2/2', isCompleted: true, completedAt: '2/2 15:00' },
    { id: 'ot20', title: '월간 운영 보고서 작성', dueDate: '2/1', isCompleted: true, completedAt: '2/1 18:00' },
  ],
  op2: [
    { id: 'ot21', title: 'AI 8기 OT 준비', dueDate: '2/15', isCompleted: false },
    { id: 'ot22', title: '학관 면접 진행', dueDate: '2/12', isCompleted: true, completedAt: '2/12 15:00' },
    { id: 'ot23', title: 'AI 8기 커리큘럼 확정', dueDate: '2/10', isCompleted: true, completedAt: '2/10 14:00' },
  ],
}

export const mockOperatorTrackDetails: Record<string, OperatorTrackDetail[]> = {
  op1: [
    {
      trackId: 'track1',
      trackName: 'AI 트랙 7기',
      staff: [
        { id: 'staff1', name: '김학관', taskCompletionRate: 92, taskCompleted: 11, taskTotal: 12, unreadMessages: 2 },
        { id: 'staff2', name: '이학관', taskCompletionRate: 88, taskCompleted: 8, taskTotal: 10, unreadMessages: 0, missedRound: '오전 팀순회' },
        { id: 'staff3', name: '박학관', taskCompletionRate: 65, taskCompleted: 7, taskTotal: 10, unreadMessages: 3 },
      ],
    },
    {
      trackId: 'track2',
      trackName: 'BE 트랙 5기',
      staff: [
        { id: 'staff4', name: '정학관', taskCompletionRate: 90, taskCompleted: 9, taskTotal: 10, unreadMessages: 1 },
        { id: 'staff5', name: '한학관', taskCompletionRate: 85, taskCompleted: 8, taskTotal: 10, unreadMessages: 0 },
      ],
    },
  ],
  op2: [
    {
      trackId: 'track3',
      trackName: 'AI 트랙 8기',
      staff: [
        { id: 'staff6', name: '최학관', taskCompletionRate: 87, taskCompleted: 7, taskTotal: 8, unreadMessages: 1 },
        { id: 'staff7', name: '강학관', taskCompletionRate: 82, taskCompleted: 9, taskTotal: 11, unreadMessages: 0 },
      ],
    },
  ],
}

// -- Track Detail Dashboard Data --

const DEFAULT_WORK_SCHEDULE: WorkScheduleEntry[] = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
]

export const mockStaffCards: StaffCard[] = [
  {
    id: 'staff1',
    name: '김학관',
    taskCompletionRate: 92,
    taskCompleted: 11,
    taskTotal: 12,
    unreadMessages: 2,
    isWarning: false,
    vacationHistory: [
      { id: 'v1', start: '2026-01-20', end: '2026-01-21', reason: '개인사유' },
    ],
    workSchedule: [...DEFAULT_WORK_SCHEDULE],
    memo: '성실하고 책임감 있음. 1팀 리더 역할 수행 중.',
  },
  {
    id: 'staff2',
    name: '이학관',
    taskCompletionRate: 88,
    taskCompleted: 8,
    taskTotal: 10,
    unreadMessages: 0,
    missedRound: '오전 팀순회',
    isWarning: false,
    vacationHistory: [],
    workSchedule: [...DEFAULT_WORK_SCHEDULE],
    memo: '',
  },
  {
    id: 'staff3',
    name: '박학관',
    taskCompletionRate: 65,
    taskCompleted: 7,
    taskTotal: 10,
    unreadMessages: 3,
    isWarning: true,
    vacation: { start: '2026-02-16', end: '2026-02-17' },
    vacationHistory: [
      { id: 'v2', start: '2026-02-16', end: '2026-02-17', reason: '개인사유' },
      { id: 'v3', start: '2026-02-25', end: '2026-02-26', reason: '가족행사' },
    ],
    workSchedule: [...DEFAULT_WORK_SCHEDULE],
    memo: '최근 업무 완료율 하락. 면담 필요.',
  },
]

// -- Staff Detail Page Data --

export const mockStaffConversations: StaffConversation[] = [
  {
    id: 'conv1',
    taskTitle: '오전 팀순회',
    time: '10:00',
    isCompleted: true,
    newMessageCount: 2,
    preview: '1팀 김철수 학생 추가 상담 필요',
    messages: [
      {
        id: 'cm1',
        authorName: '김학관',
        content: '1팀 김철수 학생이 진로 고민 중입니다. 추가 상담이 필요해 보입니다.',
        timestamp: '10:30',
        isSelf: false,
      },
      {
        id: 'cm2',
        authorName: '이운영',
        content: '멘토와 연결해드릴게요. 내일 오전에 면담 일정 잡겠습니다.',
        timestamp: '10:45',
        isSelf: true,
      },
    ],
  },
  {
    id: 'conv2',
    taskTitle: '오후 팀순회',
    time: '14:00',
    isCompleted: false,
    newMessageCount: 1,
    preview: '진도 체크 완료했습니다',
    messages: [
      {
        id: 'cm3',
        authorName: '김학관',
        content: '6팀~10팀 진도 체크 완료했습니다. 특이사항 없습니다.',
        timestamp: '14:30',
        isSelf: false,
      },
    ],
  },
]

export const mockStaffIssues: StaffIssue[] = [
  {
    id: 'si1',
    title: '교육장 에어컨 고장',
    content: '2번 교실 에어컨이 작동하지 않습니다.\n오늘 오후 수업 진행이 어려울 것 같습니다.',
    urgency: 'urgent',
    status: 'pending',
    authorName: '김학관',
    createdAt: '2026-02-10 08:30',
    replies: [],
  },
  {
    id: 'si2',
    title: '교육 자료 요청',
    content: '다음 주 특강에 필요한 교육 자료를 미리 받을 수 있을까요?',
    urgency: 'normal',
    status: 'pending',
    authorName: '이학관',
    createdAt: '2026-02-10 05:00',
    replies: [],
  },
]

export const mockStaffTasks: StaffTask[] = [
  {
    id: 'st1',
    title: '출석 체크',
    time: '09:00',
    isCompleted: true,
    completedTime: '09:25',
  },
  {
    id: 'st2',
    title: '오전 팀순회',
    time: '10:00',
    isCompleted: true,
    completedTime: '10:45',
    conversationCount: 2,
  },
  {
    id: 'st3',
    title: '오후 팀순회',
    time: '14:00',
    isCompleted: false,
    deadlineMinutes: 60,
  },
]

// -- Kanban Board Data --

export const mockKanbanCards: KanbanCard[] = [
  // 운영 요청 카드들
  {
    id: 'kb1',
    trackName: 'AI 7기',
    trackColor: '#3B82F6',
    operatorName: '이운영',
    requesterRole: '운영',
    requesterName: '이운영',
    title: '중간 평가 준비 요청',
    content: '중간 평가 일정을 확인해주세요. 다음 주 목요일로 진행 예정입니다.',
    timeAgo: '2시간 전',
    createdAt: '2026-02-10 08:30',
    isUrgent: false,
    status: 'waiting',
    messages: [
      { id: 'kbm1', authorName: '이운영', content: '확인 부탁드립니다.', timestamp: '08:30', isSelf: false },
      { id: 'kbm2', authorName: '나', content: '확인했습니다.', timestamp: '09:00', isSelf: true },
    ],
  },
  {
    id: 'kb2',
    trackName: 'BE 5기',
    trackColor: '#10B981',
    operatorName: '김운영',
    requesterRole: '운영',
    requesterName: '김운영',
    title: '긴급이슈 확인요청',
    content: '수강생 3명이 동시에 퇴소 의사를 밝혔습니다. 긴급 면담이 필요합니다.',
    timeAgo: '5분 전',
    createdAt: '2026-02-11 09:55',
    isUrgent: true,
    status: 'waiting',
    messages: [
      { id: 'kbm3', authorName: '김운영', content: '긴급하게 확인 부탁드립니다.', timestamp: '09:55', isSelf: false },
    ],
  },
  {
    id: 'kb3',
    trackName: 'AI 8기',
    trackColor: '#8B5CF6',
    operatorName: '이운영',
    requesterRole: '운영',
    requesterName: '이운영',
    title: '자료 업데이트',
    content: 'AI 8기 OT 자료를 최신 버전으로 업데이트해야 합니다.',
    timeAgo: '1시간 전',
    createdAt: '2026-02-11 09:00',
    isUrgent: false,
    status: 'waiting',
    messages: [],
  },
  {
    id: 'kb4',
    trackName: 'BE 5기',
    trackColor: '#10B981',
    operatorName: '김운영',
    requesterRole: '운영',
    requesterName: '김운영',
    title: '자료 수정 진행중',
    content: 'BE 5기 챕터3 실습 자료에 오류가 있어 수정 중입니다.',
    timeAgo: '1시간 전',
    createdAt: '2026-02-11 09:00',
    isUrgent: false,
    status: 'in_progress',
    messages: [
      { id: 'kbm4', authorName: '김운영', content: '자료 오류 수정 중입니다.', timestamp: '09:00', isSelf: false },
    ],
  },
  {
    id: 'kb5',
    trackName: 'AI 8기',
    trackColor: '#8B5CF6',
    operatorName: '이운영',
    requesterRole: '운영',
    requesterName: '이운영',
    title: '멘토 일정 조율 완료',
    content: 'AI 8기 멘토링 일정을 모두 확정했습니다.',
    timeAgo: '어제',
    createdAt: '2026-02-10 15:00',
    isUrgent: false,
    status: 'done',
    messages: [
      { id: 'kbm5', authorName: '이운영', content: '일정 확정했습니다.', timestamp: '15:00', isSelf: false },
      { id: 'kbm6', authorName: '나', content: '수고하셨습니다.', timestamp: '15:30', isSelf: true },
    ],
  },
  {
    id: 'kb6',
    trackName: 'AI 7기',
    trackColor: '#3B82F6',
    operatorName: '이운영',
    requesterRole: '운영',
    requesterName: '이운영',
    title: '교육 자료 준비 완료',
    content: 'AI 7기 다음 주 강의 교육 자료 준비를 완료했습니다.',
    timeAgo: '어제',
    createdAt: '2026-02-10 17:00',
    isUrgent: false,
    status: 'done',
    messages: [],
  },
  // 총괄 → 운영 업무 지시 카드들
  {
    id: 'kb7',
    trackName: 'AI 7기',
    trackColor: '#3B82F6',
    operatorName: '이운영',
    requesterRole: '총괄',
    requesterName: '이운기',
    title: '수강생 출결 현황 보고서 작성',
    content: '이번 주 AI 7기 수강생 출결 현황을 정리해서 금요일까지 보고서를 제출해주세요.',
    timeAgo: '30분 전',
    createdAt: '2026-02-11 09:30',
    isUrgent: false,
    status: 'waiting',
    messages: [
      { id: 'kbm7', authorName: '이운기 (총괄)', content: '금요일까지 보고서 부탁드립니다.', timestamp: '09:30', isSelf: true },
    ],
  },
  {
    id: 'kb8',
    trackName: 'BE 5기',
    trackColor: '#10B981',
    operatorName: '김운영',
    requesterRole: '총괄',
    requesterName: '이운기',
    title: '멘토링 세션 피드백 취합',
    content: 'BE 5기 멘토링 세션 피드백을 취합하여 다음 주 월요일 회의 자료로 준비해주세요.',
    timeAgo: '1시간 전',
    createdAt: '2026-02-11 09:00',
    isUrgent: false,
    status: 'in_progress',
    messages: [
      { id: 'kbm8', authorName: '이운기 (총괄)', content: '다음 주 월요일 회의에 필요합니다.', timestamp: '09:00', isSelf: true },
      { id: 'kbm9', authorName: '김운영', content: '취합 중입니다. 목요일까지 완료하겠습니다.', timestamp: '09:20', isSelf: false },
    ],
  },
  {
    id: 'kb9',
    trackName: 'AI 8기',
    trackColor: '#8B5CF6',
    operatorName: '이운영',
    requesterRole: '총괄',
    requesterName: '이운기',
    title: '긴급: OT 일정 확정 및 공지',
    content: 'AI 8기 OT를 3월 첫째 주로 확정하고 수강생들에게 공지해주세요. 장소 예약도 필요합니다.',
    timeAgo: '15분 전',
    createdAt: '2026-02-11 09:45',
    isUrgent: true,
    status: 'waiting',
    messages: [
      { id: 'kbm10', authorName: '이운기 (총괄)', content: '빠르게 처리 부탁드립니다. 장소 예약이 급해요.', timestamp: '09:45', isSelf: true },
    ],
  },
  {
    id: 'kb10',
    trackName: 'AI 7기',
    trackColor: '#3B82F6',
    operatorName: '이운영',
    requesterRole: '총괄',
    requesterName: '이운기',
    title: '팀 재편성 계획 수립',
    content: '중간 평가 이후 팀 재편성 계획을 수립해주세요. 성적 및 팀워크 기반으로 진행.',
    timeAgo: '어제',
    createdAt: '2026-02-10 14:00',
    isUrgent: false,
    status: 'done',
    messages: [
      { id: 'kbm11', authorName: '이운기 (총괄)', content: '중간 평가 후 진행해주세요.', timestamp: '14:00', isSelf: true },
      { id: 'kbm12', authorName: '이운영', content: '계획서 작성 완료했습니다. 확인 부탁드립니다.', timestamp: '17:00', isSelf: false },
      { id: 'kbm13', authorName: '이운기 (총괄)', content: '확인했습니다. 수고하셨습니다.', timestamp: '17:30', isSelf: true },
    ],
  },
]

// -- Chat Rooms (per-operator) --

export const mockChatRooms: ChatRoom[] = [
  {
    id: 'room-op1',
    operatorName: '이운영',
    operatorId: 'op1',
    tracks: ['AI 7기', 'AI 8기'],
    lastMessage: '확인 부탁드립니다.',
    lastTime: '10:05',
    unreadCount: 3,
    hasUrgent: false,
    messages: [
      { id: 'rm1-1', isSelf: false, authorName: '이운영', message: 'AI 8기 커리큘럼 초안 작성했습니다.', time: '08:20' },
      { id: 'rm1-2', isSelf: true, authorName: '나', message: '확인했습니다. 2장 내용 괜찮네요.', time: '08:35' },
      { id: 'rm1-3', isSelf: false, authorName: '이운영', message: '오전 팀순회 보고 올립니다.', time: '09:00' },
      { id: 'rm1-4', isSelf: false, authorName: '이운영', message: 'OT 자료 업데이트 관련 확인 부탁드립니다.', time: '09:15', taskTitle: '자료 업데이트', taskContent: 'AI 8기 OT 자료를 최신 버전으로 업데이트해야 합니다.', relatedKanbanId: 'kb3' },
      { id: 'rm1-5', isSelf: true, authorName: '나', message: '네, 이번 주 중으로 확인할게요.', time: '09:30' },
      { id: 'rm1-6', isSelf: false, authorName: '이운영', message: '중간 평가 일정 확인 부탁드립니다. 다음 주 목요일로 진행 예정입니다.', time: '10:00', taskTitle: '중간 평가 준비', taskContent: '중간 평가 일정을 확인해주세요.', relatedKanbanId: 'kb1' },
      { id: 'rm1-7', isSelf: false, authorName: '이운영', message: '확인 부탁드립니다.', time: '10:05' },
    ],
  },
  {
    id: 'room-op2',
    operatorName: '김운영',
    operatorId: 'op2',
    tracks: ['BE 5기'],
    lastMessage: '긴급 요청사항이 있습니다',
    lastTime: '09:55',
    unreadCount: 1,
    hasUrgent: true,
    messages: [
      { id: 'rm2-1', isSelf: false, authorName: '김운영', message: '수강생 출결 현황 공유합니다.', time: '07:30' },
      { id: 'rm2-2', isSelf: true, authorName: '나', message: '감사합니다. 결석 비율이 좀 높네요.', time: '07:45' },
      { id: 'rm2-3', isSelf: false, authorName: '김운영', message: '멘토링 피드백 정리 완료했습니다.', time: '08:00', taskTitle: '멘토링 피드백', taskContent: '이번 주 멘토링 세션에 대한 피드백입니다.' },
      { id: 'rm2-4', isSelf: true, authorName: '나', message: '좋습니다. 공유 감사해요.', time: '08:10' },
      { id: 'rm2-5', isSelf: false, authorName: '김운영', message: '긴급 요청사항이 있습니다', time: '09:55', relatedKanbanId: 'kb2' },
    ],
  },
]

// -- Cohort Info for Chat (기수별 채팅용) --

export const mockCohorts: CohortInfo[] = [
  { id: 'cohort-ai7', name: 'AI 7기', color: '#3B82F6' },
  { id: 'cohort-be5', name: 'BE 5기', color: '#10B981' },
  { id: 'cohort-ai8', name: 'AI 8기', color: '#8B5CF6' },
]

// -- Planner Track Cards --

export const mockPlannerTracks: PlannerTrackCard[] = [
  {
    id: 'track1',
    name: 'AI 트랙 7기',
    period: '2026.02.01 ~ 2026.07.31',
    color: '#3B82F6',
    completionRate: 92,
    issueSummary: { total: 5, waiting: 2, inProgress: 1, done: 2 },
    staffCount: 3,
    studentCount: 70,
    tutorCount: 2,
    operator: {
      id: 'op1',
      name: '이운영',
      taskCompletionRate: 85,
      taskCompleted: 17,
      taskTotal: 20,
      issueResolutionRate: 95,
      issueResolved: 19,
      issueTotal: 20,
    },
    staff: [
      { id: 'staff1', name: '김학관', taskCompletionRate: 92 },
      { id: 'staff2', name: '이학관', taskCompletionRate: 88 },
      { id: 'staff3', name: '박학관', taskCompletionRate: 75 },
    ],
  },
  {
    id: 'track2',
    name: 'BE 트랙 5기',
    period: '2026.01.01 ~ 2026.06.30',
    color: '#10B981',
    completionRate: 88,
    issueSummary: { total: 3, waiting: 1, inProgress: 1, done: 1 },
    staffCount: 2,
    studentCount: 50,
    tutorCount: 1,
    operator: {
      id: 'op2',
      name: '김운영',
      taskCompletionRate: 90,
      taskCompleted: 18,
      taskTotal: 20,
      issueResolutionRate: 88,
      issueResolved: 15,
      issueTotal: 17,
    },
    staff: [
      { id: 'staff4', name: '최학관', taskCompletionRate: 95 },
      { id: 'staff5', name: '정학관', taskCompletionRate: 82 },
    ],
  },
  {
    id: 'track3',
    name: 'AI 트랙 8기',
    period: '2026.03.01 ~ 2026.08.31',
    color: '#8B5CF6',
    completionRate: 85,
    issueSummary: { total: 2, waiting: 1, inProgress: 0, done: 1 },
    staffCount: 2,
    studentCount: 40,
    tutorCount: 1,
    staff: [
      { id: 'staff6', name: '한학관', taskCompletionRate: 90 },
      { id: 'staff7', name: '윤학관', taskCompletionRate: 78 },
    ],
  },
]

// -- Track Tasks (트랙별 전체 Task 목록) --

export const mockTrackTasks: TrackTask[] = [
  // === track1 (AI 트랙 7기) - staff1 김학관 ===
  { id: 'tt1', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:25', messages: [] },
  { id: 'tt1-b', title: '조회 및 공지 전달', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '09:30', dueTime: '10:00', completedAt: '09:50', messages: [] },
  { id: 'tt2', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:45', messages: [
    { id: 'ttm1', authorName: '김학관', content: '1팀 김철수 학생 추가 상담 필요합니다.', timestamp: '10:30', isSelf: false },
    { id: 'ttm2', authorName: '이운영', content: '확인했습니다. 멘토 연결해드릴게요.', timestamp: '10:45', isSelf: true },
  ]},
  { id: 'tt2-b', title: '튜터 미팅 참석', type: 'manual', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'overdue', priority: 'urgent', scheduledDate: '2026-02-11', scheduledTime: '10:30', dueTime: '11:00', description: '튜터 주간 업무 보고 미팅 – 3층 회의실', messages: [
    { id: 'ttm-m1', authorName: '이운영', content: '튜터 미팅 참석 부탁드려요. 이번주 이슈 공유해주세요.', timestamp: '09:00', isSelf: true },
  ]},
  { id: 'tt5', title: '수강생 출결 리포트', type: 'milestone', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending_review', priority: 'important', scheduledDate: '2026-02-11', scheduledTime: '11:00', dueTime: '12:00', reviewerId: 'op1', reviewerName: '이운영', messages: [
    { id: 'ttm-r1', authorName: '김학관', content: '출결 리포트 작성 완료했습니다. 확인 부탁드립니다.', timestamp: '11:40', isSelf: false },
  ]},
  { id: 'tt5-b', title: '수강생 개별 면담 (이영희)', type: 'manual', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'in_progress', scheduledDate: '2026-02-11', scheduledTime: '11:30', dueTime: '12:00', description: '이영희 학생 – 최근 출석률 하락, 사유 확인 및 독려', messages: [
    { id: 'ttm-f1', authorName: '이운영', content: '이영희 학생 최근 3일 연속 지각입니다. 면담 부탁드려요.', timestamp: '08:30', isSelf: true },
    { id: 'ttm-f2', authorName: '김학관', content: '네, 11시 반에 면담 잡았습니다.', timestamp: '09:10', isSelf: false },
  ]},
  { id: 'tt5-c', title: '점심시간 교실 관리', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '12:00', dueTime: '13:00', messages: [] },
  { id: 'tt3-a', title: '수강생 만족도 설문 배포', type: 'milestone', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '13:00', dueTime: '13:30', description: '챕터3 종료 시점 만족도 조사 배포. 구글폼 링크 단톡방 공유.', messages: [] },
  { id: 'tt3', title: '오후 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'in_progress', scheduledDate: '2026-02-11', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt3-b', title: '퇴소자 행정 처리 (박지민)', type: 'manual', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '15:00', dueTime: '16:00', description: '박지민 퇴소 서류 작성 및 NCS 시스템 반영', messages: [
    { id: 'ttm-d1', authorName: '이운영', content: '박지민 학생 퇴소 확정입니다. 행정 처리 오늘 중으로 부탁해요.', timestamp: '11:00', isSelf: true },
  ]},
  { id: 'tt3-c', title: '튜터 일일 리포트 취합', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '16:00', dueTime: '17:00', messages: [] },
  { id: 'tt4', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '17:00', dueTime: '18:00', messages: [] },
  { id: 'tt4-b', title: '익일 수업 자료 사전 확인', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '17:30', dueTime: '18:00', description: '내일 챕터4 시작 – 강사에게 자료 수령 여부 확인', messages: [] },

  // === track1 - staff1 김학관 (시간 미지정 task) ===
  // 운영매 요청 task
  { id: 'tt-ut1', title: '수강생 포트폴리오 양식 배포', type: 'manual', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-11', description: '운영매니저 요청 – 포트폴리오 작성 가이드 단톡방에 공유', reviewerId: 'op1', reviewerName: '이운영', messages: [
    { id: 'ttm-ut1', authorName: '이운영', content: '포트폴리오 양식 오늘 중으로 배포 부탁드려요.', timestamp: '08:00', isSelf: true },
  ]},
  { id: 'tt-ut2', title: '교실 비품 재고 확인', type: 'manual', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'in_progress', scheduledDate: '2026-02-11', description: '화이트보드 마커, A4 용지 등 소모품 재고 파악 후 보고', messages: [
    { id: 'ttm-ut2', authorName: '이운영', content: '비품 재고 부족한 거 있으면 오늘 중 정리해주세요.', timestamp: '09:15', isSelf: true },
  ]},
  { id: 'tt-ut3', title: '결석 사유서 미제출자 독촉', type: 'manual', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-11', description: '2/7~2/10 결석자 중 사유서 미제출 3명에게 연락', messages: []},
  // 시스템 자동 배정 task (시간 없음)
  { id: 'tt-ut4', title: '주간 출결 현황 정리', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-11', endDate: '2026-02-11', description: '금주 출결 데이터 취합 및 이상 수강생 리스트 작성', messages: [] },
  { id: 'tt-ut5', title: 'NCS 자기평가서 입력 안내', type: 'milestone', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-11', completedAt: '10:20', description: '챕터3 종료에 따른 NCS 자기평가서 입력 안내 공지', messages: [] },
  { id: 'tt-ut6', title: '수강생 HRD-Net 출석 동기화 확인', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'in_progress', scheduledDate: '2026-02-11', description: 'HRD-Net 시스템과 실제 출석 데이터 비교 확인', messages: [] },

  // === track1 - staff1 김학관 (업무 요청 request_sent) ===
  { id: 'tt-req1', title: '교실 프로젝터 수리 요청', type: 'manual', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending_review', scheduledDate: '2026-02-11', reviewerId: 'op1', reviewerName: '이운영', description: '__request_sent__\n2번 교실 프로젝터가 수업 중 꺼짐 현상이 반복됩니다. 확인 부탁드립니다.', messages: [
    { id: 'reqm1', authorName: '김학관', content: '오전 수업 중 2회 발생했습니다.', timestamp: '09:40', isSelf: false },
  ]},
  { id: 'tt-req2', title: '수강생 김민수 휴가 승인 요청', type: 'manual', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending_review', scheduledDate: '2026-02-11', reviewerId: 'op1', reviewerName: '이운영', description: '__request_sent__\n김민수 학생이 2/13~2/14 개인 사유로 휴가를 신청했습니다. 승인 부탁드립니다.', messages: [] },

  // === track1 (AI 트랙 7기) - staff2 이학관 ===
  { id: 'tt6', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:20', messages: [] },
  { id: 'tt7', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'overdue', scheduledDate: '2026-02-11', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt8', title: '오후 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt9', title: '수강생 면담 기록', type: 'manual', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '13:00', dueTime: '14:00', completedAt: '13:50', messages: [] },
  { id: 'tt10', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '17:00', dueTime: '18:00', messages: [] },
  // 이학관: 5 tasks, 2 completed, 1 overdue, 2 pending

  // === track1 (AI 트랙 7기) - staff3 박학관 ===
  { id: 'tt11', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:28', messages: [] },
  { id: 'tt12', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'overdue', scheduledDate: '2026-02-11', scheduledTime: '10:00', dueTime: '11:00', messages: [
    { id: 'ttm3', authorName: '이운영', content: '오전 팀순회 아직 안 하셨나요?', timestamp: '11:15', isSelf: true },
    { id: 'ttm4', authorName: '박학관', content: '죄송합니다. 학생 이슈 대응하느라 늦었습니다.', timestamp: '11:20', isSelf: false },
  ]},
  { id: 'tt13', title: '오후 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'overdue', scheduledDate: '2026-02-11', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt14', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '17:00', dueTime: '18:00', messages: [] },
  { id: 'tt15', title: '교육 자료 정리', type: 'manual', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '15:00', dueTime: '16:30', messages: [] },
  // 박학관: 5 tasks, 1 completed, 2 overdue, 2 pending

  // === track1 (AI 트랙 7기) - 기간 일정 (2026-02-11 시작, endDate 다른 날) ===
  { id: 'tt-range1', title: '프로젝트 발표 준비', type: 'milestone', completionType: 'evidence', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'in_progress', priority: 'important', scheduledDate: '2026-02-11', endDate: '2026-02-13', scheduledTime: '09:00', dueTime: '18:00', messages: [] },
  { id: 'tt-range2', title: '팀 프로젝트 코드리뷰', type: 'milestone', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-11', endDate: '2026-02-12', scheduledTime: '14:00', dueTime: '17:00', messages: [] },
  { id: 'tt-range3', title: '수강생 포트폴리오 점검', type: 'milestone', completionType: 'evidence', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'pending', scheduledDate: '2026-02-11', endDate: '2026-02-14', scheduledTime: '10:00', dueTime: '18:00', description: '전체 수강생 포트폴리오 진행 상황 점검 및 피드백', messages: [
    { id: 'ttm-range3', authorName: '이운영', content: '14일까지 전원 1차 초안 제출 확인 부탁드립니다.', timestamp: '08:30', isSelf: true },
  ]},

  // === track1 (AI 트랙 7기) - 미배정 tasks ===
  { id: 'tt16', title: '특별 멘토링 세션 준비', type: 'manual', trackId: 'track1', status: 'unassigned', priority: 'urgent', scheduledDate: '2026-02-11', scheduledTime: '16:00', dueTime: '17:00', unassignedReason: '담당자 미지정', messages: [] },
  { id: 'tt17', title: '교육장 점검', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-11', scheduledTime: '08:30', dueTime: '09:00', unassignedReason: '정학관 휴가 (대체인력 필요)', messages: [] },
  { id: 'tt18', title: '중간평가 설문 배포', type: 'milestone', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-12', scheduledTime: '10:00', dueTime: '12:00', unassignedReason: '담당자 미지정', messages: [] },

  // === track2 (BE 트랙 5기) - staff4 정학관 ===
  { id: 'tt19', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:15', messages: [] },
  { id: 'tt20', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:50', messages: [] },
  { id: 'tt21', title: '오후 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'in_progress', scheduledDate: '2026-02-11', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt22', title: '일일 보고서 작성', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '17:00', dueTime: '18:00', messages: [] },

  // === track2 (BE 트랙 5기) - staff5 한학관 ===
  { id: 'tt23', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:22', messages: [] },
  { id: 'tt24', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:55', messages: [] },
  { id: 'tt25', title: '오후 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt26', title: '수강생 진도 체크', type: 'manual', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'overdue', scheduledDate: '2026-02-11', scheduledTime: '11:00', dueTime: '12:00', messages: [] },
  { id: 'tt27', title: '일일 보고서 작성', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '17:00', dueTime: '18:00', messages: [] },

  // === track2 (BE 트랙 5기) - 미배정 ===
  { id: 'tt28', title: '멘토링 세션 보조', type: 'manual', trackId: 'track2', status: 'unassigned', scheduledDate: '2026-02-11', scheduledTime: '15:00', dueTime: '16:00', unassignedReason: '담당자 미지정', messages: [] },

  // === track3 (AI 트랙 8기) - staff6 최학관 ===
  { id: 'tt29', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:18', messages: [] },
  { id: 'tt30', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:40', messages: [] },
  { id: 'tt31', title: '오후 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'in_progress', scheduledDate: '2026-02-11', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt32', title: '일일 보고서 작성', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '17:00', dueTime: '18:00', messages: [] },

  // === track3 (AI 트랙 8기) - staff7 강학관 ===
  { id: 'tt33', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:25', messages: [] },
  { id: 'tt34', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:48', messages: [] },
  { id: 'tt35', title: '오후 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt36', title: 'OT 자료 사전 검토', type: 'milestone', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'overdue', scheduledDate: '2026-02-11', scheduledTime: '11:00', dueTime: '13:00', messages: [] },
  { id: 'tt37', title: '일일 보고서 작성', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '17:00', dueTime: '18:00', messages: [] },

  // === 확장: 과거 (2026-02-09, 월) - track1 전원 완료 ===
  { id: 'tt38', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:18', messages: [] },
  { id: 'tt39', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:42', messages: [] },
  { id: 'tt40', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '17:00', dueTime: '18:00', completedAt: '17:30', messages: [] },
  { id: 'tt41', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:22', messages: [] },
  { id: 'tt42', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:55', messages: [] },
  { id: 'tt43', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '17:00', dueTime: '18:00', completedAt: '17:45', messages: [] },
  { id: 'tt44', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:25', messages: [] },
  { id: 'tt45', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:48', messages: [] },
  { id: 'tt46', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '17:00', dueTime: '18:00', completedAt: '17:20', messages: [] },

  // === 확장: 과거 (2026-02-10, 화) - track1 일부 미완료 ===
  { id: 'tt47', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:20', messages: [] },
  { id: 'tt48', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:50', messages: [] },
  { id: 'tt49', title: '오후 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '14:00', dueTime: '15:00', completedAt: '14:45', messages: [] },
  { id: 'tt50', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '17:00', dueTime: '18:00', completedAt: '17:35', messages: [] },
  { id: 'tt51', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:28', messages: [] },
  { id: 'tt52', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:58', messages: [] },
  { id: 'tt53', title: '오후 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'overdue', scheduledDate: '2026-02-10', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt54', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '17:00', dueTime: '18:00', completedAt: '17:50', messages: [] },
  { id: 'tt55', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:30', messages: [] },
  { id: 'tt56', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'overdue', scheduledDate: '2026-02-10', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt57', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '17:00', dueTime: '18:00', completedAt: '17:55', messages: [] },

  // === 확장: 미래 (2026-02-12, 목) - track1 대기 + 미배정 ===
  { id: 'tt58', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-12', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt59', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-12', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt60', title: '오후 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-12', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt61', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-12', scheduledTime: '17:00', dueTime: '18:00', messages: [] },
  { id: 'tt62', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-12', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt63', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-12', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt64', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'pending', scheduledDate: '2026-02-12', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt65', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'pending', scheduledDate: '2026-02-12', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt66', title: '중간평가 자료 준비', type: 'milestone', completionType: 'evidence', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-12', endDate: '2026-02-14', scheduledTime: '13:00', dueTime: '17:00', unassignedReason: '담당자 미지정', messages: [] },
  { id: 'tt67', title: '교육장 환경 점검', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-12', scheduledTime: '08:30', dueTime: '09:00', unassignedReason: '담당자 미지정', messages: [] },

  // === 확장: 미래 (2026-02-13, 금) - track1 ===
  { id: 'tt68', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-13', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt69', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-13', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt70', title: '주간 보고서 작성', type: 'milestone', completionType: 'evidence', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-13', scheduledTime: '15:00', dueTime: '17:00', messages: [] },
  { id: 'tt71', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-13', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt72', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'pending', scheduledDate: '2026-02-13', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt73', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'pending', scheduledDate: '2026-02-13', scheduledTime: '10:00', dueTime: '11:00', messages: [] },

  // === 확장: 다음주 (2026-02-16, 월) - track1, 박학관 휴가로 미배정 ===
  { id: 'tt74', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-16', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt75', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-16', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt76', title: '오후 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-16', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt77', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-16', scheduledTime: '17:00', dueTime: '18:00', messages: [] },
  { id: 'tt78', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-16', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt79', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-16', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt80', title: '오후 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-16', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt81', title: '출석 체크', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-16', scheduledTime: '09:00', dueTime: '09:30', unassignedReason: '박학관 휴가 (2/16~17)', messages: [] },
  { id: 'tt82', title: '오전 팀순회', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-16', scheduledTime: '10:00', dueTime: '11:00', unassignedReason: '박학관 휴가 (2/16~17)', messages: [] },
  { id: 'tt83', title: '오후 팀순회', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-16', scheduledTime: '14:00', dueTime: '15:00', unassignedReason: '박학관 휴가 (2/16~17)', messages: [] },
  { id: 'tt84', title: '중간평가 실시', type: 'milestone', completionType: 'evidence', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-16', endDate: '2026-02-17', scheduledTime: '10:00', dueTime: '17:00', unassignedReason: '담당자 미지정', messages: [] },

  // === 확장: 다음주 (2026-02-17, 화) - track1, 박학관 휴가 ===
  { id: 'tt85', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-17', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt86', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-17', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt87', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-17', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt88', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-17', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt89', title: '출석 체크', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-17', scheduledTime: '09:00', dueTime: '09:30', unassignedReason: '박학관 휴가 (2/16~17)', messages: [] },
  { id: 'tt90', title: '오전 팀순회', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-17', scheduledTime: '10:00', dueTime: '11:00', unassignedReason: '박학관 휴가 (2/16~17)', messages: [] },
  { id: 'tt91', title: '중간평가 결과 정리', type: 'milestone', completionType: 'evidence', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-17', endDate: '2026-02-19', scheduledTime: '13:00', dueTime: '17:00', unassignedReason: '담당자 미지정', messages: [] },

  // === 확장: 다음주 (2026-02-18, 수) - track1 ===
  { id: 'tt92', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-18', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt93', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-18', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt94', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-18', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt95', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'pending', scheduledDate: '2026-02-18', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt96', title: '팀 재편성 안내', type: 'milestone', completionType: 'evidence', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-18', scheduledTime: '14:00', dueTime: '16:00', messages: [] },

  // === 미배정 마일스톤 (기간 Task) 추가 ===
  { id: 'tt97', title: '프로젝트 기획서 작성', type: 'milestone', completionType: 'evidence', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-19', endDate: '2026-02-21', scheduledTime: '09:00', dueTime: '18:00', unassignedReason: '담당자 미지정', messages: [] },
  { id: 'tt98', title: '팀별 진행상황 취합', type: 'milestone', completionType: 'evidence', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-20', scheduledTime: '14:00', dueTime: '17:00', unassignedReason: '담당자 미지정', messages: [] },
  { id: 'tt99', title: '학습 콘텐츠 검수', type: 'milestone', completionType: 'evidence', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-22', endDate: '2026-02-24', scheduledTime: '10:00', dueTime: '17:00', unassignedReason: '담당자 미지정', messages: [] },

  // === 미배정 daily 추가 ===
  { id: 'tt100', title: '출석 체크', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-19', scheduledTime: '09:00', dueTime: '09:30', unassignedReason: '담당자 미지정', messages: [] },
  { id: 'tt101', title: '오전 팀순회', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-19', scheduledTime: '10:00', dueTime: '11:00', unassignedReason: '담당자 미지정', messages: [] },
  { id: 'tt102', title: '오후 팀순회', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-19', scheduledTime: '14:00', dueTime: '15:00', unassignedReason: '담당자 미지정', messages: [] },
  { id: 'tt103', title: '일일 리포트 작성', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-19', scheduledTime: '17:00', dueTime: '18:00', unassignedReason: '담당자 미지정', messages: [] },

  // === 2026-02-20 배정 Task (휴가 테스트용) ===
  { id: 'tt110', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt111', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt112', title: '수강생 면담', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt113', title: '일일 리포트 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '17:00', dueTime: '18:00', messages: [] },
  { id: 'tt114', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt115', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  { id: 'tt116', title: '프로젝트 피드백 정리', type: 'daily', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '15:00', dueTime: '16:00', messages: [] },
  { id: 'tt117', title: '출석 체크', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt118', title: '오후 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff3', assigneeName: '박학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt119', title: '중간평가 준비', type: 'milestone', completionType: 'evidence', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-20', endDate: '2026-02-21', scheduledTime: '09:00', dueTime: '18:00', messages: [] },
  { id: 'tt120', title: '학습자료 배포', type: 'milestone', completionType: 'simple', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '13:00', dueTime: '14:00', messages: [] },

  // === staff1 기간 Task (endDate 있는 Task — 캘린더에 스패닝 바로 표시) ===
  { id: 'tt-period1', title: '포트폴리오 초안 작성', type: 'milestone', completionType: 'evidence', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-12', endDate: '2026-02-14', scheduledTime: '09:00', dueTime: '18:00', description: '수강생 포트폴리오 가이드라인에 따라 초안 작성 지원', messages: [] },
  { id: 'tt-period2', title: '학습 로그 정리', type: 'manual', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-16', endDate: '2026-02-18', description: '__self_added__period', messages: [] },
  { id: 'tt-period3', title: '면담 결과 보고서', type: 'milestone', completionType: 'evidence', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-13', endDate: '2026-02-14', scheduledTime: '14:00', dueTime: '18:00', description: '면담 주간 결과 종합 보고서 작성', messages: [] },
  { id: 'tt-period4', title: '중간평가 채점 보조', type: 'milestone', completionType: 'evidence', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-17', endDate: '2026-02-19', scheduledTime: '10:00', dueTime: '17:00', description: '중간평가 채점 및 결과 입력 보조', messages: [] },

  // === track2 (BE 트랙 5기) 과거 20일치 데이터 ===
  // 1/26(월) 100%
  { id: 'tt2-h01a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-01-26', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:15', messages: [] },
  { id: 'tt2-h01b', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-01-26', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:40', messages: [] },
  // 1/27(화) 100%
  { id: 'tt2-h02a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-01-27', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:20', messages: [] },
  { id: 'tt2-h02b', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-01-27', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:50', messages: [] },
  // 1/28(수) 50% — 한학관 지연
  { id: 'tt2-h03a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-01-28', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:18', messages: [] },
  { id: 'tt2-h03b', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'overdue', scheduledDate: '2026-01-28', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  // 1/29(목) 100%
  { id: 'tt2-h04a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-01-29', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:22', messages: [] },
  { id: 'tt2-h04b', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-01-29', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:45', messages: [] },
  // 1/30(금) 75%
  { id: 'tt2-h05a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-01-30', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:10', messages: [] },
  { id: 'tt2-h05b', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-01-30', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:42', messages: [] },
  { id: 'tt2-h05c', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-01-30', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:28', messages: [] },
  { id: 'tt2-h05d', title: '일일 보고서', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'overdue', scheduledDate: '2026-01-30', scheduledTime: '17:00', dueTime: '18:00', messages: [] },
  // 2/2(월) 100%
  { id: 'tt2-h06a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-02', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:12', messages: [] },
  { id: 'tt2-h06b', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-02-02', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:48', messages: [] },
  // 2/3(화) 67%
  { id: 'tt2-h07a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-03', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:20', messages: [] },
  { id: 'tt2-h07b', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-03', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:55', messages: [] },
  { id: 'tt2-h07c', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'overdue', scheduledDate: '2026-02-03', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  // 2/4(수) 100%
  { id: 'tt2-h08a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-04', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:15', messages: [] },
  { id: 'tt2-h08b', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-02-04', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:25', messages: [] },
  // 2/5(목) 50%
  { id: 'tt2-h09a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-05', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:18', messages: [] },
  { id: 'tt2-h09b', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'overdue', scheduledDate: '2026-02-05', scheduledTime: '10:00', dueTime: '11:00', messages: [] },
  // 2/6(금) 100%
  { id: 'tt2-h10a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-06', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:10', messages: [] },
  { id: 'tt2-h10b', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-02-06', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:22', messages: [] },
  // 2/9(월) 100%
  { id: 'tt2-d09a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:20', messages: [] },
  { id: 'tt2-d09b', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:45', messages: [] },
  { id: 'tt2-d09c', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:25', messages: [] },
  { id: 'tt2-d09d', title: '일일 보고서', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '17:00', dueTime: '18:00', completedAt: '17:40', messages: [] },
  // 2/10(화) 75%
  { id: 'tt2-d10a', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:18', messages: [] },
  { id: 'tt2-d10b', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:50', messages: [] },
  { id: 'tt2-d10c', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'overdue', scheduledDate: '2026-02-10', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt2-d10d', title: '일일 보고서', type: 'daily', trackId: 'track2', assigneeId: 'staff5', assigneeName: '한학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '17:00', dueTime: '18:00', completedAt: '17:50', messages: [] },

  // === track3 (AI 트랙 8기) 과거 20일치 데이터 ===
  // 1/26(월) 100%
  { id: 'tt3-h01a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-01-26', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:12', messages: [] },
  { id: 'tt3-h01b', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-01-26', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:42', messages: [] },
  // 1/27(화) 50%
  { id: 'tt3-h02a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-01-27', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:20', messages: [] },
  { id: 'tt3-h02b', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'overdue', scheduledDate: '2026-01-27', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  // 1/28(수) 100%
  { id: 'tt3-h03a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-01-28', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:15', messages: [] },
  { id: 'tt3-h03b', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-01-28', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:50', messages: [] },
  // 1/29(목) 67%
  { id: 'tt3-h04a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-01-29', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:18', messages: [] },
  { id: 'tt3-h04b', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-01-29', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:45', messages: [] },
  { id: 'tt3-h04c', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'overdue', scheduledDate: '2026-01-29', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  // 1/30(금) 100%
  { id: 'tt3-h05a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-01-30', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:10', messages: [] },
  { id: 'tt3-h05b', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-01-30', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:20', messages: [] },
  // 2/2(월) 100%
  { id: 'tt3-h06a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-02', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:14', messages: [] },
  { id: 'tt3-h06b', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-02-02', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:40', messages: [] },
  // 2/3(화) 33% — 둘 다 부진
  { id: 'tt3-h07a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'overdue', scheduledDate: '2026-02-03', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt3-h07b', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-03', scheduledTime: '10:00', dueTime: '11:00', completedAt: '11:10', messages: [] },
  { id: 'tt3-h07c', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'overdue', scheduledDate: '2026-02-03', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  // 2/4(수) 100%
  { id: 'tt3-h08a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-04', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:12', messages: [] },
  { id: 'tt3-h08b', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-02-04', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:22', messages: [] },
  // 2/5(목) 100%
  { id: 'tt3-h09a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-05', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:15', messages: [] },
  { id: 'tt3-h09b', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-02-05', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:48', messages: [] },
  // 2/6(금) 75%
  { id: 'tt3-h10a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-06', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:10', messages: [] },
  { id: 'tt3-h10b', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-06', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:42', messages: [] },
  { id: 'tt3-h10c', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-02-06', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:28', messages: [] },
  { id: 'tt3-h10d', title: '일일 보고서', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'overdue', scheduledDate: '2026-02-06', scheduledTime: '17:00', dueTime: '18:00', messages: [] },
  // 2/9(월) 75%
  { id: 'tt3-d09a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:15', messages: [] },
  { id: 'tt3-d09b', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:40', messages: [] },
  { id: 'tt3-d09c', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'overdue', scheduledDate: '2026-02-09', scheduledTime: '09:00', dueTime: '09:30', messages: [] },
  { id: 'tt3-d09d', title: '일일 보고서', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-02-09', scheduledTime: '17:00', dueTime: '18:00', completedAt: '17:30', messages: [] },
  // 2/10(화) 75%
  { id: 'tt3-d10a', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:22', messages: [] },
  { id: 'tt3-d10b', title: '오전 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:48', messages: [] },
  { id: 'tt3-d10c', title: '출석 체크', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'completed', scheduledDate: '2026-02-10', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:28', messages: [] },
  { id: 'tt3-d10d', title: '일일 보고서', type: 'daily', trackId: 'track3', assigneeId: 'staff7', assigneeName: '강학관', status: 'overdue', scheduledDate: '2026-02-10', scheduledTime: '17:00', dueTime: '18:00', messages: [] },
]

// -- Track Notices (공지) --

export interface NoticeReply {
  id: string
  authorName: string
  content: string
  timestamp: string
  isManager: boolean
}

export interface TrackNotice {
  id: string
  trackId: string
  targetStaffId: string | null
  targetStaffName: string | null
  authorName: string
  content: string
  createdAt: string
  expiresAt: string
  readBy: string[]
  replies: NoticeReply[]
}

export const mockTrackNotices: TrackNotice[] = [
  {
    id: 'tn1', trackId: 'track1', targetStaffId: null, targetStaffName: null,
    authorName: '이운영', content: '오늘 중간평가 준비 관련해서 각 팀별 자료 확인 부탁드립니다.',
    createdAt: '2026-02-19 09:00', expiresAt: '2026-02-20',
    readBy: ['staff1', 'staff2'],
    replies: [
      { id: 'tnr1', authorName: '김학관', content: '네, 1팀 자료 준비 완료했습니다.', timestamp: '2026-02-19 09:15', isManager: false },
      { id: 'tnr2', authorName: '이학관', content: '2팀도 확인 중입니다. 오전 중 마무리하겠습니다.', timestamp: '2026-02-19 09:20', isManager: false },
      { id: 'tnr3', authorName: '이운영', content: '감사합니다. 자료 제출은 12시까지 부탁드립니다.', timestamp: '2026-02-19 09:25', isManager: true },
    ],
  },
  {
    id: 'tn2', trackId: 'track1', targetStaffId: 'staff1', targetStaffName: '김학관',
    authorName: '이운영', content: '1팀 김철수 학생 출결 확인 한번 더 부탁드려요.',
    createdAt: '2026-02-19 09:30', expiresAt: '2026-02-20',
    readBy: [],
    replies: [],
  },
  {
    id: 'tn3', trackId: 'track1', targetStaffId: null, targetStaffName: null,
    authorName: '이운영', content: '내일 프로젝트 발표 일정 변경 — 14:00 → 15:00 으로 조정됩니다.',
    createdAt: '2026-02-18 17:00', expiresAt: '2026-02-21',
    readBy: ['staff1', 'staff2', 'staff3'],
    replies: [
      { id: 'tnr4', authorName: '박학관', content: '확인했습니다!', timestamp: '2026-02-18 17:30', isManager: false },
    ],
  },
  {
    id: 'tn4', trackId: 'track1', targetStaffId: 'staff3', targetStaffName: '박학관',
    authorName: '이운영', content: '휴가 복귀 후 미배정 task 확인 부탁합니다.',
    createdAt: '2026-02-18 10:00', expiresAt: '2026-02-19',
    readBy: [],
    replies: [],
  },
  {
    id: 'tn5', trackId: 'track1', targetStaffId: 'staff2', targetStaffName: '이학관',
    authorName: '이운영', content: '3팀 프로젝트 진행상황 리포트 오늘 중으로 부탁합니다.',
    createdAt: '2026-02-17 16:00', expiresAt: '2026-02-20',
    readBy: ['staff2'],
    replies: [
      { id: 'tnr5', authorName: '이학관', content: '리포트 작성 중입니다. 오후 4시까지 제출하겠습니다.', timestamp: '2026-02-17 16:30', isManager: false },
      { id: 'tnr6', authorName: '이운영', content: '네 확인. 감사합니다.', timestamp: '2026-02-17 16:35', isManager: true },
    ],
  },
]

// -- Unified Schedules --
// ChapterInfo, TrackSchedule, PersonalSchedule → UnifiedSchedule로 통합

import type { UnifiedSchedule } from '@/components/schedule/schedule-types'

export const mockSchedules: UnifiedSchedule[] = [
  // === Chapters (type: 'chapter') ===
  // track1 — AI 백엔드 아키텍처 7기 (15주, 2026-01-12 ~ 2026-04-22)
  { id: 'ch1', title: '챕터 1: 백엔드 기초 & MSA', type: 'chapter', source: 'system', startDate: '2026-01-12', endDate: '2026-01-23', trackId: 'track1', createdAt: '2026-01-01' },
  { id: 'ch2', title: '챕터 2: AI 비즈니스 프로젝트', type: 'chapter', source: 'system', startDate: '2026-01-26', endDate: '2026-02-06', trackId: 'track1', createdAt: '2026-01-01' },
  { id: 'ch3', title: '챕터 3: 심화 기술 (캐싱/스트림)', type: 'chapter', source: 'system', startDate: '2026-02-09', endDate: '2026-02-20', trackId: 'track1', createdAt: '2026-01-01' },
  { id: 'ch4', title: '챕터 4: AI 시스템 설계', type: 'chapter', source: 'system', startDate: '2026-02-23', endDate: '2026-03-13', trackId: 'track1', createdAt: '2026-01-01' },
  { id: 'ch5', title: '챕터 5: 장애 대응 & 모니터링', type: 'chapter', source: 'system', startDate: '2026-03-16', endDate: '2026-03-20', trackId: 'track1', createdAt: '2026-01-01' },
  { id: 'ch6', title: '챕터 6: 최종 프로젝트 (대용량 트래픽)', type: 'chapter', source: 'system', startDate: '2026-03-23', endDate: '2026-04-22', trackId: 'track1', createdAt: '2026-01-01' },
  // track2 — BE 트랙 5기
  { id: 'ch7', title: '챕터 1: OT 및 환경 설정', type: 'chapter', source: 'system', startDate: '2026-02-02', endDate: '2026-02-08', trackId: 'track2', createdAt: '2026-01-15' },
  { id: 'ch8', title: '챕터 2: 기초 이론', type: 'chapter', source: 'system', startDate: '2026-02-09', endDate: '2026-02-15', trackId: 'track2', createdAt: '2026-01-15' },

  // === Curriculum (type: 'curriculum', source: 'system') ===
  // track1 — 시스템 일정 (커리큘럼 기반)
  { id: 'sch1', title: '자바 스프링 백엔드 개발', type: 'curriculum', source: 'system', startDate: '2026-01-12', endDate: '2026-01-13', trackId: 'track1', category: '강의', createdAt: '2026-01-01' },
  { id: 'sch2', title: 'MSA (Microservice Architecture)', type: 'curriculum', source: 'system', startDate: '2026-01-14', endDate: '2026-01-22', trackId: 'track1', category: '강의', createdAt: '2026-01-01' },
  { id: 'sch3', title: 'AI 검증 비즈니스 프로젝트', type: 'curriculum', source: 'system', startDate: '2026-01-23', endDate: '2026-02-06', trackId: 'track1', category: '프로젝트', createdAt: '2026-01-01' },
  { id: 'sch4', title: '프로젝트 관리 심화', type: 'curriculum', source: 'system', startDate: '2026-02-09', endDate: '2026-02-11', trackId: 'track1', category: '강의', createdAt: '2026-01-01' },
  { id: 'sch5', title: '인메모리 저장소 및 캐싱 전략', type: 'curriculum', source: 'system', startDate: '2026-02-12', endDate: '2026-02-16', trackId: 'track1', category: '강의', createdAt: '2026-01-01' },
  { id: 'sch6', title: '대규모 스트림 처리', type: 'curriculum', source: 'system', startDate: '2026-02-17', endDate: '2026-02-19', trackId: 'track1', category: '강의', createdAt: '2026-01-01' },
  { id: 'sch7', title: '대규모 AI 시스템 설계 프로젝트', type: 'curriculum', source: 'system', startDate: '2026-02-20', endDate: '2026-03-09', trackId: 'track1', category: '프로젝트', createdAt: '2026-01-01' },
  { id: 'sch8', title: '모니터링 시스템 및 시큐어 코딩', type: 'curriculum', source: 'system', startDate: '2026-03-10', endDate: '2026-03-13', trackId: 'track1', category: '강의', createdAt: '2026-01-01' },
  { id: 'sch9', title: '장애 대응', type: 'curriculum', source: 'system', startDate: '2026-03-16', endDate: '2026-03-17', trackId: 'track1', category: '강의', createdAt: '2026-01-01' },
  { id: 'sch10', title: '실무 기반 대용량 트래픽 처리 프로젝트', type: 'curriculum', source: 'system', startDate: '2026-03-18', endDate: '2026-04-22', trackId: 'track1', category: '프로젝트', createdAt: '2026-01-01' },
  // track2 — BE 트랙 5기
  { id: 'sch17', title: 'OT 및 환경 설정', type: 'curriculum', source: 'system', startDate: '2026-02-02', endDate: '2026-02-08', trackId: 'track2', category: '강의', createdAt: '2026-01-15' },
  { id: 'sch18', title: '기초 이론 강의', type: 'curriculum', source: 'system', startDate: '2026-02-09', endDate: '2026-02-15', trackId: 'track2', category: '강의', createdAt: '2026-01-15' },

  // === Operation Periods (type: 'operation_period', source: 'manual') ===
  // track1 — 운기매/운영매가 설정한 기간형 운영 일정
  { id: 'op-p1', title: '면담 주간', type: 'operation_period', source: 'manual', startDate: '2026-02-09', endDate: '2026-02-13', trackId: 'track1', description: '챕터3 시작 — 전체 수강생 1:1 면담 진행', creatorId: 'op1', createdAt: '2026-02-03' },
  { id: 'op-p2', title: '중간평가 주간', type: 'operation_period', source: 'manual', startDate: '2026-02-16', endDate: '2026-02-19', trackId: 'track1', description: '챕터3 종료 중간평가 실시 및 결과 정리', creatorId: 'op1', createdAt: '2026-02-05' },
  { id: 'op-p3', title: 'AI 프로젝트 주간', type: 'operation_period', source: 'manual', startDate: '2026-02-20', endDate: '2026-03-06', trackId: 'track1', description: '대규모 AI 시스템 설계 프로젝트 집중 기간', creatorId: 'mgr1', createdAt: '2026-02-10' },
  { id: 'op-p4', title: '코드리뷰 기간', type: 'operation_period', source: 'manual', startDate: '2026-02-18', endDate: '2026-02-19', trackId: 'track1', description: '챕터3 종료 전 전체 코드 리뷰', creatorId: 'op1', createdAt: '2026-02-10' },
  { id: 'op-p5', title: '수료 준비 주간', type: 'operation_period', source: 'manual', startDate: '2026-04-13', endDate: '2026-04-22', trackId: 'track1', description: '최종 발표, 포트폴리오, 수료 행정 처리', creatorId: 'mgr1', createdAt: '2026-03-15' },

  // === Track Events (type: 'track_event', source: 'manual') ===
  // track1 — 단발성 운영 이벤트
  { id: 'sch11', title: '멘토링 데이', type: 'track_event', source: 'manual', startDate: '2026-02-07', endDate: '2026-02-07', trackId: 'track1', category: '행사', description: '현업 멘토 초청 네트워킹', creatorId: 'op1', createdAt: '2026-02-01' },
  { id: 'sch12', title: '팀빌딩 행사', type: 'track_event', source: 'manual', startDate: '2026-02-14', endDate: '2026-02-14', trackId: 'track1', category: '행사', description: '팀 결속력 강화 워크숍', creatorId: 'op1', createdAt: '2026-02-01' },
  { id: 'sch13', title: '보충수업 (MSA)', type: 'track_event', source: 'manual', startDate: '2026-01-20', endDate: '2026-01-21', trackId: 'track1', category: '강의', description: 'MSA 기초 부족 학생 대상 보충', creatorId: 'op1', createdAt: '2026-01-15' },
  { id: 'sch14', title: '중간 코드 리뷰', type: 'track_event', source: 'manual', startDate: '2026-02-19', endDate: '2026-02-19', trackId: 'track1', category: '평가', description: '챕터 3 종료 전 중간 코드 리뷰', creatorId: 'op1', createdAt: '2026-02-10' },
  { id: 'sch15', title: '특별 세미나', type: 'track_event', source: 'manual', startDate: '2026-03-05', endDate: '2026-03-05', trackId: 'track1', category: '기타', description: 'AI 인프라 트렌드 세미나', creatorId: 'op1', createdAt: '2026-02-20' },
  { id: 'sch16', title: '최종 발표', type: 'track_event', source: 'manual', startDate: '2026-04-22', endDate: '2026-04-22', trackId: 'track1', category: '평가', description: '최종 프로젝트 발표 및 평가', creatorId: 'op1', createdAt: '2026-03-01' },

  // === Personal Schedules (type: 'personal', source: 'manual') ===
  { id: 'ps1', title: '김민수 면담', type: 'personal', source: 'manual', startDate: '2026-02-11', endDate: '2026-02-11', startTime: '14:00', creatorId: 'staff1', description: '진도 상담', createdAt: '2026-02-10 09:00' },
  { id: 'ps2', title: '이수진 면담', type: 'personal', source: 'manual', startDate: '2026-02-12', endDate: '2026-02-12', startTime: '10:30', creatorId: 'staff1', createdAt: '2026-02-10 09:05' },
  { id: 'ps3', title: '팀빌딩 자료 준비', type: 'personal', source: 'manual', startDate: '2026-02-14', endDate: '2026-02-14', creatorId: 'staff1', createdAt: '2026-02-10 10:00' },
  { id: 'ps4', title: '박지훈 면담', type: 'personal', source: 'manual', startDate: '2026-02-13', endDate: '2026-02-13', startTime: '15:00', creatorId: 'staff1', description: '출결 문제', createdAt: '2026-02-11 08:00' },
]

// Legacy type aliases (하위 호환)
export type ScheduleSource = 'system' | 'operator'
export type TrackSchedule = {
  id: string; trackId: string; title: string; startDate: string; endDate: string
  source: ScheduleSource; category?: string; description?: string
}
export type PersonalSchedule = {
  id: string; staffId: string; title: string; date: string
  time?: string; memo?: string; createdAt: string
}

// -- Notifications --

export const mockNotifications: AppNotification[] = [
  { id: 'noti1', type: 'task_overdue', category: 'system', title: '기한초과: 오전 팀순회', description: '이학관 - AI 트랙 7기, 11:00 마감', timestamp: '2026-02-11 11:05', isRead: false, linkTo: '/tracks/track1', recipientRole: 'operator', relatedTrackId: 'track1', relatedTaskId: 'tt7', relatedStaffId: 'staff2', isEscalatedAway: true },
  { id: 'noti2', type: 'task_overdue', category: 'system', title: '기한초과: 오후 팀순회', description: '박학관 - AI 트랙 7기, 15:00 마감', timestamp: '2026-02-11 15:05', isRead: false, linkTo: '/tracks/track1', recipientRole: 'operator', relatedTrackId: 'track1', relatedTaskId: 'tt13', relatedStaffId: 'staff3' },
  { id: 'noti3', type: 'task_unassigned', category: 'system', title: '미배정 Task 알림', description: 'AI 트랙 7기 - 미배정 Task 2건', timestamp: '2026-02-11 11:30', isRead: false, linkTo: '/tracks/track1#unassigned', recipientRole: 'operator', relatedTrackId: 'track1', relatedTaskId: 'tt16' },
  { id: 'noti4', type: 'vacation_registered', category: 'action', title: '휴가 등록: 박학관', description: '박학관 휴가(2/16~17) - 6건 미배정 발생', timestamp: '2026-02-11 09:00', isRead: false, linkTo: '/staff/staff3', recipientRole: 'operator', relatedTrackId: 'track1', relatedStaffId: 'staff3' },
  { id: 'noti5', type: 'request_received', category: 'action', title: '업무 요청: 교육장 에어컨 수리 요청', description: '김학관 → 운영매 - AI 트랙 7기', timestamp: '2026-02-10 08:30', isRead: true, linkTo: '/tracks/track1/tasks', recipientRole: 'operator', relatedTrackId: 'track1', relatedStaffId: 'staff1', priority: 'urgent' },
  { id: 'noti6', type: 'task_review_requested', category: 'action', title: '확인요청: 교육 자료 준비', description: '이학관 - AI 트랙 7기, 확인 부탁드립니다', timestamp: '2026-02-10 05:00', isRead: true, linkTo: '/tracks/track1/tasks', recipientRole: 'operator', relatedTrackId: 'track1', relatedStaffId: 'staff2' },
  { id: 'noti7', type: 'message_new', category: 'action', title: '새 메시지: 김학관', description: '1팀 김철수 학생 추가 상담 필요합니다.', timestamp: '2026-02-11 10:30', isRead: false, linkTo: '/staff/staff1', recipientRole: 'operator', relatedTrackId: 'track1', relatedStaffId: 'staff1' },
  { id: 'noti8', type: 'message_new', category: 'action', title: '새 메시지: 박학관', description: '죄송합니다. 학생 이슈 대응하느라 늦었습니다.', timestamp: '2026-02-11 11:20', isRead: true, linkTo: '/staff/staff3', recipientRole: 'operator', relatedTrackId: 'track1', relatedStaffId: 'staff3' },
  { id: 'noti9', type: 'task_completed', category: 'action', title: 'Task 완료: 출석 체크', description: '김학관 - AI 트랙 7기, 09:25 완료', timestamp: '2026-02-11 09:25', isRead: true, linkTo: '/staff/staff1', recipientRole: 'operator', relatedTrackId: 'track1', relatedTaskId: 'tt1', relatedStaffId: 'staff1' },
  { id: 'noti10', type: 'task_completed', category: 'action', title: 'Task 완료: 수강생 출결 리포트', description: '김학관 - AI 트랙 7기, 11:40 완료', timestamp: '2026-02-11 11:40', isRead: true, linkTo: '/staff/staff1', recipientRole: 'operator', relatedTrackId: 'track1', relatedTaskId: 'tt5', relatedStaffId: 'staff1' },
  { id: 'noti11', type: 'task_overdue', category: 'system', title: '기한초과: 수강생 진도 체크', description: '한학관 - BE 트랙 5기, 12:00 마감', timestamp: '2026-02-11 12:05', isRead: false, linkTo: '/tracks/track2', recipientRole: 'operator', relatedTrackId: 'track2', relatedTaskId: 'tt26', relatedStaffId: 'staff4' },
  { id: 'noti12', type: 'task_completed', category: 'action', title: 'Task 완료: 오전 팀순회', description: '정학관 - BE 트랙 5기, 10:50 완료', timestamp: '2026-02-11 10:50', isRead: true, linkTo: '/staff/staff5', recipientRole: 'operator', relatedTrackId: 'track2', relatedTaskId: 'tt20', relatedStaffId: 'staff5' },
  { id: 'noti13', type: 'task_assigned', category: 'action', title: 'Task 배정: 특별 멘토링 세션 준비', description: '김학관에게 배정 - AI 트랙 7기', timestamp: '2026-02-11 08:30', isRead: true, linkTo: '/staff/staff1', recipientRole: 'learning_manager', relatedTrackId: 'track1', relatedTaskId: 'tt16', relatedStaffId: 'staff1' },
  { id: 'noti14', type: 'notice_new', category: 'action', title: '새 공지: 2월 셋째주 일정 안내', description: '운영매니저 → 전체 학관', timestamp: '2026-02-11 09:00', isRead: true, linkTo: '/staff/staff1', recipientRole: 'learning_manager', relatedTrackId: 'track1' },
  { id: 'noti15', type: 'escalation_triggered', category: 'system', title: '[에스컬레이션] 기한초과: 오전 팀순회', description: '이학관 - AI 트랙 7기 (운영매 이운영님 미조치 4h 경과)', timestamp: '2026-02-11 15:05', isRead: false, linkTo: '/tracks/track1/tasks', recipientRole: 'operator_manager', relatedTrackId: 'track1', relatedTaskId: 'tt7', relatedStaffId: 'staff2', escalation: { isEscalated: true, originalRecipientRole: 'operator', escalatedAt: '2026-02-11 15:05', originalNotificationId: 'noti1' } },
  { id: 'noti16', type: 'escalation_triggered', category: 'system', title: '[에스컬레이션] 확인요청 미처리: 교육 자료 준비', description: '이학관 - AI 트랙 7기 (운영매 이운영님 미조치 8h 경과)', timestamp: '2026-02-11 13:00', isRead: false, linkTo: '/tracks/track1/tasks', recipientRole: 'operator_manager', relatedTrackId: 'track1', relatedStaffId: 'staff2', escalation: { isEscalated: true, originalRecipientRole: 'operator', escalatedAt: '2026-02-11 13:00', originalNotificationId: 'noti6' } },
  { id: 'noti17', type: 'task_review_done', category: 'action', title: '확인완료: 수강생 출결 리포트', description: '운영매니저가 확인을 완료했습니다', timestamp: '2026-02-11 11:45', isRead: false, linkTo: '/staff/staff1', recipientRole: 'learning_manager', relatedTrackId: 'track1', relatedTaskId: 'tt5', relatedStaffId: 'staff1' },
  { id: 'noti18', type: 'task_reminder', category: 'system', title: '시작 30분 전: 오후 팀순회', description: 'AI 트랙 7기 14:30~15:00', timestamp: '2026-02-11 14:00', isRead: false, linkTo: '/staff/staff1', recipientRole: 'learning_manager', relatedTrackId: 'track1', relatedTaskId: 'tt10', relatedStaffId: 'staff1' },
]

// -- Notification Configs --

export const mockNotificationConfigs: NotificationConfig[] = [
  { trackId: 'track1', ...DEFAULT_NOTIFICATION_CONFIG },
  { trackId: 'track2', ...DEFAULT_NOTIFICATION_CONFIG },
  { trackId: 'track3', ...DEFAULT_NOTIFICATION_CONFIG },
]

// -- Manager Personal Tasks (총괄/운영매 개인 업무, UnifiedTask 기반) --
// ManagerTask 인터페이스는 삭제됨 — UnifiedTask를 직접 사용
// trackId: '_manager' 는 트랙 소속이 아닌 매니저 개인 task를 의미

import type { UnifiedTask, TaskMessage as UnifiedTaskMessage } from '@/components/task/task-types'

export const mockManagerTasks: UnifiedTask[] = [
  // 운영매(op1) 대상 - 시스템 생성
  { id: 'mt1', trackId: '_manager', title: '주간 트랙 운영 현황 리포트 작성', category: '운영 관리', source: 'system', assigneeId: 'op1', reviewerId: 'mgr1', startDate: '2026-02-11', startTime: '09:00', endTime: '10:00', priority: 'important', status: 'pending', createdAt: '2026-02-11', messages: [] },
  { id: 'mt2', trackId: '_manager', title: '운영매니저 주간 미팅 준비', category: '운영 관리', source: 'system', assigneeId: 'op1', startDate: '2026-02-11', startTime: '10:00', endTime: '11:00', priority: 'normal', status: 'in_progress', createdAt: '2026-02-11', messages: [] },
  // 총괄(mgr1) -> 운영매(op1) 지시
  { id: 'mt3', trackId: '_manager', title: 'AI 트랙 8기 OT 일정 최종 확정', category: '운영 관리', source: 'request_received', creatorId: 'mgr1', assigneeId: 'op1', reviewerId: 'mgr1', startDate: '2026-02-11', priority: 'urgent', status: 'pending', createdAt: '2026-02-11', messages: [
    { id: 'mtm1', authorId: 'mgr1', authorName: '이운기', content: 'OT를 3월 첫째 주로 확정하고 수강생 공지해주세요.', timestamp: '09:30', isSelf: false },
  ] },
  { id: 'mt4', trackId: '_manager', title: '2월 운영 예산 집행 보고서', category: '운영 관리', source: 'request_received', creatorId: 'mgr1', assigneeId: 'op1', reviewerId: 'mgr1', startDate: '2026-02-11', priority: 'important', status: 'pending', createdAt: '2026-02-11', messages: [] },
  // 운영매(op1) 자체 추가
  { id: 'mt5', trackId: '_manager', title: '신규 학관 온보딩 자료 업데이트', category: '운영 관리', source: 'self', assigneeId: 'op1', startDate: '2026-02-11', priority: 'normal', status: 'in_progress', createdAt: '2026-02-11', messages: [] },
  // 운영매(op1) -> 총괄(mgr1) 요청
  { id: 'mt6', trackId: '_manager', title: '학관 추가 채용 승인 요청', category: '운영 관리', source: 'request_sent', creatorId: 'op1', assigneeId: 'mgr1', reviewerId: 'mgr1', startDate: '2026-02-11', priority: 'important', status: 'pending_review', createdAt: '2026-02-11', messages: [
    { id: 'mtm2', authorId: 'op1', authorName: '이운영', content: 'AI 트랙 7기 학관 1명 추가 채용이 필요합니다.', timestamp: '10:00', isSelf: true },
  ] },
  // 총괄(mgr1) 대상 - 시스템 생성
  { id: 'mt7', trackId: '_manager', title: '트랙별 KPI 대시보드 검토', category: '운영 관리', source: 'system', assigneeId: 'mgr1', startDate: '2026-02-11', startTime: '08:30', endTime: '09:00', priority: 'normal', status: 'completed', completedAt: '08:55', createdAt: '2026-02-11', messages: [] },
  // 총괄(mgr1) 자체 추가
  { id: 'mt8', trackId: '_manager', title: '멘토풀 확충 방안 정리', category: '운영 관리', source: 'self', assigneeId: 'mgr1', startDate: '2026-02-11', priority: 'normal', status: 'pending', createdAt: '2026-02-11', messages: [] },
  // 총괄(mgr1) 대상 - 시스템 생성 (내일)
  { id: 'mt9', trackId: '_manager', title: '다음 분기 트랙 편성안 초안', category: '운영 관리', source: 'system', assigneeId: 'mgr1', reviewerId: 'mgr1', startDate: '2026-02-12', priority: 'important', status: 'pending', createdAt: '2026-02-11', messages: [] },
  // 운영매(op2) 대상 - 총괄 지시
  { id: 'mt10', trackId: '_manager', title: 'BE 트랙 5기 멘토링 피드백 취합', category: '운영 관리', source: 'request_received', creatorId: 'mgr1', assigneeId: 'op2', reviewerId: 'mgr1', startDate: '2026-02-11', priority: 'normal', status: 'pending', createdAt: '2026-02-11', messages: [
    { id: 'mtm3', authorId: 'mgr1', authorName: '이운기', content: '다음 주 월요일 회의에 필요합니다.', timestamp: '09:00', isSelf: false },
  ] },
]

// -- Comm Widget Types & Data --

export interface CommMessage {
  id: string
  content: string
  authorId: string
  authorName: string
  timestamp: string
  replyTo?: { authorName: string; content: string }
  reactions?: { emoji: string; count: number }[]
  taskPreview?: {
    taskId: string
    trackId: string
    taskTitle: string
    lastAuthor: string
    lastContent: string
    messageCount: number
    unreadCount: number
  }
}

export interface CommSystemNotification {
  id: string
  type: 'task_assigned' | 'task_completed' | 'task_overdue' | 'review_requested' | 'review_done' | 'reminder' | 'general'
  content: string
  timestamp: string
  taskId?: string
  taskTitle?: string
  trackId?: string
  trackName?: string
  isRead?: boolean
}

export interface StickyNotice {
  channelId: string
  content: string
  authorId: string
  authorName: string
}

export const mockCommNotifications: CommSystemNotification[] = [
  { id: 'n-1', type: 'task_assigned', content: '새 업무가 배정되었습니다', timestamp: '2026-02-11T08:00:00', taskId: 'tt1', taskTitle: '오전 출석 체크', trackId: 'track1', trackName: 'AI 트랙 7기' },
  { id: 'n-2', type: 'task_overdue', content: '마감 시간이 지났습니다', timestamp: '2026-02-11T10:30:00', taskId: 'tt5', taskTitle: '주간 보고서 제출', trackId: 'track1', trackName: 'AI 트랙 7기' },
  { id: 'n-3', type: 'review_requested', content: '확인 요청이 등록되었습니다', timestamp: '2026-02-11T09:30:00', taskId: 'tt5', taskTitle: '수강생 출결 리포트', trackId: 'track1', trackName: 'AI 트랙 7기' },
  { id: 'n-4', type: 'task_assigned', content: '이운영 매니저가 업무를 배정했습니다', timestamp: '2026-02-11T09:00:00', taskId: 'tt3', taskTitle: '프로젝트 중간점검', trackId: 'track1', trackName: 'AI 트랙 7기' },
  { id: 'n-5', type: 'reminder', content: '30분 후 시작 예정입니다', timestamp: '2026-02-11T08:30:00', taskId: 'tt2', taskTitle: '수강생 면담 준비', trackId: 'track2', trackName: 'BE 트랙 5기' },
  { id: 'n-6', type: 'review_done', content: '김운영 매니저가 확인을 완료했습니다', timestamp: '2026-02-11T10:15:00', taskId: 'tt1', taskTitle: '출석 현황 보고', trackId: 'track2', trackName: 'BE 트랙 5기' },
  { id: 'n-7', type: 'general', content: '내일 챕터4 수업이 예정되어 있습니다. 자료를 미리 확인해주세요.', timestamp: '2026-02-11T11:00:00' },
]

export const mockCommMessages: Record<string, CommMessage[]> = {
  'chat:mgr1:op1': [
    { id: 'cm-1', content: 'AI 트랙 7기 중간 점검 보고서 준비 상황 어떤가요?', authorId: 'mgr1', authorName: '박총괄', timestamp: '2026-02-11T08:30:00' },
    { id: 'cm-2', content: '네, 내일까지 마무리 예정입니다. 학관 완료율은 92%로 양호합니다.', authorId: 'op1', authorName: '이운영', timestamp: '2026-02-11T08:45:00' },
    { id: 'cm-3', content: '', authorId: '__system__', authorName: '', timestamp: '2026-02-11T09:00:00', taskPreview: { taskId: 'tt5', trackId: 'track1', taskTitle: '수강생 출결 리포트', lastAuthor: '김학관', lastContent: '출결 리포트 작성 완료했습니다. 확인 부탁드립니다.', messageCount: 2, unreadCount: 1 } },
    { id: 'cm-4', content: '출결 리포트 확인 부탁합니다. 김학관이 올려놨어요.', authorId: 'op1', authorName: '이운영', timestamp: '2026-02-11T09:10:00' },
  ],
  'chat:mgr1:op2': [
    { id: 'cm-5', content: 'BE 트랙 학관 충원 건 진행 상황 공유해주세요.', authorId: 'mgr1', authorName: '박총괄', timestamp: '2026-02-10T16:00:00' },
    { id: 'cm-6', content: '이번 주 내로 면접 진행 예정입니다.', authorId: 'op2', authorName: '김운영', timestamp: '2026-02-10T16:30:00' },
  ],
  'chat:op1:staff1': [
    { id: 'cm-10', content: '수강생 김민수님 출석 관련해서 확인 부탁드립니다.', authorId: 'op1', authorName: '이운영', timestamp: '2026-02-11T09:15:00' },
    { id: 'cm-11', content: '네, 확인했습니다. 오늘 오후에 면담 진행하겠습니다.', authorId: 'staff1', authorName: '김학관', timestamp: '2026-02-11T09:20:00' },
    { id: 'cm-12', content: '', authorId: '__system__', authorName: '', timestamp: '2026-02-11T09:30:00', taskPreview: { taskId: 'tt2', trackId: 'track1', taskTitle: '오전 팀순회', lastAuthor: '김학관', lastContent: '1팀 김철수 학생 추가 상담 필요합니다.', messageCount: 3, unreadCount: 2 } },
    { id: 'cm-13', content: '감사합니다! 면담 결과는 간단하게 공유 부탁드려요.', authorId: 'op1', authorName: '이운영', timestamp: '2026-02-11T09:22:00', reactions: [{ emoji: '👍', count: 1 }] },
  ],
  'chat:op1:staff2': [
    { id: 'cm-20', content: '프로젝트 중간점검 자료 제출 완료했습니다.', authorId: 'staff2', authorName: '이학관', timestamp: '2026-02-11T10:00:00' },
    { id: 'cm-21', content: '자료 잘 받았습니다. 2팀 진도 확인 부탁드려요.', authorId: 'op1', authorName: '이운영', timestamp: '2026-02-11T10:05:00' },
  ],
  'chat:op1:staff3': [
    { id: 'cm-30', content: '수강생 상담 일정 변경 요청이 있어서 보고드립니다.', authorId: 'staff3', authorName: '박학관', timestamp: '2026-02-11T11:00:00' },
  ],
}

export const mockCommStickies: Record<string, StickyNotice> = {
  'chat:op1:staff1': { channelId: 'chat:op1:staff1', content: '챕터3 프로젝트 — 궁금한 점 편하게 물어봐 주세요', authorId: 'op1', authorName: '이운영' },
  'chat:mgr1:op1': { channelId: 'chat:mgr1:op1', content: '주간 보고 매주 금요일 오전까지', authorId: 'mgr1', authorName: '박총괄' },
}

export const mockCommUnreadMap: Record<string, number> = {
  'chat:op1:staff1': 2,
  'chat:op1:staff3': 1,
  'chat:mgr1:op2': 1,
}
