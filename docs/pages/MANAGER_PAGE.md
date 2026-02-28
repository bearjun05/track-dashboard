# 총괄/운영매니저 공용 대시보드 정책

> `/managers/[id]` 및 `/operators/[id]` 페이지의 설계 원칙, 컴포넌트 구조, 데이터 흐름을 정리한 문서.

---

## 1. 페이지 개요

운영기획매니저(총괄)와 운영매니저(운영매)가 담당 트랙의 현황을 **탭 없이 단일 페이지**에서 파악하고, 즉각적인 조치가 필요한 항목을 빠르게 확인할 수 있는 대시보드. 두 역할이 **동일한 컴포넌트**(`ManagerOverview`)를 공유하되, `role` prop으로 데이터 필터링과 UI를 분기한다.

- **경로**: `/managers/[id]` (총괄), `/operators/[id]` (운영매)
- **진입점**:
  - `app/managers/[id]/page.tsx` → `ManagerDashboardHome` → `ManagerOverview(role='operator_manager')`
  - `app/operators/[id]/page.tsx` → `OperatorDashboardHome` → `ManagerOverview(role='operator')`
- **레이아웃**: 단일 스크롤 페이지 (탭 없음), `max-w-[1200px]` 중앙 정렬

### 역할별 차이

| 항목 | 총괄 (operator_manager) | 운영매 (operator) |
|------|------------------------|-------------------|
| 보이는 트랙 | 전체 `plannerTracks` | `operator.id === userId`인 트랙만 |
| 유저 이름 | "이운기" (하드코딩) | 트랙 데이터에서 동적 조회 (`plannerTracks → operator.name`) |
| 역할 타이틀 | "EduWorks 운영 관리" | "운영 관리" |
| Section 2 (트랙별 할 일) | **미표시** | 표시 (운영매 전용) |
| Section 1 운영매 현황 | 표시 (`showOperator=true`) | **미표시** |
| 내가 할 일 필터 | `assigneeId === mgr1` | `assigneeId === op1` |
| 업무 생성 (요청 탭) | "운영매에게 지시" — 운영매 선택 드롭다운 | "총괄에게 요청" — mgr1 고정 |

---

## 2. 페이지 구조

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: 인사말, 역할·트랙 수, 날짜                                │
│         ※ 통계 카드 4개는 제거됨 (설계 결정)                       │
├─────────────────────────────────────────────────────────────────┤
│ 트랙 건강도: 30일 스파크라인 바 차트 (TrackHealthSection)          │
├─────────────────────────────────────────────────────────────────┤
│ Section 1: 트랙별 현황 (TrackStatsSection)                       │
│            — 카드 그리드, 학관매 현황, 운영매 현황(총괄 전용)        │
├─────────────────────────────────────────────────────────────────┤
│ Section 2: 트랙별 할 일 (TrackActionSection) — 운영매 전용         │
│            — 3컬럼: 미배정 / 받은 요청 / 리뷰                      │
├─────────────────────────────────────────────────────────────────┤
│ Section 3: 내가 할 일 (MyTaskSection)                            │
│            — UnifiedTask 기반, 필터/정렬/생성 모달                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Header

`ManagerOverview` 컴포넌트 상단에 위치하는 `<header>` 영역.

| 요소 | 설명 |
|------|------|
| 인사말 | "{이름}님, 좋은 아침이에요" — `getGreeting()` 함수로 시간대별 자동 전환 (12시 전: 아침, 18시 전: 오후, 이후: 저녁) |
| 역할/트랙 수 | "{역할 타이틀} · 담당 트랙 N개" — `ROLE_TITLE[role]` + `tracks.length` |
| 날짜 | "2/27 (금)" 포맷 — `formatToday()` 함수 |

> **설계 결정**: Header에 통계 카드 4개 (오늘 Task, 완료율, 이슈, 공지 등)가 있었으나 **제거됨**. 트랙 건강도 섹션이 이 역할을 대체하며, 페이지 상단을 간결하게 유지한다.

---

## 4. 트랙 건강도 (TrackHealthSection)

