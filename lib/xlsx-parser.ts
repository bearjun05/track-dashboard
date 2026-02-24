import * as XLSX from 'xlsx'
import type { SubjectCard, HolidayEntry, ParsedSchedule } from './track-creation-types'

const HOLIDAY_KEYWORDS = [
  '크리스마스', '어린이날', '신정', '설', '설날', '설 연휴', '설날 연휴',
  '석가탄신일', '광복절', '추석', '한글날', '개천절', '삼일절',
  '대체 휴일', '대체 공휴일', '지방선거', '전국동시 지방선거',
  '2026 지방선거', '현충일', '휴게시간', '휴게 시간',
]

function isHoliday(name: string): boolean {
  const n = name.trim()
  return HOLIDAY_KEYWORDS.some(k => n.includes(k))
}

function isTimeValue(val: unknown): boolean {
  if (val === null || val === undefined) return false
  const s = String(val)
  return /^\d{1,2}:\d{2}(:\d{2})?$/.test(s) || (typeof val === 'number' && val < 1 && val >= 0)
}

function excelTimeToString(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const s = String(val)
  const match = s.match(/^(\d{1,2}):(\d{2})/)
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`
  if (typeof val === 'number' && val >= 0 && val < 1) {
    const totalMinutes = Math.round(val * 24 * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  return null
}

function parseDateCell(val: unknown, yearHint?: number): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()

  // "2026-01-05 00:00:00" or "2026-01-05"
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`

  // "3/9(월)" or "12/22(월)"
  const shortMatch = s.match(/^(\d{1,2})\/(\d{1,2})\(/)
  if (shortMatch && yearHint) {
    const m = shortMatch[1].padStart(2, '0')
    const d = shortMatch[2].padStart(2, '0')
    return `${yearHint}-${m}-${d}`
  }

  // Excel serial date
  if (typeof val === 'number' && val > 40000) {
    const date = new Date((val - 25569) * 86400 * 1000)
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return null
}

function detectYearHint(sheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })]
      if (cell && cell.v) {
        const s = String(cell.v)
        const yearMatch = s.match(/(\d{2,4})년\s*(\d{1,2})월/)
        if (yearMatch) {
          const y = yearMatch[1].length === 2 ? 2000 + parseInt(yearMatch[1]) : parseInt(yearMatch[1])
          return y
        }
      }
    }
  }
  return new Date().getFullYear()
}

