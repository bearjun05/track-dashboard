'use client'

import { cn } from '@/lib/utils'
import { ROLE_LABELS, ROLE_LABELS_FULL } from '@/lib/role-labels'
import {
  BarChart3,
  Users,
  GraduationCap,
  ClipboardList,
  Megaphone,
  Bell,
  TrendingUp,
  Settings,
} from 'lucide-react'

interface SidebarProps {
  activeMenu: string
  onMenuChange: (menu: string) => void
}

const menuItems = [
  { id: 'dashboard', label: '대시보드', icon: BarChart3 },
  { id: 'staff', label: `${ROLE_LABELS_FULL.learning_manager} 관리`, icon: Users },
  { id: 'students', label: '수강생 관리', icon: GraduationCap },
  { id: 'rounds', label: '팀순회 현황', icon: ClipboardList },
  { id: 'notices', label: '공지 관리', icon: Megaphone },
  { id: 'issues', label: '이슈/요청', icon: Bell },
  { id: 'stats', label: '통계 및 리포트', icon: TrendingUp },
  { id: 'settings', label: '설정', icon: Settings },
]

export function ManagerSidebar({ activeMenu, onMenuChange }: SidebarProps) {
  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-secondary/50">
      {/* Logo */}
      <div className="flex h-[60px] items-center px-6">
        <span className="text-lg font-bold text-primary">{'EduWorks'}</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeMenu
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onMenuChange(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-border px-4 py-4">
        <p className="text-sm font-medium text-foreground">{'이운영'}</p>
        <p className="text-xs text-muted-foreground">{ROLE_LABELS.operator_manager}</p>
      </div>
    </aside>
  )
}
