'use client'

import { use } from 'react'
import { ManagerDashboardHome } from '@/components/manager/manager-dashboard-home'

export default function ManagerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: managerId } = use(params)
  return <ManagerDashboardHome managerId={managerId} />
}
