# 글로벌 플로팅 소통 위젯 정책

> 파일: `components/comm/floating-comm-widget.tsx`
> 마운트: `app/layout.tsx` (모든 페이지에서 사용 가능)
> 디자인: 채널톡/Intercom 스타일 + macOS 느낌 + 프로젝트 디자인 일관성(무채색 미니멀)

---

## 1. 개요

운영 커뮤니케이션을 한 곳에서 처리하는 글로벌 플로팅 위젯.
기존 트랙 대시보드의 소통 탭(`TrackCommPanel`)을 대체하며, 모든 페이지에서 접근 가능.

### 1.1 배경

- 트랙 대시보드 탭이 제거됨 (Task 탭이 기본 랜딩)
- 소통 기능은 트랙에 종속되지 않고 글로벌하게 필요
- 알림 + 1:1 채팅을 하나의 위젯에서 통합 관리
- **학관(learning_manager)은 대상에서 제외** — 학관 대시보드 우측에 자체 소통 채널(`comm-channel.tsx`)이 있음

### 1.2 역할별 제공 범위

| 역할 | 플로팅 위젯 | 채팅 상대 | 비고 |
|------|:----------:|----------|------|
| 총괄(operator_manager) | ✅ | 운영매니저들 | 트랙별로 운영매니저 1:1 채팅 |
| 운영(operator) | ✅ | 총괄 + 학관매들 | 총괄 1:1 + 트랙별 학관매 1:1 |
| 학관(learning_manager) | ❌ | — | `comm-channel.tsx` (학관 대시보드 우측) 사용 |

---

## 2. UI 구조

### 2.1 플로팅 버튼

```
위치: fixed bottom-6 right-6 (z-50)
크기: 56px (h-14 w-14)
아이콘: MessageSquare (lucide)
뱃지: 안읽은 총합 (빨간 원형, 우상단, min-w-5)
```

- 패널이 열리면 버튼 숨김
- 학관 역할이면 렌더링하지 않음 (`if (currentRole === 'learning_manager') return null`)
- 안읽은 수: `commUnreadMap` 값 합계 + `commNotifications.filter(n => !n.isRead).length`
- hover: `scale-105 shadow-[0_6px_24px_...]`, active: `scale-95`

### 2.2 패널 레이아웃

```
크기: 680px × 560px
위치: fixed bottom-6 right-6 (z-50)

┌─────────────┬──────────────────────────────────┐
│ 좌측 사이드바 │  우측 콘텐츠                       │
│ (200px)      │  (flex-1)                        │
│              ├──────────────────────────────────┤
│ 소통 (헤더)   │  타이틀바 (macOS 스타일)    [−][×] │
│              ├──────────────────────────────────┤
│ 🔔 알림      │                                  │
│ ─────────── │  메시지 영역 / 알림 피드            │
│ ● 박총괄     │  (스크롤)                         │
│ ─────────── │                                  │
│ ▼ AI 트랙 7기│                                  │
│   ● 김학관   │                                  │
│   ● 이학관   ├──────────────────────────────────┤
│   ● 박학관   │  입력 영역                         │
│ ▶ BE 트랙 5기│  [  메시지 입력...        ] [전송]  │
│   ...        │                                  │
└─────────────┴──────────────────────────────────┘
```

기본 상태(채널 미선택): "채널을 선택하세요" placeholder (MessageSquare 아이콘 + 텍스트).

### 2.3 디자인 시스템

- **컨테이너**: `rounded-2xl border border-foreground/[0.08] bg-background shadow-[0_8px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03)]`
- **사이드바**: `bg-foreground/[0.02]`, 헤더 `bg-foreground/[0.015]` — `w-[200px]`
- **타이틀바**: macOS 스타일 (`h-12`, 좌측 채널명 + 우측 최소화/닫기 버튼)
- **채팅 버블**: 본인=`bg-foreground text-background`, 상대=`bg-foreground/[0.05] text-foreground`
- **버블 라운딩**: iMessage 스타일 (연속 메시지 시 코너 축소)
- **입력 영역**: `rounded-xl border border-foreground/[0.06] bg-foreground/[0.02]`

---

## 3. 채널 종류

### 3.1 알림 (notifications)

| 항목 | 값 |
|------|-----|
| ID | `notifications` |
| 읽기 권한 | 총괄, 운영 |
| 데이터 | `useAdminStore.commNotifications` |
| 필터 | 전체 / 트랙별 내부 필터 탭 |

