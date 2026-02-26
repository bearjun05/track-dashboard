'use client'

import { DashboardHome } from '@/components/manager/dashboard-home'

export function OperatorDashboardHome({ operatorId }: { operatorId?: string }) {
  return <DashboardHome userId={operatorId ?? 'op1'} role="operator" />
}
