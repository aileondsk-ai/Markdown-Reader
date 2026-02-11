# 업무노트 · Backend & Security

> 로컬 인증, DB 마이그레이션, 보안 이슈

---

## 완료 사항

| 일자 | 항목 | 비고 |
|------|------|------|
| - | 로컬 인증(localAuth) | REPL_ID 없을 때 mock 세션, /api/login 시 자동 로그인, auth/storage 연동 |
| - | 인증 분기 | server/replit_integrations/auth/index.ts 에서 isLocalDev 기준 Replit vs Local 선택 |
| - | 로컬 DB 설정 스크립트 | script/setup-local-db.cjs (stylefinder DB·유저 생성) |
| - | 시드 스크립트 | script/seed-mock-user.cjs (목 사용자 시딩) |
| 2026-02-11 | 스타일+제품 추천 병행(Phase 1) | mock-products.ts, 추천 API 응답에 products 부착 |

---

## 다음 작업

- [ ] **보안** 배포 후 실제 모니터링 실행 및 이슈 기록
- [ ] **DB** 프로덕션에서 마이그레이션 파일 적용 전략 수립 (필요 시) — `docs/development/db-migration.md` §6 참고
- [x] **API** 인증 필요 API 401 응답 형식 통일 점검 (JSON 본문·메시지 일관성) — 2026-02-11 완료 (sendUnauthorized)
- [x] **헬스 엔드포인트** 배포 환경 헬스 체크용 GET 경로 추가 (선택) — 2026-02-11 완료 (`GET /api/health`, DB 연결 확인)

---

## 이번 세션 완료 (2026-02-11)

- **다음 작업** 보강: API 401 응답 형식 통일 점검 제안 추가.
- **스타일+제품 추천 병행**: 추천 API 응답에 제품 목록(목업) 부착. `server/mock-products.ts` — `getMockProductsByCategory()`, POST 생성·GET 단건·PATCH 즐겨찾기 응답에 `products` 필드 추가. 차후 DB/API 연동 시 목업 모듈만 교체. 계획: `docs/work-ledger/작업계획-제품추천.md`.
- **추천 생성 불가 원인 대응**: 기존 OpenAI 키 미설정 시 추천 생성 실패 → **Gemini API**로 추천 생성 전환. `server/gemini-client.ts` 추가, `GEMINI_API_KEY` 설정 시 Gemini(기본 gemini-2.5-flash) 사용, 미설정 시 기존 OpenAI 폴백. `.env.example`에 GEMINI 변수 안내. (이후 POST 500 대응: 기본 모델명 수정, JSON 파싱·검증 보강.)
- **API 401 응답 형식 통일**: `sendUnauthorized(res)` 도입 — 인증 필요 API가 `res.status(401).json({ error: "Unauthorized", message: "로그인이 필요합니다" })`로 통일. `res.sendStatus(401)` 호출 전부 교체.
- **모니터링 실행 기록**: `docs/development/production-checklist.md` §6.1 모니터링 실행 기록 템플릿 표 추가.
- **다음 작업 반영**: API 401 통일 점검 완료 표시, 헬스 엔드포인트 제안 추가. DB 마이그레이션 전략은 db-migration.md §6 링크 명시.
- **헬스 엔드포인트**: `GET /api/health` 추가. 인증 불필요, `SELECT 1`로 DB 연결 확인. 200 시 `{ ok: true, db: "ok" }`, 실패 시 503. production-checklist §5·§6에 반영.

## 이번 세션 완료 (2026-02-05)

- **DB 마이그레이션 가이드** 작성: `docs/development/db-migration.md` (사전 요구사항, `npm run db:push`, 트러블슈팅, 체크리스트)
- SESSION_SECRET 권장은 이미 `.env.example`에 반영됨

## 이번 세션 완료 (파트별 작업)

- **프로덕션 배포 체크리스트** 작성: `docs/development/production-checklist.md` (인증/세션, DB, 환경변수, 보안, 기동 확인)
- **DB** `docs/development/db-migration.md`에 마이그레이션 파일 도입 검토 섹션 추가 (generate/migrate 시점 및 방법)

## 이번 세션 완료 (문서 기반 작업)

- **배포 후 모니터링** 정리: `docs/development/production-checklist.md` §6 추가 (에러 로그, 응답 시간, 헬스, DB 연결 확인 방법)

## 이번 세션 완료 (Phase 2)

- **API 에러 로깅** 보강: `logRouteError(req, err, label)` 도입 — catch 시 `[METHOD] path Label: message` 형식으로 로깅 (모니터링·배포 후 확인용)

---

## 참고 경로

- `server/replit_integrations/auth/index.ts`, `localAuth.ts`, `replitAuth.ts`
- `server/replit_integrations/auth/storage.ts`
- `script/setup-local-db.cjs`, `script/seed-mock-user.cjs`
- `drizzle.config.ts`, `shared/schema.ts`
- **DB 마이그레이션**: `docs/development/db-migration.md`
- **프로덕션 배포**: `docs/development/production-checklist.md`
