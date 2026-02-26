'use client'

import { DashboardHome } from './dashboard-home'

export function ManagerDashboardHome({ managerId }: { managerId?: string }) {
  return <DashboardHome userId={managerId ?? 'mgr1'} role="operator_manager" />
}
