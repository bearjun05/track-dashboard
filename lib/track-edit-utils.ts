import type { PlannerTrackCard, TrackTask } from './admin-mock-data'
import type { UnifiedSchedule } from '@/components/schedule/schedule-types'
import type {
  TrackCreationData,
  SubjectCard,
  Chapter,
  GeneratedTask,
  RecurrenceConfig,
  TaskFrequency,
  TaskPriority,
  TaskAssignmentConfig,
  AssignmentMode,
} from './track-creation-types'

function parseTrackName(fullName: string): { name: string; round: number } {
  const match = fullName.match(/^(.+?)\s*(\d+)\s*[기회차]+$/)
  if (match) return { name: match[1].trim(), round: parseInt(match[2], 10) }
  return { name: fullName, round: 1 }
}

function parsePeriod(period: string): { start: string; end: string } {
  const parts = period.split('~').map(s => s.trim().replace(/\./g, '-'))
  return { start: parts[0] || '', end: parts[1] || '' }
}

export function buildTrackCreationData(
  track: PlannerTrackCard,
  trackTasks: TrackTask[],
  trackSchedules: UnifiedSchedule[],
  allChapters: UnifiedSchedule[] = [],
): TrackCreationData {
  const { name, round } = parseTrackName(track.name)
  const { start: trackStart, end: trackEnd } = parsePeriod(track.period)

  const schedules = trackSchedules.filter(s => s.trackId === track.id)
  const chapters = allChapters.filter(ch => ch.trackId === track.id)

  const subjectCards: SubjectCard[] = schedules.map((sch, i) => ({
    id: sch.id,
    subjectName: sch.title,
    startDate: sch.startDate,
    endDate: sch.endDate,
    totalHours: Math.ceil(
      (new Date(sch.endDate).getTime() - new Date(sch.startDate).getTime()) / (1000 * 60 * 60 * 24) * 6
    ),
    isProject: sch.category === '프로젝트',
    isHoliday: false,
    weekNumbers: [i + 1],
  }))

  const totalWeeks = subjectCards.length > 0
    ? Math.ceil(
        (new Date(trackEnd).getTime() - new Date(trackStart).getTime()) / (1000 * 60 * 60 * 24 * 7)
      )
    : 0

  const chapterData: Chapter[] = chapters.map((ch, i) => {
    const chapterCards = subjectCards.filter(
      c => c.startDate >= ch.startDate && c.endDate <= ch.endDate
    )
    return {
      id: ch.id,
      name: ch.title,
      order: i + 1,
      cards: chapterCards.length > 0 ? chapterCards : [{
        id: `card-${ch.id}`,
        subjectName: ch.title,
        startDate: ch.startDate,
        endDate: ch.endDate,
        totalHours: Math.ceil(
          (new Date(ch.endDate).getTime() - new Date(ch.startDate).getTime()) / (1000 * 60 * 60 * 24) * 6
        ),
        isProject: false,
        isHoliday: false,
        weekNumbers: [i + 1],
      }],
      startDate: ch.startDate,
      endDate: ch.endDate,
    }
  })

  const tasks = trackTasks.filter(t => t.trackId === track.id)
  const generatedTasks: GeneratedTask[] = tasks.map(t => {
    const freq: TaskFrequency = t.type === 'daily' ? 'daily'
      : t.type === 'milestone' ? 'once'
      : 'ad_hoc'
    return {
      id: t.id,
      templateId: t.templateId || t.id,
      title: t.title,
      description: t.description,
      category: t.type === 'daily' ? '일일 업무' : '트랙 일정',
      subcategory: '',
      assignedRole: 'learning_manager' as const,
      assigneeId: t.assigneeId,
      assigneeName: t.assigneeName,
      status: 'pending' as const,
      scheduledDate: t.scheduledDate,
      dueDate: t.endDate || t.scheduledDate,
      scheduledTime: t.scheduledTime,
      frequency: freq,
      priority: 'medium' as TaskPriority,
      chapterId: undefined,
      chapterName: undefined,
    }
  })

  const recurrenceConfigs: Record<string, RecurrenceConfig> = {}
  for (const t of generatedTasks) {
    if (t.frequency === 'daily') {
      const raw = tasks.find(tt => (tt.templateId || tt.id) === t.templateId)
      recurrenceConfigs[t.templateId] = {
        type: 'daily',
        time: t.scheduledTime,
        endTime: raw?.dueTime,
      }
    }
  }

  const staffAssignment = {
    operatorManagers: [] as { id: string; name: string; role: 'operator_manager' }[],
    operators: track.operator
      ? [{ id: track.operator.id, name: track.operator.name, role: 'operator' as const }]
      : [],
    learningManagers: (track.staff || []).map(s => ({
      id: s.id,
      name: s.name,
      role: 'learning_manager' as const,
    })),
    tutors: [] as { id: string; name: string; role: 'tutor' }[],
  }

  const taskAssignments = inferAssignments(tasks, staffAssignment.learningManagers.map(s => s.id))

  return {
    name,
    round,
    parsedSchedule: {
      cards: subjectCards,
      holidays: [],
      trackStart,
      trackEnd,
      totalWeeks,
    },
    chapters: chapterData,
    unassignedCards: [],
    staff: staffAssignment,
    generatedTasks,
    recurrenceConfigs,
    customTemplates: [],
    taskAssignments,
  }
}

/**
 * 기존 TrackTask의 assigneeId 패턴을 분석하여 배정 모드를 추론한다.
 */
function inferAssignments(
  tasks: TrackTask[],
  lmIds: string[],
): Record<string, TaskAssignmentConfig> {
  const result: Record<string, TaskAssignmentConfig> = {}
  const byTemplate = new Map<string, TrackTask[]>()

  for (const t of tasks) {
    const key = t.templateId || t.id
    const list = byTemplate.get(key) || []
    list.push(t)
    byTemplate.set(key, list)
  }

  for (const [templateId, tplTasks] of byTemplate) {
    const assigneeIds = new Set(tplTasks.map(t => t.assigneeId).filter(Boolean) as string[])
    const allUnassigned = assigneeIds.size === 0

    if (allUnassigned) {
      result[templateId] = { templateId, mode: 'unassigned' }
      continue
    }

    const allLmsAssigned = lmIds.length > 0 && lmIds.every(id => assigneeIds.has(id))
    if (allLmsAssigned && assigneeIds.size === lmIds.length) {
      result[templateId] = { templateId, mode: 'all' }
      continue
    }

    if (assigneeIds.size === 1) {
      const staffId = [...assigneeIds][0]
      result[templateId] = { templateId, mode: 'specific', specificStaffId: staffId }
      continue
    }

    result[templateId] = {
      templateId,
      mode: 'rotation',
      rotationConfig: { cycle: 'daily', staffOrder: [...assigneeIds] },
    }
  }

  return result
}
