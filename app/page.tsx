'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRoleStore } from '@/lib/role-store'

const ROLE_DEFAULT_PATH: Record<string, string> = {
  operator_manager: '/managers/mgr1',
  operator: '/operators/op1',
  learning_manager: '/staff/staff1',
}

export default function RootPage() {
  const router = useRouter()
  const { currentRole } = useRoleStore()

  useEffect(() => {
    const path = ROLE_DEFAULT_PATH[currentRole] ?? '/staff/staff1'
    router.replace(path)
  }, [currentRole, router])

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-muted-foreground">리다이렉트 중...</div>
    </div>
  )
}
