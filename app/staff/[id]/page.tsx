'use client'

import { use, useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/header'
import { TimePanel } from '@/components/dashboard/time-panel'
import { TodayPanel } from '@/components/dashboard/today-panel'
import { WeekChapterCalendar } from '@/components/dashboard/week-calendar'
import { NoticeSection } from '@/components/dashboard/notice-section'
import { IssueSection } from '@/components/dashboard/issue-section'
import { TeamRoundPanel } from '@/components/interview/team-round-panel'
import { StudentLogPanel } from '@/components/interview/student-log-panel'

interface Props {
  params: Promise<{ id: string }>
}

export default function StaffPage({ params }: Props) {
  const { id: staffId } = use(params)
  const [currentPage, setCurrentPage] = useState<'task' | 'interview'>('task')

  return (
    <div className="flex h-full flex-col bg-background">
      <DashboardHeader currentPage={currentPage} onPageChange={setCurrentPage} />

      {currentPage === 'task' ? (
        <div className="flex min-h-0 flex-1">
          <div className="w-[20%] shrink-0">
            <TimePanel staffId={staffId} />
          </div>
          <div className="w-[20%] shrink-0">
            <TodayPanel staffId={staffId} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-gray-200" style={{ height: '65%' }}>
              <WeekChapterCalendar staffId={staffId} />
            </div>
            <div className="flex min-h-0" style={{ height: '35%' }}>
              <div className="w-[60%] border-r border-gray-200">
                <NoticeSection staffId={staffId} />
              </div>
              <div className="w-[40%]">
                <IssueSection staffId={staffId} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="w-1/2">
            <TeamRoundPanel />
          </div>
          <div className="w-1/2">
            <StudentLogPanel />
          </div>
        </div>
      )}
    </div>
  )
}
