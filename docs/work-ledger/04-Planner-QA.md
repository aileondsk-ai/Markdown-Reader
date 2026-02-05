# 업무노트 · Planner & QA

> 로드맵, 테스트 시나리오, 릴리즈 체크리스트

---

## 완료 사항

| 일자 | 항목 | 비고 |
|------|------|------|
| - | 시스템 문서 | SYSTEM.md (아키텍처, API, DB, 개발 환경) |
| - | 기능 설계 문서 | attached_assets/stylefinder_ai_feature_design_v2_*.md |

---

## 다음 작업

- [ ] **테스트** 시나리오 실행 후 아래 "테스트 결과 기록" 표에 체크 및 결과 기록
- [ ] **E2E** 도입 시 `docs/qa/e2e-adoption.md` 참고 후 Playwright 등 적용

---

## 이번 세션 완료 (2026-02-05)

- **로드맵** 알파/베타/정식 마일스톤 표 추가 (목표·주요 산출물)
- 테스트 시나리오·릴리즈 체크리스트 초안은 기존 유지

## 이번 세션 완료 (파트별 작업)

- **테스트 시나리오** 보강: 실행 방법 안내, ShareCard "텍스트 복사"·접근성·다중 평가·SIT 반영 확인 항목 추가, 파트(Frontend/Backend) 표기
- **릴리즈 체크리스트** 보강: production-checklist·db-migration 문서 링크, 기능 항목 파트별 표기

## 이번 세션 완료 (문서 기반 작업)

- **테스트 결과 기록** 테플릿 추가: 시나리오 하단에 실행일/실행자/시나리오별 통과·비고 표
- **E2E 도입 검토** 문서 작성: `docs/qa/e2e-adoption.md` (Playwright vs Cypress 요약, 추천, 도입 단계)

## 이번 세션 완료 (Phase 2)

- **E2E 1개 스펙** 추가: `@playwright/test` 설치, `playwright.config.ts` (webServer로 dev 자동 기동), `e2e/sit.spec.ts` (SIT 페이지 접속·첫 질문/진행률 표시). 실행: `npm run test:e2e`. 최초 1회 `npx playwright install` 필요.

---

## 로드맵 (마일스톤)

| 단계 | 목표 | 주요 산출물 |
|------|------|-------------|
| **알파** | 핵심 플로우 검증 | SIT 테스트 → 결과 공유, 단일 착장 평가, 로컬 인증/DB 동작 |
| **베타** | 실사용 가능 수준 | Replit 배포, 추천/챗 연동, 모바일·접근성 점검 |
| **정식** | 안정 서비스 | 보안·성능 점검, 릴리즈 체크리스트 통과, 모니터링 |

- 알파: 로컬 개발 환경 기준 핵심 시나리오 통과
- 베타: Replit Auth + 프로덕션 DB, 주요 API E2E 검증
- 정식: 배포 체크리스트 완료, 문서·운영 정리

---

## 테스트 시나리오 초안

**실행 방법**: 로컬 `npm run dev` 후 브라우저에서 수동 확인. (E2E 자동화는 추후 도입 시 보강.)

### SIT 테스트 (Frontend: Test.tsx)
- [ ] 비로그인 시 테스트 진행 → 결과 제출 시 로그인 유도 또는 401 처리 확인
- [ ] 12문항 전체 응답 후 결과 화면 표시 (유형 코드, 닉네임, 키워드, ShareCard)
- [ ] 결과 화면에서 "저장" / "공유하기" / "텍스트 복사" 동작
- [ ] "프로필 보기", "AI 평가 시작하기" 이동
- [ ] **접근성**: 결과 표시 시 포커스가 결과 영역으로 이동하는지, 스크린 리더로 진행률 안내 확인

### 패션 평가 (Frontend: Evaluate.tsx)
- [ ] 이미지 업로드 → 페르소나 선택 → 평가 결과(레이더 차트, 피드백) 표시
- [ ] 평가 결과 화면에서 ShareCard(OUTFIT) 저장/공유/텍스트 복사
- [ ] 다중 이미지(2장 이상) 업로드 → 배치 분석 → 종합 피드백 + 개별 카드

### 코디 추천 (Frontend: Recommend.tsx, Backend: /api/recommendations)
- [ ] 계절/상황 선택 → 추천 생성 → 아웃핏 세트·이유·대안 표시
- [ ] 로그인 사용자 SIT가 있으면 추천 프롬프트에 유형 반영되는지 확인 (API/로그)
- [ ] 즐겨찾기 토글 및 목록 반영

### 인증 (Backend: auth)
- [ ] 로컬: /api/login 호출 시 mock 유저로 로그인
- [ ] Replit: OpenID 로그인 플로우
- [ ] 로그아웃 후 인증 필요 API 401 확인

---

## 테스트 결과 기록 (실행 후 작성)

| 실행일 | 실행자 | SIT | 평가 | 추천 | 인증 | 비고 |
|--------|--------|-----|------|------|------|------|
| (예) 2026-02-05 | - | 통과 | 통과 | 통과 | 통과 | 로컬 mock |
| | | | | | | |

- 시나리오별 통과/실패만 기록해도 됨. 상세는 `docs/qa/viewport-qa-checklist.md` 등에 기록 가능.

---

## 릴리즈 체크리스트 초안

상세 항목은 **Backend** 업무노트 쪽 문서 참고: `docs/development/production-checklist.md`, `docs/development/db-migration.md`

### 배포 전
- [ ] 환경 변수 설정 (DATABASE_URL, SESSION_SECRET, OpenAI 등) — `.env.example` 참고
- [ ] `npm run db:push` 로 스키마 적용 (`docs/development/db-migration.md`)
- [ ] Replit 배포 시 Replit Auth 설정 및 REPL_ID 확인 (`production-checklist.md` §1)
- [ ] `npm run build` 성공 여부
- [ ] `npm run start` 로 프로덕션 서버 기동 확인

### 기능 (파트별)
- [ ] **SIT** 제출/최신 조회 API (Backend)
- [ ] **평가** 생성/목록/즐겨찾기 API (Backend)
- [ ] **추천** 생성/목록/계절 API (Backend)
- [ ] **챗** 대화 생성/메시지 전송 API (Backend)
- [ ] **Frontend** SIT/평가/추천/챗 페이지 핵심 플로우 (테스트 시나리오 기준)

### 보안
- [ ] 세션 비밀키 프로덕션용으로 설정 (`production-checklist.md` §1)
- [ ] 인증 필요한 API 401 응답 확인
