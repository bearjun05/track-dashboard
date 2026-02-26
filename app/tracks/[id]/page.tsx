import { TrackDetail } from '@/components/track/track-detail'

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TrackDetail trackId={id} />
}
