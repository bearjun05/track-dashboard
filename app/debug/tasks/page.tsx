'use client'

import { useState } from 'react'
import { TaskCard } from '@/components/task/task-card'
import { TaskDetailModal } from '@/components/task/task-detail-modal'
import { StatusBadge, StatusDot, PriorityBadge, PriorityIndicator, SourceBadge, TrackTag, CategoryBadge } from '@/components/task/task-badges'
import type { UnifiedTask, TaskStatus, TaskPriority, TaskSource } from '@/components/task/task-types'

const SAMPLE_MESSAGES = [
  { id: 'm1', authorId: 'mgr1', authorName: '이운영', content: '오전 팀순회 시 3팀 집중적으로 확인 부탁드립니다.', timestamp: '2026-02-11 09:00', isSelf: false },
  { id: 'm2', authorId: 'staff1', authorName: '김학관', content: '네 알겠습니다. 3팀 김철수 학생 상태가 좀 안좋아보여서 별도 면담 예정입니다.', timestamp: '2026-02-11 09:05', isSelf: true },
  { id: 'm3', authorId: 'mgr1', authorName: '이운영', content: '좋습니다. 면담 결과 공유해주세요.', timestamp: '2026-02-11 09:10', isSelf: false },
]

const SAMPLE_ATTACHMENTS = [
  { id: 'a1', name: '출석 체크 가이드 (Notion)', url: '#', type: 'guide' as const },
  { id: 'a2', name: '2월 출석 리포트.xlsx', url: '#', type: 'file' as const },
  { id: 'a3', name: '팀순회 체크리스트', url: '#', type: 'link' as const },
]

function createSampleTask(overrides: Partial<UnifiedTask> & { id: string; title: string }): UnifiedTask {
  return {
    trackId: 'track1',
    category: '수강생 관리',
    source: 'system',
    createdAt: '2026-02-11 08:00',
    startDate: '2026-02-11',
    priority: 'normal',
    status: 'pending',
    messages: [],
    ...overrides,
  }
}

const sampleTasks: UnifiedTask[] = [
  createSampleTask({ id: 't1', title: '출석 체크', startTime: '09:00', endTime: '09:30', status: 'completed', completedAt: '2026-02-11 09:25', assigneeId: 'staff1', source: 'system', priority: 'normal', messages: SAMPLE_MESSAGES, attachments: [SAMPLE_ATTACHMENTS[0]] }),
  createSampleTask({ id: 't2', title: '오전 팀순회', startTime: '10:00', endTime: '11:00', status: 'in_progress', assigneeId: 'staff2', source: 'system', priority: 'normal', description: '각 팀별 학습 진행 상태 확인 및 질문 대응. 3팀 김철수 학생 집중 관찰 필요.', output: '팀순회 보고서' }),
  createSampleTask({ id: 't3', title: '교육장 에어컨 수리 요청', status: 'pending', source: 'request_sent', priority: 'urgent', creatorId: 'staff1', description: '2번 교실 에어컨이 작동하지 않습니다. 오늘 오후 수업 진행이 어려울 것 같습니다.', category: '행정 업무', messages: [SAMPLE_MESSAGES[0]] }),
  createSampleTask({ id: 't4', title: '수강생 면담 진행', startTime: '14:00', endTime: '16:00', status: 'pending_review', assigneeId: 'staff3', reviewerId: 'mgr1', source: 'system', priority: 'important', description: '이번 주 결석 2회 이상 학생 면담 진행', output: '면담 기록서', attachments: SAMPLE_ATTACHMENTS }),
  createSampleTask({ id: 't5', title: '월간 리포트 제출', startDate: '2026-02-25', endDate: '2026-02-28', status: 'overdue', assigneeId: 'staff1', source: 'request_received', priority: 'important', creatorId: 'mgr1', description: '2월 월간 운영 리포트 작성 및 제출', output: '월간 리포트' }),
  createSampleTask({ id: 't6', title: '특별 멘토링 세션 준비', status: 'unassigned', source: 'request_received', priority: 'normal', creatorId: 'mgr1', category: '튜터 관리', description: 'AI 현업 멘토 초청 세미나 준비. 장소 세팅 및 자료 준비.' }),
  createSampleTask({ id: 't7', title: '팀 프로젝트 중간 점검', startTime: '11:00', endTime: '12:00', status: 'pending', assigneeId: 'staff4', source: 'system', priority: 'urgent', category: '수강생 관리', subcategory: '프로젝트 관리' }),
]

const ALL_STATUSES: TaskStatus[] = ['unassigned', 'pending', 'in_progress', 'pending_review', 'completed', 'overdue']
const ALL_PRIORITIES: TaskPriority[] = ['normal', 'important', 'urgent']
const ALL_SOURCES: TaskSource[] = ['system', 'request_sent', 'request_received', 'self']

