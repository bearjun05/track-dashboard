'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useRoleStore, type AppRole } from '@/lib/role-store'
import { useAdminStore } from '@/lib/admin-store'
import { ROLE_LABELS } from '@/lib/role-labels'
import { NotificationDropdown } from '@/components/manager/notification-dropdown'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  BarChart3,
  Settings,
  ClipboardList,
  Mic,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { useState } from 'react'

interface AppSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobile?: boolean
  onClose?: () => void
}

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  indent?: boolean
  collapsed?: boolean
  badge?: React.ReactNode
}

function SidebarItem({ href, icon, label, isActive, indent, collapsed, badge }: SidebarItemProps) {
  const inner = (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
        indent && !collapsed && 'ml-5 pl-2.5',
        collapsed && 'justify-center px-0',
        isActive
          ? 'bg-foreground/[0.07] text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:-translate-y-1/2 before:w-[2.5px] before:rounded-full before:bg-primary'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="min-w-0 truncate">{label}</span>}
      {!collapsed && badge}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return inner
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) {
    return <div className="mx-auto my-2 h-px w-5 bg-border" />
  }
  return (
    <div className="mt-5 mb-1.5 flex items-center gap-2 px-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
        {children}
      </span>
      <span className="h-px flex-1 bg-border/60" />
    </div>
  )
}

