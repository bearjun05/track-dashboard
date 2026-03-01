function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export const TODAY_STR = toLocalDateStr(new Date())

export const TODAY = (() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
})()

export function getWeekRange(todayStr: string = TODAY_STR): [string, string] {
  const d = new Date(todayStr + 'T00:00:00')
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((day + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return [toLocalDateStr(mon), toLocalDateStr(sun)]
}

export function getMonthRange(todayStr: string = TODAY_STR): [string, string] {
  const d = new Date(todayStr + 'T00:00:00')
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return [toLocalDateStr(start), toLocalDateStr(end)]
}
