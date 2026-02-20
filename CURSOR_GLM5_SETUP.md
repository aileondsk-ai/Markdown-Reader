# Cursor에서 GLM-5 작동 안 함 – 원인 및 해결 가이드

## 1. 원인 분석

### 1.1 GLM-5 미지원
- **GLM-5는 Cursor에 기본 탑재되어 있지 않습니다.**
- Cursor Community Forum에 기능 요청이 있으나(40+ 표), 아직 공식 지원되지 않습니다.
- 따라서 기본 Cursor 모델 목록에서는 GLM-5를 선택할 수 없습니다.

### 1.2 Cursor Pro 필요
- **커스텀 모델 사용에는 Cursor Pro 이상 구독이 필요합니다.**
- 무료 플랜에서는 OpenAI/Anthropic 기본 모델만 사용할 수 있습니다.

### 1.3 OpenRouter를 통한 우회
- GLM-5는 **OpenRouter**에서 `z-ai/glm-5`로 제공됩니다.
- Cursor의 "Override OpenAI Base URL" 기능으로 OpenRouter API를 사용할 수 있습니다.

---

## 2. 해결 방법 (OpenRouter 사용)

### 2.1 사전 준비
1. **OpenRouter API 키 발급**
   - https://openrouter.ai/settings/keys 접속
   - "Create Key"로 API 키 생성

2. **OpenRouter 크레딧**
   - GLM-5는 유료 모델입니다 (입력: $0.30/M, 출력: $2.55/M)
   - OpenRouter에 결제 수단 등록 또는 크레딧 추가

### 2.2 Cursor 설정

1. **Cursor 설정 열기**
   - `Cmd + ,` (Mac) 또는 `Ctrl + ,` (Windows)
   - 또는 메뉴: **Cursor → Settings**

2. **모델 설정 경로**
   - **Models** 또는 **Features → Models** 섹션으로 이동

3. **OpenRouter 연결**
   - **OpenAI API Key** 필드에 OpenRouter API 키 입력
   - **Override OpenAI Base URL** 필드를 `https://openrouter.ai/api/v1`로 설정
   - **Add Model** 또는 **Models** 목록에 `z-ai/glm-5` 추가

4. **모델 선택**
   - 채팅/에이전트 모드에서 `z-ai/glm-5`를 모델로 선택

### 2.3 확인 사항
- Base URL은 반드시 `https://openrouter.ai/api/v1` (슬래시 주의)
- 모델 이름은 `z-ai/glm-5` (소문자, 하이픈)
- **Cursor Pro 이상** 구독 여부 확인

---

## 3. 문제 해결 (Troubleshooting)

### 3.1 여전히 GLM-5가 목록에 없음
- Cursor를 완전히 종료 후 재시작
- Settings → Models에서 "Add Model" 또는 "Custom Models"에 `z-ai/glm-5` 수동 추가
- Cursor 버전이 최신인지 확인 (업데이트 후 재시도)

### 3.2 API 오류 (401, 403 등)
- OpenRouter API 키가 유효한지 확인
- OpenRouter 대시보드에서 해당 키가 활성화되어 있는지 확인
- 결제/크레딧 상태 확인

### 3.3 Base URL 오류
- `https://openrouter.ai/api/v1` 정확히 입력 (끝 슬래시 `/` 없음)
- "Override OpenAI Base URL" 옵션이 켜져 있는지 확인

### 3.4 응답 지연 또는 타임아웃
- OpenRouter는 여러 프로바이더로 라우팅하므로 가끔 지연 가능
- 네트워크/방화벽에서 `openrouter.ai` 접근 허용 여부 확인

---

## 4. 대안 (GLM-5 미사용 시)

OpenRouter에서 사용 가능한 다른 Zhipu 계열 모델:

| 모델 ID | 설명 |
|--------|------|
| `z-ai/glm-4.7-flash` | 가벼운 버전, 빠른 응답 |
| `z-ai/glm-4.7` | 플래그십 모델 |
| `z-ai/glm-4.5-air:free` | 무료 옵션 (제한적) |

---

## 5. 참고 링크

- [OpenRouter GLM-5](https://openrouter.ai/z-ai/glm-5)
- [Cursor Forum - GLM-5 요청](https://forum.cursor.com/t/glm-5-in-cursor/151622)
- [OpenRouter API Keys](https://openrouter.ai/settings/keys)
