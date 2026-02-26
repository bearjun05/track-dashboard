'use client'

import { useState, useMemo, useCallback } from 'react'
import { Plus, Pencil, Check, X, Trash2, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TrackCreationData, SubjectCard, Chapter } from '@/lib/track-creation-types'

interface StepChapterBuilderProps {
  data: TrackCreationData
  updateData: (partial: Partial<TrackCreationData>) => void
}

function computeChapterDates(cards: SubjectCard[]): { startDate: string; endDate: string } {
  if (cards.length === 0) return { startDate: '', endDate: '' }
  const dates = cards.flatMap(c => [c.startDate, c.endDate])
  return {
    startDate: dates.reduce((a, b) => (a < b ? a : b)),
    endDate: dates.reduce((a, b) => (a > b ? a : b)),
  }
}

function totalHours(cards: SubjectCard[]): number {
  return cards.reduce((sum, c) => sum + c.totalHours, 0)
}

export function StepChapterBuilder({ data, updateData }: StepChapterBuilderProps) {
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Build a unified timeline: all cards in date order with chapter labels
  const timeline = useMemo(() => {
    type TimelineItem =
      | { type: 'chapter-header'; chapter: Chapter }
      | { type: 'card'; card: SubjectCard; chapterId: string | null; chapterName: string | null }
      | { type: 'chapter-footer'; chapter: Chapter }
      | { type: 'divider'; afterIndex: number; nextChapterNumber: number }

    const items: TimelineItem[] = []

    const chaptersInOrder = [...data.chapters].sort((a, b) => {
      if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate)
      return a.order - b.order
    })

    // Interleave chapters (with their cards) and unassigned cards
    const chapterCards: { card: SubjectCard; chapterId: string; chapterName: string; chapterObj: Chapter }[] = []
    for (const ch of chaptersInOrder) {
      for (const card of ch.cards) {
        chapterCards.push({ card, chapterId: ch.id, chapterName: ch.name, chapterObj: ch })
      }
    }

    const unassignedCards = [...data.unassignedCards].sort((a, b) => a.startDate.localeCompare(b.startDate))

    // Merge into one sorted list
    type MergedItem = { card: SubjectCard; chapterId: string | null; chapterName: string | null; chapterObj: Chapter | null }
    const merged: MergedItem[] = []
    for (const cc of chapterCards) {
      merged.push({ card: cc.card, chapterId: cc.chapterId, chapterName: cc.chapterName, chapterObj: cc.chapterObj })
    }
    for (const card of unassignedCards) {
      merged.push({ card, chapterId: null, chapterName: null, chapterObj: null })
    }
    merged.sort((a, b) => a.card.startDate.localeCompare(b.card.startDate))

    let currentChapterId: string | null = null
    let unassignedRunStart = -1

    for (let i = 0; i < merged.length; i++) {
      const item = merged[i]

      if (item.chapterId && item.chapterId !== currentChapterId) {
        // Insert divider before chapter if there were unassigned cards
        if (unassignedRunStart >= 0) {
          items.push({ type: 'divider', afterIndex: i - 1, nextChapterNumber: chaptersInOrder.length + 1 })
          unassignedRunStart = -1
        }

        if (currentChapterId) {
          const prevCh = chaptersInOrder.find(c => c.id === currentChapterId)
          if (prevCh) items.push({ type: 'chapter-footer', chapter: prevCh })
        }
        items.push({ type: 'chapter-header', chapter: item.chapterObj! })
        currentChapterId = item.chapterId
      }

      if (!item.chapterId && currentChapterId) {
        const prevCh = chaptersInOrder.find(c => c.id === currentChapterId)
        if (prevCh) items.push({ type: 'chapter-footer', chapter: prevCh })
        currentChapterId = null
      }

      if (!item.chapterId && unassignedRunStart < 0) {
        unassignedRunStart = i
      }

      items.push({ type: 'card', card: item.card, chapterId: item.chapterId, chapterName: item.chapterName })

      // Divider after each unassigned card
      if (!item.chapterId) {
        const nextItem = merged[i + 1]
        const isLastUnassigned = !nextItem || nextItem.chapterId !== null
        items.push({
          type: 'divider',
          afterIndex: i,
          nextChapterNumber: data.chapters.length + 1,
        })
      }
    }

    // Close last chapter if needed
    if (currentChapterId) {
      const ch = chaptersInOrder.find(c => c.id === currentChapterId)
      if (ch) items.push({ type: 'chapter-footer', chapter: ch })
    }

    return { items, merged }
  }, [data.chapters, data.unassignedCards])

  // Create chapter from consecutive unassigned cards up to a given index
  const createChapterUpTo = useCallback((dividerAfterIndex: number) => {
    const { merged } = timeline

    // Gather all unassigned cards from the first unassigned card to the divider position (inclusive)
    const cardsToChapter: SubjectCard[] = []
    for (let i = 0; i <= dividerAfterIndex; i++) {
      if (merged[i].chapterId === null) {
        cardsToChapter.push(merged[i].card)
      }
    }

    // Only take the consecutive unassigned run ending at dividerAfterIndex
    const run: SubjectCard[] = []
    for (let i = dividerAfterIndex; i >= 0; i--) {
      if (merged[i].chapterId === null) {
        run.unshift(merged[i].card)
      } else {
        break
      }
    }

    if (run.length === 0) return

    const chapterNumber = data.chapters.length + 1
    const dates = computeChapterDates(run)
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      name: `챕터 ${chapterNumber}`,
      order: chapterNumber - 1,
      cards: run,
      ...dates,
    }

    const runIds = new Set(run.map(c => c.id))
    const remainingUnassigned = data.unassignedCards.filter(c => !runIds.has(c.id))

    updateData({
      chapters: [...data.chapters, newChapter],
      unassignedCards: remainingUnassigned,
    })
  }, [timeline, data.chapters, data.unassignedCards, updateData])

  const deleteChapter = useCallback((chapterId: string) => {
    const chapter = data.chapters.find(c => c.id === chapterId)
    if (!chapter) return

    // Renumber remaining chapters
    const remaining = data.chapters.filter(c => c.id !== chapterId)
    const renumbered = remaining.map((c, i) => ({ ...c, order: i, name: c.name.startsWith('챕터') ? `챕터 ${i + 1}` : c.name }))

    const returnedCards = [...data.unassignedCards, ...chapter.cards]
    returnedCards.sort((a, b) => a.startDate.localeCompare(b.startDate))

    updateData({
      chapters: renumbered,
      unassignedCards: returnedCards,
    })
  }, [data.chapters, data.unassignedCards, updateData])

  const startEditing = (chapter: Chapter) => {
    setEditingChapterId(chapter.id)
    setEditingName(chapter.name)
  }

  const saveEditing = () => {
    if (!editingChapterId) return
    updateData({
      chapters: data.chapters.map(c =>
        c.id === editingChapterId ? { ...c, name: editingName } : c
      ),
    })
    setEditingChapterId(null)
  }

  // Reset all chapters
  const resetAll = useCallback(() => {
    const allCards = [
      ...data.unassignedCards,
      ...data.chapters.flatMap(c => c.cards),
    ].sort((a, b) => a.startDate.localeCompare(b.startDate))
    updateData({ chapters: [], unassignedCards: allCards })
  }, [data.unassignedCards, data.chapters, updateData])

  const allCardsSorted = useMemo(() => {
    return [
      ...data.unassignedCards,
      ...data.chapters.flatMap(c => c.cards),
    ].sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [data.unassignedCards, data.chapters])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">챕터 편성</h2>
          <p className="text-xs text-muted-foreground">교과 사이를 클릭하여 챕터를 나누세요. 순서대로 자동 번호가 매겨집니다.</p>
        </div>
        {data.chapters.length > 0 && (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={resetAll}>
            초기화
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {data.unassignedCards.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">편성 진행률</span>
              <span className="font-medium text-foreground">
                {allCardsSorted.length - data.unassignedCards.length} / {allCardsSorted.length}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-foreground/70 transition-all"
                style={{ width: `${((allCardsSorted.length - data.unassignedCards.length) / allCardsSorted.length) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">미배정 {data.unassignedCards.length}개</span>
        </div>
      )}

      {/* Main timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* Timeline */}
        <div className="space-y-0">
          {timeline.items.map((item, i) => {
            if (item.type === 'chapter-header') {
              return (
                <div key={`ch-head-${item.chapter.id}`} className="mb-0">
                  <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-border bg-secondary/40 px-3 py-2">
                    {editingChapterId === item.chapter.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-6 text-xs bg-background"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                        />
                        <button onClick={saveEditing} className="p-0.5 rounded hover:bg-secondary"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setEditingChapterId(null)} className="p-0.5 rounded hover:bg-secondary"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-foreground">{item.chapter.name}</span>
                        <button onClick={() => startEditing(item.chapter)} className="p-0.5 rounded hover:bg-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                        </button>
                      </>
                    )}
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {item.chapter.startDate} ~ {item.chapter.endDate}
                    </span>
                    <span className="rounded-full bg-foreground/[0.06] px-1.5 py-px text-[9px] text-muted-foreground">
                      {item.chapter.cards.length}개 · {totalHours(item.chapter.cards)}h
                    </span>
                    <button
                      onClick={() => deleteChapter(item.chapter.id)}
                      className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="챕터 해제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            }

            if (item.type === 'chapter-footer') {
              return (
                <div key={`ch-foot-${item.chapter.id}`} className="mb-3">
                  <div className="h-px rounded-b-lg border border-t-0 border-border bg-card" />
                </div>
              )
            }

            if (item.type === 'card') {
              const isInChapter = item.chapterId !== null
              return (
                <div
                  key={`card-${item.card.id}`}
                  className={`flex items-center gap-3 px-3 py-2 text-xs transition-colors ${
                    isInChapter
                      ? 'border-x border-border bg-card'
                      : 'rounded-lg border border-border bg-card'
                  }`}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-[9px] font-medium text-muted-foreground">
                    {item.card.isProject ? 'P' : '강'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-foreground">{item.card.subjectName}</span>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {item.card.startDate} ~ {item.card.endDate}
                  </span>
                  <span className="shrink-0 rounded bg-foreground/[0.06] px-1.5 py-px text-[9px] font-medium text-muted-foreground">
                    {item.card.totalHours}h
                  </span>
                </div>
              )
            }

            if (item.type === 'divider') {
              return (
                <div key={`div-${i}`} className="group relative flex items-center py-1">
                  <div className="flex-1 border-t border-dashed border-border/60" />
                  <button
                    onClick={() => createChapterUpTo(item.afterIndex)}
                    className="mx-2 flex items-center gap-1 rounded-full border border-dashed border-border bg-card px-2.5 py-1 text-[10px] text-muted-foreground/60 transition-all hover:border-foreground/30 hover:bg-secondary hover:text-foreground"
                  >
                    <Scissors className="h-3 w-3" />
                    여기까지 챕터 {item.nextChapterNumber}
                  </button>
                  <div className="flex-1 border-t border-dashed border-border/60" />
                </div>
              )
            }

            return null
          })}

          {allCardsSorted.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">시간표를 먼저 업로드해 주세요.</p>
          )}
        </div>

        {/* Chapter summary sidebar */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground">챕터 요약</h3>
          {data.chapters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              <p className="text-[11px] text-muted-foreground">아직 챕터가 없습니다.</p>
              <p className="mt-1 text-[10px] text-muted-foreground/60">교과 사이의 "여기까지 챕터" 버튼을 클릭하여<br />챕터를 나눠보세요.</p>
            </div>
          ) : (
            [...data.chapters]
              .sort((a, b) => a.order - b.order)
              .map((chapter, idx) => (
                <div
                  key={chapter.id}
                  className="group rounded-xl border border-border bg-card overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/[0.08] text-[9px] font-semibold text-foreground">
                        {idx + 1}
                      </span>
                      {editingChapterId === chapter.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-6 w-28 text-[11px] bg-background"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                          />
                          <button onClick={saveEditing} className="p-0.5"><Check className="h-3 w-3" /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(chapter)}
                          className="text-xs font-semibold text-foreground hover:underline"
                        >
                          {chapter.name}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => deleteChapter(chapter.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{chapter.startDate} ~ {chapter.endDate}</span>
                      <span>{totalHours(chapter.cards)}h</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {chapter.cards.map(card => (
                        <span key={card.id} className="rounded bg-foreground/[0.04] px-1 py-px text-[8px]">
                          {card.subjectName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
