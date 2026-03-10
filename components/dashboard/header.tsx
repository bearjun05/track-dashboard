'use client'

import { Download, ChevronLeft, ChevronRight, Plus, X, Calendar } from 'lucide-react'
import { MetricsBox } from '@/components/ui/mini-charts'
import { useAdminStore } from '@/lib/admin-store'
import { useInterviewStore } from '@/lib/interview-store'
import { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { TODAY_STR } from '@/lib/date-constants'

type PageType = 'task' | 'schedule' | 'interview'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const FULL_DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
const DEFAULT_TODAY = TODAY_STR

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${FULL_DAY_NAMES[d.getDay()]}`
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

interface HeaderProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
  selectedDate?: string
  onDateChange?: (date: string) => void
  onCreateTask?: (title: string, opts?: { startDate?: string; endDate?: string; scheduledTime?: string; description?: string }) => void
  onCreateRequest?: (title: string, content: string, urgent?: boolean) => void
  trackName?: string
  staffId?: string
}

export function DashboardHeader({ currentPage, onPageChange, selectedDate, onDateChange, onCreateTask, onCreateRequest, trackName, staffId }: HeaderProps) {
  const trackTasks = useAdminStore(s => s.trackTasks)
  const { students, roundChecks } = useInterviewStore()

  const activeDate = selectedDate ?? DEFAULT_TODAY
  const dateLabel = formatDateLabel(activeDate)
  const isToday = activeDate === DEFAULT_TODAY

  // Task page stats — derived from useAdminStore.trackTasks
  const todayMyTasks = useMemo(
    () => staffId ? trackTasks.filter(t => t.assigneeId === staffId && t.scheduledDate === activeDate) : [],
    [trackTasks, staffId, activeDate],
  )
  const completedCount = todayMyTasks.filter(t => t.status === 'completed').length
  const totalCount = todayMyTasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Interview page stats
  const todayStr = new Date().toISOString().split('T')[0]
  const todayChecks = roundChecks.filter((c) => c.date === todayStr)
  const absentCount = todayChecks.filter((c) => c.period === 'morning' && c.isAbsent).length
  const healthIssueCount = todayChecks.filter((c) => c.period === 'morning' && c.healthCheck).length
  const progressIssueCount = todayChecks.filter((c) => c.period === 'afternoon' && c.progressCheck).length

  const morningCheckedIds = new Set(
    todayChecks
      .filter((c) => c.period === 'morning' && (c.isAbsent || c.healthCheck || (c.specialNote && c.specialNote.length > 0)))
      .map((c) => c.studentId),
  )
  const morningIncomplete = students.length - morningCheckedIds.size

  // Date picker popup
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(() => {
    const d = new Date(activeDate + 'T00:00:00')
    return d.getFullYear()
  })
  const [pickerMonth, setPickerMonth] = useState(() => {
    const d = new Date(activeDate + 'T00:00:00')
    return d.getMonth()
  })
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showDatePicker) return
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDatePicker])

  function handlePickDate(day: number) {
    const m = String(pickerMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onDateChange?.(`${pickerYear}-${m}-${d}`)
    setShowDatePicker(false)
  }

  function openPicker() {
    const d = new Date(activeDate + 'T00:00:00')
    setPickerYear(d.getFullYear())
    setPickerMonth(d.getMonth())
    setShowDatePicker(true)
  }

  // Task creation modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTab, setCreateTab] = useState<'self' | 'request'>('self')
  // Self task form
  const [newTitle, setNewTitle] = useState('')
  const [newStartDate, setNewStartDate] = useState(activeDate)
  const [newEndDate, setNewEndDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newDesc, setNewDesc] = useState('')
  // Request form
  const [reqTitle, setReqTitle] = useState('')
  const [reqContent, setReqContent] = useState('')
  const [reqUrgent, setReqUrgent] = useState(false)

  function openCreateModal() {
    setCreateTab('self')
    setNewTitle('')
    setNewStartDate(activeDate)
    setNewEndDate(activeDate)
    setNewTime('')
    setNewDesc('')
    setReqTitle('')
    setReqContent('')
    setReqUrgent(false)
    setShowCreateModal(true)
  }

  const isPeriodTask = newEndDate && newEndDate !== newStartDate

  function handleCreateSelf() {
    if (!newTitle.trim()) return
    onCreateTask?.(newTitle.trim(), {
      startDate: newStartDate || undefined,
      endDate: newEndDate || undefined,
      scheduledTime: newTime || undefined,
      description: newDesc || undefined,
    })
    setShowCreateModal(false)
    if (isPeriodTask) {
      toast('기간 일정은 일정 탭에서 확인할 수 있습니다', {
        action: {
          label: '일정 탭으로 이동',
          onClick: () => onPageChange('schedule'),
        },
      })
    }
  }

  function handleCreateRequest() {
    if (!reqTitle.trim() || !reqContent.trim()) return
    onCreateRequest?.(reqTitle.trim(), reqContent.trim(), reqUrgent)
    setShowCreateModal(false)
    toast('업무 요청이 운영매니저에게 전달되었습니다')
  }

  // CSV export for interview tab
  const [dateStrForExport, setDateStrForExport] = useState('')
  useEffect(() => {
    const today = new Date()
    setDateStrForExport(`${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${FULL_DAY_NAMES[today.getDay()]}`)
  }, [])

  function handleExportCSV() {
    const rows: string[][] = [
      ['면담기록', dateStrForExport],
      [],
      ['요약통계'],
      ['총 인원', `${students.length}명`],
      ['결석', `${absentCount}명`],
      ['헬스 이상', `${healthIssueCount}명`],
      ['진도 미달', `${progressIssueCount}명`],
      ['오전 미완료', `${morningIncomplete}명`],
      [],
      ['팀', '이름', '결석', '헬스', '진도', '특이사항'],
    ]

    for (const student of students) {
      const morningCheck = todayChecks.find(
        (c) => c.studentId === student.id && c.period === 'morning',
      )
      const afternoonCheck = todayChecks.find(
        (c) => c.studentId === student.id && c.period === 'afternoon',
      )
      rows.push([
        `${student.teamNumber}팀`,
        student.name,
        morningCheck?.isAbsent ? 'O' : '',
        morningCheck?.healthCheck ? 'O' : '',
        afternoonCheck?.progressCheck ? 'O' : '',
        morningCheck?.specialNote || afternoonCheck?.specialNote || '',
      ])
    }

    const csvContent = rows.map((r) => r.join(',')).join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const d = new Date()
    a.href = url
    a.download = `면담기록_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const weeks = getMonthGrid(pickerYear, pickerMonth)
  const activeDateObj = new Date(activeDate + 'T00:00:00')

  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-gray-200 bg-card px-6">
        {/* Left: toggle + date nav */}
        <div className="flex items-center gap-5">
          <div className="flex items-center rounded-lg bg-foreground/[0.04] p-0.5">
            {([
              { key: 'task' as const, label: '업무' },
              { key: 'schedule' as const, label: '일정' },
              { key: 'interview' as const, label: '면담' },
            ]).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onPageChange(tab.key)}
                className={cn(
                  'rounded-md px-3.5 py-1.5 text-sm font-medium transition-all',
                  currentPage === tab.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground/40 hover:text-foreground/60',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-gray-200" />

          {/* Date navigation */}
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDateChange?.(shiftDate(activeDate, -1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/30 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={openPicker}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-foreground/[0.04]"
            >
              <Calendar className="h-3.5 w-3.5 text-foreground/30" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  {currentPage === 'task' ? (trackName ?? '트랙') : currentPage === 'schedule' ? `${trackName ?? '트랙'} 일정` : '면담'}
                </p>
                <p className="text-xs text-gray-500">{dateLabel}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onDateChange?.(shiftDate(activeDate, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/30 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/60"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={() => onDateChange?.(DEFAULT_TODAY)}
                className="rounded-md border border-foreground/[0.08] px-2 py-0.5 text-[11px] font-medium text-foreground/40 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/60"
              >
                오늘
              </button>
            )}

            {/* Date picker popup */}
            {showDatePicker && (
              <div
                ref={pickerRef}
                className="absolute left-0 top-full z-50 mt-2 w-[280px] rounded-xl border border-foreground/[0.08] bg-card p-3 shadow-lg"
              >
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (pickerMonth === 0) { setPickerYear(y => y - 1); setPickerMonth(11) }
                      else setPickerMonth(m => m - 1)
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/40 hover:bg-foreground/[0.06]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-foreground">
                    {pickerYear}년 {pickerMonth + 1}월
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (pickerMonth === 11) { setPickerYear(y => y + 1); setPickerMonth(0) }
                      else setPickerMonth(m => m + 1)
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/40 hover:bg-foreground/[0.06]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="flex h-7 items-center justify-center text-[10px] font-medium text-foreground/30">
                      {d}
                    </div>
                  ))}
                  {weeks.flat().map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="h-8" />
                    const dateVal = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const isSelected = dateVal === activeDate
                    const isTodayDate = dateVal === DEFAULT_TODAY
                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        onClick={() => handlePickDate(day)}
                        className={cn(
                          'flex h-8 items-center justify-center rounded-md text-xs transition-colors',
                          isSelected
                            ? 'bg-foreground text-background font-semibold'
                            : isTodayDate
                              ? 'bg-blue-500/10 text-blue-600 font-medium hover:bg-blue-500/20'
                              : 'text-foreground/60 hover:bg-foreground/[0.06]',
                        )}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => { onDateChange?.(DEFAULT_TODAY); setShowDatePicker(false) }}
                    className="rounded-md px-3 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/10"
                  >
                    오늘로 이동
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: stats + create task */}
        <div className="flex items-center gap-5">
          {currentPage === 'task' && <MetricsBox />}
          {(currentPage === 'task' || currentPage === 'schedule') ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {totalCount}{'개 중 '}{completedCount}{'개 완료'}
              </span>
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-success transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500">{progressPercent}{'%'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>{'총 '}<strong className="text-gray-900">{students.length}</strong>{'명'}</span>
                <span className="text-gray-300">{'|'}</span>
                <span>{'결석 '}<strong className="text-gray-900">{absentCount}</strong></span>
                <span className="text-gray-300">{'|'}</span>
                <span>{'헬스 이상 '}<strong className="text-gray-900">{healthIssueCount}</strong></span>
                <span className="text-gray-300">{'|'}</span>
                <span>{'진도 미달 '}<strong className="text-gray-900">{progressIssueCount}</strong></span>
                <span className="text-gray-300">{'|'}</span>
                <span className="text-primary">{'오전 미완료 '}<strong>{morningIncomplete}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-card px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" />
                {'내보내기'}
              </button>
            </div>
          )}

          {(currentPage === 'task' || currentPage === 'schedule') && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              <Plus className="h-3.5 w-3.5" />
              업무 생성
            </button>
          )}
        </div>
      </header>

      {/* Task creation modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-foreground/[0.08] bg-card p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">업무 생성</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/30 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex items-center rounded-lg bg-foreground/[0.04] p-0.5">
              {([
                { key: 'self' as const, label: '내 할 일' },
                { key: 'request' as const, label: '업무 요청' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCreateTab(tab.key)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                    createTab === tab.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-foreground/40 hover:text-foreground/60',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {createTab === 'self' ? (
              <>
                <p className="mb-4 text-xs text-foreground/35">나만 보이는 개인 업무입니다. 직접 추가하고 관리할 수 있습니다.</p>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground/50">제목 *</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateSelf()}
                      placeholder="업무 제목을 입력하세요"
                      className="w-full rounded-lg border border-foreground/[0.08] bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:border-foreground/15 focus:outline-none focus:ring-2 focus:ring-foreground/5"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground/50">시작일</label>
                      <input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)}
                        className="w-full rounded-lg border border-foreground/[0.08] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/15 focus:outline-none focus:ring-2 focus:ring-foreground/5" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground/50">종료일 (선택)</label>
                      <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} min={newStartDate}
                        className="w-full rounded-lg border border-foreground/[0.08] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/15 focus:outline-none focus:ring-2 focus:ring-foreground/5" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 flex items-center justify-between text-xs font-medium text-foreground/50">
                      <span>시간</span>
                      {newTime && (
                        <button type="button" onClick={() => setNewTime('')} className="text-[10px] text-foreground/30 hover:text-foreground/50">미지정으로 변경</button>
                      )}
                    </label>
                    {newTime ? (
                      <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                        className="w-full rounded-lg border border-foreground/[0.08] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/15 focus:outline-none focus:ring-2 focus:ring-foreground/5" />
                    ) : (
                      <button type="button" onClick={() => setNewTime('09:00')}
                        className="w-full rounded-lg border border-dashed border-foreground/[0.08] bg-background px-3 py-2 text-left text-sm text-foreground/25 transition-colors hover:border-foreground/15 hover:text-foreground/40">
                        시간 미지정 · 클릭하여 시간 설정
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground/50">설명 (선택)</label>
                    <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="업무에 대한 설명을 입력하세요" rows={3}
                      className="w-full resize-none rounded-lg border border-foreground/[0.08] bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:border-foreground/15 focus:outline-none focus:ring-2 focus:ring-foreground/5" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowCreateModal(false)}
                    className="rounded-lg border border-foreground/[0.08] bg-background px-4 py-2 text-sm font-medium text-foreground/50 transition-colors hover:bg-foreground/[0.03]">취소</button>
                  <button type="button" onClick={handleCreateSelf} disabled={!newTitle.trim()}
                    className={cn('rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                      newTitle.trim() ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-foreground/10 text-foreground/25 cursor-not-allowed')}>
                    생성
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-xs text-foreground/35">운영매니저에게 업무를 요청합니다. 확인요청 상태로 전달됩니다.</p>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground/50">제목 *</label>
                    <input
                      type="text"
                      value={reqTitle}
                      onChange={e => setReqTitle(e.target.value)}
                      placeholder="요청 제목을 입력하세요"
                      className="w-full rounded-lg border border-foreground/[0.08] bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:border-foreground/15 focus:outline-none focus:ring-2 focus:ring-foreground/5"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground/50">내용 *</label>
                    <textarea
                      value={reqContent}
                      onChange={e => setReqContent(e.target.value)}
                      placeholder="요청 내용을 상세히 작성해주세요"
                      rows={4}
                      className="w-full resize-none rounded-lg border border-foreground/[0.08] bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:border-foreground/15 focus:outline-none focus:ring-2 focus:ring-foreground/5"
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setReqUrgent(!reqUrgent)}
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors',
                        reqUrgent ? 'border-destructive bg-destructive' : 'border-foreground/15 bg-background',
                      )}
                    >
                      {reqUrgent && <span className="text-[10px] font-bold text-white">✓</span>}
                    </button>
                    <span className={cn('text-sm', reqUrgent ? 'font-medium text-destructive' : 'text-foreground/50')}>긴급 요청</span>
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowCreateModal(false)}
                    className="rounded-lg border border-foreground/[0.08] bg-background px-4 py-2 text-sm font-medium text-foreground/50 transition-colors hover:bg-foreground/[0.03]">취소</button>
                  <button type="button" onClick={handleCreateRequest} disabled={!reqTitle.trim() || !reqContent.trim()}
                    className={cn('rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                      reqTitle.trim() && reqContent.trim() ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-foreground/10 text-foreground/25 cursor-not-allowed')}>
                    요청 보내기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
