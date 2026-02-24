import { OperatorStaffDetail } from '@/components/operator/operator-staff-detail'

export default async function OperatorStaffPage({ params }: { params: Promise<{ id: string; staffId: string }> }) {
  const { id, staffId } = await params
  return <OperatorStaffDetail trackId={id} staffId={staffId} />
}
