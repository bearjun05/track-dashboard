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
  operator_manager: '/manager',
  operator: '/operator',
  learning_manager: '/',
}