**컴포넌트**: `components/manager/track-health-section.tsx` → `TrackHealthSection`

Header 바로 아래, Section 1 위에 위치. "요즘 트랙이 잘 관리되고 있나?"를 빠르게 판단하기 위한 **최근 30일** 추세 뷰.

### Props

| prop | 타입 | 설명 |
|------|------|------|
| `tracks` | `PlannerTrackCard[]` | 역할별 필터링 완료된 트랙 목록 |

### 트랙별 행 구성

각 트랙이 하나의 행(`TrackHealthRow`)으로 표시된다.

| 항목 | 설명 |
|------|------|
| 트랙명 뱃지 | 색상 태그, 짧은 이름 (`name.replace(/트랙\s*/, '')`), 72px 고정폭 |
| 오늘 완료율 | 굵은 숫자 (14px), 색상 정책 적용 |
| 전일 대비 변화량 | 상승: `TrendingUp` foreground, 하락: `TrendingDown` destructive, 유지: `Minus` muted |
| **30일 미니 바 차트** | `TODAY_STR` 기준 과거 30일, div 높이(2~24px) 완료율 비례, 미래는 비활성(`bg-foreground/[0.03]`), 각 바 클릭 가능 |
| **건강도 일수 태그** | 보통(80%+)/주의(60~80%)/위험(60%미만) 각각 태그+일수로 표시. 주의/위험 0이면 미표시 |
| 완료율 툴팁 | 숫자 영역 hover 시 계산 방식 설명 ("오늘 배정된 전체 Task 중 완료된 비율", 전일 대비 어제 완료율과의 차이) |

### 완료율 색상 정책

| 완료율 | 바 색상 (`barColorClass`) | 텍스트 색상 (`rateColorClass`) | 의미 |
|--------|--------------------------|-------------------------------|------|
| 80% 이상 | `bg-foreground/55` | `text-foreground/70` | 보통 |
| 60~80% | `bg-amber-500/50` | `text-amber-600` | 주의 |
| 60% 미만 | `bg-red-400/40` | `text-red-500` | 위험 |

이 정책은 헤더의 `Info` 아이콘 툴팁에도 표시되어 사용자가 색상 의미를 확인할 수 있음.

### 바 클릭 시 일별 상세 모달 (DayDetailModal)

데이터가 있는 날짜 바를 클릭하면 `DayDetailModal`이 열림:

1. **상단 요약**: 해당 날짜 완료율(색상 정책 적용), 완료/전체, 지연 건수
2. **학관매별 현황**: 학관별 완료율 프로그레스 바 + 지연 건수 (색상 정책 동일 적용)
3. **채팅 입력**: 문의/지시 내용을 입력하면 `UnifiedTask`로 생성됨. 담당 운영매니저 이름이 안내문에 표시됨.
   - **생성되는 Task 속성**:
     - `id`: `mt_health_{timestamp}`
     - `trackId`: `'_manager'`
     - `title`: `[{트랙명} {날짜}] {입력내용}`
     - **`priority`: `important` (고정)** — 건강도 문의는 긴급이 아닌 중요로 분류
     - `description`: `트랙 건강도 {rate}% ({completed}/{total}) 관련 문의`
     - **`assigneeId`: 해당 트랙의 운영매니저** (`track.operator.id`, 없으면 `'op1'`)
     - **`reviewerId`: `'mgr1'` (운영기획매니저)** — 확인 필요 상태로 자동 설정
     - `source`: `request_received` (총괄→운영매 지시)
     - `status`: `pending`
     - `messages`에 입력 내용 포함
   - 생성된 Task는 운영매니저의 "내가 할 일"에 표시되고, 총괄이 reviewer로 확인

### 데이터 계산 (computeDailyStats)

`computeDailyStats(trackTasks, trackId, days, staffList)` 유틸 함수:

- `trackTasks`에서 `trackId` + `scheduledDate`별로 `completed`/`total` 비율 계산
- `staffBreakdown` 포함하여 학관별 분석 데이터도 함께 계산 (id, name, total, completed, overdue, rate)
- 30일 날짜 배열은 `getLast30Days(TODAY_STR)`로 현재 날짜 기준 역산 자동 생성
- `TODAY_STR`은 `lib/date-constants.ts`에서 import — **매일 동적으로 갱신**됨

