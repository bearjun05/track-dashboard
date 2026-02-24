'use client'

import { AppSidebar } from './app-sidebar'
import { DebugRoleSwitcher } from './debug-role-switcher'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <DebugRoleSwitcher />
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
