// Admin Dashboard Mock Data

// -- Task Template & Track Task types --

export type TaskType = 'daily' | 'milestone' | 'manual'
export type TrackTaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue' | 'unassigned'

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
  messages: TaskMessage[]
}

export interface ChapterInfo {
  id: string
  name: string
  startDate: string
  endDate: string
  trackId: string
}

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
  // System auto (SYS)
  | 'task_overdue'            // SYS-01
  | 'task_unassigned'         // SYS-02
  | 'task_activated'          // SYS-03
  // Action-based (ACT)
  | 'issue_new'               // ACT-01
  | 'issue_urgent'            // ACT-02
  | 'issue_replied'           // ACT-03
  | 'issue_status_changed'    // ACT-04
  | 'task_completed'          // ACT-05
  | 'task_assigned'           // ACT-06
  | 'task_reassigned'         // ACT-07
  | 'notice_new'              // ACT-08
  | 'notice_replied'          // ACT-09
  | 'message_new'             // ACT-10
  | 'kanban_created'          // ACT-11
  | 'kanban_replied'          // ACT-12
  | 'vacation_registered'     // ACT-13
  // Threshold (THR)
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
  isMandatory: boolean
  linkTo: string
  recipientRole: RecipientRole
  relatedTrackId?: string
  relatedTaskId?: string
  relatedStaffId?: string
  relatedIssueId?: string
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
  category: NotificationCategory
  isMandatory: boolean
}> = {
  task_overdue:                   { label: '기한초과',       category: 'system',    isMandatory: true },
  task_unassigned:                { label: '미배정',         category: 'system',    isMandatory: true },
  task_activated:                 { label: 'Task 활성화',    category: 'system',    isMandatory: true },
  issue_new:                      { label: '새 이슈',        category: 'action',    isMandatory: true },
  issue_urgent:                   { label: '긴급 이슈',      category: 'action',    isMandatory: true },
  issue_replied:                  { label: '이슈 답변',      category: 'action',    isMandatory: true },
  issue_status_changed:           { label: '이슈 상태변경',  category: 'action',    isMandatory: false },
  task_completed:                 { label: 'Task 완료',      category: 'action',    isMandatory: false },
  task_assigned:                  { label: 'Task 배정',      category: 'action',    isMandatory: true },
  task_reassigned:                { label: 'Task 재배정',    category: 'action',    isMandatory: true },
  notice_new:                     { label: '새 공지',        category: 'action',    isMandatory: true },
  notice_replied:                 { label: '공지 답변',      category: 'action',    isMandatory: false },
  message_new:                    { label: '새 메시지',      category: 'action',    isMandatory: true },
  kanban_created:                 { label: '칸반 카드',      category: 'action',    isMandatory: true },
  kanban_replied:                 { label: '칸반 답변',      category: 'action',    isMandatory: false },
  vacation_registered:            { label: '휴가 등록',      category: 'action',    isMandatory: true },
  threshold_staff_completion:     { label: '학관 완료율',    category: 'threshold', isMandatory: false },
  threshold_operator_completion:  { label: '운영 완료율',    category: 'threshold', isMandatory: false },
  threshold_pending_issues:       { label: '이슈 누적',      category: 'threshold', isMandatory: false },
  threshold_unread_messages:      { label: '메시지 누적',    category: 'threshold', isMandatory: false },
  threshold_overdue_tasks:        { label: '기한초과 누적',  category: 'threshold', isMandatory: false },
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
  status: 'pending' | 'in-progress' | 'done'
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

export type KanbanStatus = 'waiting' | 'in-progress' | 'done'
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
    status: 'in-progress',
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
    status: 'in-progress',
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
  { id: 'tt2', title: '오전 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:45', messages: [
    { id: 'ttm1', authorName: '김학관', content: '1팀 김철수 학생 추가 상담 필요합니다.', timestamp: '10:30', isSelf: false },
    { id: 'ttm2', authorName: '이운영', content: '확인했습니다. 멘토 연결해드릴게요.', timestamp: '10:45', isSelf: true },
  ]},
  { id: 'tt3', title: '오후 팀순회', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'in-progress', scheduledDate: '2026-02-11', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
  { id: 'tt4', title: '일일 보고서 작성', type: 'daily', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'pending', scheduledDate: '2026-02-11', scheduledTime: '17:00', dueTime: '18:00', messages: [] },
  { id: 'tt5', title: '수강생 출결 리포트', type: 'milestone', trackId: 'track1', assigneeId: 'staff1', assigneeName: '김학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '11:00', dueTime: '12:00', completedAt: '11:40', messages: [] },
  // 김학관: 5 tasks, 3 completed, 1 in-progress, 1 pending

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

  // === track1 (AI 트랙 7기) - 미배정 tasks ===
  { id: 'tt16', title: '특별 멘토링 세션 준비', type: 'manual', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-11', scheduledTime: '16:00', dueTime: '17:00', unassignedReason: '담당자 미지정', messages: [] },
  { id: 'tt17', title: '교육장 점검', type: 'daily', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-11', scheduledTime: '08:30', dueTime: '09:00', unassignedReason: '정학관 휴가 (대체인력 필요)', messages: [] },
  { id: 'tt18', title: '중간평가 설문 배포', type: 'milestone', trackId: 'track1', status: 'unassigned', scheduledDate: '2026-02-12', scheduledTime: '10:00', dueTime: '12:00', unassignedReason: '담당자 미지정', messages: [] },

  // === track2 (BE 트랙 5기) - staff4 정학관 ===
  { id: 'tt19', title: '출석 체크', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '09:00', dueTime: '09:30', completedAt: '09:15', messages: [] },
  { id: 'tt20', title: '오전 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'completed', scheduledDate: '2026-02-11', scheduledTime: '10:00', dueTime: '11:00', completedAt: '10:50', messages: [] },
  { id: 'tt21', title: '오후 팀순회', type: 'daily', trackId: 'track2', assigneeId: 'staff4', assigneeName: '정학관', status: 'in-progress', scheduledDate: '2026-02-11', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
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
  { id: 'tt31', title: '오후 팀순회', type: 'daily', trackId: 'track3', assigneeId: 'staff6', assigneeName: '최학관', status: 'in-progress', scheduledDate: '2026-02-11', scheduledTime: '14:00', dueTime: '15:00', messages: [] },
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
  { id: 'tt120', title: '학습자료 배포', type: 'milestone', completionType: 'check', trackId: 'track1', assigneeId: 'staff2', assigneeName: '이학관', status: 'pending', scheduledDate: '2026-02-20', scheduledTime: '13:00', dueTime: '14:00', messages: [] },
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

// -- Track Schedules --

export type ScheduleSource = 'system' | 'operator'

export interface TrackSchedule {
  id: string
  trackId: string
  title: string
  startDate: string
  endDate: string
  source: ScheduleSource
  category?: '강의' | '프로젝트' | '평가' | '행사' | '기타'
  description?: string
}

export const mockTrackSchedules: TrackSchedule[] = [
  // track1 — 시스템 일정
  { id: 'sch1', trackId: 'track1', title: 'OT 및 환경 설정', startDate: '2026-01-26', endDate: '2026-02-01', source: 'system', category: '강의' },
  { id: 'sch2', trackId: 'track1', title: '기초 이론 강의', startDate: '2026-02-02', endDate: '2026-02-08', source: 'system', category: '강의' },
  { id: 'sch3', trackId: 'track1', title: '심화 학습', startDate: '2026-02-09', endDate: '2026-02-15', source: 'system', category: '강의' },
  { id: 'sch4', trackId: 'track1', title: '중간평가', startDate: '2026-02-16', endDate: '2026-02-18', source: 'system', category: '평가' },
  { id: 'sch5', trackId: 'track1', title: '미니 프로젝트', startDate: '2026-02-19', endDate: '2026-02-22', source: 'system', category: '프로젝트' },
  { id: 'sch6', trackId: 'track1', title: '최종 프로젝트', startDate: '2026-02-23', endDate: '2026-03-01', source: 'system', category: '프로젝트' },
  { id: 'sch7', trackId: 'track1', title: '최종 발표', startDate: '2026-03-01', endDate: '2026-03-01', source: 'system', category: '평가' },
  // track1 — 운영 추가 일정
  { id: 'sch8', trackId: 'track1', title: '멘토링 데이', startDate: '2026-02-07', endDate: '2026-02-07', source: 'operator', category: '행사', description: '현업 멘토 초청 네트워킹' },
  { id: 'sch9', trackId: 'track1', title: '팀빌딩 행사', startDate: '2026-02-14', endDate: '2026-02-14', source: 'operator', category: '행사', description: '팀 결속력 강화 워크숍' },
  { id: 'sch10', trackId: 'track1', title: '보충수업 (기초반)', startDate: '2026-02-10', endDate: '2026-02-11', source: 'operator', category: '강의', description: '기초 부족 학생 대상' },
  { id: 'sch11', trackId: 'track1', title: '특별 세미나', startDate: '2026-02-20', endDate: '2026-02-20', source: 'operator', category: '기타', description: 'AI 트렌드 세미나' },
  { id: 'sch12', trackId: 'track1', title: '중간 회고', startDate: '2026-02-19', endDate: '2026-02-19', source: 'operator', category: '기타', description: '학습 진행 중간 회고' },
  { id: 'sch13', trackId: 'track1', title: '보충수업 (심화)', startDate: '2026-02-25', endDate: '2026-02-26', source: 'operator', category: '강의', description: '심화 학습 보충' },
  // track2 — 시스템 일정
  { id: 'sch14', trackId: 'track2', title: 'OT 및 환경 설정', startDate: '2026-02-02', endDate: '2026-02-08', source: 'system', category: '강의' },
  { id: 'sch15', trackId: 'track2', title: '기초 이론 강의', startDate: '2026-02-09', endDate: '2026-02-15', source: 'system', category: '강의' },
]

// -- Chapters --

export const mockChapters: ChapterInfo[] = [
  { id: 'ch1', name: '챕터 1: OT 및 환경 설정', startDate: '2026-01-26', endDate: '2026-02-01', trackId: 'track1' },
  { id: 'ch2', name: '챕터 2: 기초 이론', startDate: '2026-02-02', endDate: '2026-02-08', trackId: 'track1' },
  { id: 'ch3', name: '챕터 3: 심화 학습', startDate: '2026-02-09', endDate: '2026-02-15', trackId: 'track1' },
  { id: 'ch4', name: '챕터 4: 중간 평가', startDate: '2026-02-16', endDate: '2026-02-22', trackId: 'track1' },
  { id: 'ch5', name: '챕터 5: 프로젝트', startDate: '2026-02-23', endDate: '2026-03-01', trackId: 'track1' },
  { id: 'ch6', name: '챕터 1: OT 및 환경 설정', startDate: '2026-02-02', endDate: '2026-02-08', trackId: 'track2' },
  { id: 'ch7', name: '챕터 2: 기초 이론', startDate: '2026-02-09', endDate: '2026-02-15', trackId: 'track2' },
]

// -- Notifications --

export const mockNotifications: AppNotification[] = [
  { id: 'noti1', type: 'task_overdue', category: 'system', title: '기한초과: 오전 팀순회', description: '이학관 - AI 트랙 7기, 11:00 마감', timestamp: '2026-02-11 11:05', isRead: false, isMandatory: true, linkTo: '/operator/tracks/track1', recipientRole: 'operator', relatedTrackId: 'track1', relatedTaskId: 'tt7', relatedStaffId: 'staff2', isEscalatedAway: true },
  { id: 'noti2', type: 'task_overdue', category: 'system', title: '기한초과: 오후 팀순회', description: '박학관 - AI 트랙 7기, 15:00 마감', timestamp: '2026-02-11 15:05', isRead: false, isMandatory: true, linkTo: '/operator/tracks/track1', recipientRole: 'operator', relatedTrackId: 'track1', relatedTaskId: 'tt13', relatedStaffId: 'staff3' },
  { id: 'noti3', type: 'task_unassigned', category: 'system', title: '미배정 Task 알림', description: 'AI 트랙 7기 - 미배정 Task 2건', timestamp: '2026-02-11 11:30', isRead: false, isMandatory: true, linkTo: '/operator/tracks/track1#unassigned', recipientRole: 'operator', relatedTrackId: 'track1', relatedTaskId: 'tt16' },
  { id: 'noti4', type: 'vacation_registered', category: 'action', title: '휴가 등록: 박학관', description: '박학관 휴가(2/16~17) - 6건 미배정 발생', timestamp: '2026-02-11 09:00', isRead: false, isMandatory: true, linkTo: '/operator/tracks/track1/staff/staff3', recipientRole: 'operator', relatedTrackId: 'track1', relatedStaffId: 'staff3' },
  { id: 'noti5', type: 'issue_urgent', category: 'action', title: '긴급 이슈: 교육장 에어컨 고장', description: '김학관 - AI 트랙 7기', timestamp: '2026-02-10 08:30', isRead: true, isMandatory: true, linkTo: '/manager/tracks/track1/staff/staff1#issues', recipientRole: 'operator_manager', relatedTrackId: 'track1', relatedStaffId: 'staff1' },
  { id: 'noti6', type: 'issue_new', category: 'action', title: '새 이슈: 교육 자료 요청', description: '이학관 - AI 트랙 7기', timestamp: '2026-02-10 05:00', isRead: true, isMandatory: true, linkTo: '/operator/tracks/track1/staff/staff2#issues', recipientRole: 'operator', relatedTrackId: 'track1', relatedStaffId: 'staff2', isEscalatedAway: true },
  { id: 'noti7', type: 'message_new', category: 'action', title: '새 메시지: 김학관', description: '1팀 김철수 학생 추가 상담 필요합니다.', timestamp: '2026-02-11 10:30', isRead: false, isMandatory: true, linkTo: '/operator/tracks/track1/staff/staff1', recipientRole: 'operator', relatedTrackId: 'track1', relatedStaffId: 'staff1' },
  { id: 'noti8', type: 'message_new', category: 'action', title: '새 메시지: 박학관', description: '죄송합니다. 학생 이슈 대응하느라 늦었습니다.', timestamp: '2026-02-11 11:20', isRead: true, isMandatory: true, linkTo: '/operator/tracks/track1/staff/staff3', recipientRole: 'operator', relatedTrackId: 'track1', relatedStaffId: 'staff3' },
  { id: 'noti9', type: 'task_completed', category: 'action', title: 'Task 완료: 출석 체크', description: '김학관 - AI 트랙 7기, 09:25 완료', timestamp: '2026-02-11 09:25', isRead: true, isMandatory: false, linkTo: '/operator/tracks/track1/staff/staff1', recipientRole: 'operator', relatedTrackId: 'track1', relatedTaskId: 'tt1', relatedStaffId: 'staff1' },
  { id: 'noti10', type: 'task_completed', category: 'action', title: 'Task 완료: 수강생 출결 리포트', description: '김학관 - AI 트랙 7기, 11:40 완료', timestamp: '2026-02-11 11:40', isRead: true, isMandatory: false, linkTo: '/operator/tracks/track1/staff/staff1', recipientRole: 'operator', relatedTrackId: 'track1', relatedTaskId: 'tt5', relatedStaffId: 'staff1' },
  { id: 'noti11', type: 'task_overdue', category: 'system', title: '기한초과: 수강생 진도 체크', description: '한학관 - BE 트랙 5기, 12:00 마감', timestamp: '2026-02-11 12:05', isRead: false, isMandatory: true, linkTo: '/operator/tracks/track2', recipientRole: 'operator', relatedTrackId: 'track2', relatedTaskId: 'tt26', relatedStaffId: 'staff4' },
  { id: 'noti12', type: 'task_completed', category: 'action', title: 'Task 완료: 오전 팀순회', description: '정학관 - BE 트랙 5기, 10:50 완료', timestamp: '2026-02-11 10:50', isRead: true, isMandatory: false, linkTo: '/operator/tracks/track2/staff/staff5', recipientRole: 'operator', relatedTrackId: 'track2', relatedTaskId: 'tt20', relatedStaffId: 'staff5' },
  { id: 'noti13', type: 'task_assigned', category: 'action', title: 'Task 배정: 특별 멘토링 세션 준비', description: '김학관에게 배정 - AI 트랙 7기', timestamp: '2026-02-11 08:30', isRead: true, isMandatory: true, linkTo: '/', recipientRole: 'learning_manager', relatedTrackId: 'track1', relatedTaskId: 'tt16', relatedStaffId: 'staff1' },
  { id: 'noti14', type: 'notice_new', category: 'action', title: '새 공지: 2월 셋째주 일정 안내', description: '운영매니저 → 전체 학관', timestamp: '2026-02-11 09:00', isRead: true, isMandatory: true, linkTo: '/', recipientRole: 'learning_manager', relatedTrackId: 'track1' },
  { id: 'noti15', type: 'task_overdue', category: 'system', title: '[에스컬레이션] 기한초과: 오전 팀순회', description: '이학관 - AI 트랙 7기 (운영 미처리 4h 경과)', timestamp: '2026-02-11 15:05', isRead: false, isMandatory: true, linkTo: '/operator/tracks/track1', recipientRole: 'operator_manager', relatedTrackId: 'track1', relatedTaskId: 'tt7', relatedStaffId: 'staff2', escalation: { isEscalated: true, originalRecipientRole: 'operator', escalatedAt: '2026-02-11 15:05' } },
  { id: 'noti16', type: 'issue_new', category: 'action', title: '[에스컬레이션] 이슈 미처리: 교육 자료 요청', description: '이학관 - AI 트랙 7기 (운영 미처리 8h 경과)', timestamp: '2026-02-11 13:00', isRead: false, isMandatory: true, linkTo: '/operator/tracks/track1', recipientRole: 'operator_manager', relatedTrackId: 'track1', relatedStaffId: 'staff2', escalation: { isEscalated: true, originalRecipientRole: 'operator', escalatedAt: '2026-02-11 13:00' } },
]

// -- Notification Configs --

export const mockNotificationConfigs: NotificationConfig[] = [
  { trackId: 'track1', ...DEFAULT_NOTIFICATION_CONFIG },
  { trackId: 'track2', ...DEFAULT_NOTIFICATION_CONFIG },
  { trackId: 'track3', ...DEFAULT_NOTIFICATION_CONFIG },
]
