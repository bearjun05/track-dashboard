import { TrackDetailDashboard } from '@/components/manager/track-detail-dashboard'

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TrackDetailDashboard trackId={id} />
}
