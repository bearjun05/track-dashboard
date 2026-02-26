'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRoleStore } from '@/lib/role-store'
import { AppSidebar } from './app-sidebar'
import { DebugRoleSwitcher } from './debug-role-switcher'
import { Menu } from 'lucide-react'

function useIsLg() {
  const [isLg, setIsLg] = useState(true)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    setIsLg(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isLg
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentRole } = useRoleStore()
  const showSidebar = currentRole !== 'learning_manager'
  const isLg = useIsLg()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    if (isLg) setMobileOpen(false)
  }, [isLg])

  useEffect(() => {
    if (!mobileOpen) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [mobileOpen])

  return (
    <div className="flex h-screen flex-col">
      <DebugRoleSwitcher />
      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        {showSidebar && isLg && (
          <AppSidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(c => !c)}
          />
        )}

        {/* Mobile overlay */}
        {showSidebar && !isLg && mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 transition-opacity"
              onClick={closeMobile}
            />
            <div className="fixed inset-y-0 left-0 z-50 shadow-xl">
              <AppSidebar
                collapsed={false}
                onToggleCollapse={() => {}}
                mobile
                onClose={closeMobile}
              />
            </div>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          {showSidebar && !isLg && (
            <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-[14px] font-bold tracking-tight text-foreground">APM</span>
            </div>
          )}
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}