---

## 5. Section 1: 트랙별 현황 (TrackStatsSection)

**컴포넌트**: `components/manager/track-stats-section.tsx` → `TrackStatsSection`

**데이터 소스**: `plannerTracks` (admin-store), `trackTasks` (overdue 계산용), `schedules` (현재 챕터/커리큘럼)

### Props

| prop | 타입 | 설명 |
|------|------|------|
| `tracks` | `PlannerTrackCard[]` | 역할별 필터링 완료된 트랙 목록 |
| `showOperator` | `boolean` | 운영매니저 현황 표시 여부 — 총괄 뷰에서만 `true` (`!isOperator`) |

### 카드당 표시 항목

| 항목 | 데이터 | 비고 |
|------|--------|------|
| 트랙명 + 기간 | `track.name`, `track.period` | 색상 태그 (`track.color`) |
| 현재 챕터/커리큘럼 | `schedules`에서 오늘 날짜 범위 매칭 (`findCurrentSchedule`) | `BookMarked` 아이콘, 없으면 미표시 |
| 학관 평균 완료율 | `track.completionRate` | `MiniProgress` 바 (md 사이즈) + 퍼센트 숫자 |
| 이슈 현황 | `track.issueSummary` | 전체/대기/진행/완료, 대기 > 0이면 amber 강조 |
| **운영매니저 현황** (총괄 뷰 전용) | `track.operator` | 이름(볼드) + MiniProgress md + 완료/전체. `showOperator` prop으로 총괄 뷰에서만 표시 |
| 구분선 | — | 운영매니저↔학관매 사이 `border-dashed border-foreground/[0.08]` 점선 |
| **학관매 개별 현황** | `track.staff[]` | 이름 + 완료율% + MiniProgress 바 + 지연 인디케이터 |
| 인원 | `staffCount`, `studentCount`, `tutorCount` | 아이콘(Users/GraduationCap/BookOpen) + 툴팁(학습관리매니저/수강생/튜터) |
| 숏컷 버튼 | — | Task(`/tracks/[id]/tasks`) + 일정(`/tracks/[id]/schedule`) |

### 운영매니저 현황 (총괄 뷰 전용)

- `showOperator` prop이 `true`일 때만 렌더링 (총괄 대시보드에서 전달)
- 운영매니저 이름(볼드, 38px 고정폭) + MiniProgress 바(md 사이즈) + 완료/전체 숫자
- 학관매 리스트와 `border-dashed border-foreground/[0.08]` 점선으로 구분

### 학관매 개별 현황

각 학관매 행:
- 이름 (38px 고정폭) + 완료율 프로그레스 바 + 완료율% 수치
- `trackTasks`에서 해당 학관의 overdue 건수가 1건 이상이면 amber `AlertTriangle` 아이콘 + 건수 표시
- 완료율 80%+ 진한색, 60%+ 중간, 미만 연한색 (`MiniProgress` 재사용)
- `overdueMap`: `Map<trackId, Map<staffId, count>>` 구조로 사전 계산

### 레이아웃

- `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` 반응형 그리드
- 카드 클릭 시 `/tracks/[id]`로 이동 (`<Link>`)

---

## 6. Section 2: 트랙별 할 일 (TrackActionSection) — 운영매 전용

**컴포넌트**: `components/manager/track-action-section.tsx` → `TrackActionSection`

> **운영매니저 뷰에서만 렌더링.** 총괄은 트랙을 직접 관리하지 않으므로 `ManagerOverview`에서 `isOperator && <TrackActionSection>`으로 조건부 렌더링한다.

### Props

| prop | 타입 | 설명 |
|------|------|------|
| `tracks` | `PlannerTrackCard[]` | 운영매가 담당하는 트랙 목록 |
| `managerId` | `string` | 운영매니저 ID |

### 3개 컬럼 구성

