# Admin 트랙 생성/수정 위저드 정책

## 라우트

| 라우트 | 모드 | 설명 |
|--------|------|------|
| `/admin/tracks/new` | 생성 | 빈 상태에서 새 트랙 생성 |
| `/admin/tracks/[id]/edit` | 수정 | 기존 트랙 데이터를 불러와 수정 |

두 라우트 모두 `TrackCreationWizard` 컴포넌트를 사용한다. 수정 모드는 `mode="edit"` + `initialData` props로 구분한다.

---

## 위저드 구조

8단계 순차 진행. 건너뛰기 없음 (프로덕션 레벨). 각 단계의 유효성 검사를 통과해야 다음 단계로 이동 가능.

| 단계 | 이름 | 컴포넌트 | 목적 |
|------|------|----------|------|
| 1 | 기본 정보 | `step-basic-info.tsx` | 트랙명, 회차 입력 |
| 2 | 시간표 업로드 | `step-timetable-upload.tsx` | XLSX 파싱 → 교과 카드 추출 |
| 3 | 챕터 편성 | `step-chapter-builder.tsx` | 교과 카드를 챕터로 그룹핑 |
| 4 | 인원 배정 | `step-staff-assignment.tsx` | 역할별 스태프 배정 |
| 5 | Task 생성 | `step-task-generation.tsx` | 템플릿 선택, 반복 설정, Task 자동 생성 |
| 6 | Task 배정 | `step-task-assignment.tsx` | 학관에게 반복 Task 담당자 배정 |
| 7 | Task 확인 | `step-task-review.tsx` | 생성된 Task 읽기 전용 검토 |
| 8 | 최종 확인 | `step-final-confirmation.tsx` | 요약 확인 후 제출 |

---

## 단계별 상세

### Step 1: 기본 정보

**입력**
- 트랙명: 텍스트 (빈 값 불가)
- 회차: 숫자 (최소 1)

**유효성**: `name.trim() !== '' && round > 0`

**데이터**: `data.name`, `data.round`

---

### Step 2: 시간표 업로드

**입력**
- `.xlsx` 또는 `.xls` 파일 (드래그앤드롭 또는 파일 선택)
- NCS 기반 정부 시간표 형식

**파싱 로직** (`lib/xlsx-parser.ts`)
- 첫 번째 시트 사용
- "YYYY년 M월" 패턴에서 연도 추출
- `N주차` 헤더 → 주 단위 구조 감지
- 시간 슬롯 행(HH:mm)과 교과명 셀 → 동일 교과 연속 블록을 `SubjectCard`로 변환
- 공휴일: 키워드 매칭 (크리스마스, 설날, 추석 등) → `HolidayEntry[]`

**출력** (`ParsedSchedule`)
- `cards`: 교과 블록 배열
- `holidays`: 공휴일 배열
- `trackStart`, `trackEnd`: 트랙 기간
- `totalWeeks`: 총 주 수

**에러 처리**
- "xlsx 또는 xls 파일만 업로드할 수 있습니다."
- "시간표에서 교과 데이터를 추출할 수 없습니다."
- "파일 파싱 중 오류가 발생했습니다."

**유효성**: `parsedSchedule !== null && parsedSchedule.cards.length > 0`

**데이터**: `data.parsedSchedule`, `data.unassignedCards`

---

### Step 3: 챕터 편성

**목적**: 교과 카드를 챕터로 그룹핑. 모든 카드가 챕터에 배정되어야 다음 단계로 이동 가능.

**UI 구조**
- 타임라인: 카드 사이 "여기까지 챕터 N" 구분선 버튼
- 사이드바: 편성된 챕터 요약
- 진행률 바: 배정/미배정 비율

**동작**
- `createChapterUpTo(dividerIndex)`: 구분선까지의 미배정 카드를 새 챕터로 생성
- `deleteChapter(id)`: 챕터 삭제 → 소속 카드를 미배정으로 복귀
- `resetAll()`: 전체 챕터 초기화
- 인라인 이름 수정 가능

**챕터 구조**
```
id: string
name: string (기본 "챕터 N")
order: number
cards: SubjectCard[]
startDate, endDate: string (소속 카드의 min/max)
```

**유효성**: `chapters.length > 0 && unassignedCards.length === 0`

**데이터**: `data.chapters`, `data.unassignedCards`

---

### Step 4: 인원 배정

**역할 구조**

| 역할 | 필드 | 필수 |
|------|------|------|
| 운영기획매니저 (총괄) | `operatorManagers` | 선택 |
| 운영매니저 | `operators` | 1명 이상 권장 |
| 학습관리매니저 (학관) | `learningManagers` | 1명 이상 권장 |
| 튜터 | `tutors` | 선택 |

**동작**
- `MOCK_USERS` 목록에서 검색/선택
- 새 이름 입력 후 Enter → 새 사용자 생성 (`u-new-{timestamp}-{random}`)
- 한 사람은 하나의 역할에만 배정 가능

**유효성**: `operators.length > 0 || learningManagers.length > 0`

**데이터**: `data.staff`

---

### Step 5: Task 생성

**6개 섹션**

