# EduWorks — 학습 트랙 운영 관리 대시보드

교육 프로그램(트랙)의 운영을 체계화하는 대시보드 시스템.
학관(학습관리매니저)의 업무를 표준화하고, 총괄(운영기획매니저)의 리소스를 절감하기 위한 도구.

---

## 빠른 시작

```bash
pnpm install
pnpm dev
```

http://localhost:3000 접속 후 상단 DEBUG 바에서 역할(총괄/운영/학관) 전환 가능.

---

## 프로젝트 이해를 위한 문서 가이드

**백엔드 개발 에이전트에게**: 아래 문서를 순서대로 읽으면 전체 맥락을 파악할 수 있습니다.

### 1단계: 전체 맥락 파악

| 순서 | 문서 | 내용 |
|:----:|------|------|
| 1 | [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) | 프로젝트 목적, 역할 체계, 기술 스택, 디렉토리 구조, Store 구조, 설계 결정 히스토리 |
| 2 | [`docs/CONTEXT_GRAPH.md`](docs/CONTEXT_GRAPH.md) | 모든 라우트 목록, 각 라우트가 참고할 문서 매핑, 컴포넌트 디렉토리 맵, 데이터 레이어 |

### 2단계: 데이터 모델 이해

| 문서 | 내용 |
|------|------|
| [`docs/TASK_MODEL.md`](docs/TASK_MODEL.md) | UnifiedTask(22필드), UnifiedSchedule(13필드), 상태 전환 플로우, description 마커 시스템, task-adapter 변환 규칙 |

### 3단계: 페이지별 기능 명세

| 문서 | 대상 페이지 | 핵심 내용 |
|------|-----------|----------|
| [`docs/pages/MANAGER_PAGE.md`](docs/pages/MANAGER_PAGE.md) | `/managers/[id]`, `/operators/[id]` | 총괄/운영 대시보드: 건강도, 트랙 현황, 할 일, 내 업무 |
| [`docs/pages/STAFF_PAGE.md`](docs/pages/STAFF_PAGE.md) | `/staff/[id]` | 학관 대시보드: 업무/일정/면담 3탭, Task 상태 전환, 소통 채널 |
| [`docs/pages/TRACK_PAGE.md`](docs/pages/TRACK_PAGE.md) | `/tracks/[id]` | 트랙 Task 시트, 일정 캘린더, 담당자 배정, 생성 모달 |
| [`docs/pages/COMM_WIDGET.md`](docs/pages/COMM_WIDGET.md) | 글로벌 | 플로팅 소통 위젯: 알림, 1:1 채팅, Sticky 메모, Task 스레드 |

### 4단계: 시스템 정책

| 문서 | 내용 |
|------|------|
| [`docs/NOTIFICATION_POLICY.md`](docs/NOTIFICATION_POLICY.md) | 알림 시스템: 역할별 수신 매트릭스, 에스컬레이션, 긴급 Task 처리, 전달 채널 |
| [`docs/APP_INFRA.md`](docs/APP_INFRA.md) | 앱 셸, 사이드바, 역할 시스템, 공유 상수/유틸 |

---

## 역할 체계

```
총괄 (operator_manager) — 정규직, 4~5개 트랙 총괄
 └─ 운영 (operator) — 계약직, 학관을 직접 관리
     └─ 학관 (learning_manager) — 알바, 수강생과 직접 소통
```

- 총괄은 운영만 관리, 운영은 학관을 관리하는 위임 구조
- 에스컬레이션: 운영이 미조치 시 총괄에게 자동 에스컬레이션

---

## 기술 스택

| 카테고리 | 기술 |
|---------|------|
| 프레임워크 | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS, shadcn/ui |
| 상태관리 | Zustand (`useAdminStore` — Single Source of Truth) |
| 기타 | @hello-pangea/dnd, SheetJS, date-fns, Sonner |

---

## 라우트 구조

| 경로 | 설명 |
|------|------|
| `/` | 역할별 자동 리다이렉트 |
| `/managers/[id]` | 총괄 대시보드 |
| `/operators/[id]` | 운영 대시보드 |
| `/staff/[id]` | 학관 대시보드 (업무/일정/면담) |
| `/tracks/[id]/tasks` | 트랙 Task 시트 |
| `/tracks/[id]/schedule` | 트랙 일정 캘린더 |
| `/admin` | 시스템 관리 |
| `/admin/tracks/new` | 트랙 생성 위저드 (8단계) |
| `/admin/tracks/[id]/edit` | 트랙 수정 |
| `/admin/notifications` | 알림 설정 (역할별 권한) |

---

## Mock 데이터 안내

현재 프론트엔드는 **모든 데이터가 mock** 입니다. 백엔드 연동 시 아래 파일들의 mock 데이터를 실제 API로 교체해야 합니다.

### 교체 대상 파일

| 파일 | 내용 | 교체 방법 |
|------|------|----------|
| `lib/admin-mock-data.ts` | 트랙, Task, 알림, 소통 등 전체 mock 데이터 + 타입 정의 | **타입 정의는 유지**, mock 데이터(export const mock*)를 API 호출로 교체 |
| `lib/admin-store.ts` | Zustand 전역 스토어. 초기값으로 mock 데이터 사용 | 스토어 초기화를 API fetch로 변경. 액션(add/update/delete)을 API 호출 + 낙관적 업데이트로 변경 |
| `lib/interview-mock-data.ts` | 면담 mock 데이터 (학생, 순회 체크, 로그) | API로 교체 |
| `lib/interview-store.ts` | 면담 스토어 | API 연동 |
| `components/comm/floating-comm-widget.tsx` | 소통 위젯 데이터 (현재 `useAdminStore`의 `commMessages`, `commNotifications`, `commStickies`) | 이미 스토어에서 읽으므로, 스토어만 API로 전환하면 자동 반영 |

