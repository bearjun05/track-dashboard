'use client'

import { use } from 'react'
import { OperatorDashboardHome } from '@/components/operator/operator-dashboard-home'

export default function OperatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: operatorId } = use(params)
  return <OperatorDashboardHome operatorId={operatorId} />
}
