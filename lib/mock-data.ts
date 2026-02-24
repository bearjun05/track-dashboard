import type { Task, Notice, Issue, CalendarEvent } from './types'

// Use a fixed "today" so that SSR and client produce identical markup.
// The value is 2026-02-11 in the local timezone, which avoids Date.now()
// hydration mismatches while still looking realistic in the UI.
const today = new Date(2026, 1, 11, 9, 0, 0) // months are 0-indexed
const todayStr = '2026-02-11'

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export const mockTimedTasks: Task[] = [
  {
    id: 't1',
    title: '오전 출석체크',
    dueDate: todayStr,
    dueTime: '09:00',
    isCompleted: true,
    isImportant: true,
    type: 'system',
    chatMessages: [],
  },
  {
    id: 't2',
    title: '오전 학습현황 확인',
    dueDate: todayStr,
    dueTime: '10:00',
    isCompleted: false,
    isImportant: false,
    type: 'system',
    chatMessages: [
      {
        id: 'tm1',
        authorId: 'mgr1',
        authorName: '김운영',
        content: 'LMS 학습 진도율 30% 미만 수강생 리스트 따로 정리해주세요',
        timestamp: new Date(today.getTime() - 7200000).toISOString(),
        isFromManager: true,
      },
      {
        id: 'tm2',
        authorId: 'mgr1',
        authorName: '김운영',
        content: '특히 3주 연속 진도 미달인 분들은 면담 일정도 같이 잡아주세요',
        timestamp: new Date(today.getTime() - 5400000).toISOString(),
        isFromManager: true,
      },
    ],
    managerRequestCount: 2,
    attachments: [
      { id: 'a1', name: '학습현황 확인 가이드', url: 'https://notion.so/guide-1', type: 'notion' },
    ],
    detailContent: 'LMS 대시보드에서 각 수강생별 학습 진도율을 확인하고, 기준 미달 수강생에게 개별 안내를 진행합니다.',
  },
  {
    id: 't3',
    title: '점심시간 출석체크',
    dueDate: todayStr,
    dueTime: '13:00',
    isCompleted: false,
    isImportant: true,
    type: 'system',
    chatMessages: [],
  },
  {
    id: 't4',
    title: '팀 프로젝트 진행상황 점검',
    dueDate: todayStr,
    dueTime: '14:00',
    isCompleted: false,
    isImportant: false,
    type: 'system',
    chatMessages: [
      {
        id: 'tm3',
        authorId: 'mgr2',
        authorName: '박기획',
        content: '3조 팀 갈등 이슈가 있다고 하니 진행상황 점검할 때 유의해서 살펴봐주세요',
        timestamp: new Date(today.getTime() - 3600000).toISOString(),
        isFromManager: true,
      },
    ],
    managerRequestCount: 1,
    attachments: [
      { id: 'a2', name: '프로젝트 점검 체크리스트', url: 'https://notion.so/checklist', type: 'notion' },
      { id: 'a3', name: '팀별 진행현황 시트', url: 'https://docs.google.com/spreadsheet', type: 'link' },
    ],
    detailContent: '각 팀별 프로젝트 진행률과 이슈사항을 확인합니다. 특히 일정 지연되는 팀에 대한 원인 파악이 필요합니다.',
  },
  {
    id: 't5',
    title: '오후 출석체크',
    dueDate: todayStr,
    dueTime: '14:00',
    isCompleted: false,
    isImportant: true,
    type: 'system',
    chatMessages: [],
  },
  {
    id: 't6',
    title: '일일 학습보고서 작성',
    dueDate: todayStr,
    dueTime: '17:00',
    isCompleted: false,
    isImportant: false,
    type: 'system',
    chatMessages: [],
    attachments: [
      { id: 'a4', name: '일일보고서 템플릿', url: 'https://notion.so/daily-report', type: 'notion' },
    ],
    detailContent: '오늘 하루 동안의 학습 현황, 수강생 이슈, 특이사항을 정리하여 보고서를 작성합니다.',
  },
  {
    id: 't7',
    title: '퇴실 출석체크',
    dueDate: todayStr,
    dueTime: '18:00',
    isCompleted: false,
    isImportant: true,
    type: 'system',
    chatMessages: [],
  },
]