export default function DebugTasksPage() {
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null)

  return (
    <div className="min-h-screen bg-background px-6 pt-6 pb-24">
      <div className="mx-auto max-w-5xl space-y-10">

        <header>
          <h1 className="text-2xl font-bold text-foreground">Task 공통 컴포넌트 디버그</h1>
          <p className="mt-1 text-sm text-muted-foreground">모든 variant, 상태, 뱃지를 한 화면에서 확인할 수 있습니다. 카드를 클릭하면 상세 모달이 열립니다.</p>
        </header>

        {/* ──────── Section 1: Badges ──────── */}
        <section>
          <SectionTitle>1. 뱃지 (Badges)</SectionTitle>

          <div className="space-y-4">
            <BadgeRow title="Status Badge">
              {ALL_STATUSES.map((s) => <StatusBadge key={s} status={s} />)}
            </BadgeRow>
            <BadgeRow title="Status Badge (xs)">
              {ALL_STATUSES.map((s) => <StatusBadge key={s} status={s} size="xs" />)}
            </BadgeRow>
            <BadgeRow title="Status Dot">
              {ALL_STATUSES.map((s) => (
                <span key={s} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <StatusDot status={s} /> {s}
                </span>
              ))}
            </BadgeRow>
            <BadgeRow title="Priority Badge">
              {ALL_PRIORITIES.map((p) => <PriorityBadge key={p} priority={p} />)}
              <span className="text-[11px] text-muted-foreground">(normal은 표시 안 됨)</span>
            </BadgeRow>
            <BadgeRow title="Priority Indicator (icon)">
              {ALL_PRIORITIES.map((p) => (
                <span key={p} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <PriorityIndicator priority={p} /> {p}
                </span>
              ))}
            </BadgeRow>
            <BadgeRow title="Source Badge">
              {ALL_SOURCES.map((s) => <SourceBadge key={s} source={s} />)}
            </BadgeRow>
            <BadgeRow title="Track Tag">
              <TrackTag name="AI 트랙 7기" color="#6366f1" />
              <TrackTag name="BE 트랙 5기" color="#0ea5e9" />
              <TrackTag name="FE 트랙 3기" color="#ec4899" />
            </BadgeRow>
            <BadgeRow title="Category Badge">
              <CategoryBadge category="수강생 관리" />
              <CategoryBadge category="행정 업무" />
              <CategoryBadge category="튜터 관리" />
              <CategoryBadge category="개강 전후 업무" />
            </BadgeRow>
          </div>
        </section>

        {/* ──────── Section 2: Compact Variant ──────── */}
        <section>
          <SectionTitle>2. Compact Variant (시간패널, 오늘 할 일 리스트)</SectionTitle>
          <div className="rounded-xl border border-border bg-card">
            {sampleTasks.map((task) => (
              <TaskCard
                key={task.id}
                variant="compact"
                task={task}
                onClick={setSelectedTask}
                showCheckbox
                onCheck={(id) => console.log('check', id)}
                showTrack
                trackName="AI 트랙 7기"
                trackColor="#6366f1"
              />
            ))}
          </div>
        </section>

        {/* ──────── Section 3: Card Variant ──────── */}
        <section>
          <SectionTitle>3. Card Variant (트랙 Task 목록, 칸반)</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {sampleTasks.map((task) => (
              <TaskCard
                key={task.id}
                variant="card"
                task={task}
                onClick={setSelectedTask}
                staffColor={task.assigneeId === 'staff1' ? '#6366f1' : task.assigneeId === 'staff2' ? '#0ea5e9' : task.assigneeId === 'staff3' ? '#8b5cf6' : '#14b8a6'}
                showTrack
                trackName="AI 트랙 7기"
                trackColor="#6366f1"
              />
            ))}
          </div>
        </section>

        {/* ──────── Section 4: Expanded Variant ──────── */}
        <section>
          <SectionTitle>4. Expanded Variant (아코디언 확장, 상세 프리뷰)</SectionTitle>
          <div className="space-y-3">
            {sampleTasks.slice(0, 4).map((task) => (
              <TaskCard
                key={task.id}
                variant="expanded"
                task={task}
                onClick={setSelectedTask}
                onComplete={(id) => console.log('complete', id)}
                onDefer={(t) => console.log('defer', t.id)}
                staffColor={task.assigneeId === 'staff1' ? '#6366f1' : task.assigneeId === 'staff2' ? '#0ea5e9' : '#8b5cf6'}
              />
            ))}
          </div>
        </section>

        {/* ──────── Section 5: All Status States ──────── */}
        <section>
          <SectionTitle>5. 상태별 카드 비교</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-3">
            {ALL_STATUSES.map((status) => (
              <TaskCard
                key={status}
                variant="card"
                task={createSampleTask({
                  id: `status-${status}`,
                  title: `${status} 상태 Task`,
                  status,
                  startTime: '09:00',
                  endTime: '10:00',
                  assigneeId: status !== 'unassigned' ? 'staff1' : undefined,
                  priority: status === 'overdue' ? 'urgent' : 'normal',
                  completedAt: status === 'completed' ? '2026-02-11 09:25' : undefined,
                })}
                onClick={setSelectedTask}
                staffColor="#6366f1"
              />
            ))}
          </div>
        </section>

        {/* ──────── Section 6: Priority Variants ──────── */}
        <section>
          <SectionTitle>6. 우선순위별 카드 비교</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-3">
            {ALL_PRIORITIES.map((priority) => (
              <TaskCard
                key={priority}
                variant="card"
                task={createSampleTask({
                  id: `priority-${priority}`,
                  title: `${priority} 우선순위 Task`,
                  priority,
                  startTime: '09:00',
                  assigneeId: 'staff1',
                  status: 'in_progress',
                })}
                onClick={setSelectedTask}
                staffColor="#6366f1"
              />
            ))}
          </div>
        </section>

      </div>

      {/* ──────── Modal ──────── */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={(id) => { console.log('complete', id); setSelectedTask(null) }}
          onDefer={(t) => { console.log('defer', t.id) }}
          onSendMessage={(id, content) => { console.log('send', id, content) }}
          staffColor="#6366f1"
        />
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-semibold text-foreground">{children}</h2>
}

function BadgeRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}
