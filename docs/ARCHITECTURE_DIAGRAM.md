# EduWorks — 페이지 구조도

> GitHub에서 Mermaid 다이어그램이 바로 렌더링됩니다.
> 고해상도가 필요하면 [Mermaid Live Editor](https://mermaid.live)에 코드를 붙여넣어 PNG/SVG로 내보내세요.

---

## 전체 페이지 구조

```mermaid
flowchart TB
    classDef entry fill:#374151,color:#F9FAFB,stroke:#1F2937,stroke-width:2px
    classDef mgr fill:#7C3AED,color:#fff,stroke:#5B21B6,stroke-width:2px
    classDef op fill:#0284C7,color:#fff,stroke:#0369A1,stroke-width:2px
    classDef lm fill:#059669,color:#fff,stroke:#047857,stroke-width:2px
    classDef track fill:#D97706,color:#fff,stroke:#B45309,stroke-width:2px
    classDef admin fill:#DC2626,color:#fff,stroke:#B91C1C,stroke-width:2px
    classDef sub fill:#F3F4F6,color:#1F2937,stroke:#D1D5DB,stroke-width:1px

    ROOT(["/ 역할별 자동 리다이렉트"]):::entry

    ROOT --> M & O & S

    subgraph G1 [" 운영기획매니저 대시보드 "]
        M["/managers/[id]"]:::mgr
        M1["트랙 건강도<br/>(30일 스파크라인)"]:::sub
        M2["트랙별 현황 카드"]:::sub
        M3["내가 할 일"]:::sub
    end

    subgraph G2 [" 운영매니저 대시보드 "]
        O["/operators/[id]"]:::op
        O1["트랙별 현황 카드"]:::sub
        O2["트랙별 할 일"]:::sub
        O3["내가 할 일"]:::sub
    end

    M --> M1 & M2 & M3
    O --> O1 & O2 & O3

    M & O --> T

    subgraph G3 [" 트랙별 대시보드 "]
        T["/tracks/[id]"]:::track
        T1["Task 시트<br/>(2-column 레이아웃)"]:::sub
        T2["일정 캘린더<br/>(월간 / 주간)"]:::sub
    end

    T --> T1 & T2

    subgraph G4 [" 학관매 대시보드 "]
        S["/staff/[id]"]:::lm
        S1["업무 탭<br/>(시간 업무 + 업무 리스트 + 소통)"]:::sub
        S2["일정 탭<br/>(캘린더 + 기간 할 일)"]:::sub
        S3["면담 탭<br/>(팀 순회 + 수강생 로그)"]:::sub
    end

    S --> S1 & S2 & S3

    subgraph G5 [" 시스템 관리 "]
        A1["트랙 생성/편집 위저드<br/>(8단계)"]:::admin
        A2["알림 설정"]:::admin
    end

    M -->|"총괄 전용"| A1
    M & O --> A2
```

---

## 역할별 접근 권한

```mermaid
flowchart LR
    classDef mgr fill:#7C3AED,color:#fff,stroke:#5B21B6,stroke-width:2px
    classDef op fill:#0284C7,color:#fff,stroke:#0369A1,stroke-width:2px
    classDef lm fill:#059669,color:#fff,stroke:#047857,stroke-width:2px
    classDef page fill:#F3F4F6,color:#1F2937,stroke:#D1D5DB,stroke-width:1px

    R1["운영기획매니저<br/>(총괄)"]:::mgr
    R2["운영매니저<br/>(운영)"]:::op
    R3["학습관리매니저<br/>(학관)"]:::lm

    P1["운영기획매니저 대시보드"]:::page
    P2["운영매니저 대시보드"]:::page
    P3["트랙별 대시보드"]:::page
    P4["학관매 대시보드"]:::page
    P5["트랙 생성/편집"]:::page
    P6["알림 설정"]:::page

    R1 --> P1 & P2 & P3 & P4 & P5 & P6
    R2 --> P2 & P3 & P4 & P6
    R3 --> P4
```

---

## 조직 위임 구조

```mermaid
graph TD
    classDef mgr fill:#7C3AED,color:#fff,stroke:#5B21B6,stroke-width:2px
    classDef op fill:#0284C7,color:#fff,stroke:#0369A1,stroke-width:2px
    classDef lm fill:#059669,color:#fff,stroke:#047857,stroke-width:2px

    GM["운영기획매니저"]:::mgr
    OP1["운영매니저 A"]:::op
    OP2["운영매니저 B"]:::op
    LM1["학관 1"]:::lm
    LM2["학관 2"]:::lm
    LM3["학관 3"]:::lm
    LM4["학관 4"]:::lm

    GM --> OP1 & OP2
    OP1 --> LM1 & LM2
    OP2 --> LM3 & LM4
```

---

## 위저드 흐름 (트랙 생성 8단계)

```mermaid
graph LR
    classDef step fill:#F3F4F6,color:#1F2937,stroke:#9CA3AF,stroke-width:1px
    classDef key fill:#FEF3C7,color:#92400E,stroke:#D97706,stroke-width:2px

    S1["1. 기본 정보"]:::step
    S2["2. 시간표<br/>업로드"]:::step
    S3["3. 챕터<br/>편성"]:::step
    S4["4. 인원<br/>배정"]:::step
    S5["5. Task<br/>생성"]:::key
    S6["6. 담당자<br/>배정"]:::key
    S7["7. Task<br/>확인"]:::step
    S8["8. 최종<br/>확인"]:::step

    S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8
```
