'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useAdminStore } from '@/lib/admin-store'
import type { KanbanCard } from '@/lib/admin-mock-data'
import { ROLE_LABELS } from '@/lib/role-labels'
import {
  AlertTriangle,
  Send,
  MessageSquare,
  Briefcase,
  User,
} from 'lucide-react'

const TODAY = '2026-02-11'
const HEADER_CLS = 'flex h-10 shrink-0 items-center border-b border-border px-3'

/* ------------------------------------------------------------------ */
/*  Cohort tab                                                         */
/* ------------------------------------------------------------------ */
function CohortTab({ name, color, isActive, cardCount, onClick }: {
  name: string; color: string; isActive: boolean; cardCount: number; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${isActive ? 'bg-foreground/[0.06]' : 'hover:bg-secondary/60'}`}
    >
      <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className={`flex-1 text-[13px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{name}</span>
      <span className="text-[11px] tabular-nums text-muted-foreground">{cardCount}</span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Card list item                                                     */
/* ------------------------------------------------------------------ */
function CardListItem({ card, isActive, onClick }: { card: KanbanCard; isActive: boolean; onClick: () => void }) {
  const statusLabel = card.status === 'waiting' ? '대기' : card.status === 'in-progress' ? '진행' : '완료'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors ${isActive ? 'bg-foreground/[0.06]' : 'hover:bg-secondary/60'} ${card.status === 'done' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[13px] font-medium leading-tight ${isActive ? 'text-foreground' : 'text-foreground'}`}>{card.title}</span>
        <span className="shrink-0 text-[10px] text-muted-foreground">{statusLabel}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        {card.requesterRole === ROLE_LABELS.operator_manager
          ? <span className="inline-flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{ROLE_LABELS.operator_manager}</span>
          : <span className="inline-flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{ROLE_LABELS.operator}</span>}
        <span>{card.requesterName}</span>
        {card.isUrgent && <span className="font-medium text-destructive">{'긴급'}</span>}
        {card.messages.length > 0 && <span className="ml-auto inline-flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" />{card.messages.length}</span>}
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Date divider                                                       */
/* ------------------------------------------------------------------ */
function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Chat window                                                        */
/* ------------------------------------------------------------------ */
function ChatWindow({ card }: { card: KanbanCard }) {
  const { addCardChatMessage } = useAdminStore()
  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight) }, [card.id, card.messages.length])

  const handleSend = () => { if (!inputText.trim()) return; addCardChatMessage(card.id, inputText.trim()); setInputText('') }

  const statusLabel = card.status === 'waiting' ? '대기중' : card.status === 'in-progress' ? '진행중' : '완료'

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className={`${HEADER_CLS} gap-2`}>
        <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: card.trackColor }} />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{card.title}</span>
        {card.isUrgent && <span className="shrink-0 text-[10px] font-medium text-destructive">{'긴급'}</span>}
        <span className="shrink-0 text-[10px] text-muted-foreground">{statusLabel}</span>
      </div>

      {/* Sub-info */}
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>{card.operatorName}</span>
        <span>{'·'}</span>
        <span>{card.requesterRole === ROLE_LABELS.operator_manager ? `${ROLE_LABELS.operator_manager} 업무` : `${ROLE_LABELS.operator} 요청`}</span>
        <span>{'·'}</span>
        <span>{card.trackName}</span>
      </div>

      {/* Content */}
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs leading-relaxed text-muted-foreground">{card.content}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-secondary/20 px-4 py-3">
        {card.messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <MessageSquare className="h-7 w-7" />
            <p className="text-xs">{'아직 메시지가 없습니다'}</p>
          </div>
        ) : (
          card.messages.map((msg) =>
            msg.isSelf ? (
              <div key={msg.id} className="flex justify-end">
                <div className="flex items-end gap-1.5">
                  <span className="pb-0.5 text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  <div className="max-w-[280px] rounded-xl rounded-tr-[4px] bg-foreground/[0.08] px-3 py-2">
                    <p className="text-[13px] leading-relaxed text-foreground">{msg.content}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-foreground">
                  {msg.authorName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-foreground">{msg.authorName}</span>
                  <div className="mt-0.5 flex items-end gap-1.5">
                    <div className="max-w-[280px] rounded-xl rounded-tl-[4px] bg-card px-3 py-2 shadow-sm">
                      <p className="text-[13px] leading-relaxed text-foreground">{msg.content}</p>
                    </div>
                    <span className="pb-0.5 text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ),
          )
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-border bg-card px-3 py-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="메시지를 입력하세요..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
        />
        <button type="button" disabled={!inputText.trim()} onClick={handleSend} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-colors disabled:opacity-30" aria-label="전송">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Utils                                                              */
/* ------------------------------------------------------------------ */
function getDateStr(createdAt: string): string { return createdAt.split(' ')[0] ?? createdAt }
function formatDateLabel(dateStr: string): string {
  if (dateStr === TODAY) return '오늘'
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m ?? '0', 10)}월 ${parseInt(d ?? '0', 10)}일`
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */
export function OperatorChatSection() {
  const { kanbanCards, cohorts } = useAdminStore()
  const [activeCohort, setActiveCohort] = useState(cohorts[0]?.name ?? '')
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [showAllCompleted, setShowAllCompleted] = useState(false)

  const cohortCards = useMemo(() => {
    const all = kanbanCards.filter((c) => c.trackName === activeCohort)
    if (showAllCompleted) return all.filter((c) => c.status === 'done')
    return all.filter((c) => c.status !== 'done' || getDateStr(c.createdAt) === TODAY)
  }, [kanbanCards, activeCohort, showAllCompleted])

  const groupedCards = useMemo(() => {
    const map = new Map<string, KanbanCard[]>()
    for (const card of cohortCards) { const d = getDateStr(card.createdAt); if (!map.has(d)) map.set(d, []); map.get(d)!.push(card) }
    return [...map.keys()].sort((a, b) => b.localeCompare(a)).map((date) => ({ date, cards: map.get(date)! }))
  }, [cohortCards])

  const activeCard = activeCardId ? kanbanCards.find((c) => c.id === activeCardId) : null

  const handleCohortChange = (name: string) => { setActiveCohort(name); setActiveCardId(null) }

  useEffect(() => {
    if (cohortCards.length > 0 && !cohortCards.find((c) => c.id === activeCardId)) setActiveCardId(cohortCards[0].id)
  }, [activeCohort, cohortCards]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{'기수별 실시간 채팅'}</h2>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
          <input type="checkbox" checked={showAllCompleted} onChange={(e) => setShowAllCompleted(e.target.checked)} className="h-3.5 w-3.5 rounded border-border accent-foreground" />
          {'완료 전체보기'}
        </label>
      </div>

      <div className="flex overflow-hidden rounded-xl border border-border" style={{ minHeight: '420px', height: 'calc(100vh - 320px)' }}>
        {/* 1열: 기수 */}
        <div className="flex w-[130px] shrink-0 flex-col border-r border-border bg-card">
          <div className={HEADER_CLS}><span className="text-[13px] font-medium text-foreground">{'기수'}</span></div>
          <div className="flex-1 space-y-0.5 overflow-y-auto p-1.5">
            {cohorts.map((co) => (
              <CohortTab key={co.id} name={co.name} color={co.color} isActive={activeCohort === co.name} cardCount={kanbanCards.filter((c) => c.trackName === co.name).length} onClick={() => handleCohortChange(co.name)} />
            ))}
          </div>
        </div>

        {/* 2열: 카드 */}
        <div className="flex w-[250px] shrink-0 flex-col border-r border-border bg-card">
          <div className={HEADER_CLS}>
            <span className="text-[13px] font-medium text-foreground">{'카드'}</span>
            <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">{cohortCards.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {groupedCards.length > 0 ? groupedCards.map((g) => (
              <div key={g.date}>
                <DateDivider label={formatDateLabel(g.date)} />
                <div className="space-y-0.5 px-1.5">
                  {g.cards.map((card) => <CardListItem key={card.id} card={card} isActive={activeCardId === card.id} onClick={() => setActiveCardId(card.id)} />)}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center gap-1 py-8 text-muted-foreground"><MessageSquare className="h-6 w-6" /><p className="text-xs">{'카드 없음'}</p></div>
            )}
          </div>
        </div>

        {/* 3열: 채팅 */}
        {activeCard ? <ChatWindow card={activeCard} /> : (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-muted-foreground"><MessageSquare className="h-8 w-8" /><p className="text-[13px]">{'카드를 선택하세요'}</p></div>
        )}
      </div>
    </section>
  )
}