- **단일 알림 채널**이며 트랙별 내부 필터 탭으로 분류
- 알림 유형: `task_assigned`, `task_completed`, `task_overdue`, `review_requested`, `review_done`, `reminder`, `general`
- 알림 클릭 시 `trackId + taskId`가 있으면 `/tracks/{trackId}/tasks?openTask={taskId}` 이동
- **개별 확인(ack)**: 체크박스 토글로 개별 알림 확인 처리 (로컬 state `ackedIds`)

### 3.2 1:1 채팅

| 항목 | 값 |
|------|-----|
| ID | `chat:{상위자Id}:{하위자Id}` |
| 참여자 | 2인 (위계 관계) |
| 데이터 | `useAdminStore.commMessages[channelId]` |
| 기능 | 메시지 전송, 답장(reply-to), 리액션(👍), sticky 메모, task 스레드 카드 |

---

## 4. 역할별 사이드바 구성

### 4.1 총괄 (operator_manager)

```
🔔 알림
─────────────
▼ AI 트랙 7기
  ● 이운영 (운영매)        ← chat:mgr1:op1
▼ BE 트랙 5기
  ● 김운영 (운영매)        ← chat:mgr1:op2
```

- 트랙 아래에는 **운영매니저만** 표시 (학관 표시 없음)
- `plannerTracks` 전체 표시 (총괄은 모든 트랙 조회 가능)

### 4.2 운영 (operator)

```
🔔 알림
─────────────
● 박총괄                  ← chat:mgr1:op1 (총괄과 1:1)
─────────────
▼ AI 트랙 7기 (담당 트랙만)
  ● 김학관               ← chat:op1:staff1
  ● 이학관               ← chat:op1:staff2
  ● 박학관               ← chat:op1:staff3
```

- 총괄은 알림 바로 아래 상단 고정 (세퍼레이터로 구분)
- 트랙 아래에는 담당 학관매 표시
- `plannerTracks.filter(t.operator?.id === currentUserId)` — 담당 트랙만

### 4.3 학관 (learning_manager)

- **플로팅 위젯 미표시** (학관 대시보드 우측 `comm-channel.tsx` 사용)

### 4.4 사이드바 UI 세부사항

- **트랙 그룹 접기/펼치기**: ChevronDown/ChevronRight 토글 (기본: 첫 번째 트랙만 펼침)
- **컬러 dot**: 트랙=트랙 색상, 사용자=`bg-foreground/20`
- **안읽은 수 뱃지**: 접힌 상태에서 그룹 전체 안읽은 수 표시
- **SidebarItem**: `indent` prop으로 트랙 하위 사용자에 `pl-8` 적용

---

## 5. 채팅 기능 상세

### 5.1 메시지 버블

| 항목 | 본인 메시지 | 상대 메시지 |
|------|-----------|-----------|
| 정렬 | 오른쪽 (`items-end`) | 왼쪽 (`items-start`) |
| 배경 | `bg-foreground text-background` | `bg-foreground/[0.05] text-foreground` |
| 라운딩 | `rounded-[18px]`, 연속 시 `rounded-tr-[6px]` + `rounded-br-[6px]` | `rounded-[18px]`, 연속 시 `rounded-tl-[6px]` + `rounded-bl-[6px]` |
| 이름 | 숨김 | 연속 아닐 때만 표시 |
| 시간 | 연속이고 hover 아닐 때 숨김 (`opacity-0`), 그 외 표시 | 동일 |
| 간격 | 연속: `mt-[3px]`, 비연속: `mt-3` | 동일 |

**본인 메시지 판별**: `msg.authorId === currentUserId`
- `currentUserId` = `ROLE_USER_MAP[currentRole]` (동적 계산)
- 기존 `isCurrentUser` 필드는 제거됨 — authorId로 매번 비교

### 5.2 답장 (Reply)

- 메시지 hover → 답장 버튼 (Reply 아이콘)
- 클릭 → 입력 영역 위에 답장 프리뷰 표시 (`replyTarget` state)
- 전송 시 `replyTo` 필드에 원본 정보 포함 (`{ authorName, content }`)
- 버블 내 답장 인용 블록: `border-l-2 border-foreground/10 bg-foreground/[0.025]`
- 답장 프리뷰: Reply 아이콘 + "~에게 답장" + 내용 한 줄 + X 버튼

### 5.3 리액션

- 메시지 hover → 👍 버튼 (ThumbsUp 아이콘)
- 클릭 시 `addCommReaction(channelId, msgId, '👍')`
- 이모지 태그: `rounded-full bg-foreground/[0.05]` — emoji + count 표시
- 액션 팝업: hover 시 메시지 위에 표시 (`absolute -top-2.5`, Reply + ThumbsUp 2버튼)

