# EduWorks (Track Dashboard) — 프로젝트 컨텍스트

> 이 문서는 프로젝트의 목적, 구조, 설계 결정을 정리한 것입니다.
> 새로 합류하는 사람이나 AI 에이전트가 맥락을 빠르게 파악할 수 있도록 작성되었습니다.
> 최종 갱신: 2026-02-28

---

## 1. 프로젝트 목적

**학습 트랙 운영 관리 대시보드 시스템**

교육 프로그램(트랙)의 운영을 체계화하여:
- **학관 표준화**: 미리 정의된 Task를 자동 배정하여, 학관이 교체되어도 운영 품질 일관성 유지
- **총괄 리소스 절감**: 업무완료율·이슈처리율·운영매 완료율 3가지 지표만으로 트랙 상태 파악

---

## 2. 사용자 역할 (3+1)

| 역할 키 | 풀네임 | 줄임말 | 고용형태 | 설명 |
|---------|--------|--------|----------|------|
| `operator_manager` | 운영기획매니저 | 총괄 | 정규직 | 4~5개 트랙 총괄. 운영매니저만 직접 관리 |
| `operator` | 운영매니저 | 운영 | 계약직 | 학관을 직접 관리. 트랙 운영 실무 |
| `learning_manager` | 학습관리매니저 | 학관 | 알바 | 수강생과 직접 소통하며 일일 Task 수행 |
| `tutor` | 튜터 | 튜터 | 선택 | 트랙에 따라 배정 여부 상이 |

역할 라벨은 **`lib/role-labels.ts` 한 곳에서 관리**. `ROLE_LABELS`(줄임말), `ROLE_LABELS_FULL`(풀네임)만 수정하면 전체 반영.

### 핵심 원칙
- 총괄은 운영만 관리, 운영은 학관을 관리하는 **위임 구조**
- 총괄은 3가지 지표만으로 트랙 상태 파악
- 트랙 생성 시 시스템이 자동으로 Task를 배정

---

## 3. 조직 구조

```
총괄 1명
 └─ 운영 3명
     └─ 학관 9명 (각 운영당 3명)
```

역할별 라우트 매핑:
- 총괄 → `/managers/mgr1`
- 운영 → `/operators/op1`
- 학관 → `/staff/staff1`

---

## 4. 기술 스택

| 카테고리 | 기술 | 버전 |
|---------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 |
| UI | React | 19 |
| 언어 | TypeScript | 5.7.3 |
| 상태관리 | Zustand | 5.0.11 |
| 스타일링 | Tailwind CSS + shadcn/ui | 3.4.x |
| DnD | @hello-pangea/dnd | 17.0.0 |
| 엑셀 파싱 | SheetJS (xlsx) | 0.18.5 |
| 날짜 | date-fns | 4.1 |
| 토스트 | Sonner | 1.7.x |
| 패키지 매니저 | pnpm | — |

---

## 5. 디자인 원칙

- **무채색 중심의 미니멀 admin 디자인** (색상은 트랙 color 태그 정도만 허용)
- shadcn/ui 컴포넌트 기반, `bg-foreground/[0.0x]` 패턴
- 모든 데이터는 현재 **mock 데이터** 사용
- 텍스트: 타이틀 `text-lg~xl`, 본문 `text-sm`, 라벨 `text-[11px]`, 태그 `text-[9px]`

---

## 6. 디렉토리 구조

> 레거시 파일은 정리 완료. 아래는 현재 활성 파일 기준.

