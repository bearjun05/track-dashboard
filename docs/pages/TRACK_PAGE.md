# 트랙(Track) 페이지 정책

> 경로: `/tracks/[id]` (서브페이지 포함)
> 접근 권한: 총괄(모든 트랙), 운영(담당 트랙만)
> 대상 사용자: 운영매니저가 주 사용자, 총괄매니저가 모니터링 목적으로 열람

---

## 1. 공통 레이아웃

### 1.1 파일 구조

```
app/tracks/[id]/
  layout.tsx        # 공통 헤더 + 네비게이션 탭 (Task/일정)
  page.tsx          # → /tracks/[id]/tasks로 redirect
  tasks/
    page.tsx        # Task 시트 (TrackTaskSheet)
  schedule/
    page.tsx        # 일정 탭 (TrackSchedulePage + 인라인 TrackScheduleRightPanel)
```

### 1.2 공통 헤더 (`layout.tsx`)

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back]  AI 트랙 7기  2026.01.12~04.22  D-53                 │
│                                    학관 3명 · 수강생 30명       │
├─────────────────────────────────────────────────────────────────┤
│ [Task 3]  [일정]                                                │
└─────────────────────────────────────────────────────────────────┘
```

- **1행**: Back 버튼 + 트랙명(컬러 뱃지) + 기간 + D-day 뱃지
- **우측**: 학관/수강생 인원
- **2행**: 네비게이션 탭 (URL 기반 active 상태)
  - `Task`: `/tracks/[id]/tasks` — 미배정 건수 있으면 빨간 뱃지 (기본 랜딩)
  - `일정`: `/tracks/[id]/schedule` — CalendarDays 아이콘

#### D-Day 계산

`useDDay()` 훅 — `layout.tsx` 내부 정의:
- `TODAY_STR`을 `lib/date-constants.ts`에서 import (동적 계산, 하드코딩 아님)
- 트랙 기간의 종료일 기준으로 남은 일수 계산
- `diff <= 7`: urgent (빨간 배경), 그 외: 회색 배경
- 종료 후: `D+N`, 당일: `D-Day`, 미래: `D-N`

#### 트랙 미존재 시

`plannerTracks`에서 `trackId`에 해당하는 트랙을 찾지 못하면:
- AlertTriangle 아이콘 + "트랙을 찾을 수 없습니다" 메시지
- "돌아가기" 버튼 → `ROLE_HOME[currentRole]`

### 1.3 데이터 소스

헤더에서 사용하는 데이터:
- `useAdminStore.plannerTracks` → 트랙 기본 정보
- `useAdminStore.operatorTrackDetails` → 학관 목록 (`staffList`)
- `useAdminStore.trackTasks` → Task 카운트, 미배정 카운트
- `useRoleStore.currentRole` → Back 버튼 홈 경로 결정
- `TODAY_STR` → `lib/date-constants.ts` (동적: `new Date().toISOString().split('T')[0]`)

### 1.4 탭 구성

| 탭 | href | 아이콘 | 카운트 | 경고 뱃지 |
|----|------|--------|--------|----------|
| Task | `/tracks/[id]/tasks` | ListTodo | taskCount | unassignedCount > 0 |
| 일정 | `/tracks/[id]/schedule` | CalendarDays | — | — |

활성 상태: `pathname.startsWith(tab.href)` — `border-b-2 border-foreground`

---

## ~~2. 대시보드 탭~~ (제거됨)

> 대시보드 탭은 Task 탭과 기능 중복으로 제거됨.
> `/tracks/[id]` 접근 시 자동으로 `/tracks/[id]/tasks`로 redirect (`page.tsx`).
> 소통 기능은 글로벌 플로팅 위젯(`components/comm/floating-comm-widget.tsx`)으로 이전.
> 상세 정책은 `docs/pages/COMM_WIDGET.md` 참조.
>
> 삭제된 레거시 컴포넌트:
> - `components/track/track-detail.tsx` — 대시보드 메인
> - `components/track/track-comm-panel.tsx` — 소통 패널
> - `components/track/track-task-section.tsx` — Task 섹션
> - `components/track/track-staff-section.tsx` — 학관 현황 섹션
> - `components/track/track-notice-section.tsx` — 공지 섹션
> - `components/track/track-schedule-section.tsx` — 일정 섹션

### ~~2.1 히스토리 참고~~

기존 대시보드는 3-column 레이아웃(학관 현황 25% / 미배정 관리 25% / 일정·소통 50%)으로
운영매니저가 한 화면에서 트랙 전체 상황을 파악하는 목적이었으나,
Task 시트(우측에 학관별 시간 그리드) + 일정 탭(캘린더 + 우측 패널)으로 분리되면서 역할이 해소됨.

---

## 3. Task 시트 탭 (`/tracks/[id]/tasks`)

### 3.1 페이지 목적

트랙의 모든 Task를 시트 형식으로 조회/필터링/관리:
- 상태별/담당자별/기간별 필터링
- 확인 필요(pending_review) task 빠른 승인
- 미배정 task 즉석 배정
- 학관매별 오늘 일정을 옆에서 참고하며 배정 판단

### 3.2 라우트 파일 (`tasks/page.tsx`)

```typescript
<TrackTaskSheet
  trackId={id}
  initialScope={sp.scope}      // URL ?scope=unassigned → 초기 필터
  initialStatus={sp.status}    // URL ?status=pending_review → 초기 상태 탭