| 컬럼 | 아이콘 | 필터 조건 | 설명 |
|------|--------|----------|------|
| 미배정 업무 | `UserX` | `status === 'unassigned'` | 배정 대기 중인 Task |
| 받은 요청 관리 | `MessageSquareDot` | `description.startsWith('__request_sent__')` && `status !== 'completed'` | 학관이 보낸 요청 Task |
| 리뷰해줄 것 | `ClipboardCheck` | `status === 'pending_review'` && `!description.startsWith('__request_sent__')` | 확인 대기 중인 Task |

각 컬럼의 `ColumnHeader`에 아이콘 + 라벨 + 총 건수 뱃지가 표시된다.

### 빈 상태

3개 컬럼 모두 0건이면 "처리할 항목이 없습니다" 빈 상태 UI (`border-dashed`) 표시.

### 접기/펼치기

섹션 헤더에 `ChevronsUpDown`/`ChevronsDownUp` 토글 버튼 제공 — 전체 3컬럼을 접거나 펼침.

### 공통 토글 카드 (TrackActionCard)

**컴포넌트**: `components/manager/track-action-card.tsx`

| 상태 | 표시 |
|------|------|
| 닫힌 상태 | 트랙명 뱃지 + "N건" 카운트 + `ChevronRight` |
| 열린 상태 | 트랙명 뱃지 + "N건" + `ChevronDown` + 인라인 한 줄 리스트 (제목, 담당자, `ExternalLink` 아이콘) |
| 0건 | 비활성 (`opacity-50`), 클릭 불가 (`disabled`) |

- 아이템 클릭 시 `/tracks/[trackId]/tasks?{filterParam}&highlight={taskId}`로 이동
- 5건 초과 시 "외 N건 더보기" 링크 표시 (`/tracks/[trackId]/tasks?{filterParam}`)
- `filterParam`은 컬럼별로: `scope=unassigned` / `source=request` / `status=pending_review`

---

## 7. Section 3: 내가 할 일 (MyTaskSection)

**컴포넌트**: `components/manager/my-task-section.tsx` → `MyTaskSection`

총괄/운영매 개인 업무를 관리하는 Task 시트. **학관 Task 정책과 동일한 상태 전환/리뷰 플로우**를 따름.

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `managerId` | `string` | — | 현재 매니저 ID (myTasks 필터링용) |
| `role` | `DashboardRole` | `'operator'` | 역할 — 생성 모달 분기용 |
| `tracks` | `PlannerTrackCard[]` | `[]` | 운영매 목록 추출용 (총괄의 지시 대상) |

### 데이터 모델

**타입**: `UnifiedTask` (`components/task/task-types.ts`)

store의 `managerTasks: UnifiedTask[]`를 사용. `trackId: '_manager'`로 트랙 소속이 아닌 매니저 개인 task를 식별. `assigneeId === managerId`로 본인 task만 필터링.

### source 구분

| source | 의미 | 예시 |
|--------|------|------|
| `system` | 시스템이 자동 생성한 업무 | 주간 리포트 작성, 주간 미팅 준비 |
| `request_received` | 총괄이 운영매에게 지시한 업무 | OT 일정 확정, 예산 보고서 |
| `request_sent` | 운영매가 총괄에게 요청한 업무 | 학관 추가 채용 승인 요청 |
| `self` | 본인이 직접 추가한 업무 | 멘토풀 확충 방안 정리 |

### 상태 전환 (학관 정책 동일)

```
pending → in_progress       (체크 클릭)
in_progress → completed     (체크, reviewer 없음)
in_progress → pending_review (체크, reviewer 있음)
pending_review → completed  (reviewer 승인)
completed → in_progress     (체크 해제)
```

- reviewer가 있으면 `pending_review`로 전환 + 토스트 ("{reviewer이름}님이 확인하면 완료 처리됩니다")
- `onApprove`: `pending_review` → `completed` 전환

### Store 액션

| 액션 | 설명 |
|------|------|
| `addManagerTask(task: UnifiedTask)` | 새 Task를 목록 맨 앞에 추가 |
| `updateManagerTaskStatus(taskId, status: TaskStatus)` | 상태 변경 (completed 시 completedAt 자동 기록) |
| `removeManagerTask(taskId)` | Task 삭제 |
| `addManagerTaskMessage(taskId, content, authorId, authorName, isSelf)` | 메시지 추가 (채팅 스레드) |