```
app/
  page.tsx                         # 역할별 자동 리다이렉트
  layout.tsx                       # RootLayout (AppShell + FloatingCommWidget + Toaster)
  tracks/[id]/
    layout.tsx                     # 공통 헤더 + 네비게이션 탭 (Task/일정)
    page.tsx                       # → /tracks/[id]/tasks로 redirect
    tasks/page.tsx                 # Task 시트 (TrackTaskSheet)
    schedule/page.tsx              # 일정 탭 (SharedCalendar + 우측 패널)
  staff/[id]/page.tsx              # 학관 대시보드
  managers/[id]/page.tsx           # 총괄 대시보드
  operators/[id]/page.tsx          # 운영 대시보드
  admin/
    page.tsx                       # 시스템 관리 홈
    tracks/new/page.tsx            # 트랙 생성 위저드
    tracks/[id]/edit/page.tsx      # 트랙 편집
    tracks/edit/page.tsx           # 트랙 편집 (목록)
    notifications/page.tsx         # 알림 설정
  debug/tasks/page.tsx             # 디버그: Task 목록

components/
  layout/
    app-shell.tsx                  # 전체 레이아웃 (h-screen flex column)
    app-sidebar.tsx                # 역할별 사이드바 (3개 메뉴 컴포넌트)
    debug-role-switcher.tsx        # 오렌지 디버그 역할 전환 바
  task/
    task-types.ts                  # UnifiedTask 인터페이스 (22속성), enum, config
    task-card.tsx                  # TaskCard (compact/card variant)
    task-detail-modal.tsx          # TaskDetailModal (상세/채팅/상태변경)
    task-adapter.ts                # TrackTask → UnifiedTask 변환 어댑터
    task-badges.tsx                # StatusBadge, PriorityBadge, SourceBadge
  schedule/
    schedule-types.ts              # UnifiedSchedule 인터페이스 (13속성)
  calendar/
    calendar-types.ts              # 공통 타입/상수 (SpanBar, FilterKey, LAYER_STYLES)
    calendar-utils.ts              # 유틸 (timeToSlot, computeAllDayBars, getWeekStart)
    month-view.tsx                 # 월간 뷰
    week-view.tsx                  # 주간 뷰
    all-day-bar.tsx                # 종일 바 렌더러
    legend-toggle.tsx              # 범례 필터 토글
    index.tsx                      # SharedCalendar 메인 (highlightScheduleId prop)
  dashboard/
    header.tsx                     # 학관 탭 헤더 (업무/일정/면담 + 날짜 네비게이션)
    time-panel.tsx                 # 시간 지정 업무 (좌 25%)
    today-panel.tsx                # 업무 리스트 (좌 25%)
    comm-channel.tsx               # 소통 채널 (우 50%) — 학관 전용
    week-calendar.tsx              # SharedCalendar re-export 래퍼
    schedule-right-panel.tsx       # 일정 탭 우측 패널 (기간 할 일 + 미니 시간 그리드)
  comm/
    floating-comm-widget.tsx       # 글로벌 플로팅 소통 위젯 (총괄/운영 전용)
  manager/
    manager-dashboard-home.tsx     # 총괄 진입점 (role='operator_manager')
    manager-overview.tsx           # 메인 페이지 (총괄/운영 공용, role prop 분기)
    manager-sidebar.tsx            # 총괄 사이드바
    track-health-section.tsx       # 트랙 건강도 (30일 스파크라인)
    track-stats-section.tsx        # 트랙별 현황 카드 (가로 배열)
    track-action-section.tsx       # 트랙별 할 일 (3컬럼 토글 카드)
    track-action-card.tsx          # 공통 토글 카드
    my-task-section.tsx            # 내가 할 일 (UnifiedTask 기반)
  operator/
    operator-dashboard-home.tsx    # 운영 진입점 (role='operator')
  interview/
    team-round-panel.tsx           # 팀 순회 패널
    student-log-panel.tsx          # 수강생 로그 패널
  track/
    track-modals.tsx               # 트랙 관련 모달
    track-task-sheet.tsx           # Task 시트 (2-column)
    track-task-card.tsx            # 트랙 Task 카드
    track-schedule-create-modal.tsx # 운영일정/기간Task 통합 생성 모달
    track-utils.ts                 # 트랙 유틸리티
  track-creation/
    track-creation-wizard.tsx      # 8단계 위저드 메인
    step-basic-info.tsx            # Step 1: 기본 정보
    step-timetable-upload.tsx      # Step 2: 시간표 업로드
    step-chapter-builder.tsx       # Step 3: 챕터 편성
    step-staff-assignment.tsx      # Step 4: 인원 배정
    step-task-generation.tsx       # Step 5: Task 생성 (시작시간+소요시간, 섹션별 생성 예상 수, parsedSchedule 폴백)
    step-task-assignment.tsx       # Step 6: 담당자 배정 (daily/weekly/ad_hoc, 배정 모드 미니 시각화)
    step-task-review.tsx           # Step 7: Task 확인
    step-final-confirmation.tsx    # Step 8: 최종 확인
  ui/                              # shadcn/ui 컴포넌트 (46개+)

lib/
  role-store.ts                    # useRoleStore (역할 상태), ROLE_HOME, ROLE_USER_NAME, ROLE_USER_MAP
  role-labels.ts                   # ROLE_LABELS, ROLE_LABELS_FULL (역할 라벨 Single Source of Truth)
  admin-mock-data.ts               # 대시보드용 mock 데이터 + 타입 정의
  admin-store.ts                   # useAdminStore (Zustand 전역 — Single Source of Truth)
  date-constants.ts                # TODAY_STR, TODAY, getWeekRange, getMonthRange
  grid-utils.ts                    # computeOverlapColumns (겹침 처리 알고리즘)
  track-creation-types.ts          # 위저드 관련 타입 정의
  task-templates.ts                # 63개 Task 템플릿 + 태그 분류 시스템
  task-generator.ts                # Task 자동 생성 로직
  xlsx-parser.ts                   # 정부용 시간표 엑셀 파싱
  track-edit-utils.ts              # 트랙 편집 유틸 (buildTrackCreationData, inferAssignments)
  interview-mock-data.ts           # 면담 mock 데이터
  interview-store.ts               # 면담 스토어
  types.ts                         # 공통 타입
  utils.ts                         # cn() 등 유틸
  hooks/
    use-staff-dashboard.ts         # 학관 대시보드 데이터 hook (targetDate, UnifiedSchedule 필터)
    use-name-lookup.ts             # ID → 이름 조회 유틸리티 (plannerTracks 기반)

docs/
  PROJECT_CONTEXT.md               # 이 문서
  CONTEXT_GRAPH.md                 # 라우트-문서 매핑 그래프 + 컴포넌트 디렉토리 맵
  TASK_MODEL.md                    # UnifiedTask(22속성) + UnifiedSchedule(13속성) 모델 정의
  NOTIFICATION_POLICY.md           # 알림 시스템 정책 (역할별 라우팅, 에스컬레이션, 긴급 처리)
  APP_INFRA.md                     # 인프라/공통 컴포넌트 정책
  pages/
    STAFF_PAGE.md                  # /staff/[id] 페이지 정책
    TRACK_PAGE.md                  # /tracks/[id] 페이지 정책
    MANAGER_PAGE.md                # /managers/[id] 페이지 정책
    COMM_WIDGET.md                 # 글로벌 소통 위젯 정책
```

