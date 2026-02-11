# 업무노트 · AI & Prompt

> SIT 알고리즘, 추천 엔진, 프롬프트 관리

---

## 완료 사항

| 일자 | 항목 | 비고 |
|------|------|------|
| - | SIT 계산 로직 | Test.tsx 내 calculateSitResult: 12문항 → IE/WC/SN/MB 점수 → 16가지 코드 산출 |
| - | SIT 유형 정의 | client/src/lib/sit-types.ts (16종 닉네임, keywords, style, description) |
| - | 추천 API 연동 | use-recommendations.ts (목록/개별/계절/생성/즐겨찾기), Recommend.tsx에서 사용 |
| - | 패션 평가 프롬프트 | server/routes.ts PERSONA_PROMPTS (수진/민수/지현 역할·톤·평가 기준) |
| 2026-02-11 | 스타일+제품 추천 병행(Phase 1) | API 레이어에서 제품 목업 부착, 공통 타입 shared/types/products.ts |

---

## 다음 작업

- [ ] **SIT** 유형별 프롬프트/추천 문구 확장 (선택)
- [ ] **추천** 상황별 프롬프트 템플릿 분리 시 `docs/ai/recommendation-prompt.md` 참고 (선택)
- [ ] **챗봇** 프롬프트 분리 검토: `server/prompts/` 또는 `docs/ai/`에 챗 대화 시스템 프롬프트 이관 (선택)

---

## 이번 세션 완료 (2026-02-11)

- **다음 작업** 보강: 챗봇 프롬프트 분리 검토 제안 추가.
- **스타일+제품 추천 병행**: 스타일 추천(AI 프롬프트 기존 유지)과 제품 추천을 API 레이어에서 병행. 제품은 목업으로 응답에 부착(`products`), AI 프롬프트 변경 없음. 공통 타입 `shared/types/products.ts`. 계획: `docs/work-ledger/작업계획-제품추천.md`.

## 이번 세션 완료 (2026-02-05)

- **추천 엔진** SIT 반영 확인: `getLatestSitResult(userId)`로 sitType 조회 후 프롬프트에 `사용자 스타일 유형: ${sitType}` 포함됨
- **프롬프트 분리** `server/prompts/persona.ts` 생성, PERSONA_PROMPTS 이관 및 routes에서 import
- **계절/상황 공통화** `shared/constants/occasion.ts` 추가 (SEASON_NAMES, OCCASION_NAMES), 추천 API에서 사용

## 이번 세션 완료 (파트별 작업)

- **SIT 알고리즘** `docs/ai/sit-algorithm.md` 작성: 경계값 50, 3문항×17점 변동치, 0~100 클램핑, 코드 산출 순서 검증·문서화
- **추천** Recommend.tsx에서 `@shared/constants/occasion`의 SEASON_NAMES, OCCASION_NAMES 사용으로 계절/상황 라벨 공통화

## 이번 세션 완료 (문서 기반 작업)

- **추천 프롬프트 구조** 문서화: `docs/ai/recommendation-prompt.md` (상황/계절/SIT 반영 방식, 현재 구조 요약, 상황별 템플릿 분리 검토 안내)

## 이번 세션 완료 (Phase 2)

- **추천 프롬프트 분리**: `server/prompts/recommendation.ts` 생성 — `buildRecommendationPrompt()`, `RECOMMENDATION_SYSTEM_PROMPT` export, `server/routes.ts`에서 import 사용

---

## 참고 경로

- `client/src/pages/Test.tsx` (calculateSitResult)
- `client/src/lib/sit-types.ts`
- `client/src/hooks/use-recommendations.ts`
- `server/routes.ts` (추천 생성 로직)
- `server/prompts/persona.ts` (PERSONA_PROMPTS)
- `shared/constants/occasion.ts` (계절/상황 한글 라벨)
- **SIT 알고리즘**: `docs/ai/sit-algorithm.md`
- **추천 프롬프트**: `docs/ai/recommendation-prompt.md`, `server/prompts/recommendation.ts`