### 5.4 Sticky 메모

- 채팅 영역 상단에 핀 고정 메모 (채널당 1개)
- 작성 권한:
  - 총괄 → 운영매니저 채팅방에 sticky 작성 가능 (`channelId.startsWith('chat:' + currentUserId + ':')`)
  - 운영 → 학관매 채팅방에 sticky 작성 가능 (동일 조건)

#### 3가지 상태

| 상태 | 표시 |
|------|------|
| **미작성 (placeholder)** | 핀 아이콘 + `"메모 추가..."` 1줄 compact 버튼 |
| **인라인 인풋** | placeholder 클릭 시 바로 인풋 활성화 (autoFocus), 등록 버튼이 인풋 내부 우측에 배치 |
| **등록된 메모** | 1줄 compact 표시 (truncate), 작성자만 수정/삭제 아이콘 표시 (Pencil/Trash2) |

- Enter로 등록, Escape로 취소 (IME 조합 중 Enter 방지: `!e.nativeEvent.isComposing`)
- 수정: Pencil 버튼 → 인라인 인풋 재활성화 (기존 내용 pre-fill)
- 삭제: Trash2 버튼 → `deleteStickyNote(channelId)`
- 타인은 읽기 전용

#### 힌트 문구

인풋 아래에 역할별 안내 표시:
- 총괄: `"{운영매니저 이름}에게만 보입니다"` — 대상 트랙의 operator name 조회
- 운영: `"{트랙명} 학관매들에게만 보입니다"` — 대상 학관이 속한 트랙명 조회

### 5.5 Task 스레드 카드 (taskPreview)

- 채팅 내에 task 관련 대화가 인라인으로 표시 (`msg.taskPreview` 존재 시)
- 카드 클릭 시 `/tracks/{trackId}/tasks?openTask={taskId}` 이동 + 패널 닫힘
- 카드 디자인: `rounded-lg border border-blue-500/15 bg-blue-50/80`, ListTodo 아이콘 + 제목 + 마지막 메시지 미리보기
- 안읽은 수 뱃지: `rounded-[4px] bg-blue-500 text-white`
- dark 모드: `dark:bg-blue-500/[0.06] dark:hover:bg-blue-500/[0.10]`

### 5.6 입력 영역

- textarea (auto-grow, 최대 80px — `max-h-20`)
- Enter → 전송 (Shift+Enter → 줄바꿈)
- IME 조합 중 Enter 방지 (`!e.nativeEvent.isComposing` 체크)
- 전송 버튼: 입력 있으면 `bg-foreground text-background`, 없으면 `text-foreground/15`
- active: `scale-90` transition

### 5.7 채널 전환 시 초기화

`channelId` 변경 시 (`useEffect`):
- `input` 초기화
- `replyTarget` 초기화
- `stickyInput` / `editSticky` 초기화

---

## 6. 알림 피드 상세

### 6.1 구조

- 상단 필터 탭: 전체 / 트랙별 (track.name에서 기수 제거: `name.replace(/ \d+기$/, '')`)
  - 총괄: 전체 트랙 표시
  - 운영: 담당 트랙만 표시
- 필터 탭 디자인: `FilterTab` 컴포넌트 — 트랙 컬러 dot + 이름

### 6.2 알림 유형별 아이콘

| 유형 | 아이콘 | 색상 |
|------|--------|------|
| task_assigned | ListTodo | blue-500 |
| task_completed | CheckCircle2 | emerald-500 |
| task_overdue | AlertTriangle | amber-500 |
| review_requested | UserCheck | violet-500 |
| review_done | CheckCircle2 | emerald-500 |
| reminder | Clock | orange-400 |
| general | Bell | foreground/40 |

### 6.3 알림 카드 UI

- **체크박스**: 좌측에 확인(ack) 토글 (로컬 state, 확인 시 `opacity-45` + `line-through`)
- **아이콘**: `h-6 w-6 rounded-md bg-foreground/[0.04]` 배경
- **내용**: 1줄 텍스트 + 우측 시간 (오전/오후 포맷)
- **Task 제목**: 하단에 truncate 표시, hover 시 밝아짐
- **트랙 태그**: `rounded bg-foreground/[0.04] text-[9px]`
- 클릭 가능한 알림 (taskId 존재 시): `cursor-pointer` + task 페이지 이동

---

## 7. 데이터 소스

