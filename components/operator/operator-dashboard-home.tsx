'use client'

import { ManagerOverview } from '@/components/manager/manager-overview'

export function OperatorDashboardHome({ operatorId }: { operatorId?: string }) {
  return <ManagerOverview userId={operatorId ?? 'op1'} role="operator" />
}
