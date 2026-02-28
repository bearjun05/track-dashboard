import { TrackTaskSheet } from '@/components/track/track-task-sheet'

export default async function TrackTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const initialScope = typeof sp.scope === 'string' ? sp.scope : undefined
  const initialStatus = typeof sp.status === 'string' ? sp.status : undefined
  return (
    <TrackTaskSheet
      trackId={id}
      initialScope={initialScope}
      initialStatus={initialStatus}
    />
  )
}
