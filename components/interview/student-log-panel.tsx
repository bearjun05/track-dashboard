'use client'

import React from "react"

import { useInterviewStore } from '@/lib/interview-store'
import { cn } from '@/lib/utils'
import { Search, Send, User } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'

export function StudentLogPanel() {
  const { students, studentLogs, selectedStudentId, selectStudent, addStudentLog } =
    useInterviewStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [logText, setLogText] = useState('')
  const logsEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  // Filtered students for dropdown
  const filteredStudents = searchQuery.trim()
    ? students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : students

  // Logs for selected student, sorted oldest first
  const selectedLogs = selectedStudentId
    ? studentLogs
        .filter((l) => l.studentId === selectedStudentId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : []

  // Group logs by date
  const logsByDate = new Map<string, typeof selectedLogs>()
  for (const log of selectedLogs) {
    const d = new Date(log.createdAt)
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const key = `${d.getMonth() + 1}월 ${d.getDate()}일 ${dayNames[d.getDay()]}요일`
    if (!logsByDate.has(key)) logsByDate.set(key, [])
    logsByDate.get(key)!.push(log)
  }

  // Scroll to bottom on new log
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedLogs.length])

  // Auto-resize textarea
  const handleTextareaInput = useCallback(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    const maxH = 10 * 20 // ~10 lines
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxH)}px`
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelectStudent(id: string) {
    selectStudent(id)
    const s = students.find((st) => st.id === id)
    if (s) setSearchQuery(s.name)
    setShowDropdown(false)
  }

  function handleSubmitLog() {
    if (!logText.trim() || !selectedStudentId) return
    addStudentLog(selectedStudentId, logText.trim())
    setLogText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitLog()
    }
  }

  function formatTime(iso: string): string {
    const d = new Date(iso)
    const h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h < 12 ? '오전' : '오후'} ${h > 12 ? h - 12 : h}:${m}`
  }

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-200 px-4">
        <User className="h-4 w-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900">{'수강생 로그'}</h2>
      </div>

      {/* Student search/select */}
      <div className="shrink-0 border-b border-gray-200 px-4 py-2" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="수강생 이름 검색"
            className="w-full rounded-md border border-gray-200 bg-background py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border border-gray-200 bg-card shadow-lg">
              {filteredStudents.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-gray-400">
                  {'검색 결과가 없습니다'}
                </p>
              ) : (
                filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStudent(s.id)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50',
                      selectedStudentId === s.id && 'bg-blue-50/60',
                    )}
                  >
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-xs text-gray-400">{s.teamNumber}{'팀'}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {selectedStudent && (
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {selectedStudent.teamNumber}{'팀'}
            </span>
            <span className="text-sm font-medium text-gray-900">{selectedStudent.name}</span>
          </div>
        )}
      </div>

      {/* Logs area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!selectedStudentId ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <User className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm">{'수강생을 선택하면 로그가 표시됩니다'}</p>
          </div>
        ) : selectedLogs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <p className="text-sm">{'아직 작성된 로그가 없습니다'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(logsByDate.entries()).map(([dateLabel, logs]) => (
              <div key={dateLabel}>
                {/* Date divider - KakaoTalk style */}
                <div className="flex items-center justify-center py-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-500">
                    {dateLabel}
                  </span>
                </div>

                {/* Logs for this date */}
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-lg border border-gray-200 bg-card">
                      {/* Log meta */}
                      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                        <span className="text-[13px] font-medium text-gray-600">
                          {log.authorName}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {log.period === 'morning' ? '오전' : '오후'}
                          {' '}
                          {formatTime(log.createdAt)}
                        </span>
                      </div>
                      {/* Log content */}
                      <div className="px-3 py-2.5">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
                          {log.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Log input */}
      {selectedStudentId && (
        <div className="shrink-0 border-t border-gray-200 px-4 py-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={logText}
              onChange={(e) => {
                setLogText(e.target.value)
                handleTextareaInput()
              }}
              onKeyDown={handleKeyDown}
              placeholder="수강생 로그 작성..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
            <button
              type="button"
              onClick={handleSubmitLog}
              disabled={!logText.trim()}
              className={cn(
                'absolute bottom-3.5 right-3 rounded-md p-1 transition-colors',
                logText.trim()
                  ? 'text-primary hover:bg-primary/10'
                  : 'cursor-not-allowed text-gray-300',
              )}
              aria-label="로그 제출"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {'Enter로 제출, Shift+Enter로 줄바꿈'}
          </p>
        </div>
      )}
    </div>
  )
}
