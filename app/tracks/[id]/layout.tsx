'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminStore } from '@/lib/admin-store'
import { ROLE_LABELS } from '@/lib/role-labels'
import { useRoleStore, ROLE_HOME } from '@/lib/role-store'
import { ArrowLeft, Users, GraduationCap, ListTodo, CalendarDays, AlertTriangle } from 'lucide-react'
import { MetricsBox } from '@/components/ui/mini-charts'
import { cn } from '@/lib/utils'
import { TODAY_STR } from '@/lib/date-constants'

function useDDay(period: string) {
  return useMemo(() => {
    const parts = period.split(' ~ ')
    if (parts.length < 2) return null
    const endDate = new Date(parts[1].replace(/\./g, '-'))
    const today = new Date(TODAY_STR)
    const diff = Math.ceil((endDate.getTime() - today.getTime()) / 86400000)
    if (diff < 0) return { label: `D+${Math.abs(diff)}`, urgent: true }
    if (diff === 0) return { label: 'D-Day', urgent: true }
    return { label: `D-${diff}`, urgent: diff <= 7 }
  }, [period])
}

export default function TrackLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id: trackId } = React.use(params)
  const pathname = usePathname()
  const { plannerTracks, trackTasks, operatorTrackDetails } = useAdminStore()
  const currentRole = useRoleStore((s) => s.currentRole)
  const homeHref = ROLE_HOME[currentRole]

  const track = plannerTracks.find((t) => t.id === trackId)
  const dDayText = useDDay(track?.period ?? '')

  const staffList = useMemo(() => {
    const allDetails = Object.values(operatorTrackDetails).flat()
    return allDetails.find((d) => d.trackId === trackId)?.staff ?? []
  }, [operatorTrackDetails, trackId])

  const taskCount = trackTasks.filter((t) => t.trackId === trackId).length
  const unassignedCount = trackTasks.filter((t) => t.trackId === trackId && t.status === 'unassigned').length

  if (!track) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-[15px] font-semibold text-foreground">트랙을 찾을 수 없습니다</p>
        <p className="text-[12px] text-muted-foreground">요청한 트랙(ID: {trackId})이 존재하지 않습니다.</p>
        <Link href={homeHref} className="mt-2 rounded-lg bg-foreground px-4 py-2 text-[12px] text-background transition-colors hover:bg-foreground/90">돌아가기</Link>
      </div>
    )
  }

  const basePath = `/tracks/${trackId}`
  const tabs = [
    { href: `${basePath}/tasks`, label: 'Task', icon: ListTodo, count: taskCount, warning: unassignedCount > 0 ? unassignedCount : undefined },
    { href: `${basePath}/schedule`, label: '일정', icon: CalendarDays },
  ]

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 pt-3 pb-2">
          <div className="flex items-center gap-2.5">
            <Link href={homeHref} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
              style={{ backgroundColor: `${track.color}15`, color: track.color }}>{track.name}</span>
            <span className="text-[11px] text-muted-foreground">{track.period}</span>
            {dDayText && (
              <span className={`rounded-full px-2 py-[2px] text-[10px] font-bold tabular-nums ${
                dDayText.urgent ? 'bg-destructive/10 text-destructive' : 'bg-foreground/[0.06] text-muted-foreground'
              }`}>{dDayText.label}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <MetricsBox />
            <p className="text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{ROLE_LABELS.learning_manager} {staffList.length}명</span>
            <span className="mx-1.5 text-foreground/20">·</span>
            <span className="inline-flex items-center gap-1"><GraduationCap className="h-3 w-3" />{track.studentCount}명</span>
          </p>
          </div>
        </div>
        <nav className="flex items-center gap-0.5 px-6">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link key={tab.href} href={tab.href}
                className={cn(
                  'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground/70',
                )}>
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.warning != null && (
                  <span className={cn(
                    'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                    isActive ? 'bg-red-500/10 text-red-500' : 'bg-red-500/10 text-red-500',
                  )}>{tab.warning}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
