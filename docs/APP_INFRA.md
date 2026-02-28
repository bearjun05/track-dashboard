# EduWorks — 인프라 및 공통 컴포넌트 정책

> 앱 전반의 레이아웃, 역할 시스템, 공유 유틸리티, 글로벌 마운트 정책을 정리한 문서.
> 최종 갱신: 2026-02-28

---

## 1. AppShell (`components/layout/app-shell.tsx`)

전체 앱 레이아웃을 구성하는 최상위 쉘 컴포넌트.

### 1.1 레이아웃 구조

```
┌─────────────────────────────────────────────────┐
│ DebugRoleSwitcher (h-8, 상단 고정)                │
├────────────┬────────────────────────────────────┤
│ AppSidebar │  main (flex-1, overflow-y-auto)    │
│ (조건부)    │  {children}                        │
└────────────┴────────────────────────────────────┘
```

- 컨테이너: `h-screen flex flex-col`
- `DebugRoleSwitcher`가 최상단에 고정 (개발용)
- 그 아래 `flex min-h-0 flex-1`로 사이드바 + 콘텐츠 영역 수평 배치

### 1.2 역할별 사이드바 표시

| 역할 | 사이드바 | 비고 |
|------|:--------:|------|
| `operator_manager` (총괄) | O | 전체 메뉴 표시 |
| `operator` (운영) | O | 담당 트랙만 표시 |
| `learning_manager` (학관) | **X** | 사이드바 숨김 — 전체 너비 사용 |

```typescript
const showSidebar = currentRole !== 'learning_manager'
```

### 1.3 모바일 반응형 (lg breakpoint)

- `useIsLg()` 커스텀 훅: `window.matchMedia('(min-width: 1024px)')` 기반
- **데스크톱** (≥1024px): 사이드바 인라인 표시
- **모바일** (<1024px):
  - 사이드바 숨김, 상단에 모바일 바 표시 (햄버거 `Menu` 아이콘 + "EduWorks" 텍스트)
  - 햄버거 클릭 → 오버레이 사이드바 (`fixed inset-y-0 left-0 z-50`)
  - 배경 딤처리 (`bg-black/40`)
  - ESC 키로 닫기 지원

---

## 2. AppSidebar (`components/layout/app-sidebar.tsx`)

역할에 따라 다른 메뉴를 렌더링하는 글로벌 사이드바.

### 2.1 접기/펼치기

| 상태 | 너비 | 표시 |
|------|------|------|
| 펼침 | **240px** | 아이콘 + 라벨 + 뱃지 |
| 접힘 | **52px** | 아이콘만 (Tooltip으로 라벨 대체) |

- 헤더 영역 `PanelLeftClose` / `PanelLeftOpen` 아이콘 버튼으로 토글
- 접힌 상태에서 모든 메뉴 항목에 `Tooltip` (side="right") 표시

### 2.2 구조

```
┌────────────────────┐
│ Header (h-14)      │  "EduWorks" 로고 + 접기/펼치기 버튼
├────────────────────┤
│ Nav (flex-1)       │  역할별 메뉴 컴포넌트
│  - ManagerMenu     │
│  - OperatorMenu    │
│  - LearningMgrMenu │
├────────────────────┤
│ Footer             │  시스템 관리 + 사용자 정보
└────────────────────┘
```

- 배경: `bg-background` (기존 `bg-card`에서 변경)
- 보더: `border-foreground/[0.06]` (얇고 은은한 구분선)
- 컴포넌트: `NavItem` (공통 메뉴 항목), `TrackItem` (트랙 전용), `PersonLink` (인원 링크)

### 2.3 총괄 메뉴 (`ManagerMenu`)

| 구역 | 메뉴 항목 | 경로 |
|------|----------|------|
| 상단 | 대시보드 | `/managers/mgr1` |
| 담당 트랙 | 각 트랙 (색상dot + 이름 + 완료율%) | `/tracks/{trackId}` |
| └ 운영매 | PersonLink (아바타 + 이름 + "운영" + 완료율%) | `/operators/{opId}` |
| └ 학관 | PersonLink (아바타 + 이름 + 완료율%) | `/staff/{staffId}` |

- 트랙별 색상 dot (`track.color`)
- **하위 인원은 해당 트랙이 활성(pathname 매칭)일 때만 펼쳐짐** (기존 토글 버튼 방식 → 자동 펼침/접힘으로 간소화)
- 학관 섹션 헤더: Users 아이콘 + "학관 N명" 라벨 (기존 ChevronDown 토글 제거)
- **학관 완료율 표시**: `staff[].taskCompletionRate`를 PersonLink에 전달하여 이름 옆에 `N%` 표시
- **완료율 호버 툴팁**: 숫자 위에 마우스를 올리면 "업무완료율 N%" Tooltip 표시
- active 상태: 좌측 3px 검정 바 인디케이터 + `bg-foreground/[0.06]`

