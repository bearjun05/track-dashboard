'use client'

import { use, useMemo } from 'react'
import { notFound } from 'next/navigation'
import { useAdminStore } from '@/lib/admin-store'
import { buildTrackCreationData } from '@/lib/track-edit-utils'
import { TrackCreationWizard } from '@/components/track-creation/track-creation-wizard'

interface Props {
  params: Promise<{ id: string }>
}

export default function TrackEditPage({ params }: Props) {
  const { id } = use(params)
  const plannerTracks = useAdminStore(s => s.plannerTracks)
  const trackTasks = useAdminStore(s => s.trackTasks)
  const trackSchedules = useAdminStore(s => s.trackSchedules)
  const chapters = useAdminStore(s => s.chapters)

  const track = plannerTracks.find(t => t.id === id)

  const initialData = useMemo(() => {
    if (!track) return null
    return buildTrackCreationData(track, trackTasks, trackSchedules, chapters)
  }, [track, trackTasks, trackSchedules, chapters])

  if (!track || !initialData) return notFound()

  return (
    <TrackCreationWizard
      mode="edit"
      trackId={id}
      initialData={initialData}
    />
  )
}