### Mock 데이터 현재 규모

| 데이터 | 건수 | 비고 |
|--------|------|------|
| 트랙 (PlannerTrackCard) | 3개 | AI 7기, BE 5기, AI 8기 |
| 학관 (Staff) | 7명 | track1: 3명, track2: 2명, track3: 2명 |
| 운영매 (Operator) | 3명 | op1 이운영, op2 김운영, op3 박운영 |
| TrackTasks | ~530개 | 2/11 당일 ~80개 + 2/23~3/13 매 평일 자동 생성 ~297개 (3개 트랙, `_genExtTasks()`) |
| Schedules | ~53개 | 3개 트랙에 chapter/curriculum/operation/event/personal |
| Notifications | ~28개 | SYS/ACT/THR 전체 타입 커버 |
| ManagerTasks | 10개 | 총괄/운영매 개인 업무 |
| Comm Messages | ~30개 | 8개 채널 |
| TrackNotices | ~12개 | 3개 트랙 |
| StaffCards | 7개 | 전체 학관 상세 |
| Interview Students | 57명 | 10팀 |
| RoundChecks | ~20건 | 오전/오후 다양한 체크 |
| StudentLogs | ~11건 | 6명 학생 대상 |

### 교체하면 안 되는 파일 (타입/설정만 포함)

- `lib/admin-mock-data.ts`의 **타입 정의** (`interface`, `type`, `NOTIFICATION_TYPE_CONFIG` 등) — 그대로 유지
- `lib/task-templates.ts` — 63개 Task 템플릿 정의 (DB 시드 데이터로 활용)
- `lib/task-generator.ts` — Task 생성 로직 (백엔드로 이전 가능)
- `lib/role-store.ts` — 역할 상수 (인증 시스템으로 대체)
- `lib/date-constants.ts` — 날짜 유틸 (공유 가능)

### Mock 데이터 생성 범위

- **TrackTasks**: 2026-01-26 ~ 2026-03-13 (약 7주). 당일(2/11) 집중 + 2/23~3/13 매 평일 자동 생성 (`_genExtTasks()` 헬퍼 함수)
- **Schedules**: 3개 트랙의 chapter/curriculum/operation/event가 각 트랙 기간 전체 커버
- **Status 분배**: 과거=70%완료+15%진행+10%지연+5%확인요청, 최근=혼합, 미래=80%대기+15%진행+5%미배정
- 날짜를 앞뒤로 이동해도 한 달 이상 데이터가 있어 빈 화면 없음

### Mock 데이터 제거 순서 (권장)

1. 백엔드 API 엔드포인트 구축
2. `lib/admin-store.ts`의 초기값을 API fetch로 변경
3. 스토어 액션(addTrackTask, updateStatus 등)에 API 호출 추가
4. `lib/admin-mock-data.ts`에서 `export const mock*` 상수들 + `_genExtTasks()` 함수 제거
5. `lib/interview-mock-data.ts` 제거
6. 빌드 확인

---

## 디렉토리 구조 (주요)

```
app/                          # Next.js App Router 페이지
components/
  layout/                     # AppShell, AppSidebar, DebugRoleSwitcher
  task/                       # UnifiedTask 기반 공통 컴포넌트
  calendar/                   # SharedCalendar (월간/주간)
  dashboard/                  # 학관 대시보드 위젯
  manager/                    # 총괄/운영 대시보드 섹션
  operator/                   # 운영 진입점
  track/                      # 트랙 페이지 (Task 시트, 모달)
  track-creation/             # 트랙 생성/수정 위저드 (8단계)
  comm/                       # 플로팅 소통 위젯
  interview/                  # 면담 (팀 순회, 수강생 로그)
  admin/                      # 알림 설정
lib/
  admin-store.ts              # Zustand 전역 스토어 (Single Source of Truth)
  admin-mock-data.ts          # Mock 데이터 + 타입 정의
  task-templates.ts           # 63개 Task 템플릿
  task-generator.ts           # Task 자동 생성 로직
  track-creation-types.ts     # 위저드 타입 정의
  date-constants.ts           # 날짜 상수/유틸
  grid-utils.ts               # 겹침 처리 알고리즘
docs/
  PROJECT_CONTEXT.md          # 프로젝트 전체 컨텍스트
  CONTEXT_GRAPH.md            # 라우트-문서 매핑
  TASK_MODEL.md               # 데이터 모델 상세
  NOTIFICATION_POLICY.md      # 알림 시스템 정책
  APP_INFRA.md                # 앱 인프라 정책
  pages/                      # 페이지별 기능 명세
```

---

## 정책 문서가 없는 영역 (TODO)

| 영역 | 상태 | 비고 |
|------|------|------|
| Admin 트랙 생성/수정 위저드 | 코드 구현 완료, 정책 문서 미작성 | `PROJECT_CONTEXT.md` 설계 결정 섹션에 요약 있음 |
| 알림 시스템 실제 구현 | 정책 문서 완료 (`NOTIFICATION_POLICY.md`), 코드는 설정 UI만 | 브라우저 푸시, 에스컬레이션 타이머 등 백엔드 구현 필요 |
