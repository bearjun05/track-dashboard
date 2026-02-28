'use client'

import { ManagerOverview } from './manager-overview'

export function ManagerDashboardHome({ managerId }: { managerId?: string }) {
  return <ManagerOverview userId={managerId ?? 'mgr1'} role="operator_manager" />
}