function ManagerMenu({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const { plannerTracks } = useAdminStore()
  const [staffExpanded, setStaffExpanded] = useState<Record<string, boolean>>({})

  const toggleStaff = (trackId: string) => {
    setStaffExpanded((prev) => ({ ...prev, [trackId]: !prev[trackId] }))
  }

  return (
    <>
      <SidebarItem
        href="/managers/mgr1"
        icon={<BarChart3 className="h-4 w-4 shrink-0" />}
        label="대시보드"
        isActive={pathname.startsWith('/managers/')}
        collapsed={collapsed}
      />

      <SectionLabel collapsed={collapsed}>담당 트랙</SectionLabel>
      {plannerTracks.map((track) => {
        const isTrackActive = pathname === `/tracks/${track.id}`
        const isStaffOpen = staffExpanded[track.id] || pathname.includes('/staff/')

        const trackDot = (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border/30"
            style={{ backgroundColor: track.color }}
          />
        )

        const trackLink = (
          <Link
            href={`/tracks/${track.id}`}
            className={cn(
              'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
              collapsed && 'justify-center px-0',
              isTrackActive
                ? 'bg-foreground/[0.07] text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:-translate-y-1/2 before:w-[2.5px] before:rounded-full before:bg-primary'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {trackDot}
            {!collapsed && (
              <>
                <span className="min-w-0 truncate">{track.name}</span>
                <span className="ml-auto shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground/50">
                  {track.completionRate}%
                </span>
              </>
            )}
          </Link>
        )

        return (
          <div key={track.id}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>{trackLink}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {track.name} · {track.completionRate}%
                </TooltipContent>
              </Tooltip>
            ) : (
              trackLink
            )}

            {!collapsed && (
              <div className="space-y-0.5 py-0.5">
                {track.operator && (
                  <Link
                    href={`/operators/${track.operator.id}`}
                    className={cn(
                      'ml-5 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all',
                      pathname === `/operators/${track.operator.id}`
                        ? 'bg-foreground/[0.07] text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px]">
                      {track.operator.name[0]}
                    </span>
                    <span className="min-w-0 truncate">{track.operator.name}</span>
                    <span className="ml-auto shrink-0 rounded-full bg-muted/80 px-1.5 py-px text-[10px] tabular-nums text-muted-foreground">
                      {track.operator.taskCompletionRate}%
                    </span>
                  </Link>
                )}

                {track.staff && track.staff.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleStaff(track.id)}
                      className="ml-5 flex w-[calc(100%-1.25rem)] items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground"
                    >
                      <ChevronDown className={cn(
                        'h-3 w-3 shrink-0 transition-transform duration-200',
                        isStaffOpen ? 'rotate-0' : '-rotate-90',
                      )} />
                      <span>학관</span>
                      <span className="ml-auto rounded-full bg-muted/80 px-1.5 py-px text-[10px] tabular-nums text-muted-foreground">
                        {track.staff.length}
                      </span>
                    </button>

                    {isStaffOpen && (
                      <div className="space-y-0.5 py-0.5">
                        {track.staff.map((s) => (
                          <SidebarItem
                            key={s.id}
                            href={`/staff/${s.id}`}
                            icon={<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />}
                            label={s.name}
                            isActive={pathname === `/staff/${s.id}`}
                            indent
                            collapsed={collapsed}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

function OperatorMenu({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const { plannerTracks } = useAdminStore()
  const operatorTracks = plannerTracks.filter((t) => t.operator?.name === '이운영')

  return (
    <>
      <SidebarItem
        href="/operators/op1"
        icon={<BarChart3 className="h-4 w-4 shrink-0" />}
        label="대시보드"
        isActive={pathname.startsWith('/operators/')}
        collapsed={collapsed}
      />

      <SectionLabel collapsed={collapsed}>담당 트랙</SectionLabel>
      {operatorTracks.map((track) => {
        const isTrackActive = pathname === `/tracks/${track.id}`

        const trackDot = (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border/30"
            style={{ backgroundColor: track.color }}
          />
        )

        const trackLink = (
          <Link
            href={`/tracks/${track.id}`}
            className={cn(
              'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
              collapsed && 'justify-center px-0',
              isTrackActive
                ? 'bg-foreground/[0.07] text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:-translate-y-1/2 before:w-[2.5px] before:rounded-full before:bg-primary'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {trackDot}
            {!collapsed && <span className="truncate">{track.name}</span>}
          </Link>
        )

        return (
          <div key={track.id}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>{trackLink}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{track.name}</TooltipContent>
              </Tooltip>
            ) : (
              trackLink
            )}

            {!collapsed && track.staff && (
              <div className="space-y-0.5 py-0.5">
                {track.staff.map((s) => (
                  <SidebarItem
                    key={s.id}
                    href={`/staff/${s.id}`}
                    icon={<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />}
                    label={s.name}
                    isActive={pathname === `/staff/${s.id}`}
                    indent
                    collapsed={collapsed}
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

function LearningManagerMenu({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()

  return (
    <>
      <SidebarItem
        href="/staff/staff1"
        icon={<ClipboardList className="h-4 w-4 shrink-0" />}
        label="오늘 할 일"
        isActive={pathname.startsWith('/staff/')}
        collapsed={collapsed}
      />
      <SidebarItem
        href="/staff/staff1?tab=interview"
        icon={<Mic className="h-4 w-4 shrink-0" />}
        label="면담 관리"
        isActive={false}
        collapsed={collapsed}
      />
    </>
  )
}

const ROLE_USER_NAME: Record<AppRole, string> = {
  operator_manager: '이운기',
  operator: '이운영',
  learning_manager: '김학관',
}

export function AppSidebar({ collapsed, onToggleCollapse, mobile, onClose }: AppSidebarProps) {
  const { currentRole } = useRoleStore()
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex h-full shrink-0 flex-col border-r border-border bg-card transition-all duration-200',
          collapsed ? 'w-[52px]' : 'w-[220px]',
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex h-14 shrink-0 items-center border-b border-border/50',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button type="button" onClick={onToggleCollapse} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">사이드바 펼치기</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <span className="text-[15px] font-bold tracking-tight text-foreground">APM</span>
              <div className="flex items-center gap-1">
                <NotificationDropdown />
                {mobile ? (
                  <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="button" onClick={onToggleCollapse} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={cn(
          'flex-1 space-y-0.5 overflow-y-auto py-2',
          collapsed ? 'px-1.5' : 'px-2',
        )}>
          {currentRole === 'operator_manager' && <ManagerMenu collapsed={collapsed} />}
          {currentRole === 'operator' && <OperatorMenu collapsed={collapsed} />}
          {currentRole === 'learning_manager' && <LearningManagerMenu collapsed={collapsed} />}
        </nav>

        {/* Footer */}
        <div className={cn(
          'shrink-0 space-y-1 border-t border-border',
          collapsed ? 'px-1.5 py-2' : 'px-2 py-2',
        )}>
          {currentRole !== 'learning_manager' && (
            <SidebarItem
              href="/admin"
              icon={<Settings className="h-4 w-4 shrink-0" />}
              label="시스템 관리"
              isActive={pathname.startsWith('/admin')}
              collapsed={collapsed}
            />
          )}
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center py-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-[11px] font-bold text-foreground">
                    {ROLE_USER_NAME[currentRole][0]}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {ROLE_USER_NAME[currentRole]} · {ROLE_LABELS[currentRole]}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[11px] font-bold text-foreground">
                {ROLE_USER_NAME[currentRole][0]}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">{ROLE_USER_NAME[currentRole]}</p>
                <p className="truncate text-[10px] text-muted-foreground">{ROLE_LABELS[currentRole]}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