### 2.4 운영 메뉴 (`OperatorMenu`)

| 구역 | 메뉴 항목 | 경로 |
|------|----------|------|
| 상단 | 대시보드 | `/operators/op1` |
| 담당 트랙 | 담당 트랙만 (색상dot + 이름 + 완료율%) | `/tracks/{trackId}` |
| └ 학관 | PersonLink (아바타 + 이름 + 완료율%) | `/staff/{staffId}` |

- `plannerTracks.filter(t.operator?.name === '이운영')`으로 담당 트랙만 필터
- 학관 목록은 트랙 활성 시 자동 펼침
- 학관 완료율 + 호버 툴팁 (총괄 메뉴와 동일)

### 2.5 학관 메뉴 (`LearningManagerMenu`)

| 메뉴 | 아이콘 | 경로 |
|------|--------|------|
| 오늘 할 일 | `ClipboardList` | `/staff/staff1` |
| 면담 관리 | `Mic` | `/staff/staff1?tab=interview` |

- 메뉴 2개뿐 (사이드바 자체가 숨겨져 있으므로 실질적으로 미사용)

### 2.6 Footer

- **시스템 관리**: `Settings` 아이콘, `/admin` 경로 (학관 제외)
- **사용자 정보**: 이니셜 아바타 (원형, `bg-foreground/10`) + 이름 + 역할 라벨
- 접힌 상태: Tooltip으로 이름·역할 표시

---

## 3. 역할 시스템

### 3.1 useRoleStore (`lib/role-store.ts`)

```typescript
type AppRole = 'operator_manager' | 'operator' | 'learning_manager'

// Zustand store
currentRole: AppRole           // 현재 선택된 역할
setRole(role: AppRole): void   // 역할 변경
```

| 상수 | 타입 | 내용 |
|------|------|------|
| `ROLE_HOME` | `Record<AppRole, string>` | 역할 → 홈 경로 (`operator_manager → '/managers/mgr1'`) |
| `ROLE_USER_NAME` | `Record<AppRole, string>` | 역할 → 사용자 이름 (`operator_manager → '박총괄'`) |
| `ROLE_USER_MAP` | `Record<AppRole, string>` | 역할 → 사용자 ID (`operator_manager → 'mgr1'`) |

### 3.2 역할 라벨 (`lib/role-labels.ts`)

```typescript
type RoleKey = 'operator_manager' | 'operator' | 'learning_manager' | 'tutor'

ROLE_LABELS: Record<string, string>       // 줄임말: 총괄, 운영, 학관, 튜터
ROLE_LABELS_FULL: Record<string, string>  // 풀네임: 운영기획매니저, 운영매니저, ...

type RequesterRole = '총괄' | '운영' | '학관'
```

역할 이름이 바뀌면 이 파일만 수정하면 전체 반영 (Single Source of Truth).

### 3.3 역할별 리다이렉트 (`app/page.tsx`)

```typescript
const ROLE_DEFAULT_PATH = {
  operator_manager: '/managers/mgr1',
  operator: '/operators/op1',
  learning_manager: '/staff/staff1',
}
// useEffect에서 router.replace(path) 호출
```

- 루트 `/` 접근 시 현재 역할의 홈으로 자동 리다이렉트
- `useRoleStore().currentRole` 기반

---

## 4. DebugRoleSwitcher (`components/layout/debug-role-switcher.tsx`)

개발/데모용 역할 전환 바. 프로덕션에서는 제거 예정.

### 4.1 UI

```
┌──────────────────────────────────────────────────────────────┐
│ 🪲 DEBUG | [총괄] [운영] [학관]          역할 전환 시 해당 홈으로 이동 │
└──────────────────────────────────────────────────────────────┘
```

- 높이: `h-8` (32px)
- 배경: `bg-orange-50`, 테두리: `border-dashed border-orange-300/60`
- 3개 역할 버튼 가로 배치
- 활성 버튼: `bg-orange-600 text-white`
- 비활성: `text-orange-700 hover:bg-orange-200/60`
- 우측 안내 텍스트: `text-[10px] text-orange-400`

### 4.2 동작

1. 버튼 클릭 → `setRole(role)` (Zustand 상태 변경)
2. `router.push(ROLE_HOME[role])` → 해당 역할의 홈 페이지로 이동
3. AppShell이 `currentRole` 변경을 감지하여 사이드바 표시/숨김 자동 전환

---

## 5. 공유 상수 / 유틸리티

### 5.1 날짜 상수 (`lib/date-constants.ts`)

