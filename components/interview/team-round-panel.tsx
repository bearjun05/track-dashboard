'use client'

import { useInterviewStore } from '@/lib/interview-store'
import { cn } from '@/lib/utils'
import { Search, AlertTriangle } from 'lucide-react'
import { useState, useCallback, useRef, useEffect } from 'react'
import type { Student } from '@/lib/types'

export function TeamRoundPanel() {
  const {
    students,
    roundChecks,
    selectedStudentId,
    period,
    setPeriod,
    selectStudent,
    toggleAbsent,
    toggleHealth,
    toggleProgress,
    updateSpecialNote,
  } = useInterviewStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const highlightRef = useRef<HTMLTableRowElement>(null)

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 300)
  }, [])

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedStudentId])

  // Group students by team
  const teamMap = new Map<number, Student[]>()
  for (const s of students) {
    if (!teamMap.has(s.teamNumber)) teamMap.set(s.teamNumber, [])
    teamMap.get(s.teamNumber)!.push(s)
  }
  const teams = Array.from(teamMap.entries()).sort(([a], [b]) => a - b)

  // Filter
  const matchingStudentIds = new Set<string>()
  const matchingTeams = new Set<number>()

  if (debouncedQuery.trim()) {
    const q = debouncedQuery.trim().toLowerCase()
    const teamNumMatch = q.match(/^(\d+)/)
    if (teamNumMatch) {
      const teamNum = Number(teamNumMatch[1])
      if (teamMap.has(teamNum)) matchingTeams.add(teamNum)
    }
    for (const s of students) {
      if (s.name.toLowerCase().includes(q)) {
        matchingStudentIds.add(s.id)
        matchingTeams.add(s.teamNumber)
      }
    }
  }

  const filteredTeams = debouncedQuery.trim()
    ? teams.filter(([teamNum]) => matchingTeams.has(teamNum))
    : teams

  const [todayStr, setTodayStr] = useState('')
  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0])
  }, [])

  function getCheck(studentId: string) {
    return roundChecks.find(
      (c) => c.studentId === studentId && c.date === todayStr && c.period === period,
    )
  }

  // Column config: fixed widths
  const isMorning = period === 'morning'

  return (
    <div className="flex h-full flex-col border-r border-gray-200">
      {/* Panel header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <h2 className="text-sm font-semibold text-gray-900">{'팀 순회'}</h2>
        <div className="flex items-center rounded-md bg-gray-100 p-0.5">
          <button
            type="button"
            onClick={() => setPeriod('morning')}
            className={cn(
              'rounded px-3 py-1 text-xs font-medium transition-all',
              period === 'morning'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {'오전'}
          </button>
          <button
            type="button"
            onClick={() => setPeriod('afternoon')}
            className={cn(
              'rounded px-3 py-1 text-xs font-medium transition-all',
              period === 'afternoon'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {'오후'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-gray-200 px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="팀 번호 또는 수강생 이름 검색"
            className="w-full rounded-md border border-gray-200 bg-background py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Single unified table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full table-fixed">
          <colgroup>
            {/* Team label column */}
            <col style={{ width: '52px' }} />
            {/* Name column */}
            <col style={{ width: '80px' }} />
            {isMorning ? (
              <>
                <col style={{ width: '48px' }} />
                <col style={{ width: '48px' }} />
              </>
            ) : (
              <col style={{ width: '48px' }} />
            )}
            {/* Note column: takes remaining space */}
            <col />
          </colgroup>

          {/* Sticky header */}
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-2 py-2 text-left text-[11px] font-medium text-gray-500">{'팀'}</th>
              <th className="px-2 py-2 text-left text-[11px] font-medium text-gray-500">{'이름'}</th>
              {isMorning ? (
                <>
                  <th className="px-1 py-2 text-center text-[11px] font-medium text-gray-500">{'결석'}</th>
                  <th className="px-1 py-2 text-center text-[11px] font-medium text-gray-500">{'헬스'}</th>
                </>
              ) : (
                <th className="px-1 py-2 text-center text-[11px] font-medium text-gray-500">{'진도'}</th>
              )}
              <th className="px-2 py-2 text-left text-[11px] font-medium text-gray-500">{'특이사항'}</th>
            </tr>
          </thead>

          <tbody>
            {filteredTeams.map(([teamNum, teamStudents]) =>
              teamStudents.map((student, idx) => {
                const check = getCheck(student.id)
                const isSelected = selectedStudentId === student.id
                const isSearchMatch =
                  debouncedQuery.trim() && matchingStudentIds.has(student.id)
                const isFirstInTeam = idx === 0
                const isLastInTeam = idx === teamStudents.length - 1

                return (
                  <tr
                    key={student.id}
                    ref={isSelected ? highlightRef : undefined}
                    className={cn(
                      'transition-colors',
                      isLastInTeam ? 'border-b border-gray-200' : 'border-b border-gray-100',
                      isSelected
                        ? 'bg-blue-50/70'
                        : isSearchMatch
                          ? 'bg-blue-50/40'
                          : 'hover:bg-gray-50',
                    )}
                  >
                    {/* Team number: only show for first row */}
                    <td className="px-2 py-1.5 align-middle">
                      {isFirstInTeam && (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                          {teamNum}
                        </span>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-2 py-1.5 align-middle">
                      <button
                        type="button"
                        onClick={() => selectStudent(student.id)}
                        className={cn(
                          'flex items-center gap-1 text-sm font-medium',
                          isSelected ? 'text-primary' : 'text-gray-900 hover:text-primary',
                        )}
                      >
                        <span className="truncate">{student.name}</span>
                        {student.consecutiveAbsentDays >= 2 && (
                          <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />
                        )}
                      </button>
                    </td>

                    {isMorning ? (
                      <>
                        <td className="px-1 py-1.5 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={check?.isAbsent ?? false}
                            onChange={() => {
                              toggleAbsent(student.id)
                              selectStudent(student.id)
                            }}
                            className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-primary"
                            aria-label={`${student.name} 결석`}
                          />
                        </td>
                        <td className="px-1 py-1.5 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={check?.healthCheck ?? false}
                            onChange={() => {
                              toggleHealth(student.id)
                              selectStudent(student.id)
                            }}
                            className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-primary"
                            aria-label={`${student.name} 헬스체크`}
                          />
                        </td>
                      </>
                    ) : (
                      <td className="px-1 py-1.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={check?.progressCheck ?? false}
                          onChange={() => {
                            toggleProgress(student.id)
                            selectStudent(student.id)
                          }}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-primary"
                          aria-label={`${student.name} 진도체크`}
                        />
                      </td>
                    )}

                    {/* Special note */}
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        defaultValue={check?.specialNote ?? ''}
                        onFocus={() => selectStudent(student.id)}
                        onBlur={(e) => updateSpecialNote(student.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                        }}
                        placeholder=""
                        className="w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs text-gray-900 placeholder:text-gray-300 hover:border-gray-200 focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
                      />
                    </td>
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