export function parseXlsxTimetable(file: ArrayBuffer): ParsedSchedule {
  const workbook = XLSX.read(file, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  const yearHint = detectYearHint(sheet)

  const rows: (string | number | null)[][] = []
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: (string | number | null)[] = []
    for (let c = range.s.c; c <= Math.min(range.e.c, 15); c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })]
      row.push(cell ? cell.v : null)
    }
    rows.push(row)
  }

  const dateSubjectMap: Map<string, Map<string, number>> = new Map()
  const holidays: HolidayEntry[] = []
  let currentWeekNum = 0
  let currentDates: string[] = []
  const weekDateMap: Map<string, number> = new Map()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const firstVal = row[0] !== null && row[0] !== undefined ? String(row[0]).trim() : ''

    // Detect week headers
    const weekMatch = firstVal.match(/^(\d+)주차/)
    if (weekMatch) {
      currentWeekNum = parseInt(weekMatch[1])
      currentDates = []
      continue
    }

    // Detect date rows (dates appear in cols 3-7, and first few cols are empty or have dates too)
    if (currentWeekNum > 0 && currentDates.length === 0) {
      const potentialDates: string[] = []
      for (let c = 3; c <= 7 && c < row.length; c++) {
        const parsed = parseDateCell(row[c], yearHint)
        if (parsed) potentialDates.push(parsed)
      }
      if (potentialDates.length >= 3) {
        currentDates = potentialDates
        for (const d of currentDates) {
          weekDateMap.set(d, currentWeekNum)
        }
        continue
      }
    }

    // Detect time-slot rows
    if (currentDates.length > 0 && isTimeValue(row[0])) {
      const startTime = excelTimeToString(row[0])
      const endTime = excelTimeToString(row[2])
      if (!startTime || !endTime) continue

      const startH = parseInt(startTime.split(':')[0])
      const endH = parseInt(endTime.split(':')[0])
      const hours = endH - startH

      for (let c = 0; c < currentDates.length; c++) {
        const dateStr = currentDates[c]
        const subjectVal = row[c + 3]
        if (subjectVal === null || subjectVal === undefined) continue
        const subject = String(subjectVal).trim()
        if (!subject || subject === '휴게시간' || subject === '휴게 시간') continue

        if (isHoliday(subject)) {
          if (!holidays.find(h => h.date === dateStr)) {
            holidays.push({ date: dateStr, name: subject })
          }
          continue
        }

        if (!dateSubjectMap.has(dateStr)) {
          dateSubjectMap.set(dateStr, new Map())
        }
        const dayMap = dateSubjectMap.get(dateStr)!
        dayMap.set(subject, (dayMap.get(subject) || 0) + Math.max(hours, 1))
      }
    }

    // Reset dates on metadata rows
    if (firstVal.startsWith('[원격]') || firstVal.startsWith('[프로젝트]') || firstVal === '과제/테스트/기타' || firstVal === '비고') {
      // Keep current week context but may look for next week
    }
  }

  // Build date -> dominant subject map
  const dateDominant: Map<string, string> = new Map()
  const dateHours: Map<string, number> = new Map()

  for (const [date, subjectMap] of dateSubjectMap) {
    let maxHours = 0
    let dominant = ''
    let totalHours = 0
    for (const [subject, hours] of subjectMap) {
      totalHours += hours
      if (hours > maxHours) {
        maxHours = hours
        dominant = subject
      }
    }
    dateDominant.set(date, dominant)
    dateHours.set(date, totalHours)
  }

  // Sort dates and group into contiguous subject blocks
  const sortedDates = Array.from(dateDominant.keys()).sort()
  if (sortedDates.length === 0) {
    return { cards: [], holidays, trackStart: '', trackEnd: '', totalWeeks: 0 }
  }

  const cards: SubjectCard[] = []
  let cardStart = sortedDates[0]
  let cardEnd = sortedDates[0]
  let cardSubject = dateDominant.get(sortedDates[0])!
  let cardHours = dateHours.get(sortedDates[0]) || 0
  let cardWeeks = new Set<number>([weekDateMap.get(sortedDates[0]) || 0])
  let cardId = 1

  for (let i = 1; i < sortedDates.length; i++) {
    const date = sortedDates[i]
    const subject = dateDominant.get(date)!

    if (subject === cardSubject) {
      cardEnd = date
      cardHours += dateHours.get(date) || 0
      cardWeeks.add(weekDateMap.get(date) || 0)
    } else {
      cards.push({
        id: `sc-${cardId++}`,
        subjectName: cardSubject,
        startDate: cardStart,
        endDate: cardEnd,
        totalHours: cardHours,
        isProject: cardSubject.includes('[프로젝트]') || cardSubject.includes('프로젝트'),
        isHoliday: false,
        weekNumbers: Array.from(cardWeeks).filter(Boolean).sort((a, b) => a - b),
      })
      cardStart = date
      cardEnd = date
      cardSubject = subject
      cardHours = dateHours.get(date) || 0
      cardWeeks = new Set([weekDateMap.get(date) || 0])
    }
  }
  // Push last block
  cards.push({
    id: `sc-${cardId++}`,
    subjectName: cardSubject,
    startDate: cardStart,
    endDate: cardEnd,
    totalHours: cardHours,
    isProject: cardSubject.includes('[프로젝트]') || cardSubject.includes('프로젝트'),
    isHoliday: false,
    weekNumbers: Array.from(cardWeeks).filter(Boolean).sort((a, b) => a - b),
  })

  const trackStart = sortedDates[0]
  const trackEnd = sortedDates[sortedDates.length - 1]
  const totalWeeks = Math.max(...Array.from(weekDateMap.values()), 0)

  return { cards, holidays, trackStart, trackEnd, totalWeeks }
}