export const mockTodayTasks: Task[] = [
  {
    id: 'td1',
    title: '수강생 면담 일정 조율',
    dueDate: todayStr,
    isCompleted: false,
    isImportant: false,
    type: 'manager_request',
    chatMessages: [
      {
        id: 'm1',
        authorId: 'mgr1',
        authorName: '김운영',
        content: '이번 주 내로 면담 일정 잡아주세요.',
        timestamp: new Date(today.getTime() - 3600000).toISOString(),
        isFromManager: true,
      },
      {
        id: 'm1b',
        authorId: 'mgr1',
        authorName: '김운영',
        content: '특히 학습 부진 수강생 3명 우선 면담 부탁드립니다.',
        timestamp: new Date(today.getTime() - 2400000).toISOString(),
        isFromManager: true,
      },
    ],
    managerRequestCount: 2,
    attachments: [
      { id: 'a5', name: '면담 일정 조율 가이드', url: 'https://notion.so/interview-guide', type: 'notion' },
    ],
    detailContent: '수강생별 면담 가능 시간대를 확인하고 일정을 조율합니다. 면담 시 학습 진도, 취업 준비 현황 등을 파악합니다.',
  },
  {
    id: 'td2',
    title: '프로젝트 발표 자료 검토',
    dueDate: todayStr,
    isCompleted: false,
    isImportant: true,
    type: 'manager_request',
    chatMessages: [
      {
        id: 'm2',
        authorId: 'mgr2',
        authorName: '박기획',
        content: '발표 자료 사전 검토 후 피드백 부탁드립니다.',
        timestamp: new Date(today.getTime() - 1800000).toISOString(),
        isFromManager: true,
      },
    ],
    managerRequestCount: 1,
    attachments: [
      { id: 'a6', name: '발표자료 검토 기준표', url: 'https://notion.so/review-criteria', type: 'notion' },
    ],
  },
  {
    id: 'td3',
    title: '주간 학습 진도율 정리',
    dueDate: todayStr,
    isCompleted: true,
    isImportant: false,
    type: 'system',
    chatMessages: [],
  },
  {
    id: 'td4',
    title: '수강생 출결 이상자 확인',
    dueDate: todayStr,
    isCompleted: false,
    isImportant: false,
    type: 'system',
    chatMessages: [],
    detailContent: '결석 3회 이상 수강생 면담 필요',
  },
  {
    id: 'td5',
    title: '챕터 과제 제출 현황 점검',
    dueDate: addDays(today, 2),
    startDate: addDays(today, -1),
    endDate: addDays(today, 2),
    isCompleted: false,
    isImportant: false,
    type: 'period',
    chatMessages: [],
  },
  {
    id: 'td6',
    title: '중간평가 준비 안내',
    dueDate: addDays(today, 1),
    startDate: todayStr,
    endDate: addDays(today, 1),
    isCompleted: false,
    isImportant: true,
    type: 'period',
    chatMessages: [],
  },
  {
    id: 'td7',
    title: '교육장 환경 점검',
    dueDate: todayStr,
    isCompleted: false,
    isImportant: false,
    type: 'self_added',
    chatMessages: [],
  },
  {
    id: 'td8',
    title: '수강생 간식 발주',
    dueDate: todayStr,
    isCompleted: true,
    isImportant: false,
    type: 'self_added',
    chatMessages: [],
  },
]

export const mockNotices: Notice[] = [
  {
    id: 'n1',
    title: '2월 둘째주 운영 안내',
    content: '이번 주 수요일 오후 2시에 전체 운영회의가 있습니다. 각 트랙별 현황 보고를 준비해주세요.',
    authorId: 'mgr1',
    authorName: '김운영',
    isGlobal: true,
    isRead: false,
    timestamp: new Date(today.getTime() - 7200000).toISOString(),
    replies: [],
  },
  {
    id: 'n2',
    title: '수강생 면담 보고서 제출',
    content: '지난주 면담 진행한 수강생들의 보고서를 금요일까지 제출해주세요.',
    authorId: 'mgr2',
    authorName: '박기획',
    isGlobal: false,
    isRead: false,
    timestamp: new Date(today.getTime() - 3600000).toISOString(),
    replies: [
      {
        id: 'r1',
        authorId: 'me',
        authorName: '나',
        content: '네, 확인했습니다. 목요일까지 제출하겠습니다.',
        timestamp: new Date(today.getTime() - 1800000).toISOString(),
        isFromManager: false,
      },
    ],
  },
  {
    id: 'n3',
    title: '시스템 점검 안내',
    content: '오늘 오후 6시~7시 LMS 시스템 점검이 있습니다.',
    authorId: 'mgr1',
    authorName: '김운영',
    isGlobal: true,
    isRead: true,
    timestamp: new Date(today.getTime() - 86400000).toISOString(),
    replies: [],
  },
]

