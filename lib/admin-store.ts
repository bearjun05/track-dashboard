import { create } from 'zustand'
import type {
  OperatorCard,
  TrackCard,
  StaffCard,
  StaffConversation,
  StaffIssue,
  StaffTask,
  StaffMessage,
  OperatorTask,
  OperatorTrackDetail,
  KanbanCard,
  KanbanStatus,
  RequesterRole,
  ChatRoom,
  ChatBubbleData,
  PlannerTrackCard,
  CohortInfo,
  TrackTask,
  TrackTaskStatus,
  AppNotification,
  NotificationType,
  NotificationCategory,
  RecipientRole,
  NotificationConfig,
  TrackSchedule,
  TrackNotice,
  NoticeReply,
  VacationEntry,
  WorkScheduleEntry,
  ChapterInfo,
} from './admin-mock-data'
import type { Chapter, TrackStaffAssignment, GeneratedTask } from './track-creation-types'
import {
  mockOperators,
  mockTracks,
  mockStaffCards,
  mockStaffConversations,
  mockStaffIssues,
  mockStaffTasks,
  mockOperatorTasks,
  mockOperatorTrackDetails,
  mockKanbanCards,
  mockChatRooms,
  mockPlannerTracks,
  mockCohorts,
  mockTrackTasks,
  mockNotifications,
  mockTrackSchedules,
  mockTrackNotices,
  mockNotificationConfigs,
  mockChapters,
  NOTIFICATION_TYPE_CONFIG,
} from './admin-mock-data'

interface AdminState {
  // Data
  operators: OperatorCard[]
  tracks: TrackCard[]
  staffCards: StaffCard[]
  staffConversations: StaffConversation[]
  staffIssues: StaffIssue[]
  staffTasks: StaffTask[]
  operatorTasks: Record<string, OperatorTask[]>
  operatorTrackDetails: Record<string, OperatorTrackDetail[]>
  chapters: ChapterInfo[]
  userRole: 'operator_manager' | 'operator'

  // Kanban
  kanbanCards: KanbanCard[]
  chatRooms: ChatRoom[]
  plannerTracks: PlannerTrackCard[]
  cohorts: CohortInfo[]

  // Track Tasks
  trackTasks: TrackTask[]
  assignTask: (taskId: string, staffId: string, staffName: string) => void
  bulkAssignTasks: (taskIds: string[], staffId: string, staffName: string) => void
  reassignTask: (taskId: string, staffId: string, staffName: string, newDueDate?: string) => void
  updateTrackTaskStatus: (taskId: string, status: TrackTaskStatus) => void
  addTrackTask: (task: TrackTask) => void
  addTaskMessage: (taskId: string, content: string) => void
  deferTask: (taskId: string, newStartDate: string, newEndDate?: string) => void
  moveTaskToToday: (taskId: string) => void
  moveTaskToDate: (taskId: string, newDate: string) => void

  // Track Schedules
  trackSchedules: TrackSchedule[]
  addTrackSchedule: (schedule: TrackSchedule) => void
  updateTrackSchedule: (id: string, updates: Partial<Omit<TrackSchedule, 'id' | 'source'>>) => void
  removeTrackSchedule: (id: string) => void

  // Track Notices (공지)
  trackNotices: TrackNotice[]
  addTrackNotice: (notice: TrackNotice) => void
  removeTrackNotice: (id: string) => void
  addTrackNoticeReply: (noticeId: string, content: string) => void
  extendTrackNotice: (noticeId: string, newExpiresAt: string) => void
  markNoticeRead: (noticeId: string, userId: string) => void

  // Notifications
  notifications: AppNotification[]
  notificationConfigs: NotificationConfig[]
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void
  updateNotificationConfig: (trackId: string, updates: Partial<Omit<NotificationConfig, 'trackId'>>) => void

