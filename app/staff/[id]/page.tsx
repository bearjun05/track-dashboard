'use client'

import { use, useState, useCallback } from 'react'
import { DashboardHeader } from '@/components/dashboard/header'
import { TimePanel } from '@/components/dashboard/time-panel'
import { TodayPanel } from '@/components/dashboard/today-panel'
import { WeekChapterCalendar, type CalendarView } from '@/components/dashboard/week-calendar'
import { ScheduleRightPanel } from '@/components/dashboard/schedule-right-panel'
import { CommChannel } from '@/components/dashboard/comm-channel'
import { TeamRoundPanel } from '@/components/interview/team-round-panel'
import { StudentLogPanel } from '@/components/interview/student-log-panel'
import { useStaffDashboard } from '@/lib/hooks/use-staff-dashboard'
import { useAdminStore } from '@/lib/admin-store'
import { TODAY_STR } from '@/lib/date-constants'

interface Props {
  params: Promise<{ id: string }>
}

export default function StaffPage({ params }: Props) {
  const { id: staffId } = use(params)
  const [currentPage, setCurrentPage] = useState<'task' | 'schedule' | 'interview'>('task')
  const [selectedDate, setSelectedDate] = useState(TODAY_STR)
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState<Date | null>(null)
  const [calendarView, setCalendarView] = useState<CalendarView>('month')

  const staffData = useStaffDashboard(staffId, selectedDate)
  const { plannerTracks } = useAdminStore()
  const trackName = plannerTracks.find(t => t.staff?.some((s: any) => s.id === staffId))?.name

  const handleCreateTask = useCallback((title: string, opts?: { startDate?: string; endDate?: string; scheduledTime?: string; description?: string }) => {
    staffData.addSelfTask(title, opts)
  }, [staffData])

  const handleCreateRequest = useCallback((title: string, content: string, urgent?: boolean) => {
    staffData.addRequestTask(title, content, urgent)
  }, [staffData])

  return (
    <div className="flex h-full flex-col bg-background">
      <DashboardHeader
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onCreateTask={handleCreateTask}
        onCreateRequest={handleCreateRequest}
        trackName={trackName}
        staffId={staffId}
      />

      {currentPage === 'task' && (
        <div className="flex min-h-0 flex-1 gap-2 p-2">
          <div className="w-[25%] shrink-0">
            <TimePanel staffId={staffId} selectedDate={selectedDate} />
          </div>
          <div className="w-[25%] shrink-0">
            <TodayPanel staffId={staffId} selectedDate={selectedDate} />
          </div>
          <div className="w-[50%]">
            <CommChannel staffId={staffId} selectedDate={selectedDate} />
          </div>
        </div>
      )}

      {currentPage === 'schedule' && (
        <div className="flex min-h-0 flex-1 gap-2 p-2">
          {calendarView === 'month' ? (
            <>
              <div className="w-[65%] shrink-0">
                <WeekChapterCalendar staffId={staffId} selectedDate={scheduleSelectedDate} onSelectDate={setScheduleSelectedDate} view={calendarView} onViewChange={setCalendarView} />
              </div>
              <div className="flex w-[35%] flex-col">
                <ScheduleRightPanel staffId={staffId} selectedDate={scheduleSelectedDate} />
              </div>
            </>
          ) : (
            <div className="w-full">
              <WeekChapterCalendar staffId={staffId} view={calendarView} onViewChange={setCalendarView} />
            </div>
          )}
        </div>
      )}

      {currentPage === 'interview' && (
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