/>
```

`searchParams`에서 `scope`/`status` 쿼리 파라미터를 받아 초기 필터를 설정.

### 3.3 레이아웃 (2-column)

```
┌──────────────────────────────────────┬────────────────────┐
│  왼쪽: Task 리스트 (flex-1)           │  오른쪽 (320px)     │
│                                      │                    │
│  ┌ 1행: 상태 탭 ────────────────┐    │  학관별 오늘 일정    │
│  │ [전체][지연][미배정][확인요청]  │    │                    │
│  │ [대기][진행중][완료]           │    │  [●김학관][●이학관]  │
│  ├ 2행: 중요도+세부 필터 ────────┤    │                    │
│  │ [⚡긴급][★중요]|담당자▼ 유형▼ │    │  시간 미지정         │
│  │ 기간▼ [초기화]|🔍 [+새Task]  │    │  ☐ 포트폴리오 배포   │
│  └──────────────────────────────┘    │                    │
│  ┌ 정렬 헤더 ───────────────────┐    │  09 ┤ 출석 체크      │
│  │ 완료  상태 ! 제목  담당 시간 소│    │  10 ┤ 팀순회         │
│  └──────────────────────────────┘    │  11 ┤ 출결리포트      │
│  [완료] 확인요청 ⚡ 출결 리포트💬1   │     ┤ 면담 (겹침)    │
│         진행중  ⚡ 오전 팀순회        │  12 ┤                │
│         대기      점심 교실관리      │  ...                │
│  [배정▼] 미배정  ★ 특별 멘토링       │                    │
│         ...                          │                    │
└──────────────────────────────────────┴────────────────────┘
```

### 3.4 왼쪽: Task 리스트

#### 필터 바

**1행 - 상태 탭** (단일 선택, 배타적):

| 탭 | 필터 키 | 색상 | 설명 |
|----|---------|------|------|
| 전체 | `all` | 기본 | 모든 상태 (기본) |
| 지연 | `overdue` | red | overdue 상태 |
| 미배정 | `unassigned` | amber | unassigned 상태 |
| 확인요청 | `pending_review` | amber | pending_review 상태 |
| 대기 | `pending` | 기본 | pending 상태 |
| 진행중 | `in_progress` | 기본 | in_progress 상태 |
| 완료 | `completed` | 기본 | completed 상태 |

각 탭에 카운트 뱃지 표시. 클릭 시 토글 (다시 클릭하면 '전체'로).

> **상태 문자열 통일**: 모든 상태는 underscore 구분자 사용 (`in_progress`, `pending_review`).
> `task-types.ts`의 `TaskStatus` 타입 참조.

**2행 - 중요도 토글 + 세부 필터 + 액션**:

```
[⚡긴급 N] [★중요 N] | [담당자 v] [유형 v] [기간 v] [초기화] | [검색]  [+ 새 Task]
```

- **⚡긴급 / ★중요**: 독립 토글 버튼 (복수 선택 가능). 상태 탭과 AND 조건으로 교차 필터 적용.
  - 둘 다 off: 중요도 필터 없음 (전체)
  - 둘 다 on: 긴급 OR 중요인 task 표시
  - overdue 상태 task는 자동으로 urgent count에 포함
  - 활성 시 색상: 긴급=`border-red-300 bg-red-500/10 text-red-600`, 중요=`border-amber-300 bg-amber-500/10 text-amber-600`
- **담당자**: select (전체 / 각 학관매 / 미배정)
- **유형**: select (전체 / 일일 / 기간 / 수동)
- **기간**: select
  - `전체 기간` — 필터 없음 (기본값: `all`)
  - `오늘` — `TODAY_STR` (초기 기본값: `today`)
  - `이번주` — `getWeekRange()` from `lib/date-constants.ts`
  - `이번달` — `getMonthRange()` from `lib/date-constants.ts`
  - `날짜 선택...` — custom date input 표시
- **검색**: 돋보기 아이콘 → 클릭 시 텍스트 입력 표시 (제목 매칭)
- **초기화**: 필터가 하나라도 활성이면 표시
- **+ 새 Task**: NewTaskModal 호출 (중요도 선택 포함)

#### 정렬 헤더

| 열 | 너비 | 정렬 | 비고 |
|----|------|------|------|
| 완료 | `w-[48px]` | — | pr-2 패딩, justify-center |
| 상태 | `w-[56px]` | 상태 우선순위순 | justify-center |
| (우선순위) | `w-5` | — | — |
| 제목 | `flex-1` | — | 좌측 정렬, pl-1 |
| 담당자 | `w-[72px]` | 이름 가나다순 | ml-2, justify-center |
| 시간 | `w-[84px]` | 날짜+시간 ASC (기본) | ml-2, justify-center |
| 소스 | `w-[48px]` | — | ml-2, justify-center |

기본 정렬: `scheduledDate` ASC → `scheduledTime` ASC

`SortButton` 컴포넌트: 상태/담당자/시간 열에 정렬 토글 (ASC↔DESC).

#### 자동 상태 보정 (`allTrackTasks` useMemo)

raw trackTasks를 런타임에 보정:
- `pending` + `scheduledDate <= TODAY_STR` → `in_progress` 자동 전환
- `in_progress` + `dueDate < TODAY_STR` → `overdue` 자동 전환
- `unassigned`, `completed`는 그대로 유지

#### Compact 행 카드 (`TaskCard variant="compact"`)

**열 순서 (왼 → 오)**:

| 순서 | 열 | 너비 | 내용 | 비고 |
|------|-----|------|------|------|
| 1 | 완료 | `w-[48px]` | `[완료]` 버튼 or 빈칸 | `reviewerId` + `pending_review` 상태일 때만. 노션 스타일 흰 배경. pr-2 |
| 2 | 상태 | `w-[56px]` | StatusLabel (컬러 dot + 텍스트) | justify-center |
| 3 | 우선순위 | `w-5` | PriorityIndicator 아이콘 | urgent=Zap(빨강), important=Star(amber) |
| 4 | 제목 | `flex-1` | 제목(truncate) + 💬카운트 + 기간태그 | 완료시 취소선, 초과시 빨강. 메시지와 기간은 제목 오른쪽에 inline |
| 5 | 담당자 | `w-[72px]` | 컬러dot+이름 드롭다운 | ml-2. 모든 task에 재배정 드롭다운 지원. 완료 task는 잠금 |
| 6 | 시간 | `w-[84px]` | HH:MM ~ HH:MM | ml-2. 시간 미지정이면 빈칸. justify-end |
| 7 | 소스 | `w-[48px]` | SourceBadge | ml-2. 시스템/보낸요청/받은요청/직접추가 |

> **소스 열 너비 변경 이력**: 기존 `w-[56px]` → 현재 정렬 헤더 기준 `w-[48px]`.
> `task-card.tsx`의 실제 렌더에서는 `w-[56px]`이 남아있을 수 있으나, 정책 기준은 `w-[48px]`.

#### 행 시각 디자인

- **좌측 보더 힌트** (상태별):
  - 미배정: `border-l-2 border-dashed border-foreground/20`
  - 기한초과: `border-l-2 border-red-500`
  - 확인요청: `border-l-2 border-amber-500`
  - 기타: `border-l-2 border-transparent`
- **미배정 행**: `bg-foreground/[0.015]`
- **완료 행**: `opacity-40`
- hover: `bg-foreground/[0.02]`
- 행 클릭: TaskDetailModal 열림 (`trackTaskToUnified()` 변환 후 전달)

#### [완료] 버튼 (토글 동작)

- **표시 조건**: `task.reviewerId` 존재 + `task.status === 'pending_review'`
- **동작**: 클릭 시 `updateTrackTaskStatus(taskId, 'completed')`
- **이미 완료인 경우**: 클릭 시 `updateTrackTaskStatus(taskId, 'pending_review')` (토글)
- **스타일**: 노션 스타일 흰색 배경 (`bg-background border border-foreground/15 shadow-[0_1px_2px_...]`)

#### 담당자 드롭다운 (재배정 포함)

- **모든 task에 표시**: 미배정/배정 모두 드롭다운으로 즉시 (재)배정 가능
- **완료 task 잠금**: `done` 상태일 때 드롭다운 비활성화 (static 텍스트)
- **드롭다운 항목**: 학관매 리스트 (컬러dot + 이름)
- **동작**: 선택 시 `assignTask(taskId, staffId, staffName)` — 상세 모달 진입 없이 즉시 배정
- **스타일 통일**: 미배정=`border-dashed`, 배정=`border-transparent`, 완료=disabled static. 모두 `rounded-md border px-1 py-0.5`로 동일 크기 유지. ChevronDown 자리에 빈 spacer(`h-2.5 w-2.5`)를 넣어 모든 상태에서 이름 텍스트 영역이 동일
- **이름 조회**: `useNameLookup()` 훅으로 `assigneeId` → 이름 변환

### 3.5 오른쪽: 학관별 오늘 시간 그리드 (320px)

**목적**: 미배정 task 배정 시 "이 학관매 오늘 뭐하고 있지?"를 옆에서 바로 확인

#### 패널 구조

```
┌────────────────────┐
│  학관별 오늘 일정    │
├────────────────────┤
│ [●김학관][●이학관]  │  ← 학관매 탭 (클릭으로 전환, 완료/전체 카운트)
├────────────────────┤
│ 시간 미지정         │  ← untimed 섹션 (있을 때만)
│ ☐ 포트폴리오 배포   │
│ ☐ 비품 재고 확인    │
├────────────────────┤
│ 09 ─ 출석 체크      │
│ 10 ─ 오전 팀순회    │  ← 시간 그리드 (겹침 처리)
│ 11 ─ 출결 리포트    │
│    ─ 면담 (겹침)    │
│ 12 ─               │
│ ...                │
│ 17 ─ 일일 보고서    │
└────────────────────┘
```

#### 학관매 탭

- 학관매 이름 탭으로 전환 (기본: 첫 번째 학관매 선택)
- 각 탭에 컬러dot + 이름 + 완료/전체 카운트
- 색상: `STAFF_COLORS` 팔레트 (`track-utils.ts`)

#### 시간 그리드 (`OverlapGrid` 컴포넌트)

- 09:00~18:00, 30분 단위
- 슬롯 높이: **20px** (`MINI_SLOT`)
- 정시: 실선 (`border-foreground/[0.05]`)
- 30분: 점선 (`border-dashed border-foreground/[0.03]`)
- 시간 라벨: 좌측 32px

#### 겹침 처리 알고리즘

`computeOverlapColumns()` 함수 — `lib/grid-utils.ts`에서 import:

1. 시작 slot 오름차순, 동일 시 span 내림차순 정렬
2. `colEnds` 배열로 각 item마다 빈 column 찾아 배치
3. 겹치는 item들의 최대 column 수(`groupSize`)를 계산
4. 각 item의 width = `(1/groupSize) * 100%`, left = `(col/groupSize) * 100%`

> 이 알고리즘은 일정 탭의 `StaffTimeGrid`와 동일하게 공유됨.

#### Task 블록 디자인

- 흰 배경 + 얇은 테두리 + 미세 그림자
- 30분(1슬롯) 카드: 제목(truncate) + 우측 시간 (compact)
- 1시간+(2슬롯+) 카드: 상단 제목 + 하단 시간 범위
- 완료: `opacity-40` + 취소선 (`text-foreground/30 line-through`)
- 기한초과: `border-red-500/20`

#### 시간 미지정 섹션

- 시간 그리드 위에 별도 영역 (있을 때만)
- 라벨 "시간 미지정" + 블루 dot + 제목 리스트
- 완료 task: `text-foreground/25 line-through`

#### 데이터 소스

- `allTrackTasks.filter(t.scheduledDate === TODAY_STR && t.assigneeId === selectedStaffId)`
- `TODAY_STR`: `lib/date-constants.ts`에서 동적 계산 (`new Date().toISOString().split('T')[0]`)
- `timeToSlot()`: `components/calendar/calendar-utils.ts`에서 import

---

## 4. 일정 탭 (`/tracks/[id]/schedule`)

### 4.1 페이지 목적

운영매니저가 트랙 전체의 일정(운영일정, 커리큘럼, 챕터)과 업무를 캘린더로 조회하고, 운영일정/기간Task를 생성하는 페이지.

### 4.2 라우트 파일 (`schedule/page.tsx`)

`'use client'` — 클라이언트 컴포넌트로 직접 렌더링.

주요 import:
- `SharedCalendar` from `components/calendar`
- `TrackScheduleCreateModal` from `components/track/track-schedule-create-modal`
- `TODAY` from `lib/date-constants`
- `timeToSlot` from `components/calendar/calendar-utils`
- `computeOverlapColumns` from `lib/grid-utils`

> **삭제된 import**: `ScheduleRightPanel`은 별도 컴포넌트가 아닌 같은 파일 내 `TrackScheduleRightPanel` 함수로 인라인 정의됨. 외부 import 없음.

### 4.3 레이아웃

```
┌──────────────────────────────────────────────────────────────────┐
├────────────────────────────────────┬─────────────────────────────┤
│  SharedCalendar (65%)              │  TrackScheduleRightPanel    │
│  (월간/주간 토글, 필터)             │  (35%)                      │
│                                    │                             │
│  월간: 셀 클릭 → 우측 패널 연동     │  2/11(화)  [+ 생성]          │
│  주간: 캘린더 100% (패널 숨김)      │  운영일정 섹션               │
│                                    │  일정 섹션 (커리큘럼 등)     │
│                                    │  기간 Task 섹션              │
│                                    │  시간 지정 업무 (학관별 그리드)│
│                                    │  시간 미지정 섹션             │
└────────────────────────────────────┴─────────────────────────────┘
```

- **월간 뷰**: 캘린더(`w-[65%]`) + 우측 패널(`w-[35%]`)
- **주간 뷰**: 캘린더(`w-full`), 우측 패널 숨김
- **생성 버튼**: 우측 패널 헤더(날짜 라벨 옆)에 `[+ 생성]` 버튼 → 통합 생성 모달 열림
- **날짜 선택**: `selectedDate` state, 기본값 `null` (→ `TODAY` fallback)

### 4.4 캘린더 (`SharedCalendar`)

`components/calendar/index.tsx`의 `SharedCalendar` 컴포넌트를 `trackId` prop으로 사용.
Staff 페이지와 동일한 캘린더이나 trackId 모드로 동작하여 트랙 전체 데이터를 통합 표시.

**`highlightScheduleId` prop**: 운영일정 생성 직후 해당 바에 ring glow 애니메이션(2.5초) 적용.

### 4.5 우측 패널 (`TrackScheduleRightPanel`)

> **인라인 정의**: `schedule/page.tsx` 파일 내부에 함수 컴포넌트로 정의됨 (별도 파일 없음).

선택된 날짜(또는 기본 오늘)의 일정/업무를 섹션별로 표시.

#### 섹션 구성 (위에서 아래)

| 섹션 | 데이터 소스 | 카드 스타일 | 담당자 표시 |
|------|-----------|-----------|-----------|
| 운영일정 | `schedules.filter(type === 'operation_period')` | violet 배경 (`bg-violet-500/[0.06]`) | — (일정이므로 없음) |
| 일정 | `schedules.filter(curriculum, track_event 등 — not personal)` | blue 배경 (`bg-blue-500/[0.06]`) | — |
| 기간 Task | `trackTasks.filter(endDate 존재 && endDate !== scheduledDate)` | 기본 카드 스타일 | 이름 텍스트 (미배정 시 "미배정") |
| 시간 지정 업무 | `pointTasks.filter(scheduledTime 존재)` | 학관별 미니 타임그리드 (`StaffTimeGrid`) | 컬럼 헤더가 학관명 |
| 시간 미지정 | `pointTasks.filter(scheduledTime 없음)` | 기본 카드 스타일 | 이름 텍스트 (미배정 시 "미배정") |

내용이 없으면: "이 날의 일정/업무가 없습니다" 표시.

#### 날짜 필터링 로직

- **일정(schedules)**: `s.trackId === trackId && dateStr >= s.startDate && dateStr <= s.endDate`
- **Task(trackTasks)**: 기간 Task는 `dateStr >= scheduledDate && dateStr <= endDate`, 일반 Task는 `scheduledDate === dateStr`

#### 시간 지정 업무 — 학관별 미니 타임그리드 (`StaffTimeGrid`)

```
┌──────────────────────────────────────┐
│  시간 지정 업무                        │
│  ┌──────┬──────────┬──────────┐      │
│  │      │  김학관   │  이학관   │      │
│  ├──────┼──────────┼──────────┤      │
│  │  09  │ ┌──────┐ │          │      │
│  │      │ │출석   │ │          │      │
│  │  10  │ └──────┘ │ ┌──────┐ │      │
│  │      │ ┌──────┐ │ │팀순회 │ │      │
│  │  11  │ │리포트 │ │ └──────┘ │      │
│  │      │ └──────┘ │          │      │
│  │  ... │          │          │      │
│  └──────┴──────────┴──────────┘      │
└──────────────────────────────────────┘
```

- 09:00~18:00, 30분 단위 (슬롯 높이 **18px** — `GRID_SLOT_H`)
- 학관별 컬럼, 업무가 있는 학관만 표시 + 미배정 컬럼(unassigned 있을 때)
- CSS Grid: `gridTemplateColumns: 32px repeat(N, 1fr)`
- **겹침 처리**: `computeOverlapColumns()` from `lib/grid-utils.ts`
- Task 카드 디자인: `rounded-[4px] border border-foreground/[0.08] bg-background shadow-[0_0.5px_2px_rgba(0,0,0,0.04)]`

### 4.6 통합 생성 모달 (`TrackScheduleCreateModal`)

**파일**: `components/track/track-schedule-create-modal.tsx`

상단에 **2개 탭**으로 구분:

#### 운영일정 탭

| 필드 | 필수 | 타입 |
|------|------|------|
| 제목 | 필수 | text |
| 시작일~종료일 | 필수 | date (2개) |
| 카테고리 | 선택 | select (강의/프로젝트/평가/행사/기타, 기본: 기타) |
| 설명 | 선택 | textarea |

- 생성 시: `addSchedule({ type: 'operation_period', source: 'manual', ... })`
- 생성 후: `onCreated('schedule', id)` → 캘린더에 해당 바가 하이라이트 애니메이션으로 등장
- 탭 색상: `border-violet-500 text-violet-700`

#### 기간 Task 탭

| 필드 | 필수 | 타입 |
|------|------|------|
| 제목 | 필수 | text |
| 시작일~종료일 | 필수 | date (2개) |
| 담당자 | 선택 | select (학관매 목록 + 미배정) |
| 시작시간/마감시간 | 선택 | time (2개) |
| 우선순위 | 선택 | button group (일반/중요/긴급) |
| 설명 | 선택 | textarea |

- 생성 시: `addTrackTask({ type: 'milestone', endDate: ..., ... })`
- 담당자 미선택 시 status: `unassigned`, 선택 시 `pending`
- 탭 색상: `border-foreground text-foreground`

#### 운영일정 vs 기간 Task 힌트

모달 내에 각 탭마다 설명 텍스트:
- 운영일정: "운영일정은 순수 일정으로, 완료/상태 처리 없이 캘린더에 표시됩니다."
- 기간 Task: "기간 Task는 담당자 배정, 상태 관리, 완료 처리가 가능한 업무입니다."

#### 종료일 보정

`endDate < startDate`이면 자동으로 `startDate`로 보정.

### 4.7 캘린더 하이라이트 애니메이션

운영일정 생성 후 캘린더의 시각적 피드백:

1. 모달 닫힘 → `highlightScheduleId` 상태 설정
2. `SharedCalendar`가 해당 ID의 종일 바에 `animate-calendar-highlight` 클래스 적용
3. CSS: `scaleX(0.92) → scaleX(1)` + `opacity(0) → opacity(1)` + `ring-2 ring-violet-400/60 shadow`
4. 2.5초 후 `highlightScheduleId`를 `null`로 해제 → 일반 스타일로 복귀

`tailwind.config.ts`에 `calendar-highlight` keyframe 정의.

---

## 5. 모달 연동

### TaskDetailModal (`task/task-detail-modal.tsx`)

- Task 행 클릭 시 열림
- `trackTaskToUnified()`로 변환 후 전달 (`task/task-adapter.ts`)
- 지원 액션:
  - 완료 처리 (`updateTrackTaskStatus → 'completed'`)
  - 확인 요청 (`→ 'pending_review'`)
  - 확인 취소 (`→ 'in_progress'`)
  - 상태 변경 (`onChangeStatus`)
  - 메시지 전송 (`addTaskMessage`)
  - 미루기 (`setDeferTarget → DeferModal`)
- `staffColor` prop으로 담당자 색상 전달
- `liveTask`: 모달 열린 동안 store에서 최신 데이터 반영

### NewTaskModal (`track/track-modals.tsx`)

- 필터 바의 "새 Task" 버튼으로 호출
- `trackId` + `staffList` 전달
- **중요도 선택**: 보통(기본) / 중요(Star, amber) / 긴급(Zap, red) 3버튼 토글. 생성 시 `priority` 필드에 반영 (`'normal'`이면 `undefined`)
- **완료 조건**: 단순 체크 / 증빙 필요 (`completionType`)

### TrackScheduleCreateModal (`track/track-schedule-create-modal.tsx`)

- 일정 탭의 "생성" 버튼으로 호출
- `trackId` + `staffList` 전달
- 운영일정/기간Task 2탭 구분

### DeferModal (`track/track-modals.tsx`)

- TaskDetailModal 내부에서 "미루기" 선택 시 열림
- 프리셋: 내일로, 다음주 월요일
- 기간 Task의 경우 원래 기간(duration)을 유지한 채 시작일 이동

### ReassignModalInline (`track/track-modals.tsx`)

- TaskDetailModal 내부에서 "재배정" 선택 시 열림
- 학관매 선택 + 새 예정일 지정

### ~~BulkAssignContent~~ (제거됨)

- 일괄 작업 기능은 필터 간소화 작업에서 제거됨 (`selectedIds`, `showBulkAssign`, `BulkDropdown` 모두 삭제)
- `track-modals.tsx`에 코드는 남아있으나 `track-task-sheet.tsx`에서 사용하지 않음

---

## 6. 데이터 흐름

```
useAdminStore (Single Source of Truth)
│
├── plannerTracks ────────── layout.tsx (트랙 헤더, 트랙명/기간/색상)
├── operatorTrackDetails ─── staffList (학관매 목록, 모든 탭에서 공유)
├── trackTasks ──┬─────────── Task 시트: allTrackTasks → 자동 상태 보정 → filteredTasks → Compact 행
│                ├─────────── 시간 그리드: todayTasksByStaff
│                └─────────── 일정 탭: dayTasks → 기간/시간지정/시간미지정 분류
├── schedules ───────────── SharedCalendar (trackId 모드) + TrackScheduleRightPanel
├── staffCards ──────────── staffVacationMap (휴가 정보)
│
├── assignTask() ────────── 미배정 배정 (드롭다운/즉시)
├── updateTrackTaskStatus() ── [완료] 버튼, 상태 변경
├── deferTask() ─────────── 미루기
├── reassignTask() ─────── 재배정
├── addTrackTask() ─────── 새 Task 생성 (NewTaskModal, TrackScheduleCreateModal)
├── addSchedule() ──────── 운영일정 생성 (일정 탭)
├── addTaskMessage() ───── Task 내 메시지 전송
└── setStaffVacation() ──── 휴가 → 미배정 자동 전환
```

### 주요 유틸리티

| 유틸리티 | 파일 | 용도 |
|---------|------|------|
| `TODAY_STR`, `TODAY` | `lib/date-constants.ts` | 동적 날짜 기준 |
| `getWeekRange()`, `getMonthRange()` | `lib/date-constants.ts` | 기간 필터 범위 계산 |
| `computeOverlapColumns()` | `lib/grid-utils.ts` | 시간 그리드 겹침 처리 |
| `timeToSlot()` | `components/calendar/calendar-utils.ts` | 시간 → 슬롯 인덱스 변환 |
| `trackTaskToUnified()` | `components/task/task-adapter.ts` | TrackTask → UnifiedTask 변환 |
| `STAFF_COLORS`, `getStaffColor()` | `components/track/track-utils.ts` | 학관매 색상 팔레트 |

---

## 7. CompactCard 확장 Props (`task/task-card.tsx`)

기존 학관 페이지에서 사용하는 compact variant를 확장하여 트랙 Task 시트에서 사용.

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `showAssignee` | `boolean` | `false` | 담당자 컬러dot+이름 표시 (미배정이면 "배정"/"미배정") |
| `showSource` | `boolean` | `false` | SourceBadge 표시 |
| `showMeta` | `boolean` | `false` | 메시지 카운트 아이콘 (제목 옆 inline 표시) |
| `showApprove` | `boolean` | `false` | 확인 필요 task에 [완료] 버튼 표시 |
| `onApprove` | `(taskId) => void` | — | [완료] 버튼 클릭 핸들러 |
| `assignableStaff` | `{id,name,color}[]` | — | 담당자 (재)배정 드롭다운 후보. 미배정/배정 모두 사용 |
| `onAssign` | `(taskId,staffId,name) => void` | — | 배정 드롭다운 선택 핸들러 |
| `staffColor` | `string \| null` | — | 담당자 도트 색상 |
| `showDate` | `boolean` | `false` | 날짜 표시 (Task 시트에서는 미사용) |
| `showCheckbox` | `boolean` | `false` | 체크박스 표시 (학관 페이지용) |
| `showTrack` | `boolean` | `false` | 트랙 태그 표시 (총괄 페이지용) |

기존 props (`showCheckbox`, `onCheck`, `showTrack` 등)는 학관 페이지에서 그대로 사용.
확장 props가 없으면 기존 compact 동작과 동일 (하위호환).

`hasExtendedCols = showAssignee || showSource || showMeta` → true이면 7열 레이아웃, false이면 기본 compact 레이아웃.

---

## 8. 미결정 / TODO

- [ ] Task 시트에서 인라인 상태 변경 드롭다운 (행 hover 시 상태 빠른 전환)
- [ ] Task 시트 페이지네이션 또는 가상 스크롤 (대량 task 시 성능)
- [ ] 학관별 시간 그리드에서 task 클릭 시 TaskDetailModal 연동
- [ ] 소스 열 너비 불일치 정리 (`task-card.tsx` w-[56px] → w-[48px] 통일)
- [ ] 소통 탭 독립 페이지화
- [x] 일정 탭 독립 페이지화 (`/tracks/[id]/schedule`)
- [x] 날짜 필터 "날짜 선택..." (date input)
- [x] 필터 바 간소화 (확인필요만/운영일정/일괄작업 제거)
- [x] 상태/중요도 필터 2차원 분리 (독립 축으로 AND 교차)
- [x] Task 생성 모달에 중요도 선택 추가
- [x] 일정 탭 생성 버튼 우측 패널 헤더로 이동
- [x] 담당자 드롭다운 — 배정/재배정 통합 (완료 task 잠금)
- [x] CompactCard 기간 태그 (제목 오른쪽 inline)
- [x] TODAY_STR 동적 계산으로 전환 (`lib/date-constants.ts`)
- [x] 겹침 처리 알고리즘 공유 모듈 분리 (`lib/grid-utils.ts`)
- [x] ScheduleRightPanel 인라인화 (dead import 제거)
- [x] 상태 문자열 underscore 통일 (`in_progress`, `pending_review`)
