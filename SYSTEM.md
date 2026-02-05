# StyleFinder AI - 시스템 문서

> **인수인계 문서** | Last Updated: 2026-02-05

---

## 📋 목차

1. [프로젝트 개요 (PRD)](#1-프로젝트-개요-prd)
2. [기술 스택](#2-기술-스택)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [데이터베이스 설계 (ERD)](#4-데이터베이스-설계-erd)
5. [상세 기능 정의](#5-상세-기능-정의)
6. [API 명세서](#6-api-명세서)
7. [프로젝트 구조](#7-프로젝트-구조)
8. [개발 환경 설정](#8-개발-환경-설정)
9. [배포 가이드](#9-배포-가이드)

---

## 1. 프로젝트 개요 (PRD)

### 1.1 서비스 소개

**StyleFinder AI**는 한국어 기반의 패션 성격 진단 및 AI 스타일링 플랫폼입니다.

사용자는 MBTI와 유사한 **SIT (Style Identity Type)** 테스트를 통해 16가지 패션 성격 유형 중 자신의 유형을 발견하고, AI 패션 페르소나로부터 착장 평가를 받을 수 있습니다.

### 1.2 핵심 가치 제안

| 가치 | 설명 |
|------|------|
| 🎨 **개인화된 패션 진단** | 16가지 SIT 유형으로 사용자의 패션 성격 파악 |
| 🤖 **AI 스타일링 평가** | 3명의 가상 패션 전문가가 착장 이미지를 분석 |
| 💬 **대화형 패션 상담** | AI 페르소나와 실시간 패션 상담 |
| 👔 **TPO 기반 추천** | 시즌과 상황에 맞는 코디 추천 |

### 1.3 타겟 사용자

- **Primary**: 20-30대 패션에 관심 있는 한국 사용자
- **Secondary**: 패션 스타일 개선을 원하는 전 연령대

### 1.4 주요 기능 요약

```
┌─────────────────────────────────────────────────────────────────┐
│                      StyleFinder AI                             │
├─────────────────────────────────────────────────────────────────┤
│  📝 SIT 테스트     │  16가지 패션 유형 진단 (12문항)            │
│  📸 패션 평가      │  이미지 업로드 → AI 분석 → 점수/피드백      │
│  💬 패션 챗봇      │  3명의 AI 페르소나와 대화형 상담            │
│  👗 코디 추천      │  TPO(시간/장소/상황) 기반 아웃핏 추천       │
│  📊 성장 기록      │  월별 평가 통계 및 즐겨찾기                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 기술 스택

### 2.1 Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.3.x | UI 프레임워크 |
| TypeScript | 5.6.3 | 타입 안정성 |
| Vite | 7.3.x | 빌드 도구 |
| Wouter | 3.3.x | 클라이언트 라우팅 |
| TanStack Query | 5.x | 서버 상태 관리 |
| Tailwind CSS | 3.4.x | 스타일링 |
| shadcn/ui | - | UI 컴포넌트 라이브러리 |
| Framer Motion | 11.x | 애니메이션 |
| Recharts | 2.x | 레이더 차트 시각화 |
| react-dropzone | 14.x | 이미지 업로드 |

### 2.2 Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 20.x+ | 런타임 |
| Express | 5.x | 웹 프레임워크 |
| TypeScript | 5.6.3 | 타입 안정성 |
| Drizzle ORM | 0.39.x | 데이터베이스 ORM |
| Zod | 3.x | 스키마 검증 |
| openai SDK | 6.x | AI API 클라이언트 |

### 2.3 Database & Auth

| 기술 | 용도 |
|------|------|
| PostgreSQL | 주 데이터베이스 |
| Drizzle Kit | DB 마이그레이션 |
| Replit Auth | 사용자 인증 (OpenID Connect) |
| Passport.js | 인증 미들웨어 |
| connect-pg-simple | 세션 스토리지 |

### 2.4 AI Integration

| 서비스 | 모델 | 용도 |
|--------|------|------|
| OpenAI | gpt-5.2 | 이미지 분석 (패션 평가) |
| OpenAI | gpt-4o-mini | 챗봇 대화, 추천 생성 |

---

## 3. 시스템 아키텍처

### 3.1 전체 아키텍처

```mermaid
flowchart TB
    subgraph Client["Frontend (React)"]
        Pages["Pages<br/>Home, Test, Evaluate,<br/>Chat, Recommend, etc."]
        Hooks["Hooks<br/>use-sit, use-assessments<br/>use-chat, use-auth"]
        Components["UI Components<br/>shadcn/ui"]
    end

    subgraph Server["Backend (Express)"]
        Routes["API Routes"]
        Storage["Storage Layer"]
        Auth["Replit Auth"]
    end

    subgraph External["External Services"]
        OpenAI["OpenAI API<br/>gpt-5.2 / gpt-4o-mini"]
        PostgreSQL["PostgreSQL<br/>Database"]
    end

    Pages --> Hooks
    Hooks --> Routes
    Routes --> Storage
    Routes --> Auth
    Routes --> OpenAI
    Storage --> PostgreSQL
    Auth --> PostgreSQL
```

### 3.2 인증 플로우

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant R as Replit Auth

    U->>F: 로그인 클릭
    F->>B: /api/login
    B->>R: OpenID Connect
    R-->>B: 사용자 정보
    B-->>F: 세션 생성
    F-->>U: 인증 완료
```

### 3.3 패션 평가 플로우

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as OpenAI

    U->>F: 이미지 업로드 + 페르소나 선택
    F->>F: 이미지 압축 (browser-image-compression)
    F->>B: POST /api/assessments (Base64)
    B->>AI: Vision API 호출
    AI-->>B: JSON (scores + feedback)
    B->>B: DB 저장
    B-->>F: Assessment 결과
    F-->>U: 결과 표시 (레이더 차트 + 마크다운)
```

---

## 4. 데이터베이스 설계 (ERD)

### 4.1 ERD 다이어그램

```mermaid
erDiagram
    users ||--o{ sit_results : has
    users ||--o{ assessments : has
    users ||--o{ conversations : has
    users ||--o{ recommendations : has
    conversations ||--o{ messages : contains

    users {
        varchar id PK "UUID"
        varchar email UK
        varchar first_name
        varchar last_name
        varchar profile_image_url
        timestamp created_at
        timestamp updated_at
    }

    sessions {
        varchar sid PK
        jsonb sess
        timestamp expire
    }

    sit_results {
        serial id PK
        text user_id FK
        text sit_type "IWSM, EWSB 등 16종"
        jsonb scores "IE, WC, SN, MB 점수"
        timestamp created_at
    }

    assessments {
        serial id PK
        text user_id FK
        text image_url "Base64 또는 URL"
        text persona "sujin, minsu, jihyun"
        jsonb scores "harmony, trend, body"
        text feedback "마크다운 형식"
        boolean is_favorite
        timestamp created_at
    }

    conversations {
        serial id PK
        text user_id FK
        text persona "sujin, minsu, jihyun"
        text title
        timestamp created_at
    }

    messages {
        serial id PK
        integer conversation_id FK
        text role "user, assistant"
        text content
        timestamp created_at
    }

    recommendations {
        serial id PK
        text user_id FK
        text season "spring, summer, fall, winter"
        text occasion "date_casual, business_work 등"
        text sit_type
        jsonb outfit_set "top, bottom, shoes, accessory"
        text reasoning
        jsonb alternatives
        boolean is_favorite
        timestamp created_at
    }
```

### 4.2 테이블 상세 설명

#### `users` - 사용자 정보
Replit Auth에서 자동 관리되는 테이블. **수정 금지**.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | VARCHAR (UUID) | 사용자 고유 ID |
| email | VARCHAR | 이메일 (고유) |
| first_name | VARCHAR | 이름 |
| last_name | VARCHAR | 성 |
| profile_image_url | VARCHAR | 프로필 이미지 URL |

#### `sessions` - 세션 정보
Replit Auth 세션 저장소. **수정 금지**.

#### `sit_results` - SIT 테스트 결과

| 컬럼 | 타입 | 설명 |
|------|------|------|
| sit_type | TEXT | 16가지 유형 코드 (예: "IWSM", "ECNB") |
| scores | JSONB | `{ IE: 70, WC: 45, SN: 60, MB: 80 }` |

#### `assessments` - 패션 평가 결과

| 컬럼 | 타입 | 설명 |
|------|------|------|
| image_url | TEXT | 업로드된 이미지 (Base64) |
| persona | TEXT | 평가한 AI 페르소나 |
| scores | JSONB | `{ harmony: 8, trend: 7, body: 9 }` (1-10점) |
| feedback | TEXT | 마크다운 형식의 분석 피드백 |
| is_favorite | BOOLEAN | 즐겨찾기 여부 |

#### `conversations` & `messages` - 채팅 시스템

대화 세션과 메시지를 분리하여 저장. `messages.role`은 "user" 또는 "assistant".

#### `recommendations` - 코디 추천

| 컬럼 | 타입 | 설명 |
|------|------|------|
| season | TEXT | 계절 (spring/summer/fall/winter) |
| occasion | TEXT | 상황 코드 (date_casual, business_work 등) |
| outfit_set | JSONB | `{ top: {...}, bottom: {...}, shoes: {...}, accessory: {...} }` |
| alternatives | JSONB | 대안 스타일 배열 |

---

## 5. 상세 기능 정의

### 5.1 SIT 테스트 (Style Identity Type)

#### 5.1.1 개요
12개 질문을 통해 사용자의 패션 성격을 16가지 유형 중 하나로 진단합니다.

#### 5.1.2 유형 분류 체계

4개의 축 × 2개의 값 = 16가지 유형

| 축 | 의미 | 값 |
|----|------|-----|
| **I/E** | 표현 방향 | I(내향) / E(외향) |
| **W/C** | 스타일 온도 | W(따뜻함) / C(차가움) |
| **S/N** | 변화 성향 | S(안정) / N(새로움) |
| **M/B** | 디테일 관심도 | M(미니멀) / B(볼드) |

#### 5.1.3 16가지 SIT 유형

| 코드 | 닉네임 | 스타일 |
|------|--------|--------|
| IWSM | 고요한 숲 | 미니멀 캐주얼 |
| IWSB | 아늑한 서재 | 빈티지 캐주얼 |
| IWNM | 젠 마스터 | 노멀코어 |
| IWNB | 숨은 예술가 | 아방가르드 캐주얼 |
| ICSM | 차분한 그림자 | 다크 미니멀 |
| ICSB | 비밀의 정원 | 고딕 로맨틱 |
| ICNM | 미래에서 온 | 테크웨어 |
| ICNB | 밤의 예술가 | 스트리트 아방가르드 |
| EWSM | 햇살의 미소 | 프레피 캐주얼 |
| EWSB | 봄날의 정원사 | 로맨틱 캐주얼 |
| EWNM | 트렌드 서퍼 | 컨템포러리 캐주얼 |
| EWNB | 무대 위의 꽃 | 맥시멀리즘 |
| ECSM | 도시의 건축가 | 모던 미니멀 |
| ECSB | 밤의 사교가 | 글램 시크 |
| ECNM | 런웨이 스카우터 | 하이패션 미니멀 |
| ECNB | 스타일 아이콘 | 스테이트먼트 패션 |

#### 5.1.4 점수 계산 로직

```typescript
// 각 축당 3문항, 총 12문항
// 점수 = (해당 축에서 E/W/N/B 선택 횟수 / 3) × 100

예시: IE 축에서 "I" 2개, "E" 1개 선택
→ IE 점수 = (2/3) × 100 ≈ 67 (I 성향)

최종 유형 결정:
- IE 점수 > 50 → "I", 아니면 "E"
- WC 점수 > 50 → "W", 아니면 "C"
- ...
```

### 5.2 패션 평가 (AI Assessment)

#### 5.2.1 개요
사용자가 착장 사진을 업로드하면 AI 페르소나가 3가지 기준으로 평가합니다.

#### 5.2.2 AI 페르소나

| 페르소나 | 이름 | 역할 | 특징 |
|----------|------|------|------|
| sujin | 패션 에디터 수진 | 10년 경력 매거진 에디터 | 트렌드 중시, 세련된 분석 |
| minsu | 포토그래퍼 민수 | 스트리트 패션 사진작가 | 개성 중시, 친근한 톤 |
| jihyun | 스타일리스트 지현 | 연예인 스타일리스트 | 체형 보완, 실용적 조언 |

#### 5.2.3 평가 기준 (1-10점)

| 항목 | 설명 |
|------|------|
| **harmony** (조화) | 색상, 소재, 실루엣의 조화도 |
| **trend** (트렌드) | 최신 트렌드 반영도 |
| **body** (체형) | 체형 보완/비율 연출 효과 |

#### 5.2.4 배치 분석 기능
최대 10장의 이미지를 동시에 분석하여 개별 피드백 + 종합 피드백 제공.

### 5.3 패션 챗봇

#### 5.3.1 개요
선택한 AI 페르소나와 대화형으로 패션 상담을 받을 수 있습니다.

#### 5.3.2 기능
- 대화 생성/조회/삭제
- 텍스트 메시지 전송
- 이미지 첨부 분석
- 대화 히스토리 유지 (최근 10개 메시지 컨텍스트)

#### 5.3.3 페르소나별 말투

| 페르소나 | 말투 예시 |
|----------|----------|
| 수진 | "오 대박~ 이거 진짜 힙해요! ✨" |
| 민수 | "말씀하신 부분에서 핏이 중요합니다." |
| 지현 | "이 조합에서 색감 밸런스를 조절하면..." |

### 5.4 코디 추천

#### 5.4.1 개요
시즌과 상황(TPO)에 맞는 아웃핏을 AI가 추천합니다.

#### 5.4.2 상황 옵션

| 카테고리 | 코드 | 설명 |
|----------|------|------|
| **데이트** | date_casual | 캐주얼 데이트 |
| | date_special | 특별한 날 데이트 |
| **비즈니스** | business_work | 출근 |
| | business_meeting | 프레젠테이션/미팅 |
| | business_dinner | 회식 |
| **첫인상** | first_interview | 면접 |
| | first_blind_date | 소개팅 |
| **일상** | daily_home | 재택근무 |
| | daily_cafe | 카페 |
| | daily_travel | 여행 |
| **이벤트** | event_wedding | 결혼식 |
| | event_party | 파티 |
| | event_reunion | 동창회 |

#### 5.4.3 추천 결과 구조

```json
{
  "outfitSet": {
    "top": { "item": "니트", "color": "베이지", "reason": "..." },
    "bottom": { "item": "슬랙스", "color": "네이비", "reason": "..." },
    "shoes": { "item": "로퍼", "color": "브라운", "reason": "..." },
    "accessory": { "item": "가죽 벨트", "color": "브라운", "reason": "..." }
  },
  "reasoning": "전체 코디 컨셉 설명",
  "alternatives": [
    { "name": "대안 스타일 1", "description": "..." }
  ]
}
```

### 5.5 히스토리 & 통계

- **월별 평가 기록**: 캘린더 형태로 과거 평가 조회
- **즐겨찾기**: 마음에 드는 평가/추천 저장
- **통계**: 총 평가 수, 평균 점수, 월별 평가 횟수

---

## 6. API 명세서

### 6.1 인증

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/login` | Replit Auth 로그인 |
| GET | `/api/logout` | 로그아웃 |
| GET | `/api/user` | 현재 사용자 정보 |

### 6.2 SIT API

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/sit/submit` | SIT 결과 제출 | ✅ |
| GET | `/api/sit/latest` | 최신 SIT 결과 조회 | ✅ |

**POST /api/sit/submit - Request Body**
```typescript
{
  answers: Record<string, string>,  // { q1: "I", q2: "W", ... }
  calculatedType: string,           // "IWSM"
  scores: {
    IE: number,  // 0-100
    WC: number,
    SN: number,
    MB: number
  }
}
```

### 6.3 Assessment API

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/assessments` | 단일 이미지 평가 | ✅ |
| POST | `/api/assessments/batch` | 다중 이미지 평가 (최대 10장) | ✅ |
| GET | `/api/assessments` | 평가 목록 조회 | ✅ |
| GET | `/api/assessments/:id` | 개별 평가 조회 | ✅ |
| PATCH | `/api/assessments/:id/favorite` | 즐겨찾기 토글 | ✅ |
| GET | `/api/assessments/month/:year/:month` | 월별 평가 조회 | ✅ |
| GET | `/api/assessments/stats` | 통계 조회 | ✅ |

**POST /api/assessments - Request Body**
```typescript
{
  image: string,  // Base64 data URL
  persona: "sujin" | "minsu" | "jihyun"
}
```

**Response**
```typescript
{
  id: number,
  userId: string,
  imageUrl: string,
  persona: string,
  scores: { harmony: number, trend: number, body: number },
  feedback: string,  // Markdown
  isFavorite: boolean,
  createdAt: string
}
```

### 6.4 Chat API

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/chat/conversations` | 대화 생성 | ✅ |
| GET | `/api/chat/conversations` | 대화 목록 | ✅ |
| GET | `/api/chat/conversations/:id` | 대화 상세 (+ 메시지) | ✅ |
| DELETE | `/api/chat/conversations/:id` | 대화 삭제 | ✅ |
| POST | `/api/chat/conversations/:id/messages` | 메시지 전송 | ✅ |

**POST /api/chat/conversations/:id/messages - Request**
```typescript
{
  content: string,
  image?: string  // Optional Base64
}
```

### 6.5 Recommendation API

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/recommendations` | 추천 생성 | ✅ |
| GET | `/api/recommendations` | 추천 목록 | ✅ |
| GET | `/api/recommendations/:id` | 개별 추천 | ✅ |
| PATCH | `/api/recommendations/:id/favorite` | 즐겨찾기 토글 | ✅ |
| GET | `/api/recommendations/season` | 현재 계절 조회 | ✅ |

---

## 7. 프로젝트 구조

```
/Markdown-Reader
├── client/                    # 프론트엔드 (React)
│   ├── public/               
│   ├── src/
│   │   ├── components/        # UI 컴포넌트
│   │   │   ├── ui/           # shadcn/ui 기반 기본 컴포넌트
│   │   │   ├── Navbar.tsx    # 네비게이션 바
│   │   │   ├── Footer.tsx    # 푸터
│   │   │   ├── RadarChart.tsx # 평가 결과 차트
│   │   │   └── ShareCard.tsx # 결과 공유 카드
│   │   ├── hooks/            # React Query 기반 커스텀 훅
│   │   │   ├── use-auth.ts   # 인증 상태 관리
│   │   │   ├── use-sit.ts    # SIT 테스트 API
│   │   │   ├── use-assessments.ts
│   │   │   └── use-chat.ts
│   │   ├── lib/              # 유틸리티
│   │   │   ├── sit-types.ts  # 16가지 SIT 유형 정의
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/            # 페이지 컴포넌트
│   │   │   ├── Home.tsx      # 메인 페이지
│   │   │   ├── Test.tsx      # SIT 테스트
│   │   │   ├── Evaluate.tsx  # 패션 평가
│   │   │   ├── Chat.tsx      # AI 챗봇
│   │   │   ├── Recommend.tsx # 코디 추천
│   │   │   ├── History.tsx   # 평가 히스토리
│   │   │   ├── Progress.tsx  # 성장 통계
│   │   │   └── Profile.tsx   # 프로필
│   │   ├── App.tsx           # 라우팅 설정
│   │   └── main.tsx          # 엔트리포인트
│   └── index.html
│
├── server/                    # 백엔드 (Express)
│   ├── replit_integrations/   # Replit 통합 모듈
│   │   ├── auth/             # 인증 (Passport.js + OpenID)
│   │   └── image/            # OpenAI 클라이언트
│   ├── index.ts              # 서버 엔트리포인트
│   ├── routes.ts             # API 라우트 핸들러
│   ├── storage.ts            # 데이터베이스 액세스 레이어
│   ├── db.ts                 # Drizzle DB 연결
│   ├── static.ts             # 정적 파일 서빙
│   └── vite.ts               # Vite 개발 서버 통합
│
├── shared/                    # 공유 코드
│   ├── models/
│   │   ├── auth.ts           # users, sessions 테이블
│   │   └── chat.ts           # conversations, messages 테이블
│   ├── schema.ts             # Drizzle 스키마 (sit_results, assessments, recommendations)
│   └── routes.ts             # API 타입 정의 (Zod 스키마)
│
├── script/
│   └── build.ts              # 프로덕션 빌드 스크립트
│
├── drizzle.config.ts         # Drizzle 설정
├── tailwind.config.ts        # Tailwind 설정
├── vite.config.ts            # Vite 설정
├── tsconfig.json             # TypeScript 설정
└── package.json              # 의존성 정의
```

---

## 8. 개발 환경 설정

### 8.1 환경 변수

```bash
# 필수 환경 변수
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Replit Auth (Replit 환경에서 자동 설정)
ISSUER_URL=...
REPL_ID=...
SESSION_SECRET=...

# OpenAI (Replit AI Integrations)
AI_INTEGRATIONS_OPENAI_API_KEY=...
AI_INTEGRATIONS_OPENAI_BASE_URL=...
```

### 8.2 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 시작 (Frontend + Backend 동시 실행)
npm run dev

# 타입 체크
npm run check

# 데이터베이스 마이그레이션
npm run db:push
```

### 8.3 포트 설정

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Dev Server | 5000 | Express + Vite Dev |
| Vite HMR | - | Express에 통합 |

---

## 9. 배포 가이드

### 9.1 Replit 환경

프로젝트는 Replit 환경에 최적화되어 있습니다.

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 시작
npm run start
```

### 9.2 빌드 출력

빌드 시 `dist/` 폴더에 다음 파일이 생성됩니다:
- `dist/index.cjs` - 서버 번들 (CommonJS)
- `dist/public/` - 클라이언트 정적 파일

### 9.3 체크리스트

- [ ] 환경 변수 설정 완료
- [ ] PostgreSQL 데이터베이스 준비
- [ ] `npm run db:push`로 스키마 적용
- [ ] Replit Auth 설정 (Replit 환경)
- [ ] OpenAI API 키 설정

---

## 📎 부록

### A. 주요 파일 경로 Quick Reference

| 목적 | 파일 경로 |
|------|----------|
| DB 스키마 | `shared/schema.ts`, `shared/models/*.ts` |
| API 타입 | `shared/routes.ts` |
| API 핸들러 | `server/routes.ts` |
| DB 쿼리 | `server/storage.ts` |
| SIT 유형 정의 | `client/src/lib/sit-types.ts` |
| 페이지 라우팅 | `client/src/App.tsx` |

### B. 업무노트 (Work Ledger)

| 역할 | 경로 |
|------|------|
| Frontend & Designer | `docs/work-ledger/01-Frontend-Designer.md` |
| Backend & Security | `docs/work-ledger/02-Backend-Security.md` |
| AI & Prompt | `docs/work-ledger/03-AI-Prompt.md` |
| Planner & QA | `docs/work-ledger/04-Planner-QA.md` |

### C. 문서 인덱스 (QA·개발·AI)

| 용도 | 경로 |
|------|------|
| 작업 계획 | `docs/PLAN.md` |
| DB 마이그레이션 | `docs/development/db-migration.md` |
| 프로덕션 배포 | `docs/development/production-checklist.md` |
| 뷰포트 QA 체크리스트 | `docs/qa/viewport-qa-checklist.md` |
| E2E 도입 검토 | `docs/qa/e2e-adoption.md` |
| SIT 알고리즘 | `docs/ai/sit-algorithm.md` |
| 추천 프롬프트 구조 | `docs/ai/recommendation-prompt.md` |

### D. 참고 자료

- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [shadcn/ui 컴포넌트](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [Replit Auth 문서](https://docs.replit.com/hosting/authenticating-users-replit-auth)

---

> **문서 작성**: AI Assistant  
> **최종 업데이트**: 2026-02-05
