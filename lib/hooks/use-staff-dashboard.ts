import { useMemo } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import type { TrackTask, TrackTaskStatus } from '@/lib/admin-mock-data'
import type { UnifiedSchedule } from '@/components/schedule/schedule-types'

export interface StaffPeer {
  id: string
  name: string
}

export interface StaffDashboardData {
  staffId: string
  staffName: string | undefined
  operatorId: string | undefined
  operatorName: string | undefined
  trackPeers: StaffPeer[]

  myTasks: TrackTask[]
  todayTasks: TrackTask[]
  timedTasks: TrackTask[]
  untimedTasks: TrackTask[]
  selfTasks: TrackTask[]

  // UnifiedSchedule type별 필터 (하위 호환 이름 유지)
  trackSchedules: UnifiedSchedule[]
  chapters: UnifiedSchedule[]
  operationPeriods: UnifiedSchedule[]
  personalSchedules: UnifiedSchedule[]

  // 캘린더용 Task 분류 (daily 제외)
  calendarTasks: TrackTask[]
  periodTasks: TrackTask[]
  pointTasks: TrackTask[]

  completeTask: (taskId: string) => void
  toggleTaskStatus: (taskId: string) => void
  markInProgress: (taskId: string) => void
  requestReview: (taskId: string) => void
  cancelReview: (taskId: string) => void
  changeStatus: (taskId: string, status: TrackTaskStatus) => void
  addSelfTask: (title: string, opts?: { startDate?: string; endDate?: string; scheduledTime?: string; description?: string }) => void
  addRequestTask: (title: string, content: string, urgent?: boolean) => void
  addTaskMessage: (taskId: string, content: string) => void
  addPersonalSchedule: (title: string, date: string, time?: string, memo?: string) => void
  removePersonalSchedule: (id: string) => void
}

import { TODAY_STR } from '@/lib/date-constants'

