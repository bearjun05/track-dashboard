# 알림 시스템 정책

> 역할별 알림 라우팅, 에스컬레이션, 긴급 처리, 전달 채널을 정의한 정책 문서.
> 설정 UI: `/admin/notifications` (`components/admin/notification-settings.tsx`)
> 타입 정의: `lib/admin-mock-data.ts` → `NotificationType`, `AppNotification`, `NotificationConfig`

---

## 1. 설계 원칙

1. **학관/운영매가 업무 주체** — 학관은 자기 업무 관련 알림만, 운영매는 트랙 관리 중심
2. **총괄은 에스컬레이션 수신자** — 직접 알림보다 운영매 미조치 시 에스컬레이션으로 인지
3. **시간 기반 에스컬레이션** — Admin 설정에서 트랙별 조절 가능
4. **긴급(urgent) Task 차별 처리** — 에스컬레이션 단축 + 상위자 동시 알림
5. **학관 알림 최소화** — 자기 Task + 운영매 메시지 정도만 (소통 채널에서 직접 확인이 기본)
6. **모든 알림 ON/OFF 가능** — "필수" 개념 없음. 역할별로 설정 가능 범위를 차등화
7. **역할별 설정 권한** — 총괄은 모든 설정 가능, 운영매는 본인 수신 알림만 설정 가능, 에스컬레이션은 총괄만 수정

---

## 2. 알림 카테고리

| 카테고리 | 코드 | 트리거 | ON/OFF |
|---------|------|--------|--------|
| 시스템 자동 (SYS) | `system` | 상태 변화 자동 감지 | 가능 (역할별 권한) |
| 액션 기반 (ACT) | `action` | 사용자 행동 | 가능 (역할별 권한) |
| 임계치 (THR) | `threshold` | 설정 수치 초과 | 가능 (역할별 권한) |

---

## 3. NotificationType 정의

> 기존 21개 타입을 정리하고, 부족한 타입을 추가.

### 시스템 자동 알림 (SYS)

| ID | 타입 | 라벨 | 트리거 조건 |
|----|------|------|-----------|
| SYS-01 | `task_overdue` | 기한초과 | Task의 endDate/endTime 초과 시 자동 전환 |
| SYS-02 | `task_unassigned` | 미배정 | 트랙에 assigneeId가 없는 Task 존재 |
| SYS-03 | `task_reminder` | 시작 리마인더 | startTime 30분 전 자동 발송 |
| SYS-04 | `escalation_triggered` | 에스컬레이션 | 하위 알림 미조치 후 타이머 만료 |

> **변경**: 기존 `task_activated`(SYS-03) → `task_reminder`로 변경. `escalation_triggered`(SYS-04) 신규 추가.

### 액션 기반 알림 (ACT)

| ID | 타입 | 라벨 | 수신 대상 | 트리거 조건 |
|----|------|------|----------|-----------|
| ACT-01 | `task_assigned` | Task 배정 | 학관 | assigneeId 설정 시 |
| ACT-02 | `task_reassigned` | Task 재배정 | 학관 | assigneeId 변경 시 |
| ACT-03 | `task_completed` | Task 완료 | 운영 | 담당자가 completed로 전환 (reviewer 없음) |
| ACT-04 | `task_review_requested` | 확인요청 | 운영 | 담당자가 pending_review로 전환 |
| ACT-05 | `task_review_done` | 확인완료 | 학관 | reviewer가 completed로 전환 |
| ACT-06 | `request_received` | 업무요청 수신 | 운영, 총괄 | 학관→운영매, 운영매→총괄, 총괄→운영매 업무 생성 시 |
| ACT-07 | `message_new` | 새 메시지 | 전체 | 소통 채널/위젯에 새 메시지 |
| ACT-08 | `notice_new` | 새 공지 | 학관 | 트랙 공지 등록 시 |
| ACT-09 | `notice_replied` | 공지 답변 | 학관 | 공지에 답장 시 |
| ACT-10 | `vacation_registered` | 휴가 등록 | 운영 | 학관 휴가 등록 시 (업무 재배정 필요) |
| ACT-11 | `schedule_changed` | 일정 변경 | 학관 | 운영일정 추가/변경 시 |

> **제거**: `issue_new`~`issue_status_changed`(ACT-01~04) — 이슈 시스템 미구현, `kanban_created`/`kanban_replied`(ACT-11~12) — 칸반 기능 제거됨
> **추가**: `task_review_requested`, `task_review_done`, `request_received`, `schedule_changed`

### 임계치 알림 (THR)

