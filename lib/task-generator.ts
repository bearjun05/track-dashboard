import { addDays, addWeeks, addMonths, format, parseISO, eachWeekOfInterval, eachDayOfInterval, isWeekend, startOfMonth } from 'date-fns'
import type { Chapter, GeneratedTask, RecurrenceConfig, TaskTemplateConfig } from './track-creation-types'
import { taskTemplates } from './task-templates'

let idCounter = 0
function nextId() {
  return `gen-task-${++idCounter}`
}

function dateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function addBusinessDays(start: Date, days: number): string {
  let d = new Date(start)
  let remaining = Math.abs(days)
  const direction = days >= 0 ? 1 : -1
  while (remaining > 0) {
    d = addDays(d, direction)
    if (!isWeekend(d)) remaining--
  }
  return dateStr(d)
}

export function generateTasks(
  trackStart: string,
  trackEnd: string,
  chapters: Chapter[],
  recurrenceConfigs: Record<string, RecurrenceConfig>,
): GeneratedTask[] {
  idCounter = 0
  const tasks: GeneratedTask[] = []
  const start = parseISO(trackStart)
  const end = parseISO(trackEnd)

  for (const tpl of taskTemplates) {
    const config = recurrenceConfigs[tpl.id]

    switch (tpl.frequency) {
      case 'once':
        tasks.push(createOnceTask(tpl, start, end))
        break

      case 'per_chapter':
        for (const ch of chapters) {
          tasks.push(createChapterTask(tpl, ch))
        }
        break

      case 'daily': {
        const rc: RecurrenceConfig = config || { type: 'daily', time: '09:00', startDate: trackStart, endDate: trackEnd }
        tasks.push(...createRecurringTasks(tpl, rc, start, end))
        break
      }

      case 'weekly': {
        const rc: RecurrenceConfig = config || { type: 'weekly', daysOfWeek: [1], time: '09:00', startDate: trackStart, endDate: trackEnd }
        tasks.push(...createRecurringTasks(tpl, rc, start, end))
        break
      }

      case 'monthly': {
        const rc: RecurrenceConfig = config || { type: 'monthly', time: '09:00', startDate: trackStart, endDate: trackEnd }
        tasks.push(...createRecurringTasks(tpl, rc, start, end))
        break
      }

      case 'ad_hoc': {
        if (config) {
          tasks.push(...createRecurringTasks(tpl, config, start, end))
        } else {
          tasks.push({
            id: nextId(),
            templateId: tpl.id,
            title: tpl.title,
            description: tpl.description,
            category: tpl.category,
            subcategory: tpl.subcategory,
            assignedRole: tpl.driRole,
            status: 'unassigned',
            scheduledDate: trackStart,
            dueDate: trackEnd,
            frequency: tpl.frequency,
            priority: tpl.priority,
            reviewer: tpl.reviewer,
            output: tpl.output,
          })
        }
        break
      }
    }
  }

  return tasks.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
}

function createOnceTask(tpl: TaskTemplateConfig, start: Date, end: Date): GeneratedTask {
  let scheduledDate: string
  let dueDate: string

  switch (tpl.triggerType) {
    case 'opening_d':
      scheduledDate = dateStr(addDays(start, tpl.triggerOffset || 0))
      dueDate = tpl.estimatedDays
        ? dateStr(addDays(parseISO(scheduledDate), tpl.estimatedDays))
        : scheduledDate
      break

    case 'opening_week':
      scheduledDate = dateStr(addWeeks(start, (tpl.triggerOffset || 1) - 1))
      dueDate = dateStr(addDays(parseISO(scheduledDate), 4))
      break

    case 'closing_d':
      scheduledDate = dateStr(addDays(end, tpl.triggerOffset || 0))
      dueDate = tpl.estimatedDays
        ? dateStr(addDays(parseISO(scheduledDate), tpl.estimatedDays))
        : dateStr(end)
      break

    case 'schedule':
      scheduledDate = dateStr(start)
      dueDate = dateStr(end)
      break

    default:
      scheduledDate = dateStr(start)
      dueDate = dateStr(end)
  }

  return {
    id: nextId(),
    templateId: tpl.id,
    title: tpl.title,
    description: tpl.description,
    category: tpl.category,
    subcategory: tpl.subcategory,
    assignedRole: tpl.driRole,
    status: 'unassigned',
    scheduledDate,
    dueDate,
    frequency: tpl.frequency,
    priority: tpl.priority,
    reviewer: tpl.reviewer,
    output: tpl.output,
  }
}

