'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useAdminStore } from '@/lib/admin-store'

export default function TrackEditSelectPage() {
  const router = useRouter()
  const plannerTracks = useAdminStore(s => s.plannerTracks)
  const deleteTrack = useAdminStore(s => s.deleteTrack)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteTrack(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
        <Link
          href="/admin"
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[15px] font-bold tracking-tight text-foreground">
          트랙 수정
        </h1>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground">수정할 트랙 선택</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            수정할 트랙을 선택하면 기존 설정이 반영된 상태로 위저드가 열립니다.
          </p>
        </div>

        {plannerTracks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">생성된 트랙이 없습니다.</p>
            <Link
              href="/admin/tracks/new"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              트랙 생성하기
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {plannerTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-secondary/30"
              >
                <button
                  onClick={() => router.push(`/admin/tracks/${track.id}/edit`)}
                  className="flex flex-1 items-start gap-4 text-left"
                >
                  <div
                    className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: track.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{track.name}</h3>
                      {track.operator && (
                        <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground">
                          {track.operator.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {track.period} · 학관 {track.staffCount}명 · 수강생 {track.studentCount}명
                    </p>
                  </div>
                  <Pencil className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: track.id, name: track.name }) }}
                  className="mt-0.5 rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-[15px] font-bold text-foreground">트랙 삭제</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{deleteTarget.name}</span> 트랙을 삭제하시겠어요?
              <br />삭제하면 해당 트랙의 모든 Task, 일정, 공지가 함께 삭제되며 되돌릴 수 없습니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-[13px] font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