| ID | 타입 | 라벨 | 트리거 조건 | 기본 임계치 |
|----|------|------|-----------|-----------|
| THR-01 | `threshold_staff_completion` | 학관 완료율 | 오후 2시 기준 학관 완료율 미달 | 30% |
| THR-02 | `threshold_operator_completion` | 운영 완료율 | 오후 2시 기준 운영매 완료율 미달 | 30% |
| THR-03 | `threshold_pending_issues` | 이슈 누적 | 미처리 이슈 N건 이상 | 3건 |
| THR-04 | `threshold_unread_messages` | 메시지 누적 | 안읽은 메시지 N건 이상 | 5건 |
| THR-05 | `threshold_overdue_tasks` | 기한초과 누적 | overdue Task N건 이상 | 3건 |

---

## 4. 역할별 알림 수신 매트릭스

### 학관 (learning_manager)

| 알림 | 타입 | 조건 |
|------|------|------|
| Task 배정됨 | `task_assigned` | assigneeId === 본인 |
| Task 재배정됨 | `task_reassigned` | 새 assigneeId === 본인 |
| 시작 리마인더 | `task_reminder` | 본인 Task, startTime 30분 전 |
| 확인 완료 | `task_review_done` | 본인이 담당자인 Task의 reviewer 승인 |
| 운영매 메시지 | `message_new` | comm-channel에서 운영매 발신 |
| 새 공지 | `notice_new` | 소속 트랙의 공지 |
| 일정 변경 | `schedule_changed` | 소속 트랙의 운영일정 (선택) |

> 학관은 **overdue 알림을 직접 받지 않음** — 본인이 이미 인지하고 있으며, 운영매가 관리.

### 운영매 (operator)

| 알림 | 타입 | 조건 |
|------|------|------|
| Task 기한초과 | `task_overdue` | 담당 트랙의 Task |
| Task 미배정 | `task_unassigned` | 담당 트랙의 미배정 Task |
| Task 확인요청 | `task_review_requested` | 본인이 reviewer인 Task |
| Task 완료 (선택) | `task_completed` | 담당 트랙의 Task 완료 |
| 업무 요청 수신 | `request_received` | 학관→운영매 요청, 총괄→운영매 지시 |
| 학관 메시지 | `message_new` | comm-channel/위젯에서 학관/총괄 발신 |
| 휴가 등록 | `vacation_registered` | 담당 학관 휴가 |
| 학관 완료율 저조 | `threshold_staff_completion` | 담당 트랙 임계치 미달 |
| 기한초과 누적 | `threshold_overdue_tasks` | 담당 트랙 임계치 초과 |
| 미처리 이슈 누적 | `threshold_pending_issues` | 담당 트랙 임계치 초과 |

### 총괄 (operator_manager)

| 알림 | 타입 | 조건 |
|------|------|------|
| **에스컬레이션** | `escalation_triggered` | 운영매 미조치 후 타이머 만료 |
| 업무 요청 수신 | `request_received` | 운영매→총괄 요청 |
| 운영매 메시지 | `message_new` | 플로팅 위젯에서 운영매 발신 |
| 운영 완료율 저조 | `threshold_operator_completion` | 임계치 미달 |
| 안읽은 메시지 누적 | `threshold_unread_messages` | 임계치 초과 |

> 총괄은 직접적인 Task 알림을 받지 않음. **에스컬레이션을 통해서만** 트랙 이슈를 인지.

---

## 5. 에스컬레이션 시스템

### 흐름

```
이벤트 발생 (overdue / pending_review / unassigned)
  │
  ▼
1차 알림: 운영매에게 전송
  │
  ▼
타이머 시작 (기본: 4~8시간, 긴급: 1~2시간)
  │
  ├── 운영매가 조치함 → 타이머 해제, 알림 소멸
  │
  └── 타이머 만료 (미조치) → 2차 알림: 총괄에게 에스컬레이션
       │
       └── AppNotification 생성:
            type: 'escalation_triggered'
            escalation: {
              isEscalated: true,
              originalRecipientRole: 'operator',
              escalatedAt: timestamp,
              originalNotificationId: 원본 알림 ID
            }
```

### 에스컬레이션 타이머

| 원본 알림 | 1차 수신자 | 에스컬레이션 대상 | 일반 Task | 긴급 Task |
|----------|----------|----------------|----------|----------|
| `task_overdue` | 운영매 | 총괄 | 4시간 | 1시간 |
| `task_review_requested` 미처리 | 운영매 | 총괄 | 8시간 | 2시간 |
| `task_unassigned` | 운영매 | 총괄 | 4시간 | 1시간 |
| `threshold_staff_completion` | 운영매 | 총괄 | 24시간 | 12시간 |

