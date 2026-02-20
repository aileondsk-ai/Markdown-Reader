# 로컬 환경 시작 가이드

## 현재 상태

- ✅ `npm install` 완료
- ✅ `.env` 파일 생성됨
- ⏳ **PostgreSQL 필요** — DB가 있어야 서버가 기동됩니다

---

## 1. PostgreSQL 시작하기

### 방법 A: Docker 사용 (권장)

**1) Docker Desktop 실행**
- Mac: Docker 앱을 실행하세요 (메뉴바에 고래 아이콘 표시 확인)

**2) PostgreSQL 컨테이너 실행**
```bash
docker run -d --name postgres-stylefinder \
  -e POSTGRES_USER=stylefinder \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=stylefinder \
  -p 5432:5432 \
  postgres:16
```

### 방법 B: Homebrew로 PostgreSQL 설치

```bash
brew install postgresql@16
brew services start postgresql@16
node script/setup-local-db.cjs
```

---

## 2. DB 스키마 적용

PostgreSQL이 실행 중이면:

```bash
npm run db:push
```

---

## 3. 개발 서버 시작

```bash
npm run dev
```

- **포트**: 3000 (macOS AirPlay가 5000 사용, 기존 충돌 방지로 `.env`에 `PORT=3000` 설정됨)
- **URL**: http://localhost:3000

---

## 4. 요약

| 단계 | 명령 |
|------|------|
| 1. Docker로 DB 시작 | `docker run -d --name postgres-stylefinder ...` (위 참고) |
| 2. 스키마 적용 | `npm run db:push` |
| 3. 서버 시작 | `npm run dev` |
