'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/header'
import { TimePanel } from '@/components/dashboard/time-panel'
import { TodayPanel } from '@/components/dashboard/today-panel'
import { WeekChapterCalendar } from '@/components/dashboard/week-calendar'
import { NoticeSection } from '@/components/dashboard/notice-section'
import { IssueSection } from '@/components/dashboard/issue-section'
import { TeamRoundPanel } from '@/components/interview/team-round-panel'
import { StudentLogPanel } from '@/components/interview/student-log-panel'

export default function Page() {
  const [currentPage, setCurrentPage] = useState<'task' | 'interview'>('task')

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardHeader currentPage={currentPage} onPageChange={setCurrentPage} />

      {currentPage === 'task' ? (
        /* Task Dashboard */
        <div className="flex min-h-0 flex-1">
          {/* Left: Time-based panel (2/10) */}
          <div className="w-[20%] shrink-0">
            <TimePanel />
          </div>

          {/* Left: Today todo panel (2/10) */}
          <div className="w-[20%] shrink-0">
            <TodayPanel />
          </div>

          {/* Right section (6/10) */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Calendar (top ~65%) */}
            <div className="border-b border-gray-200" style={{ height: '65%' }}>
              <WeekChapterCalendar />
            </div>

            {/* Notice & Issue (bottom ~35%) */}
            <div className="flex min-h-0" style={{ height: '35%' }}>
              {/* Notices (60%) */}
              <div className="w-[60%] border-r border-gray-200">
                <NoticeSection />
              </div>
              {/* Issues (40%) */}
              <div className="w-[40%]">
                <IssueSection />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Interview Management */
        <div className="flex min-h-0 flex-1">
          {/* Left: Team round panel (50%) */}
          <div className="w-1/2">
            <TeamRoundPanel />
          </div>

          {/* Right: Student log panel (50%) */}
          <div className="w-1/2">
            <StudentLogPanel />
          </div>
        </div>
      )}
    </div>
  )
}
