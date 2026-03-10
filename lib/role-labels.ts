export type RoleKey = 'operator_manager' | 'operator' | 'learning_manager' | 'tutor'

export const ROLE_LABELS: Record<string, string> = {
  operator_manager: '총괄',
  operator: '운영',
  learning_manager: '학관',
  tutor: '튜터',
}

export const ROLE_LABELS_FULL: Record<string, string> = {
  operator_manager: '운영기획매니저',
  operator: '운영매니저',
  learning_manager: '학습관리매니저',
  tutor: '튜터',
}

export type RequesterRole = '총괄' | '운영' | '학관'

export function getUserRoleKey(userId: string): RoleKey | null {
  if (userId.startsWith('mgr')) return 'operator_manager'
  if (userId.startsWith('op')) return 'operator'
  if (userId.startsWith('staff')) return 'learning_manager'
  if (userId.startsWith('tutor')) return 'tutor'
  return null
}

export function getRequesterLabel(source: string, creatorId?: string): string {
  if (source === 'system' || !creatorId) return '시스템'
  const role = getUserRoleKey(creatorId)
  return role ? ROLE_LABELS[role] : '시스템'
}