  // Kanban actions
  moveKanbanCard: (cardId: string, newStatus: KanbanStatus) => void
  updateKanbanCardStatus: (cardId: string, newStatus: KanbanStatus) => void
  addKanbanReply: (cardId: string, content: string) => void
  addKanbanCard: (card: {
    trackName: string
    trackColor: string
    operatorName: string
    requesterRole: RequesterRole
    requesterName: string
    title: string
    content: string
    isUrgent: boolean
  }) => void

  // Chat actions (기수별 카드별 채팅)
  addChatMessage: (roomId: string, content: string, relatedKanbanId?: string) => void
  addCardChatMessage: (cardId: string, content: string) => void
  getKanbanLinkedMessages: (kanbanId: string) => ChatBubbleData[]

  // Staff detail actions
  addConversationMessage: (convId: string, content: string) => void
  addIssueReply: (issueId: string, content: string, status?: StaffIssue['status'], assignee?: string) => void
  updateIssueStatus: (issueId: string, status: StaffIssue['status']) => void

  // Staff management (학습관리매니저 관리 모달)
  setStaffVacation: (staffId: string, vacation: VacationEntry) => string[]
  updateStaffWorkSchedule: (staffId: string, schedule: WorkScheduleEntry[]) => void
  updateStaffMemo: (staffId: string, memo: string) => void
  removeStaffVacation: (staffId: string, vacationId: string) => void

  // Track Creation / Edit
  createTrack: (data: {
    name: string
    round: number
    trackStart: string
    trackEnd: string
    chapters: Chapter[]
    staff: TrackStaffAssignment
    tasks: GeneratedTask[]
  }) => void
  updateTrack: (trackId: string, data: {
    name: string
    round: number
    trackStart: string
    trackEnd: string
    chapters: Chapter[]
    staff: TrackStaffAssignment
    tasks: GeneratedTask[]
  }) => void
  deleteTrack: (trackId: string) => void
}