설정: `NotificationConfig.escalation`

```typescript
escalation: {
  staffToOperatorHours: number   // 학관→운영매 (현재 미사용, 학관은 에스컬레이션 대상 아님)
  operatorToManagerHours: number // 운영매→총괄 기본 시간
}
```

### "조치함" 판정 기준

| 원본 알림 | 조치 완료 조건 |
|----------|-------------|
| `task_overdue` | Task 상태가 `completed`로 변경 또는 `deferTask()` 실행 |
| `task_review_requested` | reviewer가 `completed` 또는 `in_progress`(반려)로 변경 |
| `task_unassigned` | `assigneeId`가 설정됨 (`assignTask()` 실행) |
| `threshold_*` | 다음 측정 시 임계치 이하로 회복 |

### 에스컬레이션 UI 표시

- 총괄의 알림 피드에서 에스컬레이션 알림은 **빨간 테두리 + "에스컬레이션" 뱃지**로 강조
- 원본 알림 정보 포함: "운영매 이운영님에게 4시간 전 알림되었으나 미조치"
- 클릭 시 해당 트랙/Task로 이동

---

## 6. 긴급(urgent) Task 특별 처리

| 항목 | 일반 Task | 긴급 Task |
|------|----------|----------|
| 알림 전달 | 인앱 피드 + 브라우저 푸시 | 즉시 인앱 + 푸시 + **sonner 토스트** |
| 에스컬레이션 시간 | 설정값 (기본 4~8h) | 설정값의 **1/4** (기본 1~2h) |
| 1차 알림 범위 | 담당자만 | 담당자 + **운영매 동시 알림** |
| UI 표시 | 일반 스타일 | `pulse` 빨간 dot + `destructive` 배경 |
| 수신 모드 무시 | digestMode 설정 따름 | **항상 realtime** (요약 모드 무시) |

### 긴급 동시 알림 예시

```
학관에게 긴급 Task 배정됨
  ├── 학관: task_assigned 알림 (즉시 + 토스트)
  └── 운영매: task_assigned 알림 (즉시, "긴급 Task가 김학관에게 배정됨")
```

---

## 7. 전달 채널

| 채널 | 구현 | 대상 역할 | 비고 |
|------|------|----------|------|
| **인앱 피드** | 학관: `comm-channel.tsx` 알림 탭 / 운영·총괄: `floating-comm-widget.tsx` 알림 채널 | 전체 | 기존 구현 활용 |
| **브라우저 푸시** | `Notification API` + Service Worker | 전체 | 추후 구현 |
| **sonner 토스트** | `sonner` (이미 설치) | 현재 활성 사용자 | 긴급 + 실시간 이벤트 |

### 데이터 흐름

```
이벤트 발생
  │
  ▼
useAdminStore.addNotification(notification)
  │
  ├── commNotifications 배열에 추가 (인앱 피드)
  ├── Notification API 호출 (브라우저 푸시, 허용 시)
  └── toast() 호출 (긴급 또는 realtime 모드)
```

### 수신 모드 (Admin 설정)

| 모드 | 값 | 설명 | 긴급 Task |
|------|-----|------|----------|
| 실시간 | `realtime` | 이벤트 즉시 개별 알림 (기본) | 동일 |
| 1시간 요약 | `hourly` | 매시 정각에 미확인 알림 모아서 | **무시 → 즉시** |
| 일일 요약 | `daily` | 매일 오전 9시에 모아서 | **무시 → 즉시** |

### 방해금지 시간

`NotificationConfig.quietHours: { start: string, end: string } | null`

- 이 시간대에는 **브라우저 푸시 미발송** (인앱 피드에는 정상 누적)
- 긴급 Task는 방해금지 시간도 **무시** (항상 푸시)

---

## 8. 상태 전환 → 알림 매핑 (종합)

| 상태 전환 | 알림 타입 | 수신자 | 에스컬레이션 |
|----------|----------|--------|------------|
| 미배정 → 배정 (`assigneeId` 설정) | `task_assigned` | 학관(담당자) | — |
| `assigneeId` 변경 | `task_reassigned` | 학관(새 담당자) | — |
| `startTime` 30분 전 | `task_reminder` | 학관(담당자) | — |
| `in_progress` → `completed` (reviewer 없음) | `task_completed` | 운영매 (선택) | — |
| `in_progress` → `pending_review` | `task_review_requested` | 운영매(reviewer) | 8h / 2h(긴급) |
| `pending_review` → `completed` (승인) | `task_review_done` | 학관(담당자) | — |
| any → `overdue` (자동) | `task_overdue` | 운영매 | 4h / 1h(긴급) |
| 미배정 Task 감지 | `task_unassigned` | 운영매 | 4h / 1h(긴급) |
| 업무 요청/지시 생성 | `request_received` | 대상자 | — |
| 에스컬레이션 타이머 만료 | `escalation_triggered` | 총괄 | — |

