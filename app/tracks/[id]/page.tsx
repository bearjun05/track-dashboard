import { redirect } from 'next/navigation'

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/tracks/${id}/tasks`)
}
