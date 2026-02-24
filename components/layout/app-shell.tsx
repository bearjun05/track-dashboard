'use client'

import { useRoleStore } from '@/lib/role-store'
import { AppSidebar } from './app-sidebar'
import { DebugRoleSwitcher } from './debug-role-switcher'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentRole } = useRoleStore()
  const showSidebar = currentRole !== 'learning_manager'

  return (
    <div className="flex h-screen flex-col">
      <DebugRoleSwitcher />
      <div className="flex min-h-0 flex-1">
        {showSidebar && <AppSidebar />}
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
