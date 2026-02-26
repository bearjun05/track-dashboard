import { useMemo } from 'react'
import { format } from 'date-fns'
import { useAdminStore } from '@/lib/admin-store'
import type { TrackTask, TrackSchedule, TrackTaskStatus } from '@/lib/admin-mock-data'

export interface StaffDashboardData {
  staffId: string
  staffName: string | undefined

  myTasks: TrackTask[]
  todayTasks: TrackTask[]
  timedTasks: TrackTask[]
  untimedTasks: TrackTask[]
  selfTasks: TrackTask[]

  trackSchedules: TrackSchedule[]

  completeTask: (taskId: string) => void
  toggleTaskStatus: (taskId: string) => void
  addSelfTask: (title: string) => void
  addTaskMessage: (taskId: string, content: string) => void
}

const TODAY = '2026-02-11'

export function useStaffDashboard(staffId: string): StaffDashboardData {
  const trackTasks = useAdminStore(s => s.trackTasks)
  const trackSchedules = useAdminStore(s => s.trackSchedules)
  const plannerTracks = useAdminStore(s => s.plannerTracks)
  const updateTrackTaskStatus = useAdminStore(s => s.updateTrackTaskStatus)
  const addTrackTask = useAdminStore(s => s.addTrackTask)
  const addTaskMessageAction = useAdminStore(s => s.addTaskMessage)

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

  const myTasks = useMemo(
    () => trackTasks.filter(t => t.assigneeId === staffId),
    [trackTasks, staffId],
  )

  const todayTasks = useMemo(
    () => myTasks.filter(t => t.scheduledDate === TODAY),
    [myTasks],
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
      t.assigneeId === staffId && t.type === 'manual' && t.description === '__self_added__'
    ),
    [trackTasks, staffId],
  )

  const filteredSchedules = useMemo(
    () => trackSchedules.filter(s => myTrackIds.has(s.trackId)),
    [trackSchedules, myTrackIds],
  )

  const completeTask = (taskId: string) => {
    updateTrackTaskStatus(taskId, 'completed' as TrackTaskStatus)
  }

  const toggleTaskStatus = (taskId: string) => {
    const task = trackTasks.find(t => t.id === taskId)
    if (!task) return
    const next = task.status === 'completed' ? 'pending' : 'completed'
    updateTrackTaskStatus(taskId, next as TrackTaskStatus)
  }

  const addSelfTask = (title: string) => {
    const trackId = myTrackIds.values().next().value ?? 'unknown'
    addTrackTask({
      id: `self-${Date.now()}`,
      title,
      type: 'manual',
      trackId,
      assigneeId: staffId,
      assigneeName: staffName,
      status: 'pending' as TrackTaskStatus,
      scheduledDate: TODAY,
      description: '__self_added__',
      messages: [],
    })
  }

  const addTaskMessage = (taskId: string, content: string) => {
    addTaskMessageAction(taskId, content)
  }

  return {
    staffId,
    staffName,
    myTasks,
    todayTasks,
    timedTasks,
    untimedTasks,
    selfTasks,
    trackSchedules: filteredSchedules,
    completeTask,
    toggleTaskStatus,
    addSelfTask,
    addTaskMessage,
  }
}
