'use client'

import { useState, useRef, useEffect } from 'react'
import type { TrackNotice } from '@/lib/admin-mock-data'
import { X, Clock, Send, Megaphone, CornerDownLeft, Trash2, Check } from 'lucide-react'
import { fmtNow, defaultExpiry, getDDayLabel } from './track-utils'
import { useRoleStore, ROLE_USER_NAME } from '@/lib/role-store'

function NoticeThreadModal({ notice, staffList, onReply, onExtend, onRemove, onClose }: {
  notice: TrackNotice; staffList: { id: string; name: string }[]
  onReply: (noticeId: string, content: string) => void
  onExtend: (noticeId: string, newExpiresAt: string) => void
  onRemove: (noticeId: string) => void; onClose: () => void
}) {
  const [reply, setReply] = useState('')
  const [showExtend, setShowExtend] = useState(false)
  const [extendDate, setExtendDate] = useState(notice.expiresAt)
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [notice.replies.length])
  const send = () => { if (!reply.trim()) return; onReply(notice.id, reply.trim()); setReply('') }
  const dDay = getDDayLabel(notice.expiresAt)
  const isGlobal = !notice.targetStaffId
  const targetStaff = isGlobal ? staffList : staffList.filter((s) => s.id === notice.targetStaffId)
  const readStaff = targetStaff.filter((s) => notice.readBy.includes(s.id))
  const unreadStaff = targetStaff.filter((s) => !notice.readBy.includes(s.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${isGlobal ? 'bg-foreground/10 text-foreground' : 'bg-foreground/[0.06] text-foreground/70'}`}>
                {isGlobal ? <><Megaphone className="h-2.5 w-2.5" />공통</> : notice.targetStaffName}
              </span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${dDay.urgent ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'}`}>{dDay.label}</span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">{notice.content}</p>
            <span className="text-[10px] tabular-nums text-muted-foreground">{notice.createdAt} · {notice.authorName}</span>
          </div>
          <button type="button" onClick={onClose} className="ml-3 shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="border-b border-border px-5 py-2.5">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-muted-foreground">읽음 현황</span>
            <div className="flex items-center gap-1.5">
              {readStaff.map((s) => (<span key={s.id} className="flex items-center gap-0.5 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium text-foreground"><Check className="h-2.5 w-2.5 text-foreground/60" />{s.name}</span>))}
              {unreadStaff.map((s) => (<span key={s.id} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{s.name}</span>))}
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">{readStaff.length}/{targetStaff.length}</span>
          </div>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto bg-secondary/20 px-4 py-3">
          {notice.replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-muted-foreground"><CornerDownLeft className="h-7 w-7" /><p className="text-xs">아직 답장이 없습니다</p></div>
          ) : (
            <div className="space-y-3">
              {notice.replies.map((r) => r.isManager ? (
                <div key={r.id} className="flex justify-end"><div className="flex items-end gap-1.5"><span className="pb-0.5 text-[10px] text-muted-foreground">{r.timestamp.split(' ')[1]}</span><div className="max-w-[260px] rounded-xl rounded-tr-[4px] bg-foreground/[0.08] px-3 py-2"><p className="text-[13px] leading-relaxed text-foreground">{r.content}</p></div></div></div>
              ) : (
                <div key={r.id} className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-foreground">{r.authorName.charAt(0)}</div>
                  <div className="min-w-0"><span className="text-[11px] font-medium text-foreground">{r.authorName}</span><div className="mt-0.5 flex items-end gap-1.5"><div className="max-w-[260px] rounded-xl rounded-tl-[4px] bg-card px-3 py-2 shadow-sm"><p className="text-[13px] leading-relaxed text-foreground">{r.content}</p></div><span className="pb-0.5 text-[10px] text-muted-foreground">{r.timestamp.split(' ')[1]}</span></div></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-border">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <button type="button" onClick={() => setShowExtend(!showExtend)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary"><Clock className="h-3 w-3" />기간 연장</button>
            <button type="button" onClick={() => { onRemove(notice.id); onClose() }} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" />삭제</button>
            <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">만료: {notice.expiresAt}</span>
          </div>
          {showExtend && (
            <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-2">
              <span className="text-[11px] text-muted-foreground">만료일 변경</span>
              <input type="date" value={extendDate} onChange={(e) => setExtendDate(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-[12px] text-foreground focus:border-foreground/30 focus:outline-none" />
              <button type="button" onClick={() => { onExtend(notice.id, extendDate); setShowExtend(false) }} className="rounded-lg bg-foreground px-2.5 py-1 text-[11px] text-background">적용</button>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2">
            <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="답장을 입력하세요..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
            <button type="button" onClick={send} disabled={!reply.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-colors disabled:opacity-30"><Send className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TrackNoticeSection({ trackId, notices, staffList, onAdd, onReply, onExtend, onRemove, onMarkRead }: {
  trackId: string; notices: TrackNotice[]; staffList: { id: string; name: string }[]
  onAdd: (notice: TrackNotice) => void; onReply: (noticeId: string, content: string) => void
  onExtend: (noticeId: string, newExpiresAt: string) => void; onRemove: (noticeId: string) => void
  onMarkRead?: (noticeId: string) => void
}) {
  const currentRole = useRoleStore((s) => s.currentRole)
  const authorName = ROLE_USER_NAME[currentRole]
  const [msg, setMsg] = useState('')
  const [target, setTarget] = useState<string>('all')
  const [openNotice, setOpenNotice] = useState<TrackNotice | null>(null)
  const [viewFilter, setViewFilter] = useState<'all' | string>('all')

  const send = () => {
    if (!msg.trim()) return
    const staff = target !== 'all' ? staffList.find((s) => s.id === target) : null
    onAdd({ id: `tn-${Date.now()}`, trackId, targetStaffId: staff?.id ?? null, targetStaffName: staff?.name ?? null, authorName, content: msg.trim(), createdAt: fmtNow(), expiresAt: defaultExpiry(), readBy: [], replies: [] })
    setMsg('')
  }

  const filteredNotices = viewFilter === 'all' ? notices : viewFilter === 'global' ? notices.filter((n) => !n.targetStaffId) : notices.filter((n) => n.targetStaffId === viewFilter)

  return (
    <div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap gap-1">
          {[
            { key: 'all', label: '모두', count: notices.length },
            { key: 'global', label: '공통', count: notices.filter((n) => !n.targetStaffId).length },
            ...staffList.map((s) => ({ key: s.id, label: s.name, count: notices.filter((n) => n.targetStaffId === s.id).length })),
          ].map((item) => (
            <button key={item.key} type="button" onClick={() => setViewFilter(item.key)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${viewFilter === item.key ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {item.label}{item.count > 0 && <span className="ml-1 tabular-nums">{item.count}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="shrink-0 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-medium text-foreground focus:outline-none">
            <option value="all">공통 공지</option>{staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="text" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="공지 내용을 입력하세요..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none" />
          <button type="button" onClick={send} disabled={!msg.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-colors disabled:opacity-30"><Send className="h-3.5 w-3.5" /></button>
        </div>
        {filteredNotices.length > 0 ? (
          <div className="mt-3 space-y-1">
            {filteredNotices.map((n) => {
              const dDay = getDDayLabel(n.expiresAt); const isGlobal = !n.targetStaffId
              const targetCount = isGlobal ? staffList.length : 1; const readCount = n.readBy.length
              return (
                <button key={n.id} type="button" onClick={() => { setOpenNotice(n); onMarkRead?.(n.id) }} className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary/30">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold ${isGlobal ? 'bg-foreground/10 text-foreground' : 'bg-foreground/[0.06] text-foreground/70'}`}>{isGlobal ? '전' : n.targetStaffName?.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium ${isGlobal ? 'text-foreground' : 'text-foreground/70'}`}>{isGlobal ? '공통' : n.targetStaffName}</span>
                      {readCount < targetCount && <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />}
                      {n.replies.length > 0 && <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><CornerDownLeft className="h-2.5 w-2.5" />{n.replies.length}</span>}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] leading-relaxed text-foreground/80">{n.content}</p>
                    <div className="mt-0.5 flex items-center gap-2"><span className="text-[10px] tabular-nums text-muted-foreground">{n.createdAt}</span><span className="text-[9px] tabular-nums text-muted-foreground">읽음 {readCount}/{targetCount}</span></div>
                  </div>
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${dDay.urgent ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'}`}>{dDay.label}</span>
                </button>
              )
            })}
          </div>
        ) : (<p className="mt-3 text-center text-[11px] italic text-muted-foreground">해당 공지가 없습니다</p>)}
      </div>
      {openNotice && (() => { const live = notices.find((n) => n.id === openNotice.id) ?? openNotice; return <NoticeThreadModal notice={live} staffList={staffList} onReply={onReply} onExtend={onExtend} onRemove={onRemove} onClose={() => setOpenNotice(null)} /> })()}
    </div>
  )
}