### 진행률 표시

섹션 헤더에 오늘 기준 진행률 표시:
- `{completedToday}/{totalToday} 완료` 텍스트
- 프로그레스 바 (20px 폭) + 퍼센트
- 기준: `startDate === TODAY_STR`인 task 중 completed 비율

### 필터 UI (track-task-sheet 패턴 적용)

| 필터 | 설명 |
|------|------|
| 상태 탭 | 전체 / 대기 / 진행중 / 확인요청(amber) / 완료 — 각 탭에 카운트 뱃지. 토글식 (재클릭 시 전체로 복귀) |
| 우선순위 토글 | 긴급(`Zap`, 빨강) / 중요(`Star`, amber) 토글 버튼 + 건수 뱃지 |
| 기간 필터 | 전체 기간 / 오늘 / 이번주 / 이번달 — `<select>` 드롭다운, `getWeekRange()`/`getMonthRange()` 사용 |
| 검색 | `Search` 아이콘 클릭 → 인라인 텍스트 입력, 제목 부분 검색 |
| 정렬 | 상태순(기본) / 날짜순, 오름차순/내림차순 토글. `STATUS_ORDER`: overdue(0) > pending_review(1) > in_progress(2) > pending(3) > completed(4) |
| 초기화 | 필터가 하나라도 적용되면 "초기화" 버튼 표시 — 모든 필터를 기본값으로 리셋 |

### 제외한 필터 (track-task-sheet 대비)

- 담당자 필터: 본인 task만 보이므로 불필요
- 유형(type) 필터: daily/milestone/manual 구분 없음
- 오른쪽 패널 (학관별 시간 그리드): 불필요

### Task 렌더링

- `TaskCard` compact variant (`showCheckbox`, `showSource`, `showMeta`, `showApprove`)
- 클릭 시 `TaskDetailModal` 열림 (상태 변경/메시지 전송/리뷰 요청 모두 연동)
- 리스트 영역: `max-h-[420px]` 스크롤, `min-h-[200px]`

### Task 생성 모달 (CreateTaskModal, 2탭)

**탭 1: 내 할 일** (`source: 'self'`)

| 필드 | 필수 | 설명 |
|------|------|------|
| 제목 | O | 텍스트 입력 |
| 설명 | X | textarea |
| 시작일 | O | date 입력 (기본값: `TODAY_STR`) |
| 시간 | X | time 입력 |
| 우선순위 | O | 보통 / 중요 / 긴급 3버튼 (기본: 보통) |

- `assigneeId`: 본인 (`userId`) 고정
- `status`: `pending`

**탭 2: 업무 요청/지시** (역할에 따라 분기)

| 역할 | 탭 라벨 | source | assignee | status |
|------|---------|--------|----------|--------|
| 운영매 | "총괄에게 요청" | `request_sent` | `mgr1` 고정 (총괄 한 명) | **`pending_review`** |
| 총괄 | "운영매에게 지시" | `request_received` | 운영매 선택 드롭다운 | **`pending_review`** |

> **수정 사항**: 업무 요청/지시 생성 시 `status`는 `'pending_review'`로 설정됨 (기존 `'pending'`에서 변경). 요청/지시는 상대방의 확인이 필요하므로 생성 즉시 리뷰 대기 상태로 진입한다.

| 필드 | 필수 | 설명 |
|------|------|------|
| 제목 | O | 텍스트 입력 |
| 상세 내용 | O | textarea |
| 긴급 | X | 체크박스 — 체크 시 `priority: 'urgent'`, 미체크 시 `'normal'` |

- 운영매 역할: "담당: 이운기 (총괄)" 고정 텍스트 표시
- 총괄 역할: `plannerTracks`에서 추출한 운영매 목록 `<select>` — `tracks.operator`에서 deduplicate
- `reviewerId`: 운영매일 때 `'mgr1'`, 총괄일 때 `undefined`
- `messages[]`에 입력 내용이 첫 메시지로 포함
- `creatorId`: `userId` (생성자)

