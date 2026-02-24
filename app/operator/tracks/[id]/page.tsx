import { OperatorTrackDetail } from '@/components/operator/operator-track-detail'

export default async function OperatorTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OperatorTrackDetail trackId={id} />
}