| 내보내기 | 타입 | 설명 |
|---------|------|------|
| `TODAY_STR` | `string` | 오늘 날짜 (YYYY-MM-DD), `new Date().toISOString().split('T')[0]` |
| `TODAY` | `Date` | 오늘 9시 기준 Date 객체 |
| `getWeekRange(todayStr?)` | `[string, string]` | 월~일 주간 범위 반환 |
| `getMonthRange(todayStr?)` | `[string, string]` | 월초~월말 범위 반환 |

### 5.2 겹침 처리 알고리즘 (`lib/grid-utils.ts`)

```typescript
interface OverlapPlacement { col: number; groupSize: number }

function computeOverlapColumns(
  items: readonly { slot: number; endSlot: number }[]
): OverlapPlacement[]
```

- 시간 슬롯 기반으로 겹치는 항목들의 **컬럼 인덱스**와 **그룹 크기** 계산
- 결과를 `width: (1/groupSize)*100%`, `left: (col/groupSize)*100%`로 CSS 배치에 사용
- **사용처**: 학관 대시보드 시간 패널, 트랙 일정 탭 우측 패널, 주간 캘린더 시간 그리드, 일정 탭 학관별 미니 타임그리드

### 5.3 캘린더 유틸 (`components/calendar/calendar-utils.ts`)

| 함수 | 설명 |
|------|------|
| `timeToSlot(time, hourStart?, hourEnd?)` | "HH:mm" → 슬롯 인덱스 변환 |
| `computeAllDayBars(chapters, curricula, opPeriods, periodTasks, weekDays)` | 종일 바 위치 계산 (SpanBar[]) |
| `getWeekStart(date)` | 해당 주 월요일 반환 |
| `getMonthStart(date)` | 해당 월 1일 반환 |
| `addDays(date, days)` | 날짜 이동 |
| `toDateStr(d)` | Date → YYYY-MM-DD 문자열 |
| `isSameDay(d1, d2)` | 같은 날짜인지 비교 |
| `isInRange(dateStr, start, end)` | 범위 내 날짜인지 확인 |
| `fmtShortRange(start, end?)` | "M/D~M/D" 형태 짧은 범위 포맷 |
| `getMaxRow(bars)` | SpanBar 배열의 최대 행 수 계산 |
| `getBarStyle(bar)` | SpanBar의 layer/isSelf에 따른 스타일 반환 |

---

## 6. 글로벌 마운트 정책

### 6.1 RootLayout (`app/layout.tsx`)

```tsx
<html lang="ko">
  <body>
    <AppShell>{children}</AppShell>     {/* 1. 레이아웃 쉘 */}
    <FloatingCommWidget />              {/* 2. 글로벌 소통 위젯 */}
    <Toaster position="bottom-center" /> {/* 3. 토스트 알림 */}
  </body>
</html>
```

### 6.2 FloatingCommWidget

- **파일**: `components/comm/floating-comm-widget.tsx`
- **마운트 위치**: `app/layout.tsx` (모든 페이지에서 접근 가능)
- **학관 자동 숨김**: 컴포넌트 내부에서 `currentRole === 'learning_manager'`이면 `return null`
- **위치**: `fixed bottom-6 right-6 (z-50)`
- 상세 정책은 `docs/COMM_WIDGET_POLICY.md` 참조

| 역할 | 플로팅 위젯 | 대체 수단 |
|------|:----------:|----------|
| 총괄 | O | — |
| 운영 | O | — |
| 학관 | **X** (자동 숨김) | `components/dashboard/comm-channel.tsx` (학관 대시보드 우측 50%) |

### 6.3 Toaster

- **컴포넌트**: `components/ui/sonner.tsx` (Sonner 래퍼)
- **위치**: `bottom-center`
- **용도**: 업무 생성/상태 변경/확인 요청 등 사용자 피드백

---

## 7. 데이터 흐름 요약

```
useRoleStore (역할)
  → AppShell (사이드바 표시/숨김)
  → AppSidebar (역할별 메뉴 렌더링)
  → DebugRoleSwitcher (역할 전환)
  → FloatingCommWidget (학관 숨김)
  → app/page.tsx (역할별 리다이렉트)

useAdminStore (데이터 — Single Source of Truth)
  → plannerTracks → AppSidebar (트랙 목록)
  → trackTasks → TrackTaskSheet, ManagerOverview, StaffDashboard
  → managerTasks → MyTaskSection
  → schedules → SharedCalendar, ScheduleRightPanel
  → notifications → 인앱 알림 피드 (docs/NOTIFICATION_POLICY.md 참조)
  → commNotifications / commMessages / commStickies → FloatingCommWidget, CommChannel
```