export const useAdminStore = create<AdminState>((set, get) => ({
  operators: mockOperators,
  tracks: mockTracks,
  staffCards: mockStaffCards,
  staffConversations: mockStaffConversations,
  staffIssues: mockStaffIssues,
  staffTasks: mockStaffTasks,
  operatorTasks: mockOperatorTasks,
  operatorTrackDetails: mockOperatorTrackDetails,
  chapters: mockChapters,
  userRole: 'operator_manager',

  kanbanCards: mockKanbanCards,
  chatRooms: mockChatRooms,
  plannerTracks: mockPlannerTracks,
  cohorts: mockCohorts,
  trackTasks: mockTrackTasks,
  trackSchedules: mockTrackSchedules,
  trackNotices: mockTrackNotices,
  notifications: mockNotifications,
  notificationConfigs: mockNotificationConfigs,

  addNotification: (notification) => {
    const now = new Date()
    const newNoti: AppNotification = {
      ...notification,
      id: `noti_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\. /g, '-').replace('.', ''),
      isRead: false,
    }
    set((state) => ({
      notifications: [newNoti, ...state.notifications],
    }))
  },

  updateNotificationConfig: (trackId, updates) =>
    set((state) => ({
      notificationConfigs: state.notificationConfigs.map((c) =>
        c.trackId === trackId ? { ...c, ...updates } : c,
      ),
    })),

  assignTask: (taskId, staffId, staffName) => {
    const task = get().trackTasks.find((t) => t.id === taskId)
    set((state) => ({
      trackTasks: state.trackTasks.map((t) =>
        t.id === taskId ? { ...t, assigneeId: staffId, assigneeName: staffName, status: 'pending' as TrackTaskStatus, unassignedReason: undefined } : t,
      ),
    }))
    if (task) {
      get().addNotification({
        type: 'task_assigned', category: 'action', isMandatory: true, recipientRole: 'learning_manager',
        title: `Task 배정: ${task.title}`, description: `${staffName}에게 배정`,
        linkTo: '/', relatedTrackId: task.trackId, relatedTaskId: taskId, relatedStaffId: staffId,
      })
    }
  },

  bulkAssignTasks: (taskIds, staffId, staffName) => {
    const tasks = get().trackTasks.filter((t) => taskIds.includes(t.id))
    set((state) => ({
      trackTasks: state.trackTasks.map((t) =>
        taskIds.includes(t.id) ? { ...t, assigneeId: staffId, assigneeName: staffName, status: 'pending' as TrackTaskStatus, unassignedReason: undefined } : t,
      ),
    }))
    if (tasks.length > 0) {
      get().addNotification({
        type: 'task_assigned', category: 'action', isMandatory: true, recipientRole: 'learning_manager',
        title: `Task 일괄 배정: ${tasks.length}건`, description: `${staffName}에게 ${tasks.length}건 배정`,
        linkTo: '/', relatedTrackId: tasks[0].trackId, relatedStaffId: staffId,
      })
    }
  },

  reassignTask: (taskId, staffId, staffName, newDueDate) => {
    const task = get().trackTasks.find((t) => t.id === taskId)
    const prevAssignee = task?.assigneeName
    set((state) => ({
      trackTasks: state.trackTasks.map((t) =>
        t.id === taskId ? { ...t, assigneeId: staffId, assigneeName: staffName, status: 'pending' as TrackTaskStatus, unassignedReason: undefined, scheduledDate: newDueDate ?? t.scheduledDate } : t,
      ),
    }))
    if (task) {
      get().addNotification({
        type: 'task_reassigned', category: 'action', isMandatory: true, recipientRole: 'learning_manager',
        title: `Task 재배정: ${task.title}`, description: `${prevAssignee ?? '미배정'} → ${staffName}`,
        linkTo: '/', relatedTrackId: task.trackId, relatedTaskId: taskId, relatedStaffId: staffId,
      })
    }
  },

  updateTrackTaskStatus: (taskId, status) => {
    const task = get().trackTasks.find((t) => t.id === taskId)
    set((state) => ({
      trackTasks: state.trackTasks.map((t) =>
        t.id === taskId ? { ...t, status } : t,
      ),
    }))
    if (task && status === 'completed') {
      get().addNotification({
        type: 'task_completed', category: 'action', isMandatory: false, recipientRole: 'operator',
        title: `Task 완료: ${task.title}`, description: `${task.assigneeName ?? '알수없음'} - 완료 처리`,
        linkTo: `/staff/${task.assigneeId}`,
        relatedTrackId: task.trackId, relatedTaskId: taskId, relatedStaffId: task.assigneeId,
      })
    }
  },

  addTrackTask: (task) =>
    set((state) => ({
      trackTasks: [...state.trackTasks, task],
    })),

  addTaskMessage: (taskId, content) => {
    const task = get().trackTasks.find((t) => t.id === taskId)
    set((state) => ({
      trackTasks: state.trackTasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              messages: [
                ...t.messages,
                {
                  id: `msg-${Date.now()}`,
                  authorName: '이운영',
                  content,
                  timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                  isSelf: true,
                },
              ],
            }
          : t,
      ),
    }))
    if (task?.assigneeId) {
      get().addNotification({
        type: 'message_new', category: 'action', isMandatory: true, recipientRole: 'learning_manager',
        title: `새 메시지: ${task.title}`, description: content.slice(0, 50),
        linkTo: '/', relatedTrackId: task.trackId, relatedTaskId: taskId, relatedStaffId: task.assigneeId,
      })
    }
  },

  deferTask: (taskId, newStartDate, newEndDate) =>
    set((state) => ({
      trackTasks: state.trackTasks.map((t) => {
        if (t.id !== taskId) return t
        const updated: TrackTask = { ...t, scheduledDate: newStartDate }
        if (newEndDate) updated.endDate = newEndDate
        else if (t.endDate) {
          const diff = new Date(t.endDate).getTime() - new Date(t.scheduledDate).getTime()
          updated.endDate = new Date(new Date(newStartDate).getTime() + diff).toISOString().split('T')[0]
        }
        return updated
      }),
    })),

  moveTaskToToday: (taskId) =>
    set((state) => {
      const today = new Date().toISOString().split('T')[0]
      return {
        trackTasks: state.trackTasks.map((t) => {
          if (t.id !== taskId) return t
          const updated: TrackTask = { ...t, scheduledDate: today }
          if (t.endDate) {
            const diff = new Date(t.endDate).getTime() - new Date(t.scheduledDate).getTime()
            updated.endDate = new Date(new Date(today).getTime() + diff).toISOString().split('T')[0]
          }
          return updated
        }),
      }
    }),

  moveTaskToDate: (taskId, newDate) =>
    set((state) => ({
      trackTasks: state.trackTasks.map((t) => {
        if (t.id !== taskId) return t
        const updated: TrackTask = { ...t, scheduledDate: newDate }
        if (t.endDate) {
          const diff = new Date(t.endDate).getTime() - new Date(t.scheduledDate).getTime()
          updated.endDate = new Date(new Date(newDate).getTime() + diff).toISOString().split('T')[0]
        }
        return updated
      }),
    })),

  addTrackSchedule: (schedule) =>
    set((state) => ({
      trackSchedules: [...state.trackSchedules, schedule],
    })),

  updateTrackSchedule: (id, updates) =>
    set((state) => ({
      trackSchedules: state.trackSchedules.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    })),

  removeTrackSchedule: (id) =>
    set((state) => ({
      trackSchedules: state.trackSchedules.filter((s) => s.id !== id),
    })),

  addTrackNotice: (notice) => {
    set((state) => ({
      trackNotices: [notice, ...state.trackNotices],
    }))
    get().addNotification({
      type: 'notice_new', category: 'action', isMandatory: true, recipientRole: 'learning_manager',
      title: `새 공지: ${notice.content.slice(0, 20)}`, description: notice.targetStaffName ? `${notice.targetStaffName}에게` : '전체 학관 대상',
      linkTo: '/', relatedTrackId: notice.trackId, relatedStaffId: notice.targetStaffId ?? undefined,
    })
  },

  removeTrackNotice: (id) =>
    set((state) => ({
      trackNotices: state.trackNotices.filter((n) => n.id !== id),
    })),

  addTrackNoticeReply: (noticeId, content) => {
    const notice = get().trackNotices.find((n) => n.id === noticeId)
    set((state) => ({
      trackNotices: state.trackNotices.map((n) =>
        n.id === noticeId
          ? {
              ...n,
              replies: [
                ...n.replies,
                {
                  id: `tnr-${Date.now()}`,
                  authorName: '이운영',
                  content,
                  timestamp: new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\. /g, '-').replace('.', ''),
                  isManager: true,
                },
              ],
            }
          : n,
      ),
    }))
    if (notice) {
      get().addNotification({
        type: 'notice_replied', category: 'action', isMandatory: false, recipientRole: 'operator',
        title: '공지 답변', description: content.slice(0, 50),
        linkTo: `/tracks/${notice.trackId}#notices`, relatedTrackId: notice.trackId,
      })
    }
  },

  extendTrackNotice: (noticeId, newExpiresAt) =>
    set((state) => ({
      trackNotices: state.trackNotices.map((n) =>
        n.id === noticeId ? { ...n, expiresAt: newExpiresAt } : n,
      ),
    })),

  markNoticeRead: (noticeId, userId) =>
    set((state) => ({
      trackNotices: state.trackNotices.map((n) =>
        n.id === noticeId && !n.readBy.includes(userId) ? { ...n, readBy: [...n.readBy, userId] } : n,
      ),
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),

  moveKanbanCard: (cardId, newStatus) =>
    set((state) => ({
      kanbanCards: state.kanbanCards.map((c) =>
        c.id === cardId ? { ...c, status: newStatus } : c,
      ),
    })),

  updateKanbanCardStatus: (cardId, newStatus) =>
    set((state) => ({
      kanbanCards: state.kanbanCards.map((c) =>
        c.id === cardId ? { ...c, status: newStatus } : c,
      ),
    })),

  addKanbanReply: (cardId, content) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    const card = get().kanbanCards.find((c) => c.id === cardId)

    set((state) => {
      const newKanbanCards = state.kanbanCards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              status: c.status === 'waiting' ? ('in-progress' as KanbanStatus) : c.status,
              messages: [
                ...c.messages,
                { id: `kbr-${Date.now()}`, authorName: '나', content, timestamp: now, isSelf: true } as StaffMessage,
              ],
            }
          : c,
      )

      let newChatRooms = state.chatRooms
      if (card) {
        const matchRoom = state.chatRooms.find((r) => r.operatorName === card.operatorName)
        if (matchRoom) {
          newChatRooms = state.chatRooms.map((r) =>
            r.id === matchRoom.id
              ? {
                  ...r,
                  lastMessage: content,
                  lastTime: now,
                  messages: [
                    ...r.messages,
                    {
                      id: `kbr-chat-${Date.now()}`,
                      isSelf: true,
                      authorName: '나',
                      message: content,
                      time: now,
                      relatedKanbanId: cardId,
                      taskTitle: card.title,
                    } as ChatBubbleData,
                  ],
                }
              : r,
          )
        }
      }

      return { kanbanCards: newKanbanCards, chatRooms: newChatRooms }
    })

    if (card) {
      get().addNotification({
        type: 'kanban_replied', category: 'action', isMandatory: false, recipientRole: 'operator',
        title: `칸반 답변: ${card.title}`, description: content.slice(0, 50),
        linkTo: '/operators/op1',
      })
    }
  },

  addKanbanCard: (card) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    const todayStr = new Date().toISOString().split('T')[0]
    const newCard: KanbanCard = {
      id: `kb-${Date.now()}`,
      trackName: card.trackName,
      trackColor: card.trackColor,
      operatorName: card.operatorName,
      requesterRole: card.requesterRole,
      requesterName: card.requesterName,
      title: card.title,
      content: card.content,
      timeAgo: '방금 전',
      createdAt: `${todayStr} ${now}`,
      isUrgent: card.isUrgent,
      status: 'waiting',
      messages: [],
    }
    set((state) => ({
      kanbanCards: [newCard, ...state.kanbanCards],
    }))
    get().addNotification({
      type: 'kanban_created', category: 'action', isMandatory: true, recipientRole: 'operator',
      title: `새 칸반 카드: ${card.title}`, description: `${card.requesterName} (${card.requesterRole})`,
      linkTo: '/operators/op1',
    })
  },

  addCardChatMessage: (cardId, content) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    set((state) => ({
      kanbanCards: state.kanbanCards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: `msg-${Date.now()}`,
                  authorName: '이운기 (총괄)',
                  content,
                  timestamp: now,
                  isSelf: true,
                } as StaffMessage,
              ],
            }
          : c,
      ),
    }))
  },

  addChatMessage: (roomId, content, relatedKanbanId) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    const newBubble: ChatBubbleData = {
      id: `cm-${Date.now()}`,
      isSelf: true,
      authorName: '나',
      message: content,
      time: now,
      relatedKanbanId,
    }

    set((state) => {
      // 1. Add message to chat room
      const newChatRooms = state.chatRooms.map((r) =>
        r.id === roomId
          ? { ...r, lastMessage: content, lastTime: now, unreadCount: 0, messages: [...r.messages, newBubble] }
          : r,
      )

      // 2. If tagged to a kanban card, also sync to that card's messages
      let newKanbanCards = state.kanbanCards
      if (relatedKanbanId) {
        newKanbanCards = state.kanbanCards.map((c) =>
          c.id === relatedKanbanId
            ? {
                ...c,
                status: c.status === 'waiting' ? ('in-progress' as KanbanStatus) : c.status,
                messages: [
                  ...c.messages,
                  { id: newBubble.id, authorName: '나', content, timestamp: now, isSelf: true } as StaffMessage,
                ],
              }
            : c,
        )
      }

      return { chatRooms: newChatRooms, kanbanCards: newKanbanCards }
    })
  },

  getKanbanLinkedMessages: (kanbanId) => {
    const state = useAdminStore.getState()
    const linked: ChatBubbleData[] = []
    for (const room of state.chatRooms) {
      for (const msg of room.messages) {
        if (msg.relatedKanbanId === kanbanId) {
          linked.push(msg)
        }
      }
    }
    return linked
  },

  addConversationMessage: (convId, content) => {
    set((state) => ({
      staffConversations: state.staffConversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: `msg-${Date.now()}`,
                  authorName: '이운영',
                  content,
                  timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                  isSelf: true,
                } as StaffMessage,
              ],
            }
          : c,
      ),
    }))
    const conv = get().staffConversations.find((c) => c.id === convId)
    if (conv) {
      get().addNotification({
        type: 'message_new', category: 'action', isMandatory: true, recipientRole: 'learning_manager',
        title: `새 메시지: ${conv.taskTitle}`, description: content.slice(0, 50),
        linkTo: '/',
      })
    }
  },

  addIssueReply: (issueId, content, status, assignee) => {
    const issue = get().staffIssues.find((i) => i.id === issueId)
    set((state) => ({
      staffIssues: state.staffIssues.map((i) =>
        i.id === issueId
          ? {
              ...i,
              status: status ?? i.status,
              assignee: assignee ?? i.assignee,
              replies: [
                ...i.replies,
                {
                  id: `reply-${Date.now()}`,
                  authorName: '이운영',
                  content,
                  timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                  isSelf: true,
                },
              ],
            }
          : i,
      ),
    }))
    if (issue) {
      get().addNotification({
        type: 'issue_replied', category: 'action', isMandatory: true, recipientRole: 'learning_manager',
        title: `이슈 답변: ${issue.title}`, description: content.slice(0, 50),
        linkTo: '/', relatedIssueId: issueId,
      })
    }
  },

  updateIssueStatus: (issueId, status) => {
    const issue = get().staffIssues.find((i) => i.id === issueId)
    set((state) => ({
      staffIssues: state.staffIssues.map((i) =>
        i.id === issueId ? { ...i, status } : i,
      ),
    }))
    if (issue) {
      const statusLabel = status === 'pending' ? '대기' : status === 'in-progress' ? '처리중' : '완료'
      get().addNotification({
        type: 'issue_status_changed', category: 'action', isMandatory: false, recipientRole: 'learning_manager',
        title: `이슈 상태변경: ${issue.title}`, description: `→ ${statusLabel}`,
        linkTo: '/', relatedIssueId: issueId,
      })
    }
  },

  setStaffVacation: (staffId, vacation) => {
    const affectedTaskIds: string[] = []
    const staffCard = get().staffCards.find((sc) => sc.id === staffId)
    set((state) => {
      const vStart = new Date(vacation.start)
      const vEnd = new Date(vacation.end)

      const updatedTasks = state.trackTasks.map((t) => {
        if (t.assigneeId !== staffId) return t
        const taskDate = new Date(t.scheduledDate)
        if (taskDate >= vStart && taskDate <= vEnd) {
          affectedTaskIds.push(t.id)
          return { ...t, status: 'unassigned' as TrackTaskStatus, assigneeId: undefined, assigneeName: undefined, unassignedReason: '휴가' }
        }
        return t
      })

      const updatedStaffCards = state.staffCards.map((sc) => {
        if (sc.id !== staffId) return sc
        const isCurrentOrFuture = vEnd >= new Date()
        return {
          ...sc,
          vacationHistory: [...sc.vacationHistory, vacation],
          vacation: isCurrentOrFuture ? { start: vacation.start, end: vacation.end } : sc.vacation,
        }
      })

      return { trackTasks: updatedTasks, staffCards: updatedStaffCards }
    })
    const staffName = staffCard?.name ?? '학관'
    get().addNotification({
      type: 'vacation_registered', category: 'action', isMandatory: true, recipientRole: 'operator_manager',
      title: `휴가 등록: ${staffName}`, description: `${vacation.start} ~ ${vacation.end}, ${affectedTaskIds.length}건 미배정 발생`,
      linkTo: `/staff/${staffId}`, relatedStaffId: staffId,
    })
    return affectedTaskIds
  },

  removeStaffVacation: (staffId, vacationId) =>
    set((state) => ({
      staffCards: state.staffCards.map((sc) =>
        sc.id === staffId
          ? { ...sc, vacationHistory: sc.vacationHistory.filter((v) => v.id !== vacationId) }
          : sc,
      ),
    })),

  updateStaffWorkSchedule: (staffId, schedule) =>
    set((state) => ({
      staffCards: state.staffCards.map((sc) =>
        sc.id === staffId ? { ...sc, workSchedule: schedule } : sc,
      ),
    })),

  updateStaffMemo: (staffId, memo) =>
    set((state) => ({
      staffCards: state.staffCards.map((sc) =>
        sc.id === staffId ? { ...sc, memo } : sc,
      ),
    })),

  createTrack: (data) =>
    set((state) => {
      const trackId = `track-${Date.now()}`
      const trackColor = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'][state.tracks.length % 5]

      const newTrack: TrackCard = {
        id: trackId,
        name: `${data.name} ${data.round}회차`,
        staffAvgCompletion: 0,
        issueResolutionRate: 0,
        urgentIssues: 0,
        pendingRequests: 0,
        staffCount: data.staff.learningManagers.length,
        studentCount: 0,
        isOwned: true,
      }

      const newPlannerTrack: PlannerTrackCard = {
        id: trackId,
        name: `${data.name} ${data.round}회차`,
        period: `${data.trackStart} ~ ${data.trackEnd}`,
        color: trackColor,
        completionRate: 0,
        issueSummary: { total: 0, waiting: 0, inProgress: 0, done: 0 },
        staffCount: data.staff.learningManagers.length,
        studentCount: 0,
        tutorCount: data.staff.tutors.length,
        operator: data.staff.operators[0] ? {
          id: `op-${Date.now()}`,
          name: data.staff.operators[0].name,
          taskCompletionRate: 0,
          taskCompleted: 0,
          taskTotal: 0,
          issueResolutionRate: 0,
          issueResolved: 0,
          issueTotal: 0,
        } : undefined,
      }

      const newChapters: ChapterInfo[] = data.chapters.map((ch) => ({
        id: ch.id,
        name: ch.name,
        startDate: ch.startDate,
        endDate: ch.endDate,
        trackId,
      }))

      const newSchedules: TrackSchedule[] = data.chapters.map((ch) => ({
        id: `sch-${ch.id}`,
        trackId,
        title: ch.name,
        startDate: ch.startDate,
        endDate: ch.endDate,
        source: 'system' as const,
        category: '강의' as const,
      }))

      const newTrackTasks: TrackTask[] = data.tasks
        .filter(t => t.status !== 'deferred')
        .map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          type: (t.frequency === 'daily' ? 'daily' : t.frequency === 'once' || t.frequency === 'per_chapter' ? 'milestone' : 'manual') as TrackTask['type'],
          templateId: t.templateId,
          trackId,
          assigneeId: t.assigneeId,
          assigneeName: t.assigneeName,
          status: (t.assigneeId ? 'pending' : 'unassigned') as TrackTaskStatus,
          scheduledDate: t.scheduledDate,
          endDate: t.dueDate !== t.scheduledDate ? t.dueDate : undefined,
          scheduledTime: t.scheduledTime,
          messages: [],
        }))

      return {
        tracks: [...state.tracks, newTrack],
        plannerTracks: [...state.plannerTracks, newPlannerTrack],
        trackSchedules: [...state.trackSchedules, ...newSchedules],
        trackTasks: [...state.trackTasks, ...newTrackTasks],
      }
    }),

  updateTrack: (trackId, data) =>
    set((state) => {
      const existing = state.plannerTracks.find(t => t.id === trackId)
      const trackColor = existing?.color || '#3B82F6'
      const displayName = `${data.name} ${data.round}회차`

      const updatedTrack: TrackCard = {
        ...(state.tracks.find(t => t.id === trackId) as TrackCard),
        name: displayName,
        staffCount: data.staff.learningManagers.length,
      }

      const updatedPlannerTrack: PlannerTrackCard = {
        ...(existing as PlannerTrackCard),
        name: displayName,
        period: `${data.trackStart} ~ ${data.trackEnd}`,
        staffCount: data.staff.learningManagers.length,
        tutorCount: data.staff.tutors.length,
        operator: data.staff.operators[0] ? {
          id: existing?.operator?.id || `op-${Date.now()}`,
          name: data.staff.operators[0].name,
          taskCompletionRate: existing?.operator?.taskCompletionRate || 0,
          taskCompleted: existing?.operator?.taskCompleted || 0,
          taskTotal: existing?.operator?.taskTotal || 0,
          issueResolutionRate: existing?.operator?.issueResolutionRate || 0,
          issueResolved: existing?.operator?.issueResolved || 0,
          issueTotal: existing?.operator?.issueTotal || 0,
        } : undefined,
        staff: data.staff.learningManagers.map(lm => ({
          id: lm.id,
          name: lm.name,
          taskCompletionRate: existing?.staff?.find(s => s.id === lm.id)?.taskCompletionRate || 0,
        })),
      }

      const newSchedules: TrackSchedule[] = data.chapters.map((ch) => ({
        id: `sch-${ch.id}`,
        trackId,
        title: ch.name,
        startDate: ch.startDate,
        endDate: ch.endDate,
        source: 'system' as const,
        category: '강의' as const,
      }))

      const newTrackTasks: TrackTask[] = data.tasks
        .filter(t => t.status !== 'deferred')
        .map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          type: (t.frequency === 'daily' ? 'daily' : t.frequency === 'once' || t.frequency === 'per_chapter' ? 'milestone' : 'manual') as TrackTask['type'],
          templateId: t.templateId,
          trackId,
          assigneeId: t.assigneeId,
          assigneeName: t.assigneeName,
          status: (t.assigneeId ? 'pending' : 'unassigned') as TrackTaskStatus,
          scheduledDate: t.scheduledDate,
          endDate: t.dueDate !== t.scheduledDate ? t.dueDate : undefined,
          scheduledTime: t.scheduledTime,
          messages: [],
        }))

      return {
        tracks: state.tracks.map(t => t.id === trackId ? updatedTrack : t),
        plannerTracks: state.plannerTracks.map(t => t.id === trackId ? updatedPlannerTrack : t),
        trackSchedules: [
          ...state.trackSchedules.filter(s => s.trackId !== trackId),
          ...newSchedules,
        ],
        trackTasks: [
          ...state.trackTasks.filter(t => t.trackId !== trackId),
          ...newTrackTasks,
        ],
      }
    }),

  deleteTrack: (trackId) =>
    set((state) => ({
      plannerTracks: state.plannerTracks.filter(t => t.id !== trackId),
      tracks: state.tracks.filter(t => t.id !== trackId),
      trackTasks: state.trackTasks.filter(t => t.trackId !== trackId),
      trackSchedules: state.trackSchedules.filter(s => s.trackId !== trackId),
      trackNotices: state.trackNotices.filter(n => n.trackId !== trackId),
    })),
}))
