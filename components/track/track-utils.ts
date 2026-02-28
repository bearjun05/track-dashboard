'use client'

import type { TrackTaskStatus, TrackTask } from '@/lib/admin-mock-data'

export const STAFF_COLORS = [
  '#6366f1', '#0ea5e9', '#8b5cf6', '#14b8a6', '#f59e0b', '#ec4899', '#64748b',
]

export function getStaffColor(staffList: { id: string }[], staffId: string | undefined): string | null {
  if (!staffId) return null
  const idx = staffList.findIndex((s) => s.id === staffId)
  return idx >= 0 ? STAFF_COLORS[idx % STAFF_COLORS.length] : null
}

export const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']
export const TODAY_STR = new Date().toISOString().split('T')[0]

export type UnassignedViewMode = 'daily' | 'weekly' | 'chapter' | 'monthly'

export function fmtDate(d: Date) {
  return d.toISOString().split('T')[0]
}

export function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function getMonthDates(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay()
  const start = new Date(firstDay)
  start.setDate(1 - ((startDay + 6) % 7))
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return fmtDate(d)
}

export function fmtNow(): string {
  return new Date()
    .toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .replace(/\. /g, '-')
    .replace('.', '')
}

export function defaultExpiry(): string {
  const d = new Date(TODAY_STR)
  d.setDate(d.getDate() + 1)
  return fmtDate(d)
}

export function getDDayLabel(expiresAt: string): { label: string; urgent: boolean } {
  const today = new Date(TODAY_STR)
  const expires = new Date(expiresAt)
  const diff = Math.ceil((expires.getTime() - today.getTime()) / 86400000)
  if (diff <= 0) return { label: '오늘 삭제', urgent: true }
  return { label: `D-${diff}`, urgent: diff <= 1 }
}

export function formatToday(): string {
  const d = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`
}

export type StaffInfo = { id: string; name: string; unreadMessages?: number }
export type TaskStats = { completed: number; inProgress: number; overdue: number; pending: number; total: number }

export const STATUS_CONFIG: Record<TrackTaskStatus, { label: string; cls: string }> = {
  pending: { label: '대기', cls: 'bg-secondary text-muted-foreground' },
  in_progress: { label: '진행중', cls: 'bg-foreground/[0.06] text-foreground' },
  pending_review: { label: '확인요청', cls: 'bg-amber-500/10 text-amber-600' },
  completed: { label: '완료', cls: 'bg-foreground/[0.06] text-muted-foreground' },
  overdue: { label: '기한초과', cls: 'bg-destructive/10 text-destructive' },
  unassigned: { label: '미배정', cls: 'bg-foreground/[0.06] text-foreground/60' },
}

export const TYPE_CONFIG: Record<TrackTask['type'], { label: string; cls: string }> = {
  daily: { label: '일일', cls: 'bg-foreground/[0.05] text-foreground/60' },
  milestone: { label: '마일스톤', cls: 'bg-foreground/[0.06] text-foreground/70' },
  manual: { label: '수동', cls: 'bg-foreground/[0.05] text-foreground/60' },
}
