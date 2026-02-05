# 추천 프롬프트 구조

> 코디 추천 API · 상황/계절/SIT 반영 방식

---

## 1. 현재 구조 요약

- **위치**: `server/routes.ts` — `POST /api/recommendations` 내부
- **모델**: `gpt-4o-mini`
- **입력**: `occasion`(필수), `season`(선택, 기본값: 현재 계절). 사용자 SIT는 서버에서 `getLatestSitResult(userId)`로 조회 후 조건에 포함

---

## 2. 프롬프트 구성

### 2.1 시스템 메시지
```
패션 스타일리스트로서 코디를 추천합니다. JSON 형식으로만 응답합니다.
```

### 2.2 사용자 메시지 (조건부)
- **공통**: 역할 안내 + "다음 조건에 맞는 코디 추천을 JSON 형식으로 제공해주세요."
- **조건**:
  - `상황: ${occasionName}` — `shared/constants/occasion.ts`의 OCCASION_NAMES 한글 라벨
  - `계절: ${seasonName}` — SEASON_NAMES 한글 라벨
  - (선택) `사용자 스타일 유형: ${sitType}` — SIT 테스트 결과가 있을 때만 추가 (예: IWSM, EWSB)
- **출력 형식**: outfitSet(top/bottom/shoes/accessory 각각 item, color, reason), reasoning, alternatives 배열

---

## 3. 상황별 문구 (현재)

상황 코드와 한글 라벨은 `shared/constants/occasion.ts`에 일원화되어 있으며, 프롬프트에는 **한글 라벨**만 넣습니다.  
(예: `date_casual` → "캐주얼 데이트", `business_meeting` → "프레젠테이션/미팅")

상황별로 **추가 지시문**을 두지 않고, 동일한 조건 블록 + JSON 형식으로만 요청하고 있습니다.  
나중에 "면접"/"데이트" 등 상황별로 톤·포맷을 나누고 싶다면 `server/prompts/recommendation.ts` 등으로 템플릿을 분리하는 방안을 검토할 수 있습니다.

---

## 4. 참고 경로

- `server/routes.ts` (추천 생성 로직)
- `shared/constants/occasion.ts` (OCCASION_NAMES, SEASON_NAMES)
- `server/prompts/persona.ts` (패션 평가용 페르소나 — 추천과는 별도)