---

## 7. 데이터 모델 요약

### UnifiedTask (22 필드)

모든 "업무" 엔티티를 통합한 단일 모델. 정의: `components/task/task-types.ts`

| 그룹 | 필드 |
|------|------|
| 식별 | `id`, `templateId?`, `trackId` |
| 내용 | `title`, `description?`, `category`, `subcategory?`, `output?`, `attachments?` |
| 출처 | `source` (system/request_sent/request_received/self), `creatorId?`, `createdAt` |
| 배정 | `assigneeId?`, `reviewerId?` |
| 일정 | `startDate`, `endDate?`, `startTime?`, `endTime?` |
| 상태 | `priority` (urgent/important/normal), `status` (pending/in_progress/pending_review/completed), `completedAt?` |
| 소통 | `messages[]` |

### UnifiedSchedule (13 필드)

모든 "일정" 엔티티를 통합한 단일 모델. 정의: `components/schedule/schedule-types.ts`

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | ScheduleType | chapter / curriculum / operation_period / track_event / personal |
| `source` | ScheduleSource | system / manual |
| 나머지 | — | id, title, startDate, endDate, startTime?, endTime?, trackId?, creatorId?, description?, category?, createdAt |

> 상세 정의는 `docs/TASK_MODEL.md` 참조.

---

## 8. Store 구조

### useAdminStore (`lib/admin-store.ts`) — Single Source of Truth

| 상태 | 설명 |
|------|------|
| `plannerTracks` | 트랙 목록 (PlannerTrackCard[]) |
| `trackTasks` | 트랙별 Task (Record<string, TrackTask[]>) |
| `managerTasks` | 총괄/운영매 개인 업무 (UnifiedTask[], trackId: '_manager') |
| `schedules` | 모든 일정 (UnifiedSchedule[] 단일 배열) |
| `notifications` | 알림 (AppNotification[]) — `NOTIFICATION_POLICY.md` 참조 |
| `notificationConfigs` | 트랙별 알림 설정 (임계치, 에스컬레이션, 수신 모드). 역할별 설정 권한 차등 적용 |
| `commNotifications` | 소통 위젯 시스템 알림 (CommSystemNotification[]) |
| `commMessages` | 소통 위젯 채팅 메시지 (Record: channelId to CommMessage[]) |
| `commStickies` | Sticky 메모 (Record: channelId to StickyNotice) |
| `staffConversations` | 운영-학관 대화 |
| `trackNotices` | 트랙 공지 |