function createChapterTask(tpl: TaskTemplateConfig, chapter: Chapter): GeneratedTask {
  const chStart = parseISO(chapter.startDate)
  let scheduledDate = chapter.startDate

  if (tpl.triggerType === 'chapter_start_d' && tpl.triggerOffset) {
    scheduledDate = dateStr(addDays(chStart, tpl.triggerOffset))
  }

  const dueDate = tpl.estimatedDays
    ? dateStr(addDays(parseISO(scheduledDate), tpl.estimatedDays))
    : chapter.endDate

  return {
    id: nextId(),
    templateId: tpl.id,
    title: tpl.title,
    description: tpl.description,
    category: tpl.category,
    subcategory: tpl.subcategory,
    assignedRole: tpl.driRole,
    status: 'unassigned',
    scheduledDate,
    dueDate,
    frequency: tpl.frequency,
    priority: tpl.priority,
    chapterId: chapter.id,
    chapterName: chapter.name,
    reviewer: tpl.reviewer,
    output: tpl.output,
  }
}

function createRecurringTasks(
  tpl: TaskTemplateConfig,
  config: RecurrenceConfig,
  trackStart: Date,
  trackEnd: Date,
): GeneratedTask[] {
  const tasks: GeneratedTask[] = []
  const rcStart = config.startDate ? parseISO(config.startDate) : trackStart
  const rcEnd = config.endDate ? parseISO(config.endDate) : trackEnd

  switch (config.type) {
    case 'daily': {
      const days = eachDayOfInterval({ start: rcStart, end: rcEnd })
      for (const day of days) {
        if (isWeekend(day)) continue
        tasks.push({
          id: nextId(),
          templateId: tpl.id,
          title: tpl.title,
          category: tpl.category,
          subcategory: tpl.subcategory,
          assignedRole: tpl.driRole,
          status: 'unassigned',
          scheduledDate: dateStr(day),
          dueDate: dateStr(day),
          scheduledTime: config.time,
          frequency: tpl.frequency,
          priority: tpl.priority,
          recurrence: config,
          reviewer: tpl.reviewer,
          output: tpl.output,
        })
      }
      break
    }

    case 'weekly': {
      const weeks = eachWeekOfInterval({ start: rcStart, end: rcEnd }, { weekStartsOn: 1 })
      const daysOfWeek = config.daysOfWeek || [1]
      for (const weekStart of weeks) {
        for (const dow of daysOfWeek) {
          const day = addDays(weekStart, dow - 1)
          if (day < rcStart || day > rcEnd) continue
          tasks.push({
            id: nextId(),
            templateId: tpl.id,
            title: tpl.title,
            category: tpl.category,
            subcategory: tpl.subcategory,
            assignedRole: tpl.driRole,
            status: 'unassigned',
            scheduledDate: dateStr(day),
            dueDate: dateStr(addDays(day, 4)),
            scheduledTime: config.time,
            frequency: tpl.frequency,
            priority: tpl.priority,
            recurrence: config,
            reviewer: tpl.reviewer,
            output: tpl.output,
          })
        }
      }
      break
    }

    case 'monthly': {
      let current = startOfMonth(rcStart)
      while (current <= rcEnd) {
        const day = current < rcStart ? rcStart : current
        tasks.push({
          id: nextId(),
          templateId: tpl.id,
          title: tpl.title,
          category: tpl.category,
          subcategory: tpl.subcategory,
          assignedRole: tpl.driRole,
          status: 'unassigned',
          scheduledDate: dateStr(day),
          dueDate: dateStr(addDays(day, tpl.estimatedDays || 5)),
          scheduledTime: config.time,
          frequency: tpl.frequency,
          priority: tpl.priority,
          recurrence: config,
          reviewer: tpl.reviewer,
          output: tpl.output,
        })
        current = addMonths(current, config.interval || 1)
      }
      break
    }

    case 'per_chapter':
      break
  }

  return tasks
}
