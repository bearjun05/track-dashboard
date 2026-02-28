export const TODAY_STR = new Date().toISOString().split('T')[0]

export const TODAY = (() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
})()

export function getWeekRange(todayStr: string = TODAY_STR): [string, string] {
  const d = new Date(todayStr)
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((day + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return [mon.toISOString().split('T')[0], sun.toISOString().split('T')[0]]
}

export function getMonthRange(todayStr: string = TODAY_STR): [string, string] {
  const d = new Date(todayStr)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]]
}
