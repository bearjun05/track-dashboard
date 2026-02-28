import type { Student, TeamRoundCheck, StudentLog } from './types'

const today = new Date()
const todayStr = today.toISOString().split('T')[0]

// 10 teams, 5-7 students each
const teamNames: string[][] = [
  ['김민수', '이서연', '박지호', '최유진', '정하늘'],
  ['한소율', '오준혁', '강다은', '임시우', '윤채원', '서도현'],
  ['조은서', '배성민', '송지안', '류태양', '문예린', '장현우', '홍서아'],
  ['신동현', '권나연', '황재민', '양수빈', '전유나'],
  ['고은혁', '남지우', '백서진', '차민호', '구하린', '안태윤'],
  ['유정우', '문서영', '이한결', '최예은', '김도윤', '박하은'],
  ['장서준', '임수아', '윤지환', '서예진', '한도영'],
  ['정민서', '오태은', '강준호', '배수연', '송현아', '류도훈'],
  ['조미래', '신유진', '권태현', '황예솔', '양서윤', '전도은', '고민재'],
  ['남하윤', '백준서', '차예린', '구성현', '안서하'],
]

export const mockStudents: Student[] = teamNames.flatMap((names, teamIdx) =>
  names.map((name, idx) => ({
    id: `s${teamIdx + 1}-${idx + 1}`,
    name,
    teamNumber: teamIdx + 1,
    consecutiveAbsentDays:
      // Some students with consecutive absences
      (teamIdx === 0 && idx === 2) ? 3 :
      (teamIdx === 2 && idx === 4) ? 2 :
      (teamIdx === 5 && idx === 0) ? 4 :
      0,
  })),
)

// Pre-filled checks for some students
export const mockRoundChecks: TeamRoundCheck[] = [
  // Team 1
  { studentId: 's1-3', date: todayStr, period: 'morning', isAbsent: true, healthCheck: false, specialNote: '3일 연속 결석, 연락 필요' },
  { studentId: 's1-4', date: todayStr, period: 'morning', isAbsent: false, healthCheck: true, specialNote: '컨디션 안 좋아보임' },
  // Team 3
  { studentId: 's3-5', date: todayStr, period: 'morning', isAbsent: true, healthCheck: false, specialNote: '병원 방문' },
  // Team 6
  { studentId: 's6-1', date: todayStr, period: 'morning', isAbsent: true, healthCheck: false, specialNote: '4일 연속 결석, 상담 센터 연계 예정' },
  // Afternoon checks
  { studentId: 's2-3', date: todayStr, period: 'afternoon', progressCheck: true, specialNote: '진도 50% 미만' },
  { studentId: 's4-2', date: todayStr, period: 'afternoon', progressCheck: true, specialNote: '' },
  // Team 2 morning
  { studentId: 's2-1', date: todayStr, period: 'morning', isAbsent: false, healthCheck: true, specialNote: '' },
  { studentId: 's2-5', date: todayStr, period: 'morning', isAbsent: false, healthCheck: true, specialNote: '최근 학습 의욕 상승' },
  { studentId: 's2-6', date: todayStr, period: 'morning', isAbsent: true, healthCheck: false, specialNote: '개인 사유 결석, 사전 연락 있음' },
  // Team 4 morning
  { studentId: 's4-1', date: todayStr, period: 'morning', isAbsent: false, healthCheck: true, specialNote: '' },
  { studentId: 's4-4', date: todayStr, period: 'morning', isAbsent: false, healthCheck: false, specialNote: '두통 호소, 조퇴 가능성' },
  // Team 5 morning
  { studentId: 's5-2', date: todayStr, period: 'morning', isAbsent: true, healthCheck: false, specialNote: '2일 연속 결석' },
  { studentId: 's5-5', date: todayStr, period: 'morning', isAbsent: false, healthCheck: true, specialNote: '' },
  // Team 7 morning
  { studentId: 's7-3', date: todayStr, period: 'morning', isAbsent: false, healthCheck: true, specialNote: '프로젝트 진도 우수' },
  // Team 8 afternoon
  { studentId: 's8-1', date: todayStr, period: 'afternoon', progressCheck: true, specialNote: '프로젝트 진도 양호' },
  { studentId: 's8-4', date: todayStr, period: 'afternoon', progressCheck: false, specialNote: '진도 30% 미만, 보충 필요' },
  // Team 9 afternoon
  { studentId: 's9-2', date: todayStr, period: 'afternoon', progressCheck: true, specialNote: '' },
  { studentId: 's9-6', date: todayStr, period: 'afternoon', progressCheck: false, specialNote: '과제 미제출 2건' },
  // Team 10 morning
  { studentId: 's10-1', date: todayStr, period: 'morning', isAbsent: false, healthCheck: true, specialNote: '' },
  { studentId: 's10-3', date: todayStr, period: 'morning', isAbsent: true, healthCheck: false, specialNote: '가족 행사, 오후 복귀 예정' },
]

