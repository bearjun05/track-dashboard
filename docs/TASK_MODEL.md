# Task 통합 모델 정의

> **출처**: `components/task/task-types.ts`, `components/task/task-adapter.ts`, `components/schedule/schedule-types.ts`

---

## 1. UnifiedTask 모델

트랙에서 생성된 개별 업무 인스턴스의 속성.
템플릿/설정 레벨 속성(assignmentMode, rotationConfig, triggerType 등)은 인스턴스에 포함하지 않는다.

### 식별 (Identity)

| # | 속성 | 타입 | 필수 | 설명 |
|---|------|------|:----:|------|
| 1 | `id` | string | O | 고유 식별자 |
| 2 | `templateId` | string | - | 원본 템플릿 ID. 시스템 생성 Task에만 존재 |
| 3 | `trackId` | string | O | 소속 트랙 ID |

### 내용 (Content)

| # | 속성 | 타입 | 필수 | 설명 |
|---|------|------|:----:|------|
| 4 | `title` | string | O | 업무 제목 |
| 5 | `description` | string | - | 업무 설명. 마커 시스템으로 source를 인코딩 (§6 참조) |
| 6 | `category` | string | O | 대분류 (튜터 관리, 행정, 수강생 관리 등) |
| 7 | `subcategory` | string | - | 소분류 |
| 8 | `output` | string | - | 기대 산출물 (리포트, 체크리스트 등) |
| 9 | `attachments` | TaskAttachment[] | - | 첨부 — 가이드 링크, 증빙 파일, 외부 링크 등 통합 |

### 출처 (Source)

| # | 속성 | 타입 | 필수 | 설명 |
|---|------|------|:----:|------|
| 10 | `source` | TaskSource | O | 출처 — `system` / `request_sent` / `request_received` / `self` |
| 11 | `creatorId` | string | - | 생성자 ID. 시스템 생성이면 없음. 이름은 ID로 참조 |
| 12 | `createdAt` | string | O | 생성 시각 (ISO 8601) |

### 배정 (Assignment)

| # | 속성 | 타입 | 필수 | 설명 |
|---|------|------|:----:|------|
| 13 | `assigneeId` | string | - | 담당자 ID. 없으면 미배정(unassigned) 상태 |
| 14 | `reviewerId` | string | - | 검토자 ID. 존재하면 완료 시 검토 프로세스 진행 |

### 일정 (Schedule)

| # | 속성 | 타입 | 필수 | 설명 |
|---|------|------|:----:|------|
| 15 | `startDate` | string | O | 시작 날짜 (YYYY-MM-DD) |
| 16 | `endDate` | string | - | 종료 날짜. 없으면 startDate와 동일 (당일 완료) |
| 17 | `startTime` | string | - | 시작 시간 (HH:mm). 없으면 시간 제한 없음 |
| 18 | `endTime` | string | - | 종료 시간 (HH:mm). 없으면 시간 제한 없음 |

### 상태 (Status)

| # | 속성 | 타입 | 필수 | 설명 |
|---|------|------|:----:|------|
| 19 | `priority` | TaskPriority | O | 우선순위 — `important` / `urgent` / `normal` |
| 20 | `status` | TaskStatus | O | 현재 상태 — §5 상태 전환 플로우 참조 |
| 21 | `completedAt` | string | - | 최종 완료 시각 (ISO 8601) |

### 소통 (Communication)

| # | 속성 | 타입 | 필수 | 설명 |
|---|------|------|:----:|------|
| 22 | `messages` | TaskMessage[] | O | Task 내 대화 스레드 (빈 배열 가능) |

> **이름 참조 정책**: `creatorId`, `assigneeId`, `reviewerId`의 이름은 ID를 통해 staff 디렉토리에서 참조하여 표시. name 필드를 중복 저장하지 않음.

---

## 2. UnifiedSchedule 모델

기존 `ChapterInfo`, `TrackSchedule`, `PersonalSchedule` 3개 엔티티를 단일 모델로 통합.
Task와는 별도 엔티티로 관리.

| # | 속성 | 타입 | 필수 | 설명 |
|---|------|------|:----:|------|
| 1 | `id` | string | O | 고유 식별자 |
| 2 | `title` | string | O | 일정 제목 |
| 3 | `type` | ScheduleType | O | `chapter` / `curriculum` / `operation_period` / `track_event` / `personal` |
| 4 | `source` | ScheduleSource | O | `system`(자동) / `manual`(수동) |
| 5 | `startDate` | string | O | 시작 날짜 (YYYY-MM-DD) |
| 6 | `endDate` | string | O | 종료 날짜 (단일일이면 startDate와 동일) |
| 7 | `startTime` | string | - | 시작 시간 (HH:mm) |
| 8 | `endTime` | string | - | 종료 시간 (HH:mm) |
| 9 | `trackId` | string | - | 소속 트랙 ID (personal은 없음) |
| 10 | `creatorId` | string | - | 생성자 ID (system이면 없음) |
| 11 | `description` | string | - | 설명/메모 |
| 12 | `category` | string | - | 강의 / 프로젝트 / 평가 / 행사 / 기타 (curriculum, track_event용) |
| 13 | `createdAt` | string | O | 생성 시각 (ISO 8601) |