| 섹션 | frequency | 설명 |
|------|-----------|------|
| 매일 반복 업무 | `daily` | 매 평일 반복 |
| 주간 반복 업무 | `weekly` | 지정 요일 반복, 격주 옵션 |
| 챕터별 업무 | `per_chapter` | 챕터 시작/종료 기준 |
| 월간 업무 | `monthly` | 매월 지정일 |
| 트랙 일정 업무 | `once` | 개강/수료 기준 1회성 |
| 수시 업무 | `ad_hoc` | 일별/주별/트랙 단계별 |

**템플릿 시스템** (`lib/task-templates.ts`)
- 63개 사전 정의 템플릿
- 카테고리: 개강 전후, 수강생 상태, 과제/진도, 프로젝트/이벤트, 최종/수료, 데이터 수집, 루틴, 튜터 관리, 행정, 환경 관리
- DRI 역할: `operator_manager`, `operator`, `learning_manager`
- 체크박스로 활성/비활성 토글

**시간 설정 패턴 (TimeRangeSelect)**
- 매일 반복 업무에 적용
- 시작 시간: 08:00~19:00 (30분 단위, 23개 옵션) 또는 "시간 미지정"
- 소요 시간: 30분~3시간 (30분 단위, 6개 옵션, 기본 1시간)
- 종료 시간: 시작 + 소요로 자동 계산, 읽기 전용 표시
- 시작 시간 "시간 미지정" 선택 시 소요 시간 드롭다운 숨김

**수시 업무 (Ad-hoc) 모드**

| 모드 | 설명 |
|------|------|
| `daily` | 고정 시간, 매일 반복 (시작시간 + 소요시간 패턴 적용) |
| `weekly` | 지정 요일, 격주 옵션 |
| `track_phase` | 개강/수료 기준 오프셋 |

**커스텀 템플릿 추가**
- CreateTaskModal로 사용자 정의 템플릿 생성 가능
- 제목, 역할, 빈도, 트리거 설정

**Task 자동 생성** (`lib/task-generator.ts`)
- 활성화된 템플릿 + RecurrenceConfig → 트랙 기간/챕터 기반으로 Task 인스턴스 생성
- daily: 평일만, `config.time` + `config.endTime` 사용
- weekly: `config.daysOfWeek` 기준
- per_chapter: 챕터당 1개, 오프셋 적용
- monthly: 매월 지정일
- once: 개강/수료 기준 오프셋
- ad_hoc: 설정에 따라 daily/weekly와 동일하게 생성
- 섹션별 예상 생성 수 실시간 표시 ("→ 약 N개 생성")

**폴백**: `parsedSchedule` 없어도 기본 트랙 기간(3개월)으로 Task 생성 가능

**유효성**: `generatedTasks.length > 0`

**데이터**: `data.generatedTasks`, `data.recurrenceConfigs`, `data.customTemplates`

---

### Step 6: Task 배정

**대상**: `daily`, `weekly`, `ad_hoc` 중 `driRole === 'learning_manager'`인 템플릿만 배정. 나머지(per_chapter, monthly, once)는 "트랙 운영 시작 후 배정" 안내.

**4가지 배정 모드**

| 모드 | ID | 설명 |
|------|-----|------|
| 전원이 각자 | `all` | 모든 학관이 각 Task 인스턴스를 수행 |
| 돌아가면서 | `rotation` | 일별/주별 라운드 로빈 |
| 한 명 지정 | `specific` | 특정 학관 1명 고정 |
| 나중에 배정 | `unassigned` | 위저드에서 배정 안 함 |

**일괄 vs 개별 커스터마이징**
- **상단 모드 카드 4개**: 클릭하면 해당 섹션의 모든 항목을 일괄 변경
- **하단 각 행의 드롭다운**: 항목별 개별 모드/담당자 설정
- 항목별 모드가 다르면 상단에 **"커스터마이징 중"** 배너 표시, 카드 선택 해제
- `inferSectionMode()`: 섹션 내 항목들의 배정 모드가 동일하면 해당 모드 반환, 다르면 `'custom'` 반환

**한 명 지정 모드 상세**
- 상단 카드에서 기본 담당자 선택 시, 이미 개별 지정된 항목은 보존
- 행별 왼쪽 드롭다운 = 모드 선택, 오른쪽 드롭다운 = 담당자 (지정 모드에서만 활성)

**순환(rotation) 모드 상세**
- `cycle`: `daily` 또는 `weekly`
- `staffOrder`: 학관 순서 배열, 드래그 순서 변경 가능
- 타임라인 미리보기: 어떤 학관이 어떤 슬롯 담당인지 시각화

**기본 배정 추천** (`suggestDefaultAssignments`)
- Step 5→6 전환 시 자동 실행
- daily + 중요도 높음 → `all`
- daily + 중요도 낮음 → `rotation` (daily cycle)
- weekly → `rotation` (weekly cycle)
- per_chapter, once → `specific` (첫 번째 학관) 또는 `unassigned`

