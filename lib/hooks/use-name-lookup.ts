'use client'

import { useMemo } from 'react'
import { useAdminStore } from '@/lib/admin-store'

/**
 * ID -> 이름 조회 유틸리티.
 * plannerTracks에서 operator/staff 이름을 수집하여 Map으로 제공.
 */
export function useNameLookup() {
  const plannerTracks = useAdminStore((s) => s.plannerTracks)

  return useMemo(() => {
    const map = new Map<string, string>()
    for (const track of plannerTracks) {
      if (track.operator) map.set(track.operator.id, track.operator.name)
      for (const s of track.staff ?? []) map.set(s.id, s.name)
    }
    return (id?: string) => (id ? map.get(id) ?? id : undefined)
  }, [plannerTracks])
}