---

## 8. 컴포넌트 파일 구조

### 현재 활성 파일

```
components/manager/
  manager-dashboard-home.tsx   # 총괄 진입점 (role='operator_manager', userId='mgr1')
  manager-overview.tsx         # 메인 레이아웃 (Header + 건강도 + 3 Section, role prop으로 분기)
  manager-sidebar.tsx          # 매니저 전용 사이드바
  track-health-section.tsx     # 트랙 건강도 (30일 스파크라인 바 차트 + DayDetailModal)
  track-stats-section.tsx      # Section 1: 트랙별 현황 (카드 그리드 + 학관매 개별 현황)
  track-action-section.tsx     # Section 2: 트랙별 할 일 (3컬럼, 운영매 전용)
  track-action-card.tsx        # 공통 토글 카드 컴포넌트 (TrackActionCard + ActionCardItem)
  my-task-section.tsx          # Section 3: 내가 할 일 (UnifiedTask 기반 + CreateTaskModal)

components/operator/
  operator-dashboard-home.tsx  # 운영매 진입점 (role='operator', userId='op1')
```

### 삭제된 레거시 파일

다음 파일들은 리팩토링 과정에서 삭제되었으며, 위 활성 파일들이 역할을 대체함:

- `components/manager/dashboard-home.tsx`
- `components/manager/kanban-board.tsx`
- `components/manager/notification-dropdown.tsx`
- `components/manager/operator-chat-section.tsx`
- `components/manager/operator-detail-page.tsx`
- `components/manager/operator-status-tab.tsx`
- `components/manager/planner-track-cards.tsx`
- `components/manager/staff-detail-page.tsx`
- `components/manager/today-action-list.tsx`
- `components/manager/track-detail-dashboard.tsx`
- `components/operator/operator-staff-detail.tsx`
- `components/operator/operator-track-detail.tsx`

---

## 9. 링크 연동 (URL 파라미터)

Section 2의 아이템 클릭 시 `/tracks/[id]/tasks` 페이지로 이동하며, URL 파라미터로 초기 필터가 적용된다.

| 파라미터 | 값 | 효과 |
|----------|-----|------|
| `scope=unassigned` | — | statusFilter를 `'unassigned'`로 설정 |
| `source=request` | — | 요청 관련 Task만 필터 |
| `status=pending_review` | — | statusFilter를 `'pending_review'`로 설정 |
| `highlight={taskId}` | Task ID | 해당 Task 하이라이트 (스크롤 이동 + 강조) |

---

## 10. 설계 원칙

1. **탭 없는 단일 페이지**: 전체 현황을 한 화면에서 파악, 탭 전환 없이 스크롤로 모든 정보에 접근
2. **총괄/운영매 공용**: 동일한 `ManagerOverview` 컴포넌트를 `role` prop으로 분기하여 코드 중복 제거. 진입점만 `ManagerDashboardHome` / `OperatorDashboardHome`으로 분리
3. **학관 Task 정책 동일**: 상태 전환(`pending` → `in_progress` → `pending_review` → `completed`), 리뷰 플로우, `TaskCard`/`TaskDetailModal` 재사용
4. **점진적 디테일 공개**: 트랙별 할 일은 카운트만 보이다가 토글로 상세 펼침 (`TrackActionCard`)
5. **빠른 이동**: 토글 내 아이템 클릭 → 트랙 Task 탭으로 직행 + 자동 필터 (URL 파라미터)
6. **주의 환기**: 대기 이슈 amber 강조, 학관매 지연 건수 `AlertTriangle` amber 표시, 건강도 색상 정책
7. **날짜 동적 관리**: `TODAY_STR`은 `lib/date-constants.ts`에서 `new Date().toISOString().split('T')[0]`로 매번 동적 생성. 하드코딩 날짜 없음
8. **운영매 전용 섹션 분리**: Section 2(트랙별 할 일)는 운영매만 볼 수 있도록 조건부 렌더링 — 총괄은 직접 트랙을 관리하지 않으므로 불필요
