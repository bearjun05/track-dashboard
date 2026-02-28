'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useRoleStore, type AppRole } from '@/lib/role-store'
import { useAdminStore } from '@/lib/admin-store'
import { ROLE_LABELS } from '@/lib/role-labels'
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
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Users,
} from 'lucide-react'
import { useState } from 'react'

interface AppSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobile?: boolean
  onClose?: () => void
}

function NavItem({ href, icon, label, isActive, indent, collapsed, badge, sub }: {
  href: string; icon: React.ReactNode; label: string; isActive: boolean
  indent?: boolean; collapsed?: boolean; badge?: React.ReactNode; sub?: boolean
}) {
  const inner = (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-all',
        sub ? 'py-1.5 pl-9 pr-3' : 'px-3 py-2',
        indent && !collapsed && !sub && 'ml-4 pl-3',
        collapsed && 'justify-center px-0 py-2',
        isActive
          ? 'bg-foreground/[0.06] text-foreground'
          : 'text-muted-foreground/70 hover:bg-foreground/[0.03] hover:text-foreground',
      )}
    >
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-foreground" />
      )}
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="min-w-0 truncate">{label}</span>}
      {!collapsed && badge}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return inner
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) return <div className="mx-auto my-3 h-px w-4 bg-foreground/[0.06]" />
  return (
    <div className="mb-1 mt-5 px-3">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/25">
        {children}
      </span>
    </div>
  )
}

function TrackItem({ track, pathname, collapsed, children, memberPaths }: {
  track: { id: string; name: string; color: string; completionRate: number }
  pathname: string; collapsed: boolean; children?: React.ReactNode
  memberPaths?: string[]
}) {
  const isTrackPath = pathname.startsWith(`/tracks/${track.id}`)
  const isMemberPath = memberPaths?.some(p => pathname === p) ?? false
  const isActive = isTrackPath || isMemberPath

  const dot = (
    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: track.color }} />
  )

  const link = (
    <Link
      href={`/tracks/${track.id}`}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-all',
        collapsed && 'justify-center px-0',
        isActive
          ? 'bg-foreground/[0.06] text-foreground'
          : 'text-muted-foreground/70 hover:bg-foreground/[0.03] hover:text-foreground',
      )}
    >
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-foreground" />
      )}
      {dot}
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{track.name}</span>
          <span className="shrink-0 text-[10px] tabular-nums text-foreground/25">{track.completionRate}%</span>
        </>
      )}
    </Link>
  )

  return (
    <div>
      {collapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {track.name} · {track.completionRate}%
          </TooltipContent>
        </Tooltip>
      ) : (
        link
      )}
      {!collapsed && isActive && children && (
        <div className="mt-0.5 space-y-px pb-1">
          {children}
        </div>
      )}
    </div>
  )
}

function PersonLink({ href, name, role, rate, isActive }: {
  href: string; name: string; role?: string; rate?: number; isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md py-1.5 pl-9 pr-3 text-[12px] transition-all',
        isActive
          ? 'bg-foreground/[0.05] font-medium text-foreground'
          : 'text-muted-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground/80',
      )}
    >
      <span className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold',
        isActive ? 'bg-foreground/10 text-foreground' : 'bg-foreground/[0.04] text-foreground/40',
      )}>
        {name[0]}
      </span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {role && <span className="shrink-0 text-[9px] text-foreground/20">{role}</span>}
      {rate != null && (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span className="shrink-0 text-[9px] tabular-nums text-foreground/20">{rate}%</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">업무완료율 {rate}%</TooltipContent>
        </Tooltip>
      )}
    </Link>
  )
}

