import type { SpanBar } from './calendar-types'
import { HOUR_START, HOUR_END, LAYER_STYLES } from './calendar-types'

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

export function isInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function fmtShortRange(start: string, end?: string): string {
  const s = new Date(start + 'T00:00:00')
  const sm = `${s.getMonth() + 1}/${s.getDate()}`
  if (!end || end === start) return sm
  const e = new Date(end + 'T00:00:00')
  return `${sm}~${e.getMonth() + 1}/${e.getDate()}`
}

export function timeToSlot(time: string, hourStart: number = HOUR_START, hourEnd: number = HOUR_END): number {
  const totalSlots = (hourEnd - hourStart) * 2
  const [h, m] = time.split(':').map(Number)
  return Math.max(0, Math.min(totalSlots, (h - hourStart) * 2 + Math.floor(m / 30)))
}

export function computeAllDayBars(
  chapters: { id: string; label: string; startDate: string; endDate: string }[],
  curricula: { id: string; label: string; startDate: string; endDate: string }[],
  opPeriods: { id: string; label: string; startDate: string; endDate: string }[],
  periodTasks: { id: string; label: string; startDate: string; endDate: string; isSelf?: boolean; dateLabel?: string }[],
  weekDays: Date[],
): SpanBar[] {
  const cols = weekDays.length
  const dayStrs = weekDays.map(d => toDateStr(d))
  const firstDay = dayStrs[0]
  const lastDay = dayStrs[cols - 1]
  const bars: SpanBar[] = []

  function findCols(startDate: string, endDate: string): [number, number] | null {
    if (endDate < firstDay || startDate > lastDay) return null
    const startCol = dayStrs.findIndex(d => d >= startDate)
    const endCol = dayStrs.reduce((last, d, i) => (d <= endDate) ? i : last, -1)
    if (startCol === -1 || endCol === -1 || endCol < startCol) return null
    return [startCol, endCol]
  }

  let globalRow = 0

  for (const ch of chapters) {
    const r = findCols(ch.startDate, ch.endDate)
    if (!r) continue
    bars.push({ id: ch.id, label: ch.label, layer: 'chapter', startCol: r[0], span: r[1] - r[0] + 1, row: globalRow })
  }
  if (chapters.some(ch => findCols(ch.startDate, ch.endDate) !== null)) globalRow++

  const placeRows = (items: { id: string; label: string; startDate: string; endDate: string; isSelf?: boolean; dateLabel?: string }[], layer: SpanBar['layer']) => {
    const rowEnds: number[] = []
    for (const item of items) {
      const r = findCols(item.startDate, item.endDate)
      if (!r) continue
      let row = 0
      while (row < rowEnds.length && rowEnds[row] > r[0]) row++
      if (row >= rowEnds.length) rowEnds.push(0)
      rowEnds[row] = r[0] + (r[1] - r[0] + 1)
      bars.push({ id: item.id, label: item.label, layer, startCol: r[0], span: r[1] - r[0] + 1, row: globalRow + row, isSelf: item.isSelf, dateLabel: item.dateLabel })
    }
    globalRow += Math.max(rowEnds.length, 0)
  }

  placeRows(curricula, 'curriculum')
  placeRows(opPeriods, 'operation')
  placeRows(periodTasks, 'period_task')

  return bars
}

export function getMaxRow(bars: SpanBar[]): number {
  return bars.length > 0 ? Math.max(...bars.map(b => b.row)) + 1 : 0
}

export function getBarStyle(bar: SpanBar) {
  if (bar.layer === 'period_task' && bar.isSelf) return LAYER_STYLES.period_self
  return LAYER_STYLES[bar.layer]
}