**배정 적용** (`applyAssignments`)
- Step 6→7 전환 시 실행
- `all`: Task 인스턴스를 학관 수만큼 복제, 각 학관에 배정
- `specific`: `specificStaffId`로 전체 배정
- `rotation`: 날짜/주 순서에 따라 `staffOrder` 라운드 로빈
- `unassigned`: 변경 없음 (`status: 'unassigned'`)

**데이터**: `data.taskAssignments`

---

### Step 7: Task 확인

**읽기 전용** 검토 화면.

**표시 구조**
- frequency별 그룹핑
- 각 행: 제목, 타이밍 설명, 담당 역할, 배정 정보
- `getTimingLabel()`: 반복 일정 텍스트 설명
- `getAssignLabel()`: 배정 모드 + 담당자/순서 표시
- 챕터별 업무: "N개 챕터에 각각 적용" 안내

**탐색**: Step 7에서 뒤로(Step 6)로 가면 `generatedTasks`가 `preAssignmentTasks`로 복원됨 (배정 이전 상태).

---

### Step 8: 최종 확인

**요약 표시**
- 트랙명, 회차, 기간
- 통계: 스태프 수, 챕터 수 + 총 시수, Task 인스턴스 수
- 역할별 스태프 목록
- 챕터 타임라인
- Task 분석: 역할 분포, 배정 현황

**제출**
- 생성 모드: `createTrack(payload)` 호출
- 수정 모드: `updateTrack(trackId, payload)` 호출
- Payload: `name`, `round`, `trackStart`, `trackEnd`, `chapters`, `staff`, `tasks`
- 완료 후 `/managers/mgr1`로 리다이렉트

---

## 데이터 흐름

```
Step 1: name, round
    ↓
Step 2: parsedSchedule, unassignedCards
    ↓
Step 3: chapters (unassignedCards → 0)
    ↓
Step 4: staff (operators, learningManagers, ...)
    ↓
Step 5: recurrenceConfigs, generatedTasks, customTemplates
    ↓ suggestDefaultAssignments()
Step 6: taskAssignments
    ↓ applyAssignments()
Step 7: generatedTasks (with assignees)
    ↓
Step 8: submit → createTrack / updateTrack
```

---

## 수정 모드 (Edit Mode)

**진입**: `/admin/tracks/[id]/edit`

**데이터 변환** (`lib/track-edit-utils.ts`)
1. `buildTrackCreationData(track, trackTasks, trackSchedules, chapters)` 호출
2. `parseTrackName()`: "AI 트랙 7기" → `{ name: "AI 트랙", round: 7 }`
3. `parsePeriod()`: "2026-01-05~2026-04-15" → `{ trackStart, trackEnd }`
4. 스케줄 → `SubjectCard[]`, 챕터 → `Chapter[]` (cards 포함)
5. `unassignedCards: []` (수정 모드에서는 모든 카드가 챕터에 배정된 상태)
6. 기존 Task → `GeneratedTask[]` 매핑
7. daily Task의 `dueTime` → `recurrenceConfigs.endTime` → `duration` 역산
8. `inferAssignments()`: 기존 Task의 `assigneeId` 패턴 분석
   - 모두 미배정 → `unassigned`
   - 전 학관 각각 배정 → `all`
   - 단일 담당자 → `specific`
   - 그 외 → `rotation` (assignee 순서에서 `staffOrder` 추론)

**UI 차이**: 상단에 "트랙 수정 모드 — 기존 설정이 반영되어 있습니다" 배너 표시.

---

## 핵심 타입 정의

**파일**: `lib/track-creation-types.ts`

| 타입 | 용도 |
|------|------|
| `SubjectCard` | 시간표에서 추출한 교과 블록 |
| `HolidayEntry` | 공휴일 |
| `ParsedSchedule` | 시간표 파싱 결과 |
| `Chapter` | 챕터 (카드 그룹) |
| `StaffMember` | 스태프 정보 |
| `TrackStaffAssignment` | 역할별 스태프 배정 |
| `RecurrenceConfig` | Task 반복 설정 |
| `TaskTemplateConfig` | 템플릿 + 활성 상태 |
| `GeneratedTask` | 생성된 Task 인스턴스 |
| `TaskAssignmentConfig` | 배정 설정 (모드, 담당자, 순환 설정) |
| `RotationConfig` | 순환 배정 상세 (cycle, staffOrder) |
| `AssignmentMode` | `'all' \| 'specific' \| 'rotation' \| 'unassigned'` |

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `components/track-creation/track-creation-wizard.tsx` | 위저드 메인 (상태, 네비게이션) |
| `components/track-creation/step-*.tsx` | 각 단계 컴포넌트 (8개) |
| `lib/track-creation-types.ts` | 위저드 관련 타입 |
| `lib/task-templates.ts` | 63개 Task 템플릿 |
| `lib/task-generator.ts` | Task 생성 + 배정 적용 로직 |
| `lib/track-edit-utils.ts` | 수정 모드 데이터 변환 |
| `lib/xlsx-parser.ts` | 시간표 XLSX 파싱 |
| `app/admin/tracks/new/page.tsx` | 생성 페이지 |
| `app/admin/tracks/[id]/edit/page.tsx` | 수정 페이지 |
