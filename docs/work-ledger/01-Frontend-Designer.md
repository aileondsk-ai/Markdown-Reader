# 업무노트 · Frontend & Designer

> ShareCard, SIT 결과 페이지, UI/UX 개선 사항

---

## 완료 사항

| 일자 | 항목 | 비고 |
|------|------|------|
| - | ShareCard 컴포넌트 구현 | OUTFIT / SIT 두 variant, html2canvas 기반 이미지 생성, 다운로드/공유 |
| - | SIT 결과 페이지(Test.tsx) | 12문항 플로우, 점수 계산, 결과 카드에 ShareCard(SIT) 연동 |
| - | Recommend 페이지 | 계절/상황 선택, use-recommendations 훅 연동, 추천 상세 다이얼로그 |
| 2026-02-11 | 스타일+제품 추천 병행(Phase 1) | 추천 상세 다이얼로그에 "추천 제품" 카드, products 표시 |

---

## 다음 작업

- [ ] **SIT 결과 페이지** 뷰포트 QA 체크리스트 기준으로 실제 기기/수동 QA 실행
- [ ] **ShareCard** 공유 실패 시 안내 문구 A/B 테스트 (선택)
- [x] **History/Progress/Profile** 페이지 접근성(포커스·aria·키보드) 점검 (권장) — 2026-02-11 완료 (main·aria-label·이전/다음 달 버튼)
- [ ] **SIT 결과 페이지** 키보드 Tab 순서·포커스 스타일 검증 (선택)

---

## 이번 세션 완료 (2026-02-11)

- **SIT 결과 페이지 뷰포트별 확인 포인트** 표 추가 (320/768/1024px 확인 포인트). 본 문서 §SIT 결과 페이지 뷰포트별 확인 포인트.
- **다음 작업** 보강: History/Progress/Profile 접근성 점검 제안 추가.
- **스타일+제품 추천 병행**: Recommend 페이지 추천 상세 다이얼로그에 "추천 제품" 카드 추가. `useRecommendation(id)`로 단건 조회 시 `products` 수신, 상의/하의/신발/액세서리별 목업 제품(이름·브랜드·가격) 표시. 계획: `docs/work-ledger/작업계획-제품추천.md`.
- **History/Progress/Profile 접근성**: 각 페이지 루트를 `<main role="main" aria-label="...">`로 감싸고, History 이전/다음 달 버튼에 `aria-label` 추가.
- **뷰포트 QA**: `docs/qa/viewport-qa-checklist.md` §4 "실행 후 기록" 플레이스홀더 표 추가.
- **다음 작업 반영**: History/Progress/Profile 접근성 점검 완료 표시, "SIT 결과 페이지 키보드 Tab 순서·포커스 스타일 검증" 제안 추가.

## 이번 세션 완료 (2026-02-05)

- **ShareCard** Web Share 미지원 시 토스트 안내: "저장 버튼으로 이미지를 저장한 뒤 앱에서 공유해 보세요"
- **SIT 결과 페이지** 모바일 대응: `py-12 sm:py-20`, 옵션 버튼 `min-h-[48px]`, `touch-manipulation` 적용
- **접근성** 결과/진행 영역에 `aria-live="polite"`, `role="region"`, Progress에 `aria-valuenow/min/max` 추가
- **Evaluate** ShareCard에 `variant="OUTFIT"` 명시, 단일/다중 결과 모두 동일 섹션("결과 공유하기") 유지

## 이번 세션 완료 (파트별 작업)

- **ShareCard** 클립보드 폴백: `getShareableText()` + `handleCopyText()`, "텍스트 복사" 버튼(아이콘) 추가, 버튼에 `aria-label` 부여
- **접근성** SIT 진행률: `sr-only`로 "질문 N번 of 12, 진행률 N%" 안내, 결과 영역 `ref` + `useEffect`로 결과 표시 시 포커스 이동

## 이번 세션 완료 (문서 기반 작업)

- **뷰포트 QA 체크리스트** 작성: `docs/qa/viewport-qa-checklist.md` (권장 뷰포트, 페이지별 확인 항목, 결과 기록란). 수동 QA 시 참고.

(Phase 2에서 Frontend 코드 변경 없음 — Backend/AI/Planner 위주)

---

## SIT 결과 페이지 뷰포트별 확인 포인트

수동 QA 시 아래 뷰포트에서 SIT 결과 화면(`/test` 제출 후)만 집중 확인할 때 참고합니다. 상세 항목은 `docs/qa/viewport-qa-checklist.md` §2.1 참고.

| 뷰포트 (px) | 확인 포인트 |
|-------------|-------------|
| **320** | 옵션 버튼 터치 영역(최소 48px), 결과 카드·ShareCard·CTA 버튼 세로 겹침 없음, 스크롤로 모두 접근 가능 |
| **768** | 결과 영역(유형·닉네임·키워드·ShareCard) 한 줄/두 줄 배치 가독성, "저장/공유하기/텍스트 복사" 버튼 배치 |
| **1024** | 데스크톱에서 결과 카드·ShareCard 비율·여백, "프로필 보기"/"AI 평가 시작하기" 버튼 배치 |

---

## 참고 경로

- `client/src/components/ShareCard.tsx`
- `client/src/pages/Test.tsx` (SIT 테스트 및 결과)
- `client/src/pages/Recommend.tsx`
- **뷰포트 QA**: `docs/qa/viewport-qa-checklist.md`
