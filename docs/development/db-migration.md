# DB 마이그레이션 가이드

> StyleFinder AI · Drizzle ORM + PostgreSQL

---

## 1. 사전 요구사항

- Node.js 20+
- PostgreSQL 서버 (로컬 또는 원격)
- 프로젝트 루트에 `.env` 설정 (최소 `DATABASE_URL`)

### 로컬 DB 준비 (최초 1회)

```bash
# PostgreSQL이 설치되어 있어야 함 (Homebrew: brew install postgresql@16)
node script/setup-local-db.cjs
```

성공 시 `stylefinder` DB와 `stylefinder` 유저가 생성됩니다.  
`.env` 예시:

```bash
DATABASE_URL=postgresql://stylefinder:devpassword@localhost:5432/stylefinder
```

---

## 2. 스키마 적용 (push)

```bash
npm run db:push
```

- `shared/schema.ts`에 정의된 테이블이 DB에 반영됩니다.
- 테이블이 없으면 생성, 컬럼이 없으면 추가됩니다.
- **기존 컬럼 삭제/타입 변경은 Drizzle push에서 제한적**이므로, 스키마 변경 시 아래 트러블슈팅을 참고하세요.

---

## 3. 트러블슈팅

### `DATABASE_URL` 오류

- **증상**: `ensure the database is provisioned` 또는 연결 실패
- **조치**:
  1. `.env`에 `DATABASE_URL`이 있는지 확인.
  2. PostgreSQL 서비스 실행 여부 확인 (`brew services list` 또는 `pg_isready -h localhost`).
  3. 로컬이면 `node script/setup-local-db.cjs`로 DB/유저 생성 후 다시 시도.

### 권한 오류 (role / permission)

- **증상**: `permission denied for schema public` 등
- **조치**: 해당 DB의 `public` 스키마에 대한 권한 부여:
  ```sql
  GRANT ALL ON SCHEMA public TO stylefinder;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO stylefinder;
  ```

### 테이블이 이미 존재하는데 스키마가 다름

- **증상**: push 시 컬럼 타입 불일치, 제약 조건 충돌
- **조치**:
  1. 개발 DB라면 DB를 새로 만든 뒤 `npm run db:push`로 처음부터 적용.
  2. 프로덕션/데이터 유지가 필요하면 Drizzle 마이그레이션 파일 생성(`drizzle-kit generate`) 후 `drizzle-kit migrate`로 단계적 적용.  
     (현재 프로젝트는 `db:push` 스크립트만 사용 중이므로, 필요 시 `drizzle.config.ts`와 스크립트 추가.)

### `drizzle-kit` 실행 시 tsconfig/경로 오류

- **증상**: `Cannot find module` 또는 tsx 관련 오류
- **조치**: `package.json`의 `db:push`는 `drizzle-kit push`를 사용. `npx drizzle-kit push`를 직접 실행할 때는 프로젝트 루트에서 실행하고, `tsconfig.json`이 루트에 있는지 확인.

---

## 4. 적용되는 테이블 (참고)

| 테이블 | 용도 |
|--------|------|
| users | Replit Auth 사용자 (또는 로컬 mock 유저) |
| sessions | 세션 저장소 |
| sit_results | SIT 테스트 결과 |
| assessments | 패션 평가 결과 |
| conversations, messages | 챗봇 대화 |
| recommendations | 코디 추천 |

---

## 5. 체크리스트

- [ ] PostgreSQL 접속 가능
- [ ] `.env`에 `DATABASE_URL` 설정
- [ ] `npm run db:push` 성공
- [ ] 앱 기동 후 로그인/API 호출로 DB 사용 확인

---

## 6. 마이그레이션 파일 도입 검토

- **현재**: `npm run db:push`로 스키마를 DB에 직접 반영. 개발/단일 환경에 적합.
- **도입 시점**: 프로덕션 DB에 데이터가 있고, 컬럼 삭제·타입 변경·인덱스 변경 등이 필요할 때.
- **방법**:
  1. `npx drizzle-kit generate`로 마이그레이션 SQL 생성 (`drizzle.config.ts`의 `out: "./migrations"` 확인).
  2. 생성된 SQL 검토 후 `npx drizzle-kit migrate` 또는 자체 스크립트로 적용.
  3. `package.json`에 `"db:migrate": "drizzle-kit migrate"` 등 스크립트 추가 가능.
- **참고**: [Drizzle Migrate](https://orm.drizzle.team/docs/migrations). 도입 전 팀 공유 후 진행 권장.

추가 이슈는 `docs/work-ledger/02-Backend-Security.md`에 기록해 두면 이후 작업 시 참고할 수 있습니다.