주요 액션: `addManagerTask()`, `updateManagerTaskStatus()`, `addSchedule()`, `addNotification()`, `addCommMessage()`, `updateStickyNote()`, `createTrack()`

### useRoleStore (`lib/role-store.ts`) — 역할 상태

| 상수 | 설명 |
|------|------|
| `currentRole` | 현재 역할 (debug 전환용) |
| `ROLE_HOME` | 역할 → 홈 경로 매핑 |
| `ROLE_USER_NAME` | 역할 → 사용자 이름 매핑 |
| `ROLE_USER_MAP` | 역할 → 사용자 ID 매핑 |

### useInterviewStore (`lib/interview-store.ts`) — 면담

면담 탭 전용 상태. 수강생 목록, 순회 체크, 수강생 로그 관리.

### 삭제된 Store

- ~~`useDashboardStore`~~ (`lib/store.ts`) — 학관 전용 Store는 useAdminStore로 통합됨.

---

## 9. 설계 결정 히스토리

### 트랙 대시보드 탭 제거 → Task 탭이 기본 랜딩

- `/tracks/[id]` 접근 시 `/tracks/[id]/tasks`로 자동 redirect
- 대시보드 탭은 Task 탭과 기능 중복으로 제거
- 네비게이션 탭: Task / 일정 (2개만 유지)
- 기존 `track-detail.tsx`는 deprecated

### 소통 기능 → 글로벌 플로팅 위젯으로 이전

- 트랙 소통 탭을 제거하고 `FloatingCommWidget`을 `app/layout.tsx`에 마운트
- 학관은 대시보드 자체 `comm-channel.tsx` 사용 (위젯 자동 숨김)
- 채널톡/Intercom 스타일, 알림+1:1채팅+sticky메모+task스레드 통합

### `in-progress` → `in_progress` 통일

- TrackTask의 `'in-progress'` (하이픈)와 UnifiedTask의 `'in_progress'` (언더스코어)가 혼재
- 새 코드에서는 `in_progress`로 통일

### TODAY_STR 중앙화 → `lib/date-constants.ts`

- `TODAY_STR = new Date().toISOString().split('T')[0]` — 동적 오늘 날짜
- `TODAY` — 9시 기준 Date 객체
- `getWeekRange()`, `getMonthRange()` 유틸 함수 제공
- 기존 하드코딩된 `'2026-02-11'` 상수를 대체

### 공유 유틸 추출 → `lib/grid-utils.ts`

- `computeOverlapColumns()` — 시간 겹침 처리 알고리즘
- 학관 대시보드, 트랙 일정 패널, 주간 캘린더에서 공통 사용

### 캘린더 컴포넌트화

- 750줄 단일 파일(`week-calendar.tsx`)을 `components/calendar/` 디렉토리로 분리
- `SharedCalendar`에 `highlightScheduleId` prop 추가
- 기존 import 호환을 위해 `week-calendar.tsx`는 re-export 래퍼로 유지

### 총괄/운영매 대시보드 공용화

- 4탭 구조 → 탭 없는 단일 스크롤 페이지로 전면 재설계
- `ManagerOverview` 컴포넌트를 `role` prop으로 총괄/운영 공유
- 코드 중복 제거, 데이터만 역할 범위로 필터링

### 알림 설정 역할별 권한 차등

- `isMandatory` 필드 제거 — 모든 알림을 ON/OFF 가능하게 변경
- 총괄: 모든 설정 수정 가능 (에스컬레이션 포함)
- 운영매: 본인 수신 알림만 토글/임계치 수정 가능, 에스컬레이션은 읽기 전용
- 학관: 설정 페이지 접근 불가
- 상세: `docs/NOTIFICATION_POLICY.md` Section 10 참조

### 트랙 생성 위저드 UX 개선

**Step 5 (Task 생성)**:
- 6개 섹션을 한 페이지에 리스트 형태로 표시. 체크박스로 Task 활성/비활성, 인라인 설정 컨트롤
- 매일 반복 업무: **시작 시간 + 소요 시간** 패턴 (TimeRangeSelect = TimeSelect + DurationSelect)
  - 시작 시간: 08:00~19:00, 30분 단위 (23개 옵션) 또는 "시간 미지정"
  - 소요 시간: 30분~3시간, 30분 단위 (6개 옵션, 기본 1시간)
  - 시작 시간 미지정이면 소요 시간 드롭다운 숨김
  - 종료 시간은 시작+소요로 자동 계산하여 읽기 전용 표시 (`~10:00`)
  - endTime은 `RecurrenceConfig.endTime`에 자동 저장
