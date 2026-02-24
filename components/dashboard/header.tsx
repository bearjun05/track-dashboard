'use client'

import { Download, Shield } from 'lucide-react'
import Link from 'next/link'
import { useDashboardStore } from '@/lib/store'
import { useInterviewStore } from '@/lib/interview-store'
import { NotificationDropdown } from '@/components/manager/notification-dropdown'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  currentPage: 'task' | 'interview'
  onPageChange: (page: 'task' | 'interview') => void
}

export function DashboardHeader({ currentPage, onPageChange }: HeaderProps) {
  const { timedTasks, todayTasks, notices } = useDashboardStore()
  const { students, roundChecks, period } = useInterviewStore()
  const [dateStr, setDateStr] = useState('')

  // Task page stats
  const allTasks = [...timedTasks, ...todayTasks]
  const completedCount = allTasks.filter((t) => t.isCompleted).length
  const totalCount = allTasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const unreadNotices = notices.filter((n) => !n.isRead)

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

  useEffect(() => {
    const today = new Date()
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    setDateStr(`${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${dayNames[today.getDay()]}`)
  }, [])

  function handleExportCSV() {
    const rows: string[][] = [
      ['면담기록', dateStr],
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

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-gray-200 bg-card px-6">
      {/* Left: toggle + title */}
      <div className="flex items-center gap-5">
        {/* Page toggle */}
        <div className="flex items-center rounded-lg bg-gray-100 p-0.5">
          <button
            type="button"
            onClick={() => onPageChange('task')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-medium transition-all',
              currentPage === 'task'
                ? 'bg-card text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {'Task'}
          </button>
          <button
            type="button"
            onClick={() => onPageChange('interview')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-medium transition-all',
              currentPage === 'interview'
                ? 'bg-card text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {'면담'}
          </button>
        </div>

        <div className="h-5 w-px bg-gray-200" />

        <div>
          <h1 className="text-sm font-semibold text-gray-900">
            {currentPage === 'task' ? 'AI 트랙 7기' : '면담'}
          </h1>
          <p className="text-xs text-gray-500">{dateStr}</p>
        </div>
      </div>

      {/* Right: stats + actions */}
      <div className="flex items-center gap-5">
        {currentPage === 'task' ? (
          /* Task page stats */
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
          /* Interview page stats */
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

        {/* Admin link */}
        <Link
          href="/manager"
          className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-card px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Shield className="h-3.5 w-3.5" />
          {'관리자'}
        </Link>

        <NotificationDropdown />
      </div>
    </header>
  )
}