function ManagerMenu({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const { plannerTracks } = useAdminStore()

  return (
    <>
      <NavItem
        href="/managers/mgr1"
        icon={<BarChart3 className="h-4 w-4 shrink-0" />}
        label="대시보드"
        isActive={pathname.startsWith('/managers/')}
        collapsed={collapsed}
      />

      <SectionLabel collapsed={collapsed}>담당 트랙</SectionLabel>
      {plannerTracks.map((track) => {
        const memberPaths = [
          ...(track.operator ? [`/operators/${track.operator.id}`] : []),
          ...(track.staff?.map(s => `/staff/${s.id}`) ?? []),
        ]
        return (
          <TrackItem key={track.id} track={track} pathname={pathname} collapsed={collapsed} memberPaths={memberPaths}>
            {track.operator && (
              <PersonLink
                href={`/operators/${track.operator.id}`}
                name={track.operator.name}
                role="운영"
                rate={track.operator.taskCompletionRate}
                isActive={pathname === `/operators/${track.operator.id}`}
              />
            )}
            {track.staff && track.staff.length > 0 && (
              <>
                <div className="mx-3 my-1 flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-foreground/15" />
                  <span className="text-[10px] text-foreground/25">학관 {track.staff.length}명</span>
                </div>
                {track.staff.map((s) => (
                  <PersonLink
                    key={s.id}
                    href={`/staff/${s.id}`}
                    name={s.name}
                    rate={s.taskCompletionRate}
                    isActive={pathname === `/staff/${s.id}`}
                  />
                ))}
              </>
            )}
          </TrackItem>
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
      <NavItem
        href="/operators/op1"
        icon={<BarChart3 className="h-4 w-4 shrink-0" />}
        label="대시보드"
        isActive={pathname.startsWith('/operators/')}
        collapsed={collapsed}
      />

      <SectionLabel collapsed={collapsed}>담당 트랙</SectionLabel>
      {operatorTracks.map((track) => {
        const memberPaths = track.staff?.map(s => `/staff/${s.id}`) ?? []
        return (
          <TrackItem key={track.id} track={track} pathname={pathname} collapsed={collapsed} memberPaths={memberPaths}>
            {track.staff && track.staff.map((s) => (
              <PersonLink
                key={s.id}
                href={`/staff/${s.id}`}
                name={s.name}
                rate={s.taskCompletionRate}
                isActive={pathname === `/staff/${s.id}`}
              />
            ))}
          </TrackItem>
        )
      })}
    </>
  )
}

function LearningManagerMenu({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()

  return (
    <>
      <NavItem
        href="/staff/staff1"
        icon={<ClipboardList className="h-4 w-4 shrink-0" />}
        label="오늘 할 일"
        isActive={pathname.startsWith('/staff/') && !pathname.includes('tab=interview')}
        collapsed={collapsed}
      />
      <NavItem
        href="/staff/staff1?tab=interview"
        icon={<Mic className="h-4 w-4 shrink-0" />}
        label="면담 관리"
        isActive={pathname.includes('tab=interview')}
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
          'flex h-full shrink-0 flex-col border-r border-foreground/[0.06] bg-background transition-all duration-200',
          collapsed ? 'w-[52px]' : 'w-[240px]',
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex h-14 shrink-0 items-center',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button type="button" onClick={onToggleCollapse} className="rounded-md p-1.5 text-foreground/30 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/60">
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">사이드바 펼치기</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <span className="text-[15px] font-bold tracking-tight text-foreground">EduWorks</span>
              <div className="flex items-center gap-1">
                {mobile ? (
                  <button type="button" onClick={onClose} className="rounded-md p-1 text-foreground/30 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/60">
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="button" onClick={onToggleCollapse} className="rounded-md p-1 text-foreground/30 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/60">
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={cn(
          'flex-1 space-y-0.5 overflow-y-auto',
          collapsed ? 'px-1.5 py-2' : 'px-2 py-1',
        )}>
          {currentRole === 'operator_manager' && <ManagerMenu collapsed={collapsed} />}
          {currentRole === 'operator' && <OperatorMenu collapsed={collapsed} />}
          {currentRole === 'learning_manager' && <LearningManagerMenu collapsed={collapsed} />}
        </nav>

        {/* Footer */}
        <div className={cn(
          'shrink-0 space-y-1 border-t border-foreground/[0.06]',
          collapsed ? 'px-1.5 py-3' : 'px-2 py-3',
        )}>
          {currentRole !== 'learning_manager' && (
            <NavItem
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
                <div className="flex items-center justify-center pt-1">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/[0.06] text-[11px] font-bold text-foreground/60">
                    {ROLE_USER_NAME[currentRole][0]}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {ROLE_USER_NAME[currentRole]} · {ROLE_LABELS[currentRole]}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors hover:bg-foreground/[0.02]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-[11px] font-bold text-foreground/60">
                {ROLE_USER_NAME[currentRole][0]}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">{ROLE_USER_NAME[currentRole]}</p>
                <p className="truncate text-[10px] text-foreground/30">{ROLE_LABELS[currentRole]}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