모든 데이터는 `useAdminStore` (Zustand)에서 관리:

### 7.1 Store State

| 상태 | 타입 | 설명 |
|------|------|------|
| `commNotifications` | `CommSystemNotification[]` | 시스템 알림 목록 |
| `commMessages` | `Record<string, CommMessage[]>` | 채널별 메시지 (key: channelId) |
| `commStickies` | `Record<string, StickyNotice>` | 채널별 sticky 메모 |
| `commUnreadMap` | `Record<string, number>` | 채널별 안읽은 수 |

### 7.2 Store Actions

| 액션 | 시그니처 | 설명 |
|------|---------|------|
| `addCommMessage` | `(channelId, message: CommMessage) => void` | 메시지 전송 |
| `addCommReaction` | `(channelId, msgId, emoji) => void` | 리액션 추가 (토글 아님, 기존 emoji count++) |
| `updateStickyNote` | `(channelId, content, authorId, authorName) => void` | sticky 생성/수정 |
| `deleteStickyNote` | `(channelId) => void` | sticky 삭제 |
| `markCommNotificationRead` | `(notificationId) => void` | 알림 읽음 처리 |

### 7.3 역할/사용자 매핑

| 상수 | 파일 | 용도 |
|------|------|------|
| `ROLE_USER_MAP` | `lib/role-store.ts` | 역할 → 사용자 ID (`operator_manager: 'mgr1'`, `operator: 'op1'`, `learning_manager: 'staff1'`) |
| `ROLE_USER_NAME` | `lib/role-store.ts` | 역할 → 사용자 이름 (`operator_manager: '박총괄'`, `operator: '이운영'`, `learning_manager: '김학관'`) |

### 7.4 본인 메시지 판별 (D-2 수정사항)

```
isCurrentUser 판별 = msg.authorId === ROLE_USER_MAP[currentRole]
```

- 기존: `msg.isCurrentUser` 필드 (mock 데이터에 하드코딩)
- 현재: `msg.authorId === currentUserId` 동적 비교
- `currentUserId`는 컴포넌트 최상단에서 `ROLE_USER_MAP[currentRole]`로 계산

### 7.5 트랙/학관 데이터

| 데이터 | 소스 | 용도 |
|--------|------|------|
| 트랙 목록 | `useAdminStore.plannerTracks` | 사이드바 트랙 그룹, 알림 필터 탭 |
| 현재 역할 | `useRoleStore.currentRole` | 위젯 표시 여부, 사이드바 구성 |

---

## 8. 파일 구조

```
components/comm/
  floating-comm-widget.tsx   # 메인 위젯 (all-in-one)
                             # - FloatingCommWidget (export)
                             # - ChannelSidebar
                             # - SidebarItem
                             # - TitleBar
                             # - NotificationFeed
                             # - FilterTab
                             # - ChatView
                             # - TaskPreviewCard

components/dashboard/
  comm-channel.tsx           # 학관 대시보드 전용 소통 채널 (학관은 이것을 사용)

lib/
  role-store.ts              # ROLE_USER_MAP, ROLE_USER_NAME, AppRole 타입
  admin-store.ts             # commNotifications, commMessages, commStickies, commUnreadMap + actions
  admin-mock-data.ts         # CommMessage, CommSystemNotification, StickyNotice 타입 + mock 데이터
```

기존 `components/track/track-comm-panel.tsx`는 삭제됨 (대시보드 탭 제거 시 함께 삭제).

---

## 9. 미결정 / TODO

- [x] 알림을 스토어로 이전 (`commNotifications` → `useAdminStore`)
- [x] 채팅 메시지를 스토어로 이전 (`commMessages` → `useAdminStore`)
- [x] Sticky 메모를 스토어로 이전 (`commStickies` → `useAdminStore`)
- [x] 안읽은 메시지 수 스토어로 이전 (`commUnreadMap` → `useAdminStore`)
- [x] `isCurrentUser` 필드 제거 → `authorId` 동적 비교로 전환
- [ ] 안읽은 메시지 수 동적 계산 (현재 mock 초기값, 메시지 추가 시 자동 차감 미구현)
- [ ] 채팅 채널 동적 생성 (현재는 mock 기반 고정)
- [ ] 이미지/파일 첨부 기능
- [ ] 메시지 검색
- [ ] 알림 연동 (`AppNotification` ACT-10)
- [ ] `markCommNotificationRead` 알림 클릭 시 자동 호출 연동
- [ ] 리액션 이모지 다양화 (현재 👍 단일)
