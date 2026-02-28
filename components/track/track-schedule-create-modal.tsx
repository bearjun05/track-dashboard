'use client'

import { useState, useMemo } from 'react'
import { X, CalendarDays, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/lib/admin-store'
import type { UnifiedSchedule } from '@/components/schedule/schedule-types'
import type { TrackTask } from '@/lib/admin-mock-data'
import { TODAY_STR } from '@/lib/date-constants'

type CreateTab = 'schedule' | 'task'

interface Props {
  trackId: string
  staffList: { id: string; name: string }[]
  onClose: () => void
  onCreated?: (type: CreateTab, id: string) => void
}

export function TrackScheduleCreateModal({ trackId, staffList, onClose, onCreated }: Props) {
  const [tab, setTab] = useState<CreateTab>('schedule')
  const { addSchedule, addTrackTask } = useAdminStore()

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(TODAY_STR)
  const [endDate, setEndDate] = useState(TODAY_STR)
  const [category, setCategory] = useState<string>('기타')
  const [description, setDescription] = useState('')

  const [assigneeId, setAssigneeId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal')

  const resetForm = () => {
    setTitle('')
    setStartDate(TODAY_STR)
    setEndDate(TODAY_STR)
    setCategory('기타')
    setDescription('')
    setAssigneeId('')
    setStartTime('')
    setEndTime('')
    setPriority('normal')
  }

  const handleTabChange = (t: CreateTab) => {
    setTab(t)
    resetForm()
  }

  const canSubmit = title.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return

    const finalEndDate = endDate < startDate ? startDate : endDate

    if (tab === 'schedule') {
      const newSchedule: UnifiedSchedule = {
        id: `sch-op-${Date.now()}`,
        trackId,
        title: title.trim(),
        type: 'operation_period',
        source: 'manual',
        startDate,
        endDate: finalEndDate,
        category,
        description: description.trim() || undefined,
        createdAt: new Date().toISOString(),
      }
      addSchedule(newSchedule)
      onCreated?.('schedule', newSchedule.id)
    } else {
      const assignee = staffList.find(s => s.id === assigneeId)
      const newTask: TrackTask = {
        id: `tt-period-${Date.now()}`,
        trackId,
        title: title.trim(),
        description: description.trim() || '',
        type: 'milestone',
        completionType: 'simple',
        assigneeId: assigneeId || undefined,
        assigneeName: assignee?.name,
        status: assigneeId ? 'pending' : 'unassigned',
        scheduledDate: startDate,
        endDate: finalEndDate,
        scheduledTime: startTime || undefined,
        dueTime: endTime || undefined,
        messages: [],
      }
      addTrackTask(newTask)
      onCreated?.('task', newTask.id)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-[15px] font-semibold text-foreground">새로 만들기</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab */}
        <div className="flex border-b border-border px-5">
          <button type="button" onClick={() => handleTabChange('schedule')}
            className={cn('flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
              tab === 'schedule' ? 'border-violet-500 text-violet-700' : 'border-transparent text-muted-foreground hover:text-foreground/60',
            )}>
            <CalendarDays className="h-3.5 w-3.5" />
            운영일정
          </button>
          <button type="button" onClick={() => handleTabChange('task')}
            className={cn('flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
              tab === 'task' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground/60',
            )}>
            <ListTodo className="h-3.5 w-3.5" />
            기간 Task
          </button>
        </div>

        {/* Hint */}
        <div className={cn('mx-5 mt-4 rounded-lg px-3 py-2 text-[11px]',
          tab === 'schedule'
            ? 'bg-violet-500/[0.06] text-violet-700'
            : 'bg-foreground/[0.04] text-foreground/60',
        )}>
          {tab === 'schedule'
            ? '운영일정은 순수 일정으로, 완료/상태 처리 없이 캘린더에 표시됩니다.'
            : '기간 Task는 담당자 배정, 상태 관리, 완료 처리가 가능한 업무입니다.'}
        </div>

        {/* Form */}
        <div className="space-y-3 px-5 pt-3 pb-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              {tab === 'schedule' ? '일정 제목' : 'Task 제목'} <span className="text-red-400">*</span>
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={tab === 'schedule' ? '예: 멘토링 데이' : '예: 프로젝트 발표 준비'}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">시작일</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">종료일</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
            </div>
          </div>

          {tab === 'schedule' && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">카테고리</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none">
                <option value="강의">강의</option>
                <option value="프로젝트">프로젝트</option>
                <option value="평가">평가</option>
                <option value="행사">행사</option>
                <option value="기타">기타</option>
              </select>
            </div>
          )}

          {tab === 'task' && (
            <>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">담당자</label>
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none">
                  <option value="">미배정</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">시작 시간 (선택)</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">마감 시간 (선택)</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">우선순위</label>
                <div className="flex gap-2">
                  {([
                    { value: 'normal', label: '일반', cls: 'border-border text-foreground/60' },
                    { value: 'important', label: '중요', cls: 'border-amber-300 text-amber-700 bg-amber-50' },
                    { value: 'urgent', label: '긴급', cls: 'border-red-300 text-red-700 bg-red-50' },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button" onClick={() => setPriority(opt.value)}
                      className={cn('rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all',
                        priority === opt.value
                          ? cn(opt.cls, 'ring-1 ring-foreground/20')
                          : 'border-border text-muted-foreground hover:bg-secondary',
                      )}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">설명 (선택)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="간단한 설명을 입력하세요"
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary">
            취소
          </button>
          <button type="button" disabled={!canSubmit} onClick={handleSubmit}
            className={cn('rounded-lg px-4 py-1.5 text-[12px] font-medium text-white transition-colors disabled:opacity-30',
              tab === 'schedule' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-foreground hover:bg-foreground/90',
            )}>
            {tab === 'schedule' ? '일정 생성' : 'Task 생성'}
          </button>
        </div>
      </div>
    </div>
  )
}
