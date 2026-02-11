# 프로덕션 배포 체크리스트

> Backend & Security · Replit 배포 기준

---

## 1. 인증 및 세션

| 항목 | 확인 |
|------|------|
| Replit 배포 시 **Replit Auth** 사용 | `REPL_ID`가 설정되어 있어야 함. 로컬만 있으면 mock 인증 사용됨 |
| **SESSION_SECRET** | 프로덕션용 강한 비밀키 설정 (32자 이상, 예측 불가). `.env`에만 저장, Git 미포함 |
| 세션 스토어 | Replit 환경에서는 메모리/connect-pg-simple 등 실제 스토어 사용 여부 확인 |
| **HTTPS** | Replit 호스팅은 HTTPS 제공. `trust proxy` 설정 확인 (`app.set("trust proxy", 1)`) |

---

## 2. 데이터베이스

| 항목 | 확인 |
|------|------|
| **DATABASE_URL** | 프로덕션 DB 연결 문자열. Replit PostgreSQL 또는 외부 호스트 |
| 스키마 적용 | `npm run db:push` 또는 마이그레이션 실행 완료 |
| 백업/복구 절차 | 필요 시 덤프·복원 방법 문서화 |

---

## 3. 환경 변수

| 변수 | 용도 |
|------|------|
| `NODE_ENV=production` | 프로덕션 모드 |
| `DATABASE_URL` | PostgreSQL 연결 |
| `SESSION_SECRET` | 세션 서명 |
| `REPL_ID` | Replit Auth 사용 시 자동 설정 |
| `ISSUER_URL` 등 | Replit Auth 관련 (Replit에서 설정) |
| OpenAI/API 키 | Replit AI Integrations 또는 별도 키 |

`.env.example` 참고하여 필수 항목 누락 여부 확인.

---

## 4. 보안 점검

| 항목 | 확인 |
|------|------|
| 인증 필요한 API에 401 응답 | 비로그인 시 SIT/평가/추천/챗 등 401 반환 |
| 민감 정보 로그 미출력 | 비밀번호, 토큰, 세션 ID 등 로그에 남기지 않기 |
| CORS/헤더 | 필요 시 프로덕션 도메인만 허용 |

---

## 5. 기동 확인

| 항목 | 확인 |
|------|------|
| `npm run build` 성공 | |
| `npm run start` 로 서버 기동 | |
| 헬스/핑 가능 경로 동작 | `GET /api/health` (200 + `db: "ok"` 시 DB 연결 정상) 또는 `/`, `/api/user` |
| 로그인 플로우 → Replit Auth 콜백 | 로컬이 아닌 Replit에서 테스트 |

---

## 6. 배포 후 모니터링

| 항목 | 확인 방법 |
|------|-----------|
| **에러 로그** | Replit 로그 또는 서버 stdout/stderr. 5xx·예외 스택 확인 |
| **응답 시간** | 주요 API(SIT 제출, 평가 생성, 추천 생성) 응답이 5~10초 이내인지 수동 또는 APM으로 확인 |
| **헬스** | `GET /api/health` 주기적 호출 — 200 + `{ ok: true, db: "ok" }` 이면 서버·DB 정상 |
| **DB 연결** | 로그인·데이터 조회 실패 시 DATABASE_URL·풀 설정 점검 |

이슈 발생 시 원인·조치를 `docs/work-ledger/02-Backend-Security.md`에 기록해 두면 이후 작업 시 참고할 수 있습니다.

---

### 6.1 모니터링 실행 기록 (템플릿)

배포 후 1회 이상 아래 항목을 확인한 뒤, 결과를 업무노트(02-Backend-Security) 또는 이 문서에 기록합니다.

| 실행일 | 에러 로그 | 응답 시간 | 헬스 | DB 연결 | 비고 |
|--------|-----------|-----------|------|---------|------|
| (실행 후 기록) | | | | | |

---

배포 후 이슈는 `docs/work-ledger/02-Backend-Security.md`에 기록해 두면 이후 작업 시 참고할 수 있습니다.