---

## 3. Enum 정의

### TaskStatus

| 값 | 한글 | 설명 |
|---|------|------|
| `unassigned` | 미배정 | assigneeId가 없는 상태 |
| `pending` | 대기 | 배정 완료, 아직 시작 안 함 |
| `in_progress` | 진행중 | 담당자가 업무 시작 |
| `pending_review` | 확인요청 | 담당자 완료 표시 + reviewerId 존재 시 |
| `completed` | 완료 | 검토자 승인 또는 검토자 없이 담당자 완료 |
| `overdue` | 지연 | 마감 시점 초과 시 자동 전환 |

> **주의**: status 값은 언더스코어 형식(`in_progress`, `pending_review`)을 사용한다. 하이픈 형식(`in-progress`)이 아님.

### TaskPriority

| 값 | 한글 | 설명 |
|---|------|------|
| `normal` | 보통 | 일반 업무 |
| `important` | 중요 | 중요도 높은 업무 |
| `urgent` | 긴급 | 중요 + 시급. 담당자에게 즉시 알림 발송 |

### TaskSource

| 값 | 한글 | 설명 |
|---|------|------|
| `system` | 시스템 | 트랙 생성 시 자동 배정된 업무 |
| `request_sent` | 보낸요청 | 내가 다른 사람에게 요청한 업무 |
| `request_received` | 받은요청 | 다른 사람이 나에게 요청한 업무 |
| `self` | 직접추가 | 본인이 직접 등록한 개인 업무 |

### ScheduleType

| 값 | 한글 | 설명 |
|---|------|------|
| `chapter` | 챕터 | 트랙 생성 시 자동 생성되는 기간 구조 |
| `curriculum` | 커리큘럼 | 트랙 생성 시 자동 생성되는 강의/프로젝트/평가 일정 |
| `operation_period` | 운영일정 | 운기매/운영매가 설정한 기간형 운영 페이즈 |
| `track_event` | 트랙 일정 | 운영매/운기매가 수동 등록한 단발성 이벤트 |
| `personal` | 개인 일정 | 개인이 수동 등록한 본인 일정 |

### ScheduleSource

| 값 | 한글 | 설명 |
|---|------|------|
| `system` | 자동 | 트랙 생성 시 시스템이 자동 생성 (chapter, curriculum) |
| `manual` | 수동 | 사람이 직접 등록 (track_event, personal, operation_period) |

### AttachmentType

| 값 | 설명 |
|---|------|
| `guide` | 업무 수행 가이드 (노션, 문서 등) |
| `evidence` | 완료 증빙 자료 |
| `file` | 첨부 파일 |
| `link` | 외부 링크 |

---

## 4. 하위 인터페이스

### TaskAttachment

```typescript
interface TaskAttachment {
  id: string           // 고유 식별자
  name: string         // 표시 이름
  url: string          // 링크/파일 URL
  type: AttachmentType // guide | evidence | file | link
}
```

### TaskMessage

```typescript
interface TaskMessage {
  id: string          // 고유 식별자
  authorId: string    // 작성자 ID
  authorName: string  // 작성자 이름
  content: string     // 메시지 내용
  timestamp: string   // 작성 시각 (ISO 8601)
  isSelf: boolean     // 현재 로그인 사용자 본인 여부
}
```

---

## 5. 상태 전환 플로우

```
                                  ┌──── 체크 해제 ────┐
                                  ▼                    │
  ┌────────────┐   체크/모달   ┌─────────────┐      ┌───────────┐
  │  pending   │ ───────────▶ │ in_progress │      │ completed │
  └────────────┘    열기       └─────────────┘      └───────────┘
                                  │                    ▲
                                  │                    │
                    ┌─────────────┴─────────────┐      │
                    │                           │      │
                    ▼ reviewer 없음              ▼ reviewer 있음
              ┌───────────┐              ┌────────────────┐
              │ completed │              │ pending_review  │
              └───────────┘              └────────────────┘
                                                │
                                    reviewer 승인 │
                                                ▼
                                          ┌───────────┐
                                          │ completed │
                                          └───────────┘
```

**전환 규칙 요약**:

| From | To | 조건 |
|------|-----|------|
| `pending` | `in_progress` | 담당자가 체크하거나 모달 열기 |
| `in_progress` | `completed` | 완료 표시 + `reviewerId` 없음 |
| `in_progress` | `pending_review` | 완료 표시 + `reviewerId` 있음 |
| `pending_review` | `completed` | 검토자 승인 |
| `pending_review` | `in_progress` | 검토자 반려 |
| `completed` | `in_progress` | 체크 해제 (되돌리기) |
| *any non-completed* | `overdue` | endDate/endTime 초과 시 자동 전환 |

---

## 6. description 마커 시스템

