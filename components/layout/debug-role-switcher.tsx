'use client'

import { useRouter } from 'next/navigation'
import { useRoleStore, ROLE_HOME, type AppRole } from '@/lib/role-store'
import { ROLE_LABELS } from '@/lib/role-labels'
import { cn } from '@/lib/utils'
import { Bug } from 'lucide-react'

const ROLES: AppRole[] = ['operator_manager', 'operator', 'learning_manager']

export function DebugRoleSwitcher() {
  const { currentRole, setRole } = useRoleStore()
  const router = useRouter()

  function handleSwitch(role: AppRole) {
    setRole(role)
    router.push(ROLE_HOME[role])
  }

  return (
    <div className="flex h-8 shrink-0 items-center gap-3 border-b border-dashed border-orange-300/60 bg-orange-50 px-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-orange-600">
        <Bug className="h-3 w-3" />
        DEBUG
      </div>
      <div className="h-3 w-px bg-orange-300/50" />
      <div className="flex items-center gap-1">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => handleSwitch(role)}
            className={cn(
              'rounded px-2.5 py-0.5 text-[11px] font-medium transition-colors',
              currentRole === role
                ? 'bg-orange-600 text-white'
                : 'text-orange-700 hover:bg-orange-200/60',
            )}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>
      <span className="ml-auto text-[10px] text-orange-400">역할 전환 시 해당 홈으로 이동</span>
    </div>
  )
}
