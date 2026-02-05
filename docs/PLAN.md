# 수행할 작업 계획

> 문서 확인 기준: 2026-02-05 · 업무노트 01~04

---

## 1. 문서 확인 요약

| 파트 | 다음 작업 (업무노트 기준) | 수행 가능 여부 |
|------|---------------------------|----------------|
| **Frontend** | SIT 결과 페이지 기기/뷰포트별 수동 QA, ShareCard 안내 A/B(선택) | QA는 수동 → **QA 체크리스트 문서화**로 실행 가능하게 함 |
| **Backend** | 배포 후 모니터링 정리, 프로덕션 마이그레이션 전략(필요 시) | **배포 후 모니터링 섹션** 문서 추가 |
| **AI** | SIT 유형별 프롬프트 확장(선택), 상황별 프롬프트 템플릿 분리(선택) | **추천 프롬프트 구조 문서화** (상황별 문구 정리) |
| **Planner** | 테스트 시나리오 실행 후 결과 기록, E2E 자동화 도입 검토 | **결과 기록 템플릿** 추가, **E2E 도입 검토** 문서 작성 |

---

## 2. 수행할 작업 목록

### 2.1 Frontend & Designer
- [ ] **뷰포트 QA 체크리스트** 작성: `docs/qa/viewport-qa-checklist.md`  
  - 목적: SIT 결과 페이지·공통 UI를 실제 기기/뷰포트별로 수동 QA할 때 사용할 체크리스트  
  - 내용: 권장 뷰포트 목록, 페이지별 확인 항목, 결과 기록란

### 2.2 Backend & Security
- [ ] **배포 후 모니터링** 섹션 추가: `docs/development/production-checklist.md`에 §6  
  - 내용: 에러 로그 확인 방법, 응답 시간·헬스 확인, 이슈 시 업무노트 기록 안내

### 2.3 AI & Prompt
- [ ] **추천 프롬프트 구조** 문서화: `docs/ai/recommendation-prompt.md` (간단)  
  - 내용: 상황·계절·SIT 반영 방식, 현재 서버 프롬프트 구조 요약 (상황별 템플릿 분리 검토용)

### 2.4 Planner & QA
- [ ] **테스트 결과 기록 템플릿** 추가: `docs/work-ledger/04-Planner-QA.md` 테스트 시나리오 하단  
  - 내용: 실행일, 실행자, 시나리오별 통과/실패, 비고 컬럼 예시
- [ ] **E2E 도입 검토** 문서 작성: `docs/qa/e2e-adoption.md`  
  - 내용: 도구 비교(Playwright vs Cypress 등), 추천, 도입 시 다음 단계

### 2.5 공통
- [ ] **SYSTEM.md** 부록에 업무노트·주요 문서 링크 정리 (이미 B. 업무노트 있으면 새 문서만 추가)

---

## 3. 실행 순서

1. Frontend → `docs/qa/viewport-qa-checklist.md` 생성  
2. Backend → `production-checklist.md` §6 배포 후 모니터링 추가  
3. AI → `docs/ai/recommendation-prompt.md` 생성  
4. Planner → 04 업무노트에 결과 기록 템플릿 추가, `docs/qa/e2e-adoption.md` 생성  
5. SYSTEM.md 부록 점검 및 링크 보강  
6. 각 업무노트(01~04) "이번 세션 완료" 갱신  

---

## 4. 실행 완료 (같은 세션)

| # | 작업 | 산출물 |
|---|------|--------|
| 2.1 | Frontend 뷰포트 QA 체크리스트 | `docs/qa/viewport-qa-checklist.md` |
| 2.2 | Backend 배포 후 모니터링 | `docs/development/production-checklist.md` §6 |
| 2.3 | AI 추천 프롬프트 구조 | `docs/ai/recommendation-prompt.md` |
| 2.4 | Planner 결과 기록·E2E 검토 | 04 업무노트 테이블 추가, `docs/qa/e2e-adoption.md` |
| 2.5 | SYSTEM.md 부록 | §C 문서 인덱스 추가, 01~04 업무노트 갱신 |

이 계획대로 작업을 수행했습니다.

---

## 5. 다음 작업 계획 (Phase 2)

| # | 파트 | 작업 | 산출물/내용 |
|---|------|------|-------------|
| 1 | Backend | API 에러 로깅 보강 | catch 시 메서드·경로·에러 요약 로깅 (모니터링용) |
| 2 | AI | 추천 프롬프트 분리 | `server/prompts/recommendation.ts` 생성, routes에서 import |
| 3 | Planner | E2E 1개 스펙 | Playwright 설정 + SIT 페이지 로드/질문 표시 1건 |
| 4 | 공통 | 업무노트·PLAN 갱신 | 01~04 이번 세션 완료, PLAN Phase 2 실행 완료 표시 |

**실행 순서**: 1 → 2 → 3 → 4

---

## 6. Phase 2 실행 완료

| # | 작업 | 산출물 |
|---|------|--------|
| 1 | Backend API 에러 로깅 | `logRouteError(req, err, label)` 도입, Assessment/Batch/Chat/Recommendation 등 catch에서 사용 |
| 2 | AI 추천 프롬프트 분리 | `server/prompts/recommendation.ts` (buildRecommendationPrompt, RECOMMENDATION_SYSTEM_PROMPT), routes에서 import |
| 3 | E2E 1개 스펙 | `@playwright/test` 추가, `playwright.config.ts`, `e2e/sit.spec.ts` (SIT 페이지 접속·첫 질문/진행률 표시), `npm run test:e2e` |
| 4 | 업무노트·문서 | 01~04 이번 세션 완료 갱신, e2e-adoption.md 실행 방법 보강 |
