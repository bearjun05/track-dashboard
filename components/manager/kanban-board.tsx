'use client'

import { useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { useAdminStore } from '@/lib/admin-store'
import type { KanbanCard, KanbanStatus } from '@/lib/admin-mock-data'
import { ROLE_LABELS, type RequesterRole } from '@/lib/role-labels'
import { X, Send, AlertTriangle, ChevronLeft, ChevronRight, Plus, User, Briefcase } from 'lucide-react'

const COLUMNS: { id: KanbanStatus; label: string }[] = [
  { id: 'waiting', label: '대기중' },
  { id: 'in-progress', label: '진행중' },
  { id: 'done', label: '완료' },
]

/* ------------------------------------------------------------------ */
/*  Requester Role Badge                                               */
/* ------------------------------------------------------------------ */
function RequesterBadge({ role, compact }: { role: RequesterRole; compact?: boolean }) {
  const isManager = role === ROLE_LABELS.operator_manager
  const isStaff = role === ROLE_LABELS.learning_manager
  const label = compact ? role : isManager ? `${ROLE_LABELS.operator_manager} 업무` : isStaff ? `${ROLE_LABELS.learning_manager} 요청` : `${ROLE_LABELS.operator} 요청`
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {isManager ? <Briefcase className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
      {label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  New Card Modal                                                     */
/* ------------------------------------------------------------------ */
function NewCardModal({ onClose }: { onClose: () => void }) {
  const { plannerTracks, addKanbanCard } = useAdminStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTrackId, setSelectedTrackId] = useState(plannerTracks[0]?.id ?? '')
  const [isUrgent, setIsUrgent] = useState(false)
  const [requesterRole, setRequesterRole] = useState<RequesterRole>(ROLE_LABELS.operator_manager as RequesterRole)

  const selectedTrack = plannerTracks.find((t) => t.id === selectedTrackId)
  const operatorName = selectedTrack?.operator?.name ?? '미지정'

  const handleSubmit = () => {
    if (!title.trim() || !selectedTrack) return
    addKanbanCard({
      trackName: selectedTrack.name.replace(' 트랙', '').replace('트랙 ', ''),
      trackColor: selectedTrack.color,
      operatorName,
      requesterRole,
      requesterName: requesterRole === ROLE_LABELS.operator_manager ? '이운기' : operatorName,
      title: title.trim(),
      content: content.trim(),
      isUrgent,
    })
    onClose()
  }

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-[15px] font-semibold text-foreground">{'새 업무 / 요청 추가'}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{'요청 유형'}</label>
            <div className="flex gap-2">
              {([ROLE_LABELS.operator_manager, ROLE_LABELS.operator, ROLE_LABELS.learning_manager] as RequesterRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRequesterRole(r)}
                  className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    requesterRole === r
                      ? 'border-foreground/20 bg-foreground/[0.04] text-foreground'
                      : 'border-border text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  {r === ROLE_LABELS.operator_manager ? <Briefcase className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  {r === ROLE_LABELS.operator_manager ? `${ROLE_LABELS.operator_manager} 업무` : `${r} 요청`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{'트랙'}</label>
            <select value={selectedTrackId} onChange={(e) => setSelectedTrackId(e.target.value)} className={inputCls}>
              {plannerTracks.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{'제목'}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="업무/요청 제목" className={inputCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{'상세 내용'}</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="상세 내용" rows={3} className={`${inputCls} resize-none`} />
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="h-3.5 w-3.5 rounded border-border accent-destructive" />
            <span className="text-[13px] text-foreground">{'긴급 업무'}</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-secondary">{'취소'}</button>
          <button type="button" onClick={handleSubmit} disabled={!title.trim()} className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40">{'추가'}</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Card Detail Modal                                                  */
/* ------------------------------------------------------------------ */
function CardDetailModal({ card, onClose }: { card: KanbanCard; onClose: () => void }) {
  const { addKanbanReply, updateKanbanCardStatus } = useAdminStore()
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState<KanbanStatus>(card.status)

  const handleSend = () => {
    if (!reply.trim()) return
    addKanbanReply(card.id, reply.trim())
    setReply('')
    if (status === 'waiting') setStatus('in-progress')
  }

  const handleStatusChange = (s: KanbanStatus) => { setStatus(s); updateKanbanCardStatus(card.id, s) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-[15px] font-semibold text-foreground">{card.title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-b border-border px-5 py-3 text-[13px]">
          <span className="text-muted-foreground">{'트랙'}</span>
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: card.trackColor }} />
            {card.trackName}
          </span>
          <span className="text-muted-foreground">{'요청자'}</span>
          <span className="flex items-center gap-2 font-medium text-foreground">
            {card.requesterName}
            <RequesterBadge role={card.requesterRole} compact />
          </span>
          <span className="text-muted-foreground">{'담당'}</span>
          <span className="font-medium text-foreground">{card.operatorName}</span>
          {card.isUrgent && (<><span className="text-muted-foreground">{'긴급'}</span><span className="text-destructive">{'긴급'}</span></>)}
          <span className="text-muted-foreground">{'작성일'}</span>
          <span className="text-foreground">{card.createdAt}</span>
        </div>

        <div className="border-b border-border px-5 py-3">
          <p className="text-[13px] leading-relaxed text-foreground">{card.content}</p>
        </div>

        {(() => {
          const linked = useAdminStore.getState().getKanbanLinkedMessages(card.id)
          const all = [
            ...card.messages.map((m) => ({ id: m.id, authorName: m.authorName, content: m.content, time: m.timestamp, isSelf: m.isSelf })),
            ...linked.filter((lm) => !card.messages.some((cm) => cm.id === lm.id)).map((lm) => ({ id: lm.id, authorName: lm.authorName, content: lm.message, time: lm.time, isSelf: lm.isSelf })),
          ]
          if (all.length === 0) return null
          return (
            <div className="flex-1 overflow-y-auto border-b border-border px-5 py-3">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">{'대화 내역'}</p>
              <div className="space-y-1.5">
                {all.map((m) => (
                  <div key={m.id} className={`rounded-lg p-2.5 text-[13px] ${m.isSelf ? 'ml-8 bg-foreground/[0.04]' : 'mr-8 bg-secondary/60'}`}>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{m.authorName}</span>
                      <span>{m.time}</span>
                    </div>
                    <p className="mt-0.5 text-foreground">{m.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        <div className="px-5 py-3">
          <div className="flex gap-2">
            <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="답변을 입력하세요..." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
            <button type="button" onClick={handleSend} disabled={!reply.trim()} className="flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40">
              <Send className="h-3.5 w-3.5" />{'전송'}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{'상태'}</span>
            {COLUMNS.map((col) => (
              <button key={col.id} type="button" onClick={() => handleStatusChange(col.id)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${status === col.id ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>{col.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Completed Projects View                                            */
/* ------------------------------------------------------------------ */
function CompletedProjectsView({ cards }: { cards: KanbanCard[] }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const baseDate = new Date(2026, 1, 11)
  const currentWeekStart = new Date(baseDate)
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1 + weekOffset * 7)
  const weekDays = Array.from({ length: 5 }, (_, i) => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + i); return d })
  const dayLabels = ['월', '화', '수', '목', '금']
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  const weekLabel = `${baseDate.getFullYear()}년 ${currentWeekStart.getMonth() + 1}월 ${Math.ceil(currentWeekStart.getDate() / 7)}주차`
  const getCards = (day: Date) => {
    const s = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    return cards.filter((c) => c.status === 'done' && c.createdAt.startsWith(s))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-3">
        <button type="button" onClick={() => setWeekOffset((p) => p - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13px] font-medium text-foreground">{weekLabel}</span>
        <button type="button" onClick={() => setWeekOffset((p) => p + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
      </div>
      {weekDays.map((day, idx) => {
        const dc = getCards(day)
        return (
          <div key={idx}>
            <p className="mb-1.5 text-[13px] font-medium text-foreground">{dayLabels[idx]}{' '}{fmt(day)}<span className="ml-1 text-muted-foreground">{dc.length}{'건'}</span></p>
            {dc.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dc.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border bg-card px-3 py-2 text-[13px]">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span>{c.trackName}</span><RequesterBadge role={c.requesterRole} compact /></div>
                    <p className="mt-0.5 font-medium text-foreground">{c.title}</p>
                  </div>
                ))}
              </div>
            ) : (<p className="text-xs text-muted-foreground/60">{'없음'}</p>)}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  KanbanBoard                                                        */
/* ------------------------------------------------------------------ */
export function KanbanBoard() {
  const { kanbanCards, moveKanbanCard } = useAdminStore()
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
  const [showNewCard, setShowNewCard] = useState(false)
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | RequesterRole>('all')

  const onDragEnd = (result: DropResult) => { if (!result.destination) return; moveKanbanCard(result.draggableId, result.destination.droppableId as KanbanStatus) }

  const trackNames = Array.from(new Set(kanbanCards.map((c) => c.trackName)))
  const filteredCards = kanbanCards.filter((c) => {
    if (trackFilter !== 'all' && c.trackName !== trackFilter) return false
    if (roleFilter !== 'all' && c.requesterRole !== roleFilter) return false
    return true
  })
  const getColumnCards = (status: KanbanStatus) => filteredCards.filter((c) => c.status === status)

  const pillCls = (active: boolean) => `rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${active ? 'bg-foreground text-background' : 'bg-secondary/80 text-muted-foreground hover:bg-secondary'}`

  return (
    <section>
      {/* Title row */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{`${ROLE_LABELS.operator} 요청사항 & 업무`}</h2>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowNewCard(true)} className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90">
            <Plus className="h-3.5 w-3.5" />{'새 업무'}
          </button>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
            <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} className="h-3.5 w-3.5 rounded border-border accent-foreground" />
            {'완료 전체보기'}
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">{'트랙'}</span>
        <button type="button" onClick={() => setTrackFilter('all')} className={pillCls(trackFilter === 'all')}>{'전체'}</button>
        {trackNames.map((name) => {
          const c = kanbanCards.find((k) => k.trackName === name)
          return (
            <button key={name} type="button" onClick={() => setTrackFilter(name)} className={`inline-flex items-center gap-1 ${pillCls(trackFilter === name)}`}>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c?.trackColor }} />{name}
            </button>
          )
        })}

        <span className="mx-1 text-border">{'·'}</span>

        <span className="mr-1 text-xs text-muted-foreground">{'유형'}</span>
        <button type="button" onClick={() => setRoleFilter('all')} className={pillCls(roleFilter === 'all')}>{'전체'}</button>
        <button type="button" onClick={() => setRoleFilter(ROLE_LABELS.operator_manager as RequesterRole)} className={`inline-flex items-center gap-1 ${pillCls(roleFilter === ROLE_LABELS.operator_manager)}`}><Briefcase className="h-3 w-3" />{ROLE_LABELS.operator_manager}</button>
        <button type="button" onClick={() => setRoleFilter(ROLE_LABELS.operator as RequesterRole)} className={`inline-flex items-center gap-1 ${pillCls(roleFilter === ROLE_LABELS.operator)}`}><User className="h-3 w-3" />{ROLE_LABELS.operator}</button>
        <button type="button" onClick={() => setRoleFilter(ROLE_LABELS.learning_manager as RequesterRole)} className={`inline-flex items-center gap-1 ${pillCls(roleFilter === ROLE_LABELS.learning_manager)}`}><User className="h-3 w-3" />{ROLE_LABELS.learning_manager}</button>
      </div>

      {showCompleted ? (
        <CompletedProjectsView cards={filteredCards} />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-3 gap-3">
            {COLUMNS.map((col) => {
              const colCards = getColumnCards(col.id)
              return (
                <div key={col.id} className="rounded-xl border border-border bg-secondary/30 p-2.5">
                  <div className="mb-2.5 flex items-center gap-2 px-1">
                    <h3 className="text-[13px] font-semibold text-foreground">{col.label}</h3>
                    <span className="text-xs text-muted-foreground">{colCards.length}</span>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[100px] space-y-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-foreground/[0.03]' : ''}`}>
                        {colCards.map((card, index) => (
                          <Draggable key={card.id} draggableId={card.id} index={index}>
                            {(dp, ds) => (
                              <div ref={dp.innerRef} {...dp.draggableProps} {...dp.dragHandleProps} onClick={() => setSelectedCard(card)} className={`cursor-pointer rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-sm ${ds.isDragging ? 'shadow-md' : ''}`}>
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: card.trackColor }} />
                                  <span className="text-[11px] text-muted-foreground">{card.trackName}</span>
                                  <RequesterBadge role={card.requesterRole} compact />
                                </div>
                                <p className="mt-1.5 text-[13px] font-semibold leading-snug text-foreground">{card.title}</p>
                                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                  <span>{card.operatorName}</span>
                                  <span>{'·'}</span>
                                  <span>{card.timeAgo}</span>
                                  {card.isUrgent && (
                                    <span className="ml-auto inline-flex items-center gap-0.5 font-medium text-destructive">
                                      <AlertTriangle className="h-2.5 w-2.5" />{'긴급'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}

      {selectedCard && <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
      {showNewCard && <NewCardModal onClose={() => setShowNewCard(false)} />}
    </section>
  )
}