- 수시(ad_hoc) 업무의 매일 모드에서도 동일한 시작+소요 시간 패턴 적용
- 섹션별 생성 예상 수 표시 ("→ 약 1,300개 생성"). 트랙 기간 기반 실시간 계산
- 챕터별/월간/1회성 섹션에 "트랙 운영 시작 후 배정" 안내문
- parsedSchedule 없이도 기본 3개월 기간으로 Task 생성 가능 (폴백 함수)

**Step 6 (담당자 배정)**:
- daily/weekly/ad_hoc 3개 섹션 배정 가능
- 4가지 모드 카드(전원이 각자/돌아가면서/한 명 지정/나중에 배정)에 학관 데이터 기반 미니 시각화
- **상단 카드 = 일괄 설정** (클릭하면 모든 항목을 해당 모드로 변경)
- **하단 각 행의 드롭다운 = 개별 커스터마이징** (항목마다 다른 모드 선택 가능)
- 개별 항목이 서로 다른 모드면 상단 카드는 **"커스터마이징 중"** 배너 표시 + 카드 선택 해제
- "한 명 지정" 모드: 상단에서 기본 담당자 선택 시 이미 개별 지정된 항목은 보존
- 행별 왼쪽 드롭다운 = 모드(전원/순환/지정/미배정), 오른쪽 드롭다운 = 담당자(지정 모드일 때만)

**트랙 수정 (edit 모드)**:
- `app/admin/tracks/[id]/edit/page.tsx` → 동일한 `TrackCreationWizard`를 `mode="edit"` + `initialData`로 사용
- `lib/track-edit-utils.ts`의 `buildTrackCreationData()`가 기존 트랙 데이터를 위저드 형식으로 변환
- `recurrenceConfigs`에 기존 Task의 `endTime`(dueTime) 포함 → `buildInitialStates`에서 `duration` 자동 역산
- `inferAssignments()`가 기존 Task의 assigneeId 패턴으로 배정 모드(all/rotation/specific/unassigned)를 추론

**알림 설정** (`/admin/notifications`):
- 역할별 권한: 총괄=전체 수정, 운영매=본인 수신 알림만, 학관=접근 불가
- 에스컬레이션 설정: 총괄만 수정 가능 (운영매는 읽기 전용)
- `isMandatory` 제거 — 모든 알림 ON/OFF 가능
- 상세: `docs/NOTIFICATION_POLICY.md` 참조

**공통**:
- 건너뛰기 버튼 제거 (프로덕션 레벨 — 각 단계를 순서대로 완료해야 진행)

---

## 10. 라우트 구조

페이지는 **"대상 엔티티"** 기준으로 존재한다 (역할 기반이 아님).

| 경로 | 엔티티 | 비고 |
|------|--------|------|
| `/` | — | 역할별 자동 리다이렉트 |
| `/tracks/[id]` | 트랙 | → `/tracks/[id]/tasks` redirect |
| `/tracks/[id]/tasks` | 트랙 | Task 시트 (2-column) |
| `/tracks/[id]/schedule` | 트랙 | 일정 탭 (캘린더 + 생성) |
| `/managers/[id]` | 총괄 | 총괄 대시보드 |
| `/operators/[id]` | 운영매 | 운영 대시보드 |
| `/staff/[id]` | 학관 | 학관 대시보드 (3탭: 업무/일정/면담) |
| `/admin` | 시스템 | 관리 메뉴 |
| `/admin/tracks/new` | 시스템 | 트랙 생성 위저드 (8단계) |

### 열람 권한

| 페이지 | 총괄 | 운영 | 학관 |
|--------|:----:|:----:|:----:|
| `/tracks/[id]` | 모든 트랙 | 담당 트랙만 | — |
| `/managers/[id]` | 본인 | — | — |
| `/operators/[id]` | 담당 운영매 | 본인만 | — |
| `/staff/[id]` | 담당 학관 | 담당 학관 | 본인만 |
| `/admin` | O | O | — |
| `/admin/tracks/new` | O | — | — |
