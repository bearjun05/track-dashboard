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
  FolderOpen,
  Users,
  Settings,
  ClipboardList,
  Mic,
  ChevronDown,
  ChevronRight,
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

  const operators = Array.from(
    new Map(
      plannerTracks
        .filter((t) => t.operator)
        .map((t) => [t.operator!.name, t])
    ).entries()
  )

  return (
    <>
      <SidebarItem
        href="/manager"
        icon={<BarChart3 className="h-4 w-4 shrink-0" />}
        label="대시보드"
        isActive={pathname === '/manager'}
      />

      <SectionLabel>담당 트랙</SectionLabel>
      {plannerTracks.map((track) => (
        <SidebarItem
          key={track.id}
          href={`/manager/tracks/${track.id}`}
          icon={
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: track.color }}
            />
          }
          label={track.name}
          isActive={pathname.startsWith(`/manager/tracks/${track.id}`)}
        />
      ))}

      <SectionLabel>운영매니저</SectionLabel>
      {operators.map(([name, track], i) => (
        <SidebarItem
          key={name}
          href={`/manager/operators/op${i + 1}`}
          icon={<Users className="h-4 w-4 shrink-0" />}
          label={name}
          isActive={pathname === `/manager/operators/op${i + 1}`}
        />
      ))}
    </>
  )
}

function OperatorMenu() {
  const pathname = usePathname()
  const { plannerTracks } = useAdminStore()
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null)

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
        const isExpanded = expandedTrack === track.id || isTrackActive

        return (
          <div key={track.id}>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                {isExpanded
                  ? <ChevronDown className="h-3 w-3" />
                  : <ChevronRight className="h-3 w-3" />}
              </button>
              <Link
                href={`/operator/tracks/${track.id}`}
                className={cn(
                  'flex flex-1 items-center gap-2 rounded-md px-2 py-2 text-[13px] font-medium transition-colors',
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
            </div>

            {isExpanded && track.staff && (
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
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-border bg-card">
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
