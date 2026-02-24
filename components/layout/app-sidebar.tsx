'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useRoleStore, type AppRole } from '@/lib/role-store'
import { useAdminStore } from '@/lib/admin-store'
import { ROLE_LABELS } from '@/lib/role-labels'
import { NotificationDropdown } from '@/components/manager/notification-dropdown'
import {
  BarChart3,
  Settings,
  ClipboardList,
  Mic,
} from 'lucide-react'
import { useState } from 'react'

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  indent?: boolean
}

function SidebarItem({ href, icon, label, isActive, indent }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
        indent && 'ml-4 pl-3',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
      {children}
    </div>
  )
}

function ManagerMenu() {
  const pathname = usePathname()
  const { plannerTracks } = useAdminStore()
  const [staffExpanded, setStaffExpanded] = useState<Record<string, boolean>>({})

  const toggleStaff = (trackId: string) => {
    setStaffExpanded((prev) => ({ ...prev, [trackId]: !prev[trackId] }))
  }

  return (
    <>
      <SidebarItem
        href="/manager"
        icon={<BarChart3 className="h-4 w-4 shrink-0" />}
        label="대시보드"
        isActive={pathname === '/manager'}
      />

      <SectionLabel>담당 트랙</SectionLabel>
      {plannerTracks.map((track) => {
        const isTrackActive = pathname.startsWith(`/manager/tracks/${track.id}`)
        const isStaffOpen = staffExpanded[track.id] || pathname.includes(`/manager/tracks/${track.id}/staff/`)

        return (
          <div key={track.id}>
            <Link
              href={`/manager/tracks/${track.id}`}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                isTrackActive && !pathname.includes('/staff/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: track.color }}
              />
              <span className="min-w-0 truncate">{track.name}</span>
              <span className={cn(
                'ml-auto shrink-0 text-[10px] font-semibold tabular-nums',
                isTrackActive && !pathname.includes('/staff/')
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground/60',
              )}>
                {track.completionRate}%
              </span>
            </Link>

            <div className="space-y-0.5 py-0.5">
              {track.operator && (
                <Link
                  href={`/operator/tracks/${track.id}`}
                  className={cn(
                    'ml-4 flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                    pathname === `/operator/tracks/${track.id}`
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <span className="text-[11px]">👤</span>
                  <span className="min-w-0 truncate">{track.operator.name}</span>
                  <span className={cn(
                    'ml-auto shrink-0 rounded-full px-1.5 py-px text-[10px] tabular-nums',
                    pathname === `/operator/tracks/${track.id}`
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {track.operator.taskCompletionRate}%
                  </span>
                </Link>
              )}

              {track.staff && track.staff.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleStaff(track.id)}
                    className="ml-4 flex w-[calc(100%-1rem)] items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <span className={cn(
                      'text-[11px] transition-transform',
                      isStaffOpen ? 'rotate-0' : '-rotate-90',
                    )}>▼</span>
                    <span>학관 {track.staff.length}</span>
                  </button>

                  {isStaffOpen && (
                    <div className="ml-4 space-y-0.5 py-0.5">
                      {track.staff.map((s) => (
                        <SidebarItem
                          key={s.id}
                          href={`/manager/tracks/${track.id}/staff/${s.id}`}
                          icon={<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />}
                          label={s.name}
                          isActive={pathname === `/manager/tracks/${track.id}/staff/${s.id}`}
                          indent
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}

function OperatorMenu() {
  const pathname = usePathname()
  const { plannerTracks } = useAdminStore()

  const operatorTracks = plannerTracks.filter((t) => t.operator?.name === '이운영')

  return (
    <>
      <SidebarItem
        href="/operator"
        icon={<BarChart3 className="h-4 w-4 shrink-0" />}
        label="대시보드"
        isActive={pathname === '/operator'}
      />

      <SectionLabel>담당 트랙</SectionLabel>
      {operatorTracks.map((track) => {
        const isTrackActive = pathname.startsWith(`/operator/tracks/${track.id}`)

        return (
          <div key={track.id}>
            <Link
              href={`/operator/tracks/${track.id}`}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                isTrackActive && !pathname.includes('/staff/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: track.color }}
              />
              <span className="truncate">{track.name}</span>
            </Link>

            {track.staff && (
              <div className="space-y-0.5 py-0.5">
                {track.staff.map((s) => (
                  <SidebarItem
                    key={s.id}
                    href={`/operator/tracks/${track.id}/staff/${s.id}`}
                    icon={<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />}
                    label={s.name}
                    isActive={pathname === `/operator/tracks/${track.id}/staff/${s.id}`}
                    indent
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

function LearningManagerMenu() {
  const pathname = usePathname()

  return (
    <>
      <SidebarItem
        href="/"
        icon={<ClipboardList className="h-4 w-4 shrink-0" />}
        label="오늘 할 일"
        isActive={pathname === '/'}
      />
      <SidebarItem
        href="/?tab=interview"
        icon={<Mic className="h-4 w-4 shrink-0" />}
        label="면담 관리"
        isActive={false}
      />
    </>
  )
}

const ROLE_USER_NAME: Record<AppRole, string> = {
  operator_manager: '이운기',
  operator: '이운영',
  learning_manager: '김학관',
}

export function AppSidebar() {
  const { currentRole } = useRoleStore()

  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center justify-between px-5">
        <span className="text-base font-bold tracking-tight text-foreground">APM</span>
        <NotificationDropdown />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
        {currentRole === 'operator_manager' && <ManagerMenu />}
        {currentRole === 'operator' && <OperatorMenu />}
        {currentRole === 'learning_manager' && <LearningManagerMenu />}
      </nav>

      <div className="space-y-1 border-t border-border px-2 py-2">
        {currentRole !== 'learning_manager' && (
          <SidebarItem
            href="/admin"
            icon={<Settings className="h-4 w-4 shrink-0" />}
            label="시스템 관리"
            isActive={false}
          />
        )}
        <div className="px-3 py-2">
          <p className="text-[13px] font-medium text-foreground">{ROLE_USER_NAME[currentRole]}</p>
          <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[currentRole]}</p>
        </div>
      </div>
    </aside>
  )
}