export function useStaffDashboard(staffId: string, targetDate?: string): StaffDashboardData {
  const activeDate = targetDate ?? TODAY_STR
  const trackTasks = useAdminStore(s => s.trackTasks)
  const schedules = useAdminStore(s => s.schedules)
  const plannerTracks = useAdminStore(s => s.plannerTracks)
  const updateTrackTaskStatus = useAdminStore(s => s.updateTrackTaskStatus)
  const requestTaskReview = useAdminStore(s => s.requestTaskReview)
  const addTrackTask = useAdminStore(s => s.addTrackTask)
  const addTaskMessageAction = useAdminStore(s => s.addTaskMessage)
  const addScheduleAction = useAdminStore(s => s.addSchedule)
  const removeScheduleAction = useAdminStore(s => s.removeSchedule)

  const staffName = useMemo(() => {
    for (const track of plannerTracks) {
      const found = track.staff?.find(s => s.id === staffId)
      if (found) return found.name
    }
    return undefined
  }, [plannerTracks, staffId])

  const myTrackIds = useMemo(() => {
    const ids = new Set<string>()
    for (const track of plannerTracks) {
      if (track.staff?.some(s => s.id === staffId)) {
        ids.add(track.id)
      }
    }
    return ids
  }, [plannerTracks, staffId])

  const myOperator = useMemo(() => {
    for (const track of plannerTracks) {
      if (track.staff?.some(s => s.id === staffId) && track.operator) {
        return { id: track.operator.id, name: track.operator.name }
      }
    }
    return undefined
  }, [plannerTracks, staffId])

  const trackPeers = useMemo(() => {
    const peers: StaffPeer[] = []
    const seen = new Set<string>()
    for (const track of plannerTracks) {
      if (!track.staff?.some(s => s.id === staffId)) continue
      for (const s of track.staff) {
        if (s.id !== staffId && !seen.has(s.id)) {
          seen.add(s.id)
          peers.push({ id: s.id, name: s.name })
        }
      }
    }
    return peers.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [plannerTracks, staffId])

  const myTasks = useMemo(
    () => trackTasks.filter(t => t.assigneeId === staffId),
    [trackTasks, staffId],
  )

  const todayTasks = useMemo(
    () => myTasks.filter(t => t.scheduledDate === activeDate),
    [myTasks, activeDate],
  )

  const timedTasks = useMemo(
    () => todayTasks
      .filter(t => t.scheduledTime)
      .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '')),
    [todayTasks],
  )

  const untimedTasks = useMemo(
    () => todayTasks.filter(t => !t.scheduledTime),
    [todayTasks],
  )

  const selfTasks = useMemo(
    () => trackTasks.filter(t =>
      t.assigneeId === staffId && t.type === 'manual' && t.description?.startsWith('__self_added__')
    ),
    [trackTasks, staffId],
  )

  // Schedule type별 필터
  const trackSchedules = useMemo(
    () => schedules.filter(s =>
      (s.type === 'curriculum' || s.type === 'track_event') && s.trackId && myTrackIds.has(s.trackId)
    ),
    [schedules, myTrackIds],
  )

  const chapters = useMemo(
    () => schedules.filter(s => s.type === 'chapter' && s.trackId && myTrackIds.has(s.trackId)),
    [schedules, myTrackIds],
  )

  const operationPeriods = useMemo(
    () => schedules.filter(s => s.type === 'operation_period' && s.trackId && myTrackIds.has(s.trackId)),
    [schedules, myTrackIds],
  )

  const personalSchedules = useMemo(
    () => schedules.filter(s => s.type === 'personal' && s.creatorId === staffId),
    [schedules, staffId],
  )

  const calendarTasks = useMemo(
    () => myTasks.filter(t =>
      t.type !== 'daily' && t.status !== 'completed' && !t.description?.startsWith('__self_added__'),
    ),
    [myTasks],
  )

  const periodTasks = useMemo(
    () => calendarTasks.filter(t => t.endDate && t.endDate !== t.scheduledDate),
    [calendarTasks],
  )

  const pointTasks = useMemo(
    () => calendarTasks.filter(t => !t.endDate || t.endDate === t.scheduledDate),
    [calendarTasks],
  )

  const completeTask = (taskId: string) => {
    updateTrackTaskStatus(taskId, 'completed' as TrackTaskStatus)
  }

  const toggleTaskStatus = (taskId: string) => {
    const task = trackTasks.find(t => t.id === taskId)
    if (!task) return
    const hasReviewer = !!task.reviewerId
    let next: TrackTaskStatus

    if (task.status === 'completed' || task.status === 'pending_review') {
      next = 'in_progress' as TrackTaskStatus
    } else {
      next = hasReviewer ? ('pending_review' as TrackTaskStatus) : ('completed' as TrackTaskStatus)
    }
    updateTrackTaskStatus(taskId, next)
  }

  const addSelfTask = (title: string, opts?: { startDate?: string; endDate?: string; scheduledTime?: string; description?: string }) => {
    const trackId = myTrackIds.values().next().value ?? 'unknown'
    const desc = opts?.description ? `__self_added__\n${opts.description}` : '__self_added__'
    addTrackTask({
      id: `self-${Date.now()}`,
      title,
      type: 'manual',
      trackId,
      assigneeId: staffId,
      assigneeName: staffName,
      status: 'pending' as TrackTaskStatus,
      scheduledDate: opts?.startDate ?? activeDate,
      endDate: opts?.endDate,
      scheduledTime: opts?.scheduledTime,
      description: desc,
      messages: [],
    })
  }

  const addRequestTask = (title: string, content: string, urgent?: boolean) => {
    const trackId = myTrackIds.values().next().value ?? 'unknown'
    const desc = content ? `__request_sent__\n${content}` : '__request_sent__'
    addTrackTask({
      id: `req-${Date.now()}`,
      title,
      type: 'manual',
      trackId,
      assigneeId: staffId,
      assigneeName: staffName,
      status: 'pending_review' as TrackTaskStatus,
      scheduledDate: activeDate,
      reviewerId: myOperator?.id,
      reviewerName: myOperator?.name,
      description: desc,
      messages: urgent ? [{
        id: `reqm-${Date.now()}`,
        authorName: staffName ?? '나',
        content: '⚠️ 긴급 요청입니다',
        timestamp: new Date().toISOString(),
        isSelf: false,
      }] : [],
    })
  }

  const markInProgress = (taskId: string) => {
    const task = trackTasks.find(t => t.id === taskId)
    if (task && task.status === 'pending') {
      updateTrackTaskStatus(taskId, 'in_progress' as TrackTaskStatus)
    }
  }

  const requestReview = (taskId: string) => {
    if (!myOperator) return
    requestTaskReview(taskId, myOperator.id, myOperator.name)
  }

  const cancelReview = (taskId: string) => {
    updateTrackTaskStatus(taskId, 'in_progress' as TrackTaskStatus)
  }

  const changeStatus = (taskId: string, status: TrackTaskStatus) => {
    updateTrackTaskStatus(taskId, status)
  }

  const addTaskMessage = (taskId: string, content: string) => {
    addTaskMessageAction(taskId, content)
  }

  const addPersonalSchedule = (title: string, date: string, time?: string, memo?: string) => {
    addScheduleAction({
      id: `ps-${Date.now()}`,
      title,
      type: 'personal',
      source: 'manual',
      startDate: date,
      endDate: date,
      startTime: time,
      creatorId: staffId,
      description: memo,
      createdAt: new Date().toISOString(),
    })
  }

  const removePersonalSchedule = (id: string) => {
    removeScheduleAction(id)
  }

  return {
    staffId,
    staffName,
    operatorId: myOperator?.id,
    operatorName: myOperator?.name,
    trackPeers,
    myTasks,
    todayTasks,
    timedTasks,
    untimedTasks,
    selfTasks,
    trackSchedules,
    chapters,
    operationPeriods,
    personalSchedules,
    calendarTasks,
    periodTasks,
    pointTasks,
    completeTask,
    toggleTaskStatus,
    markInProgress,
    requestReview,
    cancelReview,
    changeStatus,
    addSelfTask,
    addRequestTask,
    addTaskMessage,
    addPersonalSchedule,
    removePersonalSchedule,
  }
}