---

## 9. AppNotification 인터페이스 (업데이트)

```typescript
interface AppNotification {
  id: string
  type: NotificationType
  category: NotificationCategory        // 'system' | 'action' | 'threshold'
  title: string
  description: string
  timestamp: string                      // ISO 8601
  isRead: boolean
  linkTo: string                         // 클릭 시 이동 경로
  recipientRole: RecipientRole           // 수신 대상 역할
  relatedTrackId?: string
  relatedTaskId?: string
  relatedStaffId?: string
  priority?: 'normal' | 'urgent'         // 긴급 Task 관련 알림 구분
  escalation?: {
    isEscalated: boolean
    originalRecipientRole?: RecipientRole
    escalatedAt?: string
    originalNotificationId?: string
  }
  isEscalatedAway?: boolean             // 에스컬레이션 되어서 상위로 넘어간 알림
}
```

> **제거됨**: `isMandatory` 필드 — 모든 알림은 역할별 권한에 따라 ON/OFF 가능. "필수" 개념 없음.

### NotificationConfig (기존 유지)

```typescript
interface NotificationConfig {
  trackId: string
  thresholds: {
    staffCompletionRate: number          // 기본 30%
    operatorCompletionRate: number       // 기본 30%
    pendingIssueCount: number            // 기본 3건
    unreadMessageCount: number           // 기본 5건
    overdueTaskCount: number             // 기본 3건
  }
  escalation: {
    staffToOperatorHours: number         // 기본 4시간
    operatorToManagerHours: number       // 기본 8시간
  }
  disabledOptionalAlerts: string[]       // 비활성화한 선택 알림 타입 목록
  digestMode: 'realtime' | 'hourly' | 'daily'
  quietHours: { start: string; end: string } | null
}
```

---

## 10. Admin 알림 설정 연동

`/admin/notifications` 페이지 (`notification-settings.tsx`)에서 트랙별로 설정.

### 역할별 설정 권한

| 설정 영역 | 총괄 | 운영매 | 학관 |
|----------|:----:|:-----:|:----:|
| 에스컬레이션 타이머 | 수정 가능 | 읽기 전용 (값 확인만) | 접근 불가 |
| 알림 ON/OFF (모든 알림) | 수정 가능 | — | — |
| 알림 ON/OFF (운영 수신 알림) | 수정 가능 | 수정 가능 | — |
| 임계치 슬라이더 (모든 항목) | 수정 가능 | — | — |
| 임계치 슬라이더 (운영 수신 항목) | 수정 가능 | 수정 가능 | — |
| 수신 모드 / 방해금지 | 수정 가능 | 수정 가능 | — |

- 총괄(`operator_manager`): 모든 설정 수정 가능
- 운영매(`operator`): 본인이 수신하는 알림(`recipients`에 `operator` 포함)만 토글/임계치 수정 가능. 에스컬레이션 설정은 읽기 전용.
- 학관(`learning_manager`): 설정 페이지 접근 불가 (사이드바에서 시스템 관리 메뉴 미표시)

### 설정 UI 구성

| 설정 항목 | UI | 비고 |
|----------|-----|------|
| 에스컬레이션 시간 | 시간 입력 (총괄만 수정) | 운영매는 잠금 아이콘 + disabled |
| 알림 ON/OFF 토글 | 토글 스위치 | 권한 없는 항목은 disabled + 잠금 아이콘 |
| 임계치 슬라이더 5개 | 슬라이더 (min~max) | 권한 없는 항목은 disabled |
| 수신 모드 | 3개 버튼 (실시간/1시간/일일) | |
| 방해금지 시간 | 시간 범위 입력 | null이면 비활성 |

---

## 11. 미결정 / TODO

- [ ] 브라우저 푸시 알림 구현 (Notification API + Service Worker)
- [ ] 에스컬레이션 타이머 실제 구현 방식 (setTimeout / 서버 cron / 폴링)
- [ ] 이메일 알림 채널 추가 여부
- [ ] 알림 일괄 읽음 처리 UI
- [ ] 알림 보관/삭제 정책 (N일 후 자동 삭제?)
- [ ] 이슈 시스템 구현 시 `issue_*` 알림 타입 재추가
- [ ] 임계치 측정 주기 (매시? 실시간?)
- [ ] 학관의 overdue 알림 수신 여부 재검토 (현재: 미수신)
