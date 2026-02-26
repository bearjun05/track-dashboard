import { create } from 'zustand'

export type AppRole = 'operator_manager' | 'operator' | 'learning_manager'

interface RoleState {
  currentRole: AppRole
  setRole: (role: AppRole) => void
}

export const useRoleStore = create<RoleState>((set) => ({
  currentRole: 'operator_manager',
  setRole: (role) => set({ currentRole: role }),
}))

export const ROLE_HOME: Record<AppRole, string> = {
  operator_manager: '/managers/mgr1',
  operator: '/operators/op1',
  learning_manager: '/staff/staff1',
}

export const ROLE_USER_NAME: Record<AppRole, string> = {
  operator_manager: '박총괄',
  operator: '이운영',
  learning_manager: '김학관',
}