`TrackTask`의 `description` 필드에 접두사 마커를 붙여 **source**를 인코딩한다.
어댑터의 `mapSource()`가 마커를 읽어 `TaskSource`로 변환하고, `cleanDescription()`이 마커를 제거한 순수 텍스트를 반환한다.

### 마커 상수

```typescript
const SELF_MARKER    = '__self_added__'
const REQUEST_MARKER = '__request_sent__'
```

### mapSource() 판정 로직

```
description 시작이...
  '__request_sent__' → request_sent
  '__self_added__'   → self
  마커 없음 + type === 'manual' → request_received
  마커 없음 + type !== 'manual' → system
```

| description 접두사 | TrackTask.type | → TaskSource |
|---|---|---|
| `__request_sent__` | (무관) | `request_sent` |
| `__self_added__` | (무관) | `self` |
| 마커 없음 | `manual` | `request_received` |
| 마커 없음 | `manual` 아님 | `system` |

### cleanDescription() 처리

1. `description`이 `undefined`/빈 문자열이면 `undefined` 반환
2. `SELF_MARKER` 또는 `REQUEST_MARKER`로 시작하면 해당 마커 제거
3. 마커 직후 개행(`\n`)이 있으면 함께 제거
4. 제거 후 빈 문자열이면 `undefined` 반환
5. 마커가 없으면 원본 그대로 반환

---

## 7. task-adapter 변환 규칙

`trackTaskToUnified()` — `TrackTask` → `UnifiedTask` 매핑 상세.

| UnifiedTask 필드 | ← TrackTask 필드 | 변환 |
|---|---|---|
| `id` | `tt.id` | 그대로 |
| `templateId` | `tt.templateId` | 그대로 (optional) |
| `trackId` | `tt.trackId` | 그대로 |
| `title` | `tt.title` | 그대로 |
| `description` | `tt.description` | `cleanDescription()` — 마커 제거 |
| `category` | — | 하드코딩 `'수강생 관리'` |
| `source` | `tt.description`, `tt.type` | `mapSource()` — §6 로직 |
| `createdAt` | `tt.scheduledDate` | 그대로 |
| `assigneeId` | `tt.assigneeId` | 그대로 |
| `reviewerId` | `tt.reviewerId` | 그대로 |
| `startDate` | `tt.scheduledDate` | 그대로 |
| `endDate` | `tt.endDate` | 그대로 |
| `startTime` | `tt.scheduledTime` | 그대로 |
| `endTime` | `tt.dueTime` | 그대로 |
| `priority` | `tt.priority` | `tt.priority ?? (status === 'overdue' ? 'urgent' : 'normal')` |
| `status` | `tt.status` | `mapStatus()` — 타입 캐스팅 |
| `completedAt` | `tt.completedAt` | 그대로 |
| `messages` | `tt.messages[]` | `authorId`를 `isSelf ? 'me' : 'other'`로 변환 |

---

## 8. UI 설정 테이블

### STATUS_CONFIG

| status | label | style | dotCls | cls (tailwind) |
|---|---|---|---|---|
| `unassigned` | 미배정 | outline | `bg-foreground/20` | `border border-dashed border-foreground/25 text-foreground/40 bg-transparent` |
| `pending` | 대기 | ghost | `bg-foreground/25` | `bg-foreground/[0.04] text-foreground/35` |
| `in_progress` | 진행중 | filled | `bg-blue-500` | `bg-blue-500/10 text-blue-600` |
| `pending_review` | 확인요청 | filled | `bg-amber-500` | `bg-amber-500/10 text-amber-600` |
| `completed` | 완료 | ghost | `bg-foreground/20` | `bg-foreground/[0.03] text-foreground/25` |
| `overdue` | 지연 | filled | `bg-destructive` | `bg-destructive/10 text-destructive` |

**디자인 원칙** — 3-tone + grayscale:
- **Grayscale (기본)**: foreground 불투명도 변화 — unassigned, pending, completed
- **Blue**: 진행중 (in_progress)
- **Amber**: 주의 필요 — pending_review, important
- **Destructive (red)**: overdue, urgent 전용

### PRIORITY_CONFIG

| priority | label | cls |
|---|---|---|
| `normal` | 보통 | *(없음)* |
| `important` | 중요 | `text-amber-600` |
| `urgent` | 긴급 | `text-destructive` |

### SOURCE_CONFIG

| source | label | cls |
|---|---|---|
| `system` | 시스템 | `bg-foreground/[0.04] text-foreground/40` |
| `request_sent` | 보낸요청 | `bg-foreground/[0.06] text-foreground/50` |
| `request_received` | 받은요청 | `bg-foreground/[0.06] text-foreground/50` |
| `self` | 직접추가 | `bg-foreground/[0.03] text-foreground/30` |

### SCHEDULE_TYPE_CONFIG

| type | label |
|---|---|
| `chapter` | 챕터 |
| `curriculum` | 커리큘럼 |
| `operation_period` | 운영일정 |
| `track_event` | 트랙 일정 |
| `personal` | 개인 일정 |
