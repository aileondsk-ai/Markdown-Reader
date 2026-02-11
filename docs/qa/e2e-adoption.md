# E2E 자동화 도입 검토

> Planner & QA · 테스트 시나리오 자동화

---

## 1. 목적

- 수동 테스트 시나리오(SIT/평가/추천/인증)를 자동 실행해 회귀 방지
- PR 또는 main 머지 전 CI에서 E2E 실행 검토

---

## 2. 도구 비교 (요약)

| 항목 | Playwright | Cypress |
|------|------------|---------|
| 언어 | JS/TS 기본 | JS/TS |
| 브라우저 | Chromium, Firefox, WebKit | Chromium, Firefox, WebKit (최신) |
| 속도 | 병렬·헤드리스에 유리 | 안정적, 대화형 디버깅 |
| CI 연동 | GitHub Actions 등 용이 | 동일 |
| 모바일/뷰포트 | 뷰포트 설정 간단 | 동일 |
| 학습 곡선 | 보통 | 보통 |

**추천**: **Playwright** — 멀티 브라우저·병렬 실행·공식 TS 지원이 잘 맞고, Vite/React 프로젝트와 조합하기 수월함.

---

## 3. 도입 시 다음 단계

1. **설치**: `npm i -D @playwright/test`, `npx playwright install` (브라우저 바이너리)
2. **설정**: `playwright.config.ts` — baseURL `http://localhost:5000`, webServer로 `npm run dev` 자동 기동
3. **실행**: `npm run test:e2e` (또는 `npx playwright test`). 최소 1개 스펙: `e2e/sit.spec.ts` (SIT 페이지 접속·첫 질문 표시)
4. **시나리오 매핑**:  
   - `docs/work-ledger/04-Planner-QA.md`의 테스트 시나리오 초안을 1:1로 E2E 스펙으로 옮기기 (로그인 → SIT 12문항 → 결과 확인 → ShareCard 버튼 등)
5. **로컬 실행**: `npm run test:e2e` (webServer가 dev 서버를 띄우므로 별도 터미널 불필요)
6. **CI**: GitHub Actions 등에서 `npm run test:e2e` 실행 job 추가

---

## 4. 우선순위 제안

- **1단계**: SIT 플로우 1건 (로그인 → 12문항 클릭 → 결과 페이지 존재 확인)
- **2단계**: 평가 업로드·결과 존재, 추천 생성·목록 존재
- **3단계**: 챗·기타 플로우, 다중 뷰포트

---

## 5. E2E 실행 시 DB 및 로그인

인증·DB를 사용하는 스펙(`auth-flow.spec.ts` 등)을 안정적으로 실행하려면 아래를 준비합니다.

| 항목 | 내용 |
|------|------|
| **DB** | PostgreSQL 기동, `DATABASE_URL` 설정. `npm run db:push`로 스키마 적용(users, sit_results, recommendations 등). 테이블이 없으면 추천 API가 500을 반환할 수 있음 |
| **로그인** | 로컬 개발 시 `REPL_ID` 미설정이면 mock 인증 사용. GET `/api/login` 방문 시 mock 유저로 세션 생성·DB에 `users` upsert |
| **헬스** | `GET /api/health` 로 서버·DB 상태 확인 가능. 200 + `{ ok: true, db: "ok" }` 이면 E2E 진행 가능 |
| **실행 순서** | 1) DB 기동 및 스키마 적용 2) `npm run test:e2e` (webServer가 `npm run dev`로 서버 기동) |

E2E에서 로그인 연동 플로우는 `e2e/auth-flow.spec.ts`에 정의되어 있으며, `/api/login` 방문 후 프로필·추천 페이지 접근을 검증합니다.

이 문서는 검토용이며, 도입 결정 시 업무노트(04-Planner-QA)에 반영해 두면 됩니다.