// Sample logs for some students
export const mockStudentLogs: StudentLog[] = [
  {
    id: 'log1',
    studentId: 's1-3',
    studentName: '박지호',
    content: '3일 연속 결석 상태. 전화 통화 시도했으나 부재중. 카카오톡 메시지 발송 완료. 내일까지 연락 없으면 비상연락망 사용 예정.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'morning',
    createdAt: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: 'log2',
    studentId: 's1-3',
    studentName: '박지호',
    content: '카카오톡 답신 수신. 개인 사정으로 결석 중이며 내일부터 출석 예정이라고 답변.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'afternoon',
    createdAt: new Date(today.getTime() - 72000000).toISOString(),
  },
  {
    id: 'log3',
    studentId: 's1-4',
    studentName: '최유진',
    content: '최근 학습 의욕이 떨어진 것 같아 면담 진행. 취업 준비 관련 고민이 있어 커리어 상담 연결 예정.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'morning',
    createdAt: new Date(today.getTime() - 43200000).toISOString(),
  },
  {
    id: 'log4',
    studentId: 's3-5',
    studentName: '문예린',
    content: '병원 방문으로 오전 결석. 오후 출석 예정이라고 사전 연락 받음.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'morning',
    createdAt: new Date(today.getTime() - 3600000).toISOString(),
  },
  {
    id: 'log5',
    studentId: 's6-1',
    studentName: '유정우',
    content: '4일 연속 결석. 비상연락망(보호자)에 연락, 건강 문제로 결석 중이라는 확인. 상담 센터 연계 진행.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'morning',
    createdAt: new Date(today.getTime() - 7200000).toISOString(),
  },
  {
    id: 'log6',
    studentId: 's2-3',
    studentName: '강다은',
    content: '학습 진도 50% 미만. 개인 면담에서 프로젝트 과제에 집중하느라 온라인 강의를 못 들었다고 함. 학습 계획 재조정 도움.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'afternoon',
    createdAt: new Date(today.getTime() - 5400000).toISOString(),
  },
  {
    id: 'log7',
    studentId: 's2-6',
    studentName: '서도현',
    content: '개인 사유 결석 사전 연락 수신. 오후 복귀 어려울 수 있다고 하여 내일 출석 확인 예정.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'morning',
    createdAt: new Date(today.getTime() - 3000000).toISOString(),
  },
  {
    id: 'log8',
    studentId: 's5-2',
    studentName: '남지우',
    content: '2일 연속 결석. 전화 연결되지 않아 카카오톡 메시지 발송. 보호자 연락처로 문자 발송 완료.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'morning',
    createdAt: new Date(today.getTime() - 2400000).toISOString(),
  },
  {
    id: 'log9',
    studentId: 's4-4',
    studentName: '양수빈',
    content: '오전 순회 시 두통 호소. 보건실 이용 안내 후 경과 관찰 중. 심해지면 조퇴 처리 예정.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'morning',
    createdAt: new Date(today.getTime() - 1800000).toISOString(),
  },
  {
    id: 'log10',
    studentId: 's8-4',
    studentName: '배수연',
    content: '프로젝트 진도 30% 미만. 기초 개념 이해 부족으로 판단되어 튜터 보충 수업 연결 예정. 학생 동의 받음.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'afternoon',
    createdAt: new Date(today.getTime() - 1200000).toISOString(),
  },
  {
    id: 'log11',
    studentId: 's9-6',
    studentName: '전도은',
    content: '과제 미제출 2건 확인. 개인 면담에서 아르바이트 병행으로 시간이 부족하다고 호소. 학습 스케줄 재조정 상담 진행.',
    authorId: 'me',
    authorName: '나 (학관)',
    period: 'afternoon',
    createdAt: new Date(today.getTime() - 600000).toISOString(),
  },
]