export const mockIssues: Issue[] = [
  {
    id: 'i1',
    title: '수강생 출결 시스템 오류',
    content: '오늘 오전 출석체크 시 일부 수강생 출석이 누락되었습니다. 확인 부탁드립니다.',
    urgency: 'urgent',
    status: 'answered',
    timestamp: new Date(today.getTime() - 5400000).toISOString(),
    replies: [
      {
        id: 'ir1',
        authorId: 'mgr1',
        authorName: '김운영',
        content: '확인했습니다. 수동으로 수정해두었습니다.',
        timestamp: new Date(today.getTime() - 3600000).toISOString(),
        isFromManager: true,
      },
    ],
  },
  {
    id: 'i2',
    title: '교육장 에어컨 고장',
    content: '3층 교육장 에어컨이 작동하지 않습니다.',
    urgency: 'normal',
    status: 'pending',
    timestamp: new Date(today.getTime() - 1800000).toISOString(),
    replies: [],
  },
]

export const mockCalendarEvents: CalendarEvent[] = [
  // 오늘
  {
    id: 'ce0a',
    title: '오전 특강 (외부 강사)',
    date: todayStr,
    category: 'general',
  },
  {
    id: 'ce0b',
    title: '팀 프로젝트 중간점검',
    date: todayStr,
    category: 'project',
  },
  {
    id: 'ce0c',
    title: '수강생 포트폴리오 리뷰',
    date: todayStr,
    category: 'general',
  },
  // 내일
  {
    id: 'ce2',
    title: '과제 제출 마감',
    date: addDays(today, 1),
    category: 'assignment',
  },
  {
    id: 'ce2b',
    title: '개인 멘토링 (1조~3조)',
    date: addDays(today, 1),
    category: 'general',
  },
  {
    id: 'ce2c',
    title: '이력서 클리닉',
    date: addDays(today, 1),
    category: 'general',
  },
  // 모레
  {
    id: 'ce1',
    title: '프로젝트 발표',
    date: addDays(today, 2),
    category: 'project',
  },
  {
    id: 'ce1b',
    title: '외부 심사위원 미팅',
    date: addDays(today, 2),
    category: 'general',
  },
  // +3일
  {
    id: 'ce3',
    title: '멘토링 세션',
    date: addDays(today, 3),
    category: 'general',
  },
  {
    id: 'ce3b',
    title: '취업특강 (이력서 작성)',
    date: addDays(today, 3),
    category: 'general',
  },
  {
    id: 'ce3c',
    title: '팀 빌딩 워크숍',
    date: addDays(today, 3),
    category: 'general',
  },
  // +4일
  {
    id: 'ce4',
    title: '중간 평가',
    date: addDays(today, 4),
    category: 'evaluation',
  },
  {
    id: 'ce4b',
    title: '운영회의',
    date: addDays(today, 4),
    category: 'general',
  },
]

export const mockChapterEvents: CalendarEvent[] = [
  {
    id: 'ch1',
    title: '챕터 3 시작',
    date: addDays(today, -3),
    category: 'general',
  },
  {
    id: 'ch2',
    title: '과제 제출',
    date: addDays(today, 1),
    category: 'assignment',
  },
  {
    id: 'ch3',
    title: '프로젝트 시작',
    date: addDays(today, 5),
    category: 'project',
  },
  {
    id: 'ch4',
    title: '중간 평가',
    date: addDays(today, 10),
    category: 'evaluation',
  },
  {
    id: 'ch5',
    title: '발제',
    date: addDays(today, 7),
    category: 'general',
  },
  {
    id: 'ch6',
    title: '최종 평가',
    date: addDays(today, 14),
    category: 'evaluation',
  },
  {
    id: 'ch7',
    title: '챕터 3 종료',
    date: addDays(today, 14),
    category: 'general',
  },
]
